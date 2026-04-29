import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 阿里云盘 API 桥接
const aliyunApi = {
  /** 获取连接状态 */
  getStatus: () => ipcRenderer.invoke('aliyun:getStatus'),
  /** 设置 App ID */
  setClientId: (clientId: string) => ipcRenderer.invoke('aliyun:setClientId', clientId),
  /** 获取扫码二维码 */
  getQrCode: () => ipcRenderer.invoke('aliyun:getQrCode'),
  /** 轮询扫码状态 */
  pollQrCodeStatus: (sid: string) => ipcRenderer.invoke('aliyun:pollQrCodeStatus', sid),
  /** 完成扫码授权 */
  completeAuth: (authCode: string) => ipcRenderer.invoke('aliyun:completeAuth', authCode),
  /** 退出登录 */
  logout: () => ipcRenderer.invoke('aliyun:logout'),
  /** 获取文件列表 */
  listFiles: (parentFileId: string, options?: any) =>
    ipcRenderer.invoke('aliyun:listFiles', parentFileId, options),
  /** 获取视频文件列表 */
  listVideoFiles: (parentFileId: string, marker?: string) =>
    ipcRenderer.invoke('aliyun:listVideoFiles', parentFileId, marker),
  /** 获取文件详情 */
  getFileDetail: (fileId: string) =>
    ipcRenderer.invoke('aliyun:getFileDetail', fileId),
  /** 搜索文件 */
  searchFiles: (query: string, options?: any) =>
    ipcRenderer.invoke('aliyun:searchFiles', query, options),
  /** 获取视频播放信息 */
  getVideoPlayInfo: (fileId: string) =>
    ipcRenderer.invoke('aliyun:getVideoPlayInfo', fileId),
  /** 获取下载地址 */
  getDownloadUrl: (fileId: string, expireSec?: number) =>
    ipcRenderer.invoke('aliyun:getDownloadUrl', fileId, expireSec),
  /** 更新播放进度 */
  updatePlayCursor: (fileId: string, playCursor: number) =>
    ipcRenderer.invoke('aliyun:updatePlayCursor', fileId, playCursor),
  /** 获取代理播放 URL */
  getProxyUrl: (url: string) =>
    ipcRenderer.invoke('aliyun:getProxyUrl', url)
}

// 音频缓存 API
const audioApi = {
  /** 下载云盘音频到临时目录，返回本地文件路径 */
  downloadAndCache: (fileId: string, fileName: string) =>
    ipcRenderer.invoke('audio:downloadAndCache', fileId, fileName),
  /** 联网获取歌词 */
  getLyrics: (title: string) =>
    ipcRenderer.invoke('audio:getLyrics', title)
}

// 存储管理 API
const storageApi = {
  /** 获取所有存储账户 */
  getStorages: () => ipcRenderer.invoke('storage:getStorages'),
  /** 添加存储账户 */
  addStorage: (data: any) => ipcRenderer.invoke('storage:addStorage', data),
  /** 更新存储名称 */
  updateStorage: (id: string, name: string) => ipcRenderer.invoke('storage:updateStorage', id, name),
  /** 删除存储账户 */
  deleteStorage: (id: string) => ipcRenderer.invoke('storage:deleteStorage', id),
  /** 获取所有文件源 */
  getSources: () => ipcRenderer.invoke('storage:getSources'),
  /** 添加文件源 */
  addSource: (data: any) => ipcRenderer.invoke('storage:addSource', data),
  /** 删除文件源 */
  deleteSource: (id: string) => ipcRenderer.invoke('storage:deleteSource', id),
  /** 更新文件源名称 */
  updateSource: (id: string, name: string) => ipcRenderer.invoke('storage:updateSource', id, name)
}

// TMDB API
const tmdbApi = {
  /** 搜索电影 */
  searchMovie: (query: string, year?: number) => ipcRenderer.invoke('tmdb:searchMovie', query, year),
  /** 搜索电视剧 */
  searchTV: (query: string, year?: number) => ipcRenderer.invoke('tmdb:searchTV', query, year),
  /** 智能刮削 */
  scrape: (cacheKey: string, title: string, type: string, year?: number) =>
    ipcRenderer.invoke('tmdb:scrape', cacheKey, title, type, year)
}

// 媒体扫描 API
const scannerApi = {
  /** 扫描文件源 */
  scanSource: (source: any) => ipcRenderer.invoke('scanner:scanSource', source)
}

// 字幕 API
const subtitleApi = {
  /** 搜索字幕 */
  search: (query: string, tmdbId?: number, season?: number, episode?: number) =>
    ipcRenderer.invoke('subtitle:search', query, tmdbId, season, episode),
  /** 下载并解析字幕 */
  download: (fileId: string) => ipcRenderer.invoke('subtitle:download', fileId)
}

// 媒体缓存 API
const cacheApi = {
  /** 加载媒体缓存 */
  loadMedia: () => ipcRenderer.invoke('cache:loadMedia'),
  /** 保存媒体缓存 */
  saveMedia: (items: any[]) => ipcRenderer.invoke('cache:saveMedia', items),
  /** 获取应用缓存大小 (包含音频缓存和视频/网页缓存) */
  getSize: () => ipcRenderer.invoke('cache:getSize'),
  /** 清理应用缓存 */
  clear: () => ipcRenderer.invoke('cache:clear')
}

// 播放记录 API
const historyApi = {
  /** 加载播放记录 */
  load: () => ipcRenderer.invoke('history:load'),
  /** 保存播放记录 */
  save: (records: any[]) => ipcRenderer.invoke('history:save', records)
}

// 应用配置 API
const configApi = {
  /** 获取 TMDB API Key */
  getTmdbKey: () => ipcRenderer.invoke('config:getTmdbKey'),
  /** 设置 TMDB API Key */
  setTmdbKey: (key: string) => ipcRenderer.invoke('config:setTmdbKey', key),
  /** 获取 OpenSubtitles API Key */
  getSubtitleKey: () => ipcRenderer.invoke('config:getSubtitleKey'),
  /** 设置 OpenSubtitles API Key */
  setSubtitleKey: (key: string) => ipcRenderer.invoke('config:setSubtitleKey', key)
}

// 通用 API
const api = {
  /** 选择文件夹 */
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  /** 获取系统主题 */
  getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
  /** 获取平台 */
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  /** 获取应用版本 */
  getVersion: () => ipcRenderer.invoke('get-version')
}

// 暴露给渲染进程
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('aliyunDrive', aliyunApi)
    contextBridge.exposeInMainWorld('storage', storageApi)
    contextBridge.exposeInMainWorld('tmdb', tmdbApi)
    contextBridge.exposeInMainWorld('scanner', scannerApi)
    contextBridge.exposeInMainWorld('subtitle', subtitleApi)
    contextBridge.exposeInMainWorld('cache', cacheApi)
    contextBridge.exposeInMainWorld('playHistory', historyApi)
    contextBridge.exposeInMainWorld('appConfig', configApi)
    contextBridge.exposeInMainWorld('audio', audioApi)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
  // @ts-ignore
  window.aliyunDrive = aliyunApi
  // @ts-ignore
  window.storage = storageApi
  // @ts-ignore
  window.tmdb = tmdbApi
  // @ts-ignore
  window.scanner = scannerApi
  // @ts-ignore
  window.subtitle = subtitleApi
  // @ts-ignore
  window.cache = cacheApi
  // @ts-ignore
  window.playHistory = historyApi
  // @ts-ignore
  window.appConfig = configApi
  // @ts-ignore
  window.audio = audioApi
}
