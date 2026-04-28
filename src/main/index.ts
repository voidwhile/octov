import { app, shell, BrowserWindow, ipcMain, dialog, net } from 'electron'
import * as http from 'http'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { AliyunDriveClient } from './aliyundrive'
import { StorageManager } from './storage'
import { TMDBClient, getTmdbApiKey, setTmdbApiKey } from './tmdb'
import { MediaScanner } from './scanner'
import { SubtitleClient, parseSubtitle, getSubtitleApiKey, setSubtitleApiKey } from './subtitle'

// 服务实例
const aliyunDrive = new AliyunDriveClient()
const storageManager = new StorageManager()
const tmdbClient = new TMDBClient()
const mediaScanner = new MediaScanner(aliyunDrive, tmdbClient)
const subtitleClient = new SubtitleClient()

function createWindow(): void {
  // 创建主窗口
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    // macOS 风格：隐藏标题栏，保留红绿灯按钮
    titleBarStyle: 'hiddenInset',
    // macOS 圆角
    ...(process.platform === 'darwin' ? { vibrancy: 'sidebar' } : {}),
    ...(process.platform === 'linux' ? { icon } : {}),
    backgroundColor: '#F5F5F7',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      // 允许渲染进程使用 file 协议
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 开发模式下加载开发服务器 URL，生产模式加载本地文件
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow as any
}

// 视频代理 URL 映射表
const videoProxyMap = new Map<string, string>()
let proxyPort = 19876 // 本地代理服务器端口

// 创建本地 HTTP 代理服务器，用于代理视频流（解决 CORS / Referer / URL 安全检查问题）
const proxyServer = http.createServer(async (req, res) => {
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // 从 URL 提取视频 ID: /video/<id>
  const videoId = req.url?.replace('/video/', '') || ''
  const realUrl = videoProxyMap.get(videoId)

  if (!realUrl) {
    res.writeHead(404)
    res.end('Not Found')
    return
  }

  try {
    const headers: Record<string, string> = {
      'Referer': 'https://www.aliyundrive.com/',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
    }
    // 转发 Range 头（支持视频拖拽进度）
    if (req.headers.range) {
      headers['Range'] = req.headers.range
    }

    console.log('代理视频:', realUrl.substring(0, 80) + '...')
    const response = await net.fetch(realUrl, { headers })

    // 转发响应头
    const respHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': '*'
    }
    response.headers.forEach((value, key) => {
      if (!['access-control-allow-origin'].includes(key.toLowerCase())) {
        respHeaders[key] = value
      }
    })

    res.writeHead(response.status, respHeaders)

    // 将响应流写入到 res
    if (response.body) {
      const reader = response.body.getReader()
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read()
          if (done) { res.end(); break }
          if (!res.write(value)) {
            await new Promise(resolve => res.once('drain', resolve))
          }
        }
      }
      pump().catch(err => {
        console.error('代理流出错:', err.message)
        res.end()
      })
    } else {
      res.end()
    }
  } catch (err: any) {
    console.error('代理请求失败:', err.message)
    res.writeHead(502)
    res.end('Proxy Error')
  }
})

// 启动代理服务器
proxyServer.listen(proxyPort, '127.0.0.1', () => {
  console.log(`视频代理服务器启动: http://127.0.0.1:${proxyPort}`)
})
proxyServer.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    proxyPort++
    proxyServer.listen(proxyPort, '127.0.0.1')
  }
})

// 应用就绪后创建窗口
app.whenReady().then(() => {
  // 设置 Windows 应用 ID
  electronApp.setAppUserModelId('com.octov.app')

  // 开发模式快捷键
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const { session: mainSession } = require('electron')

  // 使用通配符拦截所有 HTTPS 请求，动态判断是否为阿里云盘相关域名
  mainSession.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['https://*/*'] },
    (details, callback) => {
      try {
        const hostname = new URL(details.url).hostname
        if (
          hostname.includes('aliyun') ||
          hostname.includes('alipan') ||
          hostname.includes('alicloudccp') ||
          hostname.includes('ccp-')
        ) {
          details.requestHeaders['Referer'] = 'https://www.aliyundrive.com/'
          details.requestHeaders['User-Agent'] =
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
          delete details.requestHeaders['Origin']
        }
      } catch {}
      callback({ requestHeaders: details.requestHeaders })
    }
  )

  // 拦截响应头：修复 CORS
  mainSession.defaultSession.webRequest.onHeadersReceived(
    { urls: ['https://*/*'] },
    (details, callback) => {
      try {
        const hostname = new URL(details.url).hostname
        if (
          hostname.includes('aliyun') ||
          hostname.includes('alipan') ||
          hostname.includes('alicloudccp') ||
          hostname.includes('ccp-')
        ) {
          const responseHeaders = details.responseHeaders || {}
          responseHeaders['Access-Control-Allow-Origin'] = ['*']
          responseHeaders['Access-Control-Allow-Headers'] = ['*']
          return callback({ responseHeaders })
        }
      } catch {}
      callback({})
    }
  )

  // 获取代理 URL：将真实 URL 存入映射表，返回本地代理 URL
  ipcMain.handle('aliyun:getProxyUrl', (_event, url: string) => {
    const id = Math.random().toString(36).substring(2, 15)
    videoProxyMap.set(id, url)
    return `http://127.0.0.1:${proxyPort}/video/${id}`
  })


  // 选择文件夹对话框
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '选择视频文件夹'
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  // 获取系统主题
  ipcMain.handle('get-system-theme', () => {
    const { nativeTheme } = require('electron')
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  })

  // 获取平台信息
  ipcMain.handle('get-platform', () => {
    return process.platform
  })

  // ============================================
  // IPC 通信处理 - 阿里云盘
  // ============================================

  // 获取阿里云盘连接状态
  ipcMain.handle('aliyun:getStatus', () => {
    return {
      isLoggedIn: aliyunDrive.isLoggedIn(),
      clientId: aliyunDrive.getClientId(),
      userInfo: aliyunDrive.getUserInfo()
    }
  })

  // 设置阿里云盘 App ID
  ipcMain.handle('aliyun:setClientId', (_event, clientId: string) => {
    aliyunDrive.setClientId(clientId)
    return { success: true }
  })

  // 获取扫码授权二维码
  ipcMain.handle('aliyun:getQrCode', async () => {
    try {
      const result = await aliyunDrive.getQrCode()
      return { success: true, data: result }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // 轮询扫码状态
  ipcMain.handle('aliyun:pollQrCodeStatus', async (_event, sid: string) => {
    try {
      const result = await aliyunDrive.pollQrCodeStatus(sid)
      return { success: true, data: result }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // 完成授权（用 authCode 换取 token）
  ipcMain.handle('aliyun:completeAuth', async (_event, authCode: string) => {
    try {
      await aliyunDrive.completeAuth(authCode)
      return { success: true, userInfo: aliyunDrive.getUserInfo() }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // 退出登录
  ipcMain.handle('aliyun:logout', () => {
    aliyunDrive.logout()
    return { success: true }
  })

  // 获取文件列表
  ipcMain.handle(
    'aliyun:listFiles',
    async (_event, parentFileId: string, options?: any) => {
      try {
        const result = await aliyunDrive.listFiles(parentFileId, options)
        return { success: true, data: result }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  // 获取视频文件列表
  ipcMain.handle(
    'aliyun:listVideoFiles',
    async (_event, parentFileId: string, marker?: string) => {
      try {
        const result = await aliyunDrive.listVideoFiles(parentFileId, marker)
        return { success: true, data: result }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  // 获取文件详情
  ipcMain.handle('aliyun:getFileDetail', async (_event, fileId: string) => {
    try {
      const result = await aliyunDrive.getFileDetail(fileId)
      return { success: true, data: result }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // 搜索文件
  ipcMain.handle(
    'aliyun:searchFiles',
    async (_event, query: string, options?: any) => {
      try {
        const result = await aliyunDrive.searchFiles(query, options)
        return { success: true, data: result }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  // 获取视频播放信息
  ipcMain.handle('aliyun:getVideoPlayInfo', async (_event, fileId: string) => {
    try {
      const result = await aliyunDrive.getVideoPlayInfo(fileId)
      // 输出调试信息：查看 API 实际返回的清晰度列表
      console.log('=== 视频清晰度信息 ===')
      console.log('文件ID:', fileId)
      result.template_list.forEach(t => {
        console.log(`  ${t.template_id}: status=${t.status}, url=${t.url ? '有' : '无'}`)
      })
      console.log('=====================')
      return { success: true, data: result }
    } catch (err: any) {
      console.error('获取播放信息失败:', err.message)
      return { success: false, error: err.message }
    }
  })

  // 获取文件下载地址
  ipcMain.handle(
    'aliyun:getDownloadUrl',
    async (_event, fileId: string, expireSec?: number) => {
      try {
        const result = await aliyunDrive.getDownloadUrl(fileId, expireSec)
        return { success: true, data: result }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  // 更新播放进度
  ipcMain.handle(
    'aliyun:updatePlayCursor',
    async (_event, fileId: string, playCursor: number) => {
      try {
        await aliyunDrive.updatePlayCursor(fileId, playCursor)
        return { success: true }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  createWindow()

  // ============================================
  // IPC 通信处理 - 存储管理
  // ============================================

  ipcMain.handle('storage:getStorages', () => {
    return storageManager.getStorages()
  })

  ipcMain.handle('storage:addStorage', (_event, data: any) => {
    return storageManager.addStorage(data)
  })

  ipcMain.handle('storage:updateStorage', (_event, id: string, name: string) => {
    return storageManager.updateStorage(id, name)
  })

  ipcMain.handle('storage:deleteStorage', (_event, id: string) => {
    return storageManager.deleteStorage(id)
  })

  ipcMain.handle('storage:getSources', () => {
    return storageManager.getSources()
  })

  ipcMain.handle('storage:addSource', (_event, data: any) => {
    return storageManager.addSource(data)
  })

  ipcMain.handle('storage:deleteSource', (_event, id: string) => {
    return storageManager.deleteSource(id)
  })

  ipcMain.handle('storage:updateSource', (_event, id: string, name: string) => {
    return storageManager.updateSource(id, name)
  })

  // ============================================
  // IPC 通信处理 - TMDB 刮削
  // ============================================

  ipcMain.handle('tmdb:searchMovie', async (_event, query: string, year?: number) => {
    try {
      return { success: true, data: await tmdbClient.searchMovie(query, year) }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('tmdb:searchTV', async (_event, query: string, year?: number) => {
    try {
      return { success: true, data: await tmdbClient.searchTV(query, year) }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('tmdb:scrape', async (_event, cacheKey: string, title: string, type: string, year?: number) => {
    try {
      const result = await tmdbClient.scrape(cacheKey, title, type as any, year)
      return { success: true, data: result }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // ============================================
  // IPC 通信处理 - 媒体扫描
  // ============================================

  ipcMain.handle('scanner:scanSource', async (_event, source: any) => {
    try {
      const results = await mediaScanner.scanAliyunSource(source)
      return { success: true, data: results }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // ============================================
  // IPC 通信处理 - 字幕
  // ============================================

  ipcMain.handle('subtitle:search', async (_event, query: string, tmdbId?: number, season?: number, episode?: number) => {
    try {
      const results = await subtitleClient.search(query, tmdbId, season, episode)
      return { success: true, data: results }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('subtitle:download', async (_event, fileId: string) => {
    try {
      const content = await subtitleClient.download(fileId)
      const cues = parseSubtitle(content)
      return { success: true, data: { content, cues } }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // ============================================
  // IPC 通信处理 - 媒体缓存
  // ============================================

  const mediaCachePath = join(app.getPath('userData'), 'media-cache.json')

  ipcMain.handle('cache:loadMedia', async () => {
    try {
      const fs = await import('fs')
      const data = fs.readFileSync(mediaCachePath, 'utf-8')
      return { success: true, data: JSON.parse(data) }
    } catch {
      return { success: true, data: [] }
    }
  })

  ipcMain.handle('cache:saveMedia', async (_event, items: any[]) => {
    try {
      const fs = await import('fs')
      fs.writeFileSync(mediaCachePath, JSON.stringify(items), 'utf-8')
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // ============================================
  // IPC 通信处理 - 播放记录
  // ============================================

  const playHistoryPath = join(app.getPath('userData'), 'play-history.json')

  ipcMain.handle('history:load', async () => {
    try {
      const fs = await import('fs')
      const data = fs.readFileSync(playHistoryPath, 'utf-8')
      return { success: true, data: JSON.parse(data) }
    } catch {
      return { success: true, data: [] }
    }
  })

  ipcMain.handle('history:save', async (_event, records: any[]) => {
    try {
      const fs = await import('fs')
      fs.writeFileSync(playHistoryPath, JSON.stringify(records), 'utf-8')
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // ============================================
  // IPC 通信处理 - 应用配置
  // ============================================

  ipcMain.handle('config:getTmdbKey', async () => {
    return { success: true, data: getTmdbApiKey() }
  })

  ipcMain.handle('config:setTmdbKey', async (_event, key: string) => {
    try {
      setTmdbApiKey(key)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('config:getSubtitleKey', async () => {
    return { success: true, data: getSubtitleApiKey() }
  })

  ipcMain.handle('config:setSubtitleKey', async (_event, key: string) => {
    try {
      setSubtitleApiKey(key)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// macOS 下关闭所有窗口时不退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
