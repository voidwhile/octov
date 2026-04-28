// ============================================
// Octov - 在线字幕搜索服务
// 支持 OpenSubtitles API 搜索字幕
// ============================================

import * as fs from 'fs'
import * as path from 'path'
import { app, net } from 'electron'

// ---- 类型定义 ----

export interface SubtitleSearchResult {
  /** 字幕 ID */
  id: string
  /** 语言 */
  language: string
  /** 语言显示名 */
  languageName: string
  /** 字幕文件名 */
  fileName: string
  /** 来源 */
  source: string
  /** 下载 URL */
  downloadUrl: string
  /** 评分 */
  rating?: number
}

export interface SubtitleCue {
  /** 开始时间（秒） */
  startTime: number
  /** 结束时间（秒） */
  endTime: number
  /** 字幕文本 */
  text: string
}

// ---- SRT 解析器 ----

/**
 * 解析 SRT 格式字幕
 */
export function parseSRT(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = []
  const blocks = content.trim().split(/\n\s*\n/)

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (lines.length < 3) continue

    // 第二行是时间码
    const timeLine = lines[1]
    const timeMatch = timeLine.match(
      /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
    )
    if (!timeMatch) continue

    const startTime =
      parseInt(timeMatch[1]) * 3600 +
      parseInt(timeMatch[2]) * 60 +
      parseInt(timeMatch[3]) +
      parseInt(timeMatch[4]) / 1000

    const endTime =
      parseInt(timeMatch[5]) * 3600 +
      parseInt(timeMatch[6]) * 60 +
      parseInt(timeMatch[7]) +
      parseInt(timeMatch[8]) / 1000

    // 剩余行是字幕文本
    const text = lines.slice(2).join('\n').replace(/<[^>]+>/g, '').trim()

    cues.push({ startTime, endTime, text })
  }

  return cues
}

/**
 * 解析 VTT 格式字幕
 */
export function parseVTT(content: string): SubtitleCue[] {
  // VTT 与 SRT 类似，去掉头部后用 SRT 解析
  const srtContent = content.replace(/^WEBVTT.*?\n\n/s, '')
  return parseSRT(srtContent)
}

/**
 * 解析 ASS/SSA 格式字幕
 */
export function parseASS(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = []
  const lines = content.split('\n')
  for (const line of lines) {
    if (line.trim().startsWith('Dialogue:')) {
      const parts = line.split(',')
      if (parts.length < 10) continue

      // Dialogue: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
      const start = parts[1].trim()
      const end = parts[2].trim()
      // Text 可能包含逗号，所以取第 10 个字段及之后的所有内容
      const text = parts.slice(9).join(',').replace(/\{[^}]+\}/g, '').replace(/\\N/g, '\n').trim()

      const parseTime = (t: string) => {
        const [h, m, sc] = t.split(':')
        const [s, c] = sc.split('.')
        return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(c) / 100
      }

      try {
        cues.push({
          startTime: parseTime(start),
          endTime: parseTime(end),
          text: text
        })
      } catch {
        // 忽略解析失败的行
      }
    }
  }
  return cues
}

/**
 * 自动识别格式并解析字幕
 */
export function parseSubtitle(content: string): SubtitleCue[] {
  if (content.includes('WEBVTT')) {
    return parseVTT(content)
  }
  if (content.includes('[Events]') && content.includes('Dialogue:')) {
    return parseASS(content)
  }
  return parseSRT(content)
}

// ---- 字幕搜索客户端 ----

/** OpenSubtitles API 配置 */
const OS_BASE = 'https://api.opensubtitles.com/api/v1'
/** ZXKI API 配置 */
const ZXKI_BASE = 'https://api.zxki.cn/api/spzm'
// 请在 https://www.opensubtitles.com/consumers 注册获取 API Key
const DEFAULT_OS_API_KEY = ''

/** 获取设置文件路径 */
const getSettingsPath = (): string => path.join(app.getPath('userData'), 'app-settings.json')

/** 读取应用设置 */
function readSettings(): Record<string, any> {
  try {
    const data = fs.readFileSync(getSettingsPath(), 'utf-8')
    return JSON.parse(data)
  } catch {
    return {}
  }
}

/** 写入应用设置 */
function writeSettings(settings: Record<string, any>): void {
  fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8')
}

/** 获取 OpenSubtitles API Key */
export function getSubtitleApiKey(): string {
  const settings = readSettings()
  return settings.subtitleApiKey || DEFAULT_OS_API_KEY
}

/** 设置 OpenSubtitles API Key */
export function setSubtitleApiKey(key: string): void {
  const settings = readSettings()
  settings.subtitleApiKey = key
  writeSettings(settings)
}

/** 获取当前生效的 API Key */
function currentApiKey(): string {
  return getSubtitleApiKey()
}

/**
 * 带有重试机制的 fetch
 * 支持 503 (Service Unavailable) 和 429 (Too Many Requests) 的自动重试
 */
async function fetchWithRetry(url: string, options: any, maxRetries = 3): Promise<any> {
  let lastError: any
  for (let i = 0; i <= maxRetries; i++) {
    try {
      if (i > 0) {
        const delay = Math.pow(2, i - 1) * 1000 // 指数退避: 1s, 2s, 4s
        console.log(`OpenSubtitles API 重试中 (${i}/${maxRetries}), 等待 ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }

      const response = await net.fetch(url, options)

      // 如果是 503 或 429，则触发重试
      if ((response.status === 503 || response.status === 429) && i < maxRetries) {
        console.warn(`OpenSubtitles API 返回 ${response.status}，准备重试...`)
        continue
      }

      return response
    } catch (err) {
      lastError = err
      if (i < maxRetries) {
        console.warn(`OpenSubtitles API 请求异常，准备重试:`, err)
        continue
      }
    }
  }
  throw lastError || new Error('请求失败且已超过最大重试次数')
}

/**
 * 自动检测并解码字幕内容 (UTF-8 / GBK)
 */
async function decodeSubtitleContent(buffer: ArrayBuffer): Promise<string> {
  try {
    // 尝试 UTF-8，设置 fatal: true 如果内容不是合法的 UTF-8 会抛出异常
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true })
    return utf8Decoder.decode(buffer)
  } catch (e) {
    // UTF-8 解码失败，回退到 GBK (针对国内常用的字幕编码)
    console.log('UTF-8 解码失败，尝试使用 GBK 解码...')
    try {
      const gbkDecoder = new TextDecoder('gbk')
      return gbkDecoder.decode(buffer)
    } catch (e2) {
      // 如果 GBK 也失败，返回原始 UTF-8 解码结果（允许乱码字符）
      console.error('所有解码尝试均失败:', e2)
      return new TextDecoder('utf-8').decode(buffer)
    }
  }
}

export class SubtitleClient {
  /**
   * 搜索字幕
   * @param query 搜索关键词
   * @param tmdbId TMDB ID（可选，更精确）
   * @param season 季号（可选）
   * @param episode 集号（可选）
   */
  async search(
    query: string,
    tmdbId?: number,
    season?: number,
    episode?: number
  ): Promise<SubtitleSearchResult[]> {
    const results: SubtitleSearchResult[] = []

    // 1. 并行搜索多个来源
    const [osResults, zxkiResults] = await Promise.all([
      this.searchOpenSubtitles(query, tmdbId, season, episode),
      this.searchZXKI(query)
    ])

    results.push(...zxkiResults) // 优先放一些新接口的结果
    results.push(...osResults)

    return results.slice(0, 40) // 总共最多返回 40 条
  }

  /**
   * 从 OpenSubtitles 搜索
   */
  async searchOpenSubtitles(
    query: string,
    tmdbId?: number,
    season?: number,
    episode?: number
  ): Promise<SubtitleSearchResult[]> {
    try {
      const url = new URL(`${OS_BASE}/subtitles`)
      if (tmdbId) {
        url.searchParams.set('tmdb_id', String(tmdbId))
      } else {
        url.searchParams.set('query', query)
      }
      // 优先中文字幕
      url.searchParams.set('languages', 'zh-CN,zh-TW,en')
      if (season) url.searchParams.set('season_number', String(season))
      if (episode) url.searchParams.set('episode_number', String(episode))

      const apiKey = currentApiKey()
      if (!apiKey) {
        console.warn('OpenSubtitles API Key 未配置，跳过字幕搜索')
        return []
      }

      const response = await fetchWithRetry(url.toString(), {
        headers: {
          'Api-Key': apiKey,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': `Octov v${app.getVersion()}`
        }
      })

      if (!response.ok) {
        console.error('OpenSubtitles API 错误:', response.status)
        return []
      }

      const data = await response.json()
      const results: SubtitleSearchResult[] = []

      for (const item of (data.data || [])) {
        const attrs = item.attributes
        if (!attrs) continue

        const files = attrs.files || []
        if (files.length === 0) continue

        results.push({
          id: String(item.id),
          language: attrs.language || 'unknown',
          languageName: this.getLanguageName(attrs.language),
          fileName: attrs.release || attrs.feature_details?.title || 'subtitle',
          source: 'OpenSubtitles',
          downloadUrl: '', // 需要二次请求获取下载链接
          rating: attrs.ratings
        })
      }

      return results.slice(0, 20) // 最多返回 20 条
    } catch (err) {
      console.error('OpenSubtitles 搜索失败:', err)
      return []
    }
  }

  /**
   * 从 ZXKI 搜索
   */
  async searchZXKI(query: string): Promise<SubtitleSearchResult[]> {
    try {
      const url = new URL(ZXKI_BASE)
      url.searchParams.set('query', query)

      const response = await fetchWithRetry(url.toString(), {
        headers: {
          'User-Agent': `Octov v${app.getVersion()}`
        }
      })

      if (!response.ok) {
        console.error('ZXKI API 错误:', response.status)
        return []
      }

      const data = await response.json()
      if (data.code !== 0 || !data.data) {
        return []
      }

      return data.data.map((item: any, index: number) => {
        // 从 URL 中提取文件名
        const fileName = path.basename(item.url) || `subtitle_${index}`
        return {
          id: item.url, // 直接使用 URL 作为 ID
          language: 'zh-CN', // 该接口通常返回中文字幕
          languageName: '中文 (ZXKI)',
          fileName: fileName,
          source: 'ZXKI',
          downloadUrl: item.url,
          rating: 0
        }
      })
    } catch (err) {
      console.error('ZXKI 字幕搜索失败:', err)
      return []
    }
  }

  /**
   * 下载字幕内容
   * @param fileId OpenSubtitles 文件 ID 或 ZXKI 下载 URL
   */
  async download(fileId: string): Promise<string> {
    try {
      // 1. 如果是直接 URL (针对 ZXKI)
      if (fileId.startsWith('http')) {
        const response = await fetchWithRetry(fileId, {
          headers: {
            'User-Agent': `Octov v${app.getVersion()}`
          }
        })
        if (!response.ok) {
          throw new Error(`直接下载字幕失败: ${response.status}`)
        }
        const buffer = await response.arrayBuffer()
        return await decodeSubtitleContent(buffer)
      }

      // 2. 如果是 OpenSubtitles ID
      const apiKey = currentApiKey()
      if (!apiKey) {
        throw new Error('OpenSubtitles API Key 未配置')
      }

      const response = await fetchWithRetry(`${OS_BASE}/download`, {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': `Octov v${app.getVersion()}`
        },
        body: JSON.stringify({ file_id: parseInt(fileId) })
      })

      if (!response.ok) {
        throw new Error(`下载字幕失败: ${response.status}`)
      }

      const data = await response.json()
      const downloadUrl = data.link

      if (!downloadUrl) {
        throw new Error('未获取到下载链接')
      }

      // 下载字幕文件内容
      const subResponse = await fetchWithRetry(downloadUrl, {
        headers: {
          'Api-Key': apiKey,
          'User-Agent': `Octov v${app.getVersion()}`
        }
      })

      if (!subResponse.ok) {
        throw new Error(`无法获取字幕文件内容: ${subResponse.status}`)
      }

      const buffer = await subResponse.arrayBuffer()
      return await decodeSubtitleContent(buffer)
    } catch (err) {
      console.error('下载字幕失败:', err)
      return ''
    }
  }

  /**
   * 搜索并获取最佳字幕
   */
  async searchAndParse(
    query: string,
    tmdbId?: number,
    season?: number,
    episode?: number
  ): Promise<{ results: SubtitleSearchResult[]; cues?: SubtitleCue[] }> {
    const results = await this.search(query, tmdbId, season, episode)
    return { results }
  }

  /** 语言代码转显示名 */
  private getLanguageName(code: string): string {
    const map: Record<string, string> = {
      'zh-CN': '简体中文',
      'zh-TW': '繁体中文',
      'en': '英语',
      'ja': '日语',
      'ko': '韩语',
      'fr': '法语',
      'de': '德语',
      'es': '西班牙语',
      'pt': '葡萄牙语',
      'ru': '俄语',
      'ar': '阿拉伯语',
      'th': '泰语'
    }
    return map[code] || code
  }
}
