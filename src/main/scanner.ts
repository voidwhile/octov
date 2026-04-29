// ============================================
// Octov - 媒体扫描与分类引擎
// 递归扫描文件源，识别并分类视频文件
// ============================================

import { AliyunDriveClient } from './aliyundrive'
import { TMDBClient, ScrapedMetadata } from './tmdb'
import { FileSourceItem } from './storage'
import * as fs from 'fs'
import * as path from 'path'

// ---- 视频格式 ----
const VIDEO_EXTENSIONS = new Set([
  'mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv',
  'rmvb', 'ts', 'm4v', 'webm', 'mpg', 'mpeg', 'm2ts'
])

// ---- 音频格式 ----
const AUDIO_EXTENSIONS = new Set([
  'mp3', 'flac', 'wav', 'aac', 'm4a', 'ogg', 'opus', 'wma', 'ape', 'alac', 'aiff'
])

/** 判断是否为视频文件 */
function isVideoFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  return VIDEO_EXTENSIONS.has(ext)
}

/** 判断是否为音频文件 */
function isAudioFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  return AUDIO_EXTENSIONS.has(ext)
}

// ---- 集号识别正则 ----
const EPISODE_PATTERNS = [
  /S(\d{1,2})E(\d{1,3})/i,           // S01E01
  /Season\s*(\d+).*?E(\d{1,3})/i,    // Season 1 E01
  /EP?\s*(\d{1,3})/i,                // EP01, E01
  /第\s*(\d{1,4})\s*[集话期]/,       // 第1集
  /\[(\d{2,3})\]/,                   // [01]
]

/** 从文件名中提取集号 */
function extractEpisodeNumber(fileName: string): number | null {
  for (const pattern of EPISODE_PATTERNS) {
    const match = fileName.match(pattern)
    if (match) {
      // 优先取第二个分组（如 S01E03 中的 03）
      const epStr = match[2] || match[1]
      const ep = parseInt(epStr, 10)
      if (!isNaN(ep)) return ep
    }
  }
  return null
}

/** 从文件名中提取季号 */
function extractSeasonNumber(fileName: string, folderName?: string): number {
  // 从文件名提取
  const fileMatch = fileName.match(/S(\d{1,2})E/i) || fileName.match(/Season\s*(\d+)/i)
  if (fileMatch) return parseInt(fileMatch[1], 10)

  // 从文件夹名提取
  if (folderName) {
    const folderMatch = folderName.match(/S(\d{1,2})\b/i)
      || folderName.match(/Season\s*(\d+)/i)
      || folderName.match(/第\s*(\d+)\s*季/)
    if (folderMatch) return parseInt(folderMatch[1], 10)
  }

  return 1
}

// ---- 文件名解析 ----

export interface ParsedFileName {
  /** 解析出的标题 */
  title: string
  /** 英文标题 */
  englishTitle?: string
  /** 年份 */
  year?: number
  /** 季号 */
  season?: number
  /** 集号 */
  episode?: number
  /** 判定类型 */
  type: 'movie' | 'tvshow'
}

/** 从文件名解析标题、年份等信息 */
export function parseFileName(fileName: string, folderName?: string): ParsedFileName {
  // 去掉扩展名
  let name = fileName.replace(/\.\w{2,4}$/, '')

  // 检查是否有集号 → 判定为电视剧
  const episodeNum = extractEpisodeNumber(name)
  const isTVShow = episodeNum !== null

  // 提取年份
  const yearMatch = name.match(/[\.\s\-\(]((19|20)\d{2})[\.\s\-\)]?/)
  const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined

  // 去除分辨率、编码等标记
  name = name
    .replace(/\.\w{2,4}$/, '')
    .replace(/[\.\s_]+(1080[pi]|720[pi]|2160[pi]|4K|UHD)/gi, ' ')
    .replace(/[\.\s_]+(x264|x265|HEVC|H\.?264|H\.?265|AAC|DTS|AC3|FLAC|HDR|HDR10|SDR)/gi, ' ')
    .replace(/[\.\s_]+(BluRay|WEB-DL|WEBRip|BDRip|HDRip|DVDRip|HDTV|REMUX)/gi, ' ')
    .replace(/[\.\s_]+(10bit|8bit|DDP|Atmos)/gi, ' ')

  // 去除集号信息
  name = name
    .replace(/S\d{1,2}E\d{1,3}/gi, ' ')
    .replace(/EP?\s*\d{1,3}/gi, ' ')
    .replace(/第\s*\d{1,4}\s*[集话期]/g, ' ')
    .replace(/\[\d{2,3}\]/g, ' ')

  // 去除年份
  if (yearMatch) {
    name = name.replace(yearMatch[0], ' ')
  }

  // 去除方括号和花括号内容
  name = name.replace(/[\[\(【（][^\]\)】）]*[\]\)】）]/g, ' ')

  // 将分隔符替换为空格
  name = name.replace(/[._\-]/g, ' ')

  // 清理多余空格
  name = name.replace(/\s+/g, ' ').trim()

  // 分离中英文标题
  const chineseMatch = name.match(/[\u4e00-\u9fff\uff00-\uffef]+[\s\d]*/)
  const englishMatch = name.match(/[a-zA-Z][\w\s]+/)

  let title = name
  let englishTitle: string | undefined

  if (chineseMatch && englishMatch) {
    title = chineseMatch[0].trim()
    englishTitle = englishMatch[0].trim()
  } else if (chineseMatch) {
    title = chineseMatch[0].trim()
  }

  // 如果标题为空，尝试使用文件夹名
  if (!title && folderName) {
    title = folderName.replace(/[._\-]/g, ' ').trim()
  }

  // 如果还是为空，用原始文件名
  if (!title) {
    title = fileName.replace(/\.\w{2,4}$/, '')
  }

  return {
    title,
    englishTitle,
    year,
    season: isTVShow ? extractSeasonNumber(fileName, folderName) : undefined,
    episode: episodeNum ?? undefined,
    type: isTVShow ? 'tvshow' : 'movie'
  }
}

// ---- 扫描结果 ----

export interface ScannedMediaItem {
  /** 唯一 ID */
  id: string
  /** 标题（优先 TMDB，否则文件名解析） */
  title: string
  originalTitle?: string
  type: 'movie' | 'tvshow' | 'music'
  year?: number
  poster: string
  backdrop?: string
  rating?: number
  genres?: string[]
  overview?: string
  duration?: number
  releaseDate?: string
  /** 云盘文件 ID（仅云盘类型） */
  cloudFileId?: string
  /** 本地文件路径 */
  filePath?: string
  /** 文件扩展名（小写，如 mp3/flac/wav），用于音乐分类 */
  fileExt?: string
  /** 文件源类型 */
  source: 'local' | 'aliyundrive'
  /** 文件源 ID */
  sourceId: string
  /** TMDB ID */
  tmdbId?: number
  /** 电视剧剧集信息 */
  episodes?: {
    season: number
    episode: number
    name: string
    cloudFileId?: string
    filePath?: string
    duration?: number
  }[]
  /** 扫描时间 */
  scannedAt: string
}

// ---- 扫描器 ----

export class MediaScanner {
  private aliyunDrive: AliyunDriveClient
  private tmdb: TMDBClient

  constructor(aliyunDrive: AliyunDriveClient, tmdb: TMDBClient) {
    this.aliyunDrive = aliyunDrive
    this.tmdb = tmdb
  }

  /**
   * 扫描单个阿里云盘文件源
   * 递归扫描文件夹中的视频文件并分类
   */
  async scanAliyunSource(source: FileSourceItem): Promise<ScannedMediaItem[]> {
    const results: ScannedMediaItem[] = []

    try {
      // 列出文件源根目录
      const rootFiles = await this.aliyunDrive.listFiles(source.path, { limit: 200 })
      const items = rootFiles.items || []

      // 分离文件夹、视频文件、音频文件
      const folders = items.filter(f => f.type === 'folder')
      const videos = items.filter(f => f.type === 'file' && f.category === 'video')
      const audios = items.filter(f => f.type === 'file' && f.category === 'audio')

      // 处理根目录下的直接视频文件（视为电影）
      for (const video of videos) {
        const parsed = parseFileName(video.name)
        const item = await this.buildMediaItem(video, parsed, source)
        if (item) results.push(item)
      }

      // 处理根目录下的直接音频文件
      for (const audio of audios) {
        results.push(this.buildAliyunMusicItem(audio, source))
      }

      // 处理子文件夹
      for (const folder of folders) {
        const subItems = await this.scanAliyunFolder(folder, source)
        results.push(...subItems)
      }
    } catch (err) {
      console.error('扫描阿里云盘文件源失败:', source.name, err)
    }

    return results
  }

  /**
   * 扫描子文件夹
   */
  private async scanAliyunFolder(
    folder: any,
    source: FileSourceItem
  ): Promise<ScannedMediaItem[]> {
    try {
      const response = await this.aliyunDrive.listFiles(folder.file_id, { limit: 200 })
      const items = response.items || []
      const subVideos = items.filter(f => f.type === 'file' && f.category === 'video')
      const subAudios = items.filter(f => f.type === 'file' && f.category === 'audio')
      const subFolders = items.filter(f => f.type === 'folder')

      // 检查是否是电视剧文件夹（多个视频文件 + 含集号）
      const episodeVideos = subVideos.filter(v => extractEpisodeNumber(v.name) !== null)

      if (subVideos.length >= 2 && episodeVideos.length >= 2) {
        // 判定为电视剧，音频文件仍单独处理
        const tvItem = await this.buildTVShowItem(folder, subVideos, source)
        const audioItems = subAudios.map(a => this.buildAliyunMusicItem(a, source))
        return [tvItem, ...audioItems]
      }

      // 不是电视剧文件夹，每个视频作为独立电影
      const results: ScannedMediaItem[] = []
      for (const video of subVideos) {
        const parsed = parseFileName(video.name, folder.name)
        const item = await this.buildMediaItem(video, parsed, source)
        if (item) results.push(item)
      }

      // 处理音频文件
      for (const audio of subAudios) {
        results.push(this.buildAliyunMusicItem(audio, source))
      }

      // 递归扫描子文件夹
      for (const sub of subFolders) {
        const subResults = await this.scanAliyunFolder(sub, source)
        results.push(...subResults)
      }

      return results
    } catch (err) {
      console.error('扫描文件夹失败:', folder.name, err)
      return []
    }
  }

  /**
   * 构建电影 MediaItem
   */
  private async buildMediaItem(
    file: any,
    parsed: ParsedFileName,
    source: FileSourceItem
  ): Promise<ScannedMediaItem> {
    const cacheKey = `cloud:${file.file_id}`

    // 尝试 TMDB 刮削
    const metadata = await this.tmdb.scrape(
      cacheKey,
      parsed.title,
      'movie',
      parsed.year
    )

    return {
      id: `cloud-${file.file_id}`,
      title: metadata?.title || parsed.title,
      originalTitle: metadata?.originalTitle,
      type: 'movie',
      year: parsed.year || (metadata?.releaseDate ? new Date(metadata.releaseDate).getFullYear() : undefined),
      poster: metadata?.poster || '',
      backdrop: metadata?.backdrop,
      rating: metadata?.rating,
      genres: metadata?.genres,
      overview: metadata?.overview,
      duration: metadata?.duration || (file.video_media_metadata?.duration ? Math.round(file.video_media_metadata.duration / 60) : undefined),
      releaseDate: metadata?.releaseDate,
      cloudFileId: file.file_id,
      source: 'aliyundrive',
      sourceId: source.id,
      tmdbId: metadata?.tmdbId,
      scannedAt: new Date().toISOString()
    }
  }

  /**
   * 构建电视剧 MediaItem
   */
  private async buildTVShowItem(
    folder: any,
    videoFiles: any[],
    source: FileSourceItem
  ): Promise<ScannedMediaItem> {
    const parsed = parseFileName(folder.name)
    const cacheKey = `cloud:tv:${folder.file_id}`

    // TMDB 刮削（电视剧）
    const metadata = await this.tmdb.scrape(
      cacheKey,
      parsed.title,
      'tvshow',
      parsed.year
    )

    // 构建剧集列表
    const episodes = videoFiles
      .map(v => {
        const ep = extractEpisodeNumber(v.name)
        const season = extractSeasonNumber(v.name, folder.name)
        return {
          season,
          episode: ep || 0,
          name: v.name,
          cloudFileId: v.file_id,
          duration: v.video_media_metadata?.duration
            ? Math.round(v.video_media_metadata.duration / 60)
            : undefined
        }
      })
      .sort((a, b) => a.season - b.season || a.episode - b.episode)

    return {
      id: `cloud-tv-${folder.file_id}`,
      title: metadata?.title || parsed.title,
      originalTitle: metadata?.originalTitle,
      type: 'tvshow',
      year: parsed.year || (metadata?.releaseDate ? new Date(metadata.releaseDate).getFullYear() : undefined),
      poster: metadata?.poster || '',
      backdrop: metadata?.backdrop,
      rating: metadata?.rating,
      genres: metadata?.genres,
      overview: metadata?.overview,
      duration: metadata?.duration,
      releaseDate: metadata?.releaseDate,
      source: 'aliyundrive',
      sourceId: source.id,
      tmdbId: metadata?.tmdbId,
      episodes,
      scannedAt: new Date().toISOString()
    }
  }

  /**
   * 构建阿里云盘音乐 MediaItem
   */
  private buildAliyunMusicItem(file: any, source: FileSourceItem): ScannedMediaItem {
    // 去掉扩展名作为标题
    const title = file.name.replace(/\.[^.]+$/, '')
    const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
    return {
      id: `cloud-music-${file.file_id}`,
      title,
      type: 'music',
      poster: '',
      cloudFileId: file.file_id,
      fileExt,
      source: 'aliyundrive',
      sourceId: source.id,
      scannedAt: new Date().toISOString()
    }
  }

  /**
   * 扫描本地文件源（视频 + 音频）
   */
  async scanLocalSource(source: FileSourceItem): Promise<ScannedMediaItem[]> {
    const results: ScannedMediaItem[] = []

    const scanDir = async (dirPath: string): Promise<void> => {
      try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true })

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name)

          if (entry.isDirectory()) {
            // 递归扫描子目录
            await scanDir(fullPath)
          } else if (entry.isFile()) {
            if (isAudioFile(entry.name)) {
              // 构建音乐条目
              const item = this.buildLocalMusicItem(fullPath, entry.name, source)
              results.push(item)
            } else if (isVideoFile(entry.name)) {
              // 构建视频条目
              const item = this.buildLocalVideoItem(fullPath, entry.name, source)
              results.push(item)
            }
          }
        }
      } catch (err) {
        console.error('扫描本地目录失败:', dirPath, err)
      }
    }

    await scanDir(source.path)
    return results
  }

  /**
   * 构建本地音乐 MediaItem
   */
  private buildLocalMusicItem(filePath: string, fileName: string, source: FileSourceItem): ScannedMediaItem {
    // 去掉扩展名作为标题
    const title = fileName.replace(/\.[^.]+$/, '')
    const fileExt = fileName.split('.').pop()?.toLowerCase() || ''
    const id = `local-music-${Buffer.from(filePath).toString('base64').slice(0, 32)}`

    return {
      id,
      title,
      type: 'music',
      poster: '',
      filePath,
      fileExt,
      source: 'local',
      sourceId: source.id,
      scannedAt: new Date().toISOString()
    }
  }

  /**
   * 构建本地视频 MediaItem
   */
  private buildLocalVideoItem(filePath: string, fileName: string, source: FileSourceItem): ScannedMediaItem {
    const parsed = parseFileName(fileName)
    const id = `local-video-${Buffer.from(filePath).toString('base64').slice(0, 32)}`

    return {
      id,
      title: parsed.title || fileName.replace(/\.[^.]+$/, ''),
      type: parsed.type,
      year: parsed.year,
      poster: '',
      filePath,
      source: 'local',
      sourceId: source.id,
      scannedAt: new Date().toISOString()
    }
  }
}
