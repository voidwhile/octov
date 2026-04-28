// ============================================
// 阿里云盘 API 集成模块
// 使用 PKCE (无后端服务) 授权模式
// ============================================

import * as path from 'path'
import * as fs from 'fs'
import { app, net } from 'electron'

// ---- 常量 ----
const API_BASE = 'https://openapi.alipan.com'
const AUTH_URL = 'https://openapi.alipan.com/oauth/authorize'
const TOKEN_URL = `${API_BASE}/oauth/access_token`

// 阿里云盘开放平台 App 配置
// 从 .env 文件读取，请参考 .env.example 配置
const DEFAULT_CLIENT_ID = import.meta.env.MAIN_VITE_ALIYUN_CLIENT_ID || ''
const DEFAULT_CLIENT_SECRET = import.meta.env.MAIN_VITE_ALIYUN_CLIENT_SECRET || ''
const SCOPES = 'user:base,file:all:read,file:all:write'

// ---- 类型定义 ----

/** 阿里云盘 Token 信息 */
export interface AliyunToken {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  /** token 获取时间戳 */
  obtained_at: number
  /** 用户 drive_id */
  default_drive_id?: string
  /** 用户信息 */
  user_id?: string
  user_name?: string
  avatar?: string
}

/** 阿里云盘文件 */
export interface AliyunDriveFile {
  drive_id: string
  file_id: string
  parent_file_id: string
  name: string
  size?: number
  file_extension?: string
  content_hash?: string
  category?: string
  type: 'file' | 'folder'
  thumbnail?: string
  url?: string
  created_at: string
  updated_at: string
  play_cursor?: string
  video_media_metadata?: {
    duration?: number
    width?: number
    height?: number
  }
  mime_type?: string
}

/** 视频播放信息 */
export interface VideoPlayInfo {
  template_list: Array<{
    template_id: string
    status: string
    url: string
  }>
  meta?: {
    duration: number
    width: number
    height: number
  }
}

/** 配置持久化 */
interface AliyunConfig {
  client_id: string
  client_secret: string
  token?: AliyunToken
}

// ---- 工具函数 ----

/** 获取配置文件路径 */
function getConfigPath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'aliyundrive-config.json')
}

/** 读取配置 */
function readConfig(): AliyunConfig {
  try {
    const data = fs.readFileSync(getConfigPath(), 'utf-8')
    return JSON.parse(data)
  } catch {
    return { client_id: DEFAULT_CLIENT_ID, client_secret: DEFAULT_CLIENT_SECRET }
  }
}

/** 保存配置 */
function saveConfig(config: AliyunConfig): void {
  const configPath = getConfigPath()
  fs.mkdirSync(path.dirname(configPath), { recursive: true })
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
}

// ---- 核心类 ----

export class AliyunDriveClient {
  private config: AliyunConfig

  constructor() {
    this.config = readConfig()
  }

  /** 获取当前配置的 client_id */
  getClientId(): string {
    return this.config.client_id
  }

  /** 设置 client_id 和 client_secret */
  setClientId(clientId: string, clientSecret?: string): void {
    this.config.client_id = clientId
    if (clientSecret) this.config.client_secret = clientSecret
    saveConfig(this.config)
  }

  /** 检查是否已登录（有 token 即视为已登录，过期会自动刷新） */
  isLoggedIn(): boolean {
    if (!this.config.token) return false
    return true
  }

  /** 检查 access_token 是否过期 */
  private isTokenExpired(): boolean {
    if (!this.config.token) return true
    const now = Date.now()
    const expiresAt = this.config.token.obtained_at + this.config.token.expires_in * 1000
    return now >= expiresAt - 5 * 60 * 1000 // 提前 5 分钟视为过期
  }

  /** 确保 token 有效（过期时自动刷新） */
  private async ensureValidToken(): Promise<void> {
    if (!this.config.token) throw new Error('未登录阿里云盘')
    if (this.isTokenExpired()) {
      if (this.config.token.refresh_token) {
        await this.refreshToken()
      } else {
        delete this.config.token
        saveConfig(this.config)
        throw new Error('登录已过期，请重新登录')
      }
    }
  }

  /** 获取当前 Token */
  getToken(): AliyunToken | undefined {
    return this.config.token
  }

  /** 获取登录用户信息 */
  getUserInfo(): { user_id?: string; user_name?: string; avatar?: string; default_drive_id?: string } | null {
    if (!this.config.token) return null
    return {
      user_id: this.config.token.user_id,
      user_name: this.config.token.user_name,
      avatar: this.config.token.avatar,
      default_drive_id: this.config.token.default_drive_id
    }
  }

  /**
   * 获取扫码授权二维码
   * 返回二维码 URL 和 session ID
   */
  async getQrCode(): Promise<{ qrCodeUrl: string; sid: string }> {
    const clientId = this.config.client_id
    if (!clientId) {
      throw new Error('请先配置阿里云盘 App ID (client_id)')
    }

    const response = await net.fetch(`${API_BASE}/oauth/authorize/qrcode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: this.config.client_secret,
        scopes: SCOPES.split(','),
        width: 430,
        height: 430
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`获取二维码失败: ${response.status} - ${errText}`)
    }

    return response.json()
  }

  /**
   * 轮询扫码状态
   * @returns 状态: WaitLogin / ScanSuccess / LoginSuccess / QRCodeExpired
   */
  async pollQrCodeStatus(sid: string): Promise<{
    status: string
    authCode?: string
  }> {
    const response = await net.fetch(`${API_BASE}/oauth/qrcode/${sid}/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`查询扫码状态失败: ${response.status} - ${errText}`)
    }

    return response.json()
  }

  /**
   * 完成扫码授权：用 authCode 换取 token 并获取用户信息
   */
  async completeAuth(authCode: string): Promise<void> {
    await this.exchangeToken(authCode)
    await this.fetchUserInfo()
  }

  /**
   * 使用授权码换取 access_token
   */
  private async exchangeToken(code: string): Promise<void> {
    const response = await net.fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.config.client_id,
        client_secret: this.config.client_secret,
        grant_type: 'authorization_code',
        code: code
      })
    })

    if (!response.ok) {
      const errData = await response.text()
      throw new Error(`换取 token 失败: ${response.status} - ${errData}`)
    }

    const data = await response.json()
    this.config.token = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || '',
      token_type: data.token_type || 'Bearer',
      expires_in: data.expires_in || 7200,
      obtained_at: Date.now(),
      default_drive_id: data.default_drive_id,
      user_id: data.user_id,
      user_name: data.user_name,
      avatar: data.avatar
    }
    saveConfig(this.config)
    console.log('Token 获取成功, refresh_token:', data.refresh_token ? '有' : '无')
  }

  /**
   * 获取用户信息并更新 drive_id
   */
  private async fetchUserInfo(): Promise<void> {
    try {
      const data = await this.apiRequest('/adrive/v1.0/user/getDriveInfo', {})
      if (data.default_drive_id && this.config.token) {
        this.config.token.default_drive_id = data.default_drive_id
        this.config.token.user_id = data.user_id
        this.config.token.user_name = data.name || data.nick_name
        this.config.token.avatar = data.avatar
        saveConfig(this.config)
      }
    } catch (err) {
      console.error('获取用户信息失败:', err)
    }
  }

  /**
   * 退出登录
   */
  logout(): void {
    delete this.config.token
    saveConfig(this.config)
  }

  /**
   * 使用 refresh_token 刷新 access_token
   */
  private async refreshToken(): Promise<void> {
    if (!this.config.token?.refresh_token) {
      throw new Error('没有 refresh_token，请重新登录')
    }

    console.log('正在刷新 access_token...')
    const response = await net.fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.config.client_id,
        client_secret: this.config.client_secret,
        grant_type: 'refresh_token',
        refresh_token: this.config.token.refresh_token
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('刷新 token 失败:', response.status, errText)
      // 刷新失败，清除登录状态
      delete this.config.token
      saveConfig(this.config)
      throw new Error('登录已过期，请重新登录')
    }

    const data = await response.json()
    // 保留原有用户信息，只更新 token 相关字段
    this.config.token = {
      ...this.config.token,
      access_token: data.access_token,
      refresh_token: data.refresh_token || this.config.token.refresh_token,
      expires_in: data.expires_in || 7200,
      obtained_at: Date.now()
    }
    saveConfig(this.config)
    console.log('Token 刷新成功')
  }

  /**
   * 发送 API 请求（自动处理 token 刷新）
   */
  private async apiRequest(path: string, body: any, _retried = false): Promise<any> {
    // 请求前先确保 token 有效
    await this.ensureValidToken()

    const response = await net.fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.token!.access_token}`
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errText = await response.text()
      // token 过期，尝试刷新后重试一次
      if (response.status === 401 && !_retried && this.config.token?.refresh_token) {
        console.log('API 返回 401，尝试刷新 token...')
        try {
          await this.refreshToken()
          return this.apiRequest(path, body, true)
        } catch {
          throw new Error('登录已过期，请重新登录')
        }
      }
      if (response.status === 401) {
        delete this.config.token
        saveConfig(this.config)
        throw new Error('登录已过期，请重新登录')
      }
      throw new Error(`API 错误 ${response.status}: ${errText}`)
    }

    return response.json()
  }

  // ---- 文件管理 API ----

  /** 获取 drive_id */
  getDriveId(): string {
    return this.config.token?.default_drive_id || ''
  }

  /**
   * 获取文件列表
   * @param parentFileId 父目录 ID，根目录为 'root'
   * @param options 额外选项
   */
  async listFiles(
    parentFileId: string = 'root',
    options: {
      limit?: number
      marker?: string
      category?: string
      type?: string
      orderBy?: string
      orderDirection?: string
    } = {}
  ): Promise<{ items: AliyunDriveFile[]; next_marker: string }> {
    const driveId = this.getDriveId()
    if (!driveId) throw new Error('未获取到 drive_id')

    const body: any = {
      drive_id: driveId,
      parent_file_id: parentFileId,
      limit: options.limit || 100,
      fields: '*',
      order_by: options.orderBy || 'updated_at',
      order_direction: options.orderDirection || 'DESC'
    }

    if (options.marker) body.marker = options.marker
    if (options.category) body.category = options.category
    if (options.type) body.type = options.type

    return this.apiRequest('/adrive/v1.0/openFile/list', body)
  }

  /**
   * 获取文件详情
   */
  async getFileDetail(fileId: string): Promise<AliyunDriveFile> {
    const driveId = this.getDriveId()
    return this.apiRequest('/adrive/v1.0/openFile/get', {
      drive_id: driveId,
      file_id: fileId
    })
  }

  /**
   * 搜索文件
   * @param query 搜索查询语句
   */
  async searchFiles(
    query: string,
    options: { limit?: number; marker?: string } = {}
  ): Promise<{ items: AliyunDriveFile[]; next_marker: string }> {
    const driveId = this.getDriveId()
    return this.apiRequest('/adrive/v1.0/openFile/search', {
      drive_id: driveId,
      query: query,
      limit: options.limit || 50,
      ...(options.marker ? { marker: options.marker } : {})
    })
  }

  /**
   * 列出所有视频文件
   */
  async listVideoFiles(
    parentFileId: string = 'root',
    marker?: string
  ): Promise<{ items: AliyunDriveFile[]; next_marker: string }> {
    return this.listFiles(parentFileId, {
      category: 'video',
      marker
    })
  }

  /**
   * 获取文件下载地址
   */
  async getDownloadUrl(
    fileId: string,
    expireSec: number = 900
  ): Promise<{ url: string; expiration: string }> {
    const driveId = this.getDriveId()
    return this.apiRequest('/adrive/v1.0/openFile/getDownloadUrl', {
      drive_id: driveId,
      file_id: fileId,
      expire_sec: expireSec
    })
  }

  // ---- 视频播放 API ----

  /**
   * 获取视频预览播放信息 (边转边播 m3u8)
   */
  async getVideoPlayInfo(fileId: string): Promise<VideoPlayInfo> {
    const driveId = this.getDriveId()
    const result = await this.apiRequest('/adrive/v1.0/openFile/getVideoPreviewPlayInfo', {
      drive_id: driveId,
      file_id: fileId,
      category: 'live_transcoding',
      get_subtitle_info: true
    })

    return {
      template_list: result.video_preview_play_info?.live_transcoding_task_list || [],
      meta: result.video_preview_play_info?.meta
    }
  }

  /**
   * 更新视频播放进度
   */
  async updatePlayCursor(fileId: string, playCursor: number): Promise<void> {
    const driveId = this.getDriveId()
    await this.apiRequest('/adrive/v1.0/openFile/video/updateRecord', {
      drive_id: driveId,
      file_id: fileId,
      play_cursor: String(playCursor)
    })
  }
}
