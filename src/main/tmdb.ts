// ============================================
// Octov - TMDB 元数据刮削客户端
// 使用 TMDB v3 API 搜索影视元数据
// ============================================

import * as path from 'path'
import * as fs from 'fs'
import { app, net } from 'electron'

// TMDB API 配置
const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMG = 'https://image.tmdb.org/t/p'
const DEFAULT_TMDB_KEY = ''

// 配置文件路径
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

/** 获取 TMDB API Key */
export function getTmdbApiKey(): string {
  const settings = readSettings()
  return settings.tmdbApiKey || DEFAULT_TMDB_KEY
}

/** 设置 TMDB API Key */
export function setTmdbApiKey(key: string): void {
  const settings = readSettings()
  settings.tmdbApiKey = key
  writeSettings(settings)
}

/** 当前生效的 API Key */
function currentApiKey(): string {
  return getTmdbApiKey()
}

// ---- 类型定义 ----

export interface TMDBSearchResult {
  id: number
  title?: string        // 电影中文标题
  name?: string         // 电视剧中文标题
  original_title?: string
  original_name?: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  vote_average: number
  release_date?: string
  first_air_date?: string
  genre_ids: number[]
  media_type?: string
}

export interface TMDBDetail {
  id: number
  title?: string
  name?: string
  original_title?: string
  original_name?: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  vote_average: number
  release_date?: string
  first_air_date?: string
  runtime?: number           // 电影时长
  episode_run_time?: number[] // 电视剧集均时长
  genres: { id: number; name: string }[]
  number_of_seasons?: number
}

/** 刮削后的元数据 */
export interface ScrapedMetadata {
  tmdbId: number
  title: string
  originalTitle: string
  poster: string
  backdrop: string
  rating: number
  overview: string
  genres: string[]
  releaseDate: string
  duration: number
  type: 'movie' | 'tvshow'
}

// ---- 缓存管理 ----

function getCachePath(): string {
  return path.join(app.getPath('userData'), 'media-cache.json')
}

function readCache(): Record<string, ScrapedMetadata> {
  try {
    const data = fs.readFileSync(getCachePath(), 'utf-8')
    return JSON.parse(data)
  } catch {
    return {}
  }
}

function saveCache(cache: Record<string, ScrapedMetadata>): void {
  fs.writeFileSync(getCachePath(), JSON.stringify(cache, null, 2))
}

// ---- TMDB 客户端 ----

export class TMDBClient {
  private cache: Record<string, ScrapedMetadata>

  constructor() {
    this.cache = readCache()
  }

  /** 发起 TMDB API 请求 */
  private async request(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const apiKey = currentApiKey()
    if (!apiKey) {
      throw new Error('TMDB API Key 未配置，请在设置中填写')
    }
    const url = new URL(`${TMDB_BASE}${endpoint}`)
    url.searchParams.set('api_key', apiKey)
    url.searchParams.set('language', 'zh-CN')
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }

    const response = await net.fetch(url.toString())
    if (!response.ok) {
      throw new Error(`TMDB API 错误: ${response.status}`)
    }
    return response.json()
  }

  /** 搜索电影 */
  async searchMovie(query: string, year?: number): Promise<TMDBSearchResult[]> {
    const params: Record<string, string> = { query }
    if (year) params.year = String(year)
    const data = await this.request('/search/movie', params)
    return data.results || []
  }

  /** 搜索电视剧 */
  async searchTV(query: string, year?: number): Promise<TMDBSearchResult[]> {
    const params: Record<string, string> = { query }
    if (year) params.first_air_date_year = String(year)
    const data = await this.request('/search/tv', params)
    return data.results || []
  }

  /** 获取电影详情 */
  async getMovieDetail(tmdbId: number): Promise<TMDBDetail> {
    return this.request(`/movie/${tmdbId}`)
  }

  /** 获取电视剧详情 */
  async getTVDetail(tmdbId: number): Promise<TMDBDetail> {
    return this.request(`/tv/${tmdbId}`)
  }

  /**
   * 从缓存获取元数据
   * @param cacheKey 缓存键（通常为文件路径或 fileId）
   */
  getCached(cacheKey: string): ScrapedMetadata | undefined {
    return this.cache[cacheKey]
  }

  /**
   * 智能刮削：根据标题和类型搜索 TMDB 并返回元数据
   * @param cacheKey 缓存键
   * @param title 视频标题
   * @param type 类型（movie/tvshow）
   * @param year 年份（可选）
   */
  async scrape(
    cacheKey: string,
    title: string,
    type: 'movie' | 'tvshow',
    year?: number
  ): Promise<ScrapedMetadata | null> {
    // 检查缓存
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey]
    }

    try {
      let results: TMDBSearchResult[]
      if (type === 'tvshow') {
        results = await this.searchTV(title, year)
      } else {
        results = await this.searchMovie(title, year)
      }

      if (results.length === 0) {
        // 尝试英文搜索（去掉中文）
        const englishTitle = title.replace(/[\u4e00-\u9fff]+/g, '').trim()
        if (englishTitle && englishTitle !== title) {
          if (type === 'tvshow') {
            results = await this.searchTV(englishTitle, year)
          } else {
            results = await this.searchMovie(englishTitle, year)
          }
        }
      }

      if (results.length === 0) return null

      // 取第一个结果
      const best = results[0]
      let detail: TMDBDetail

      if (type === 'tvshow') {
        detail = await this.getTVDetail(best.id)
      } else {
        detail = await this.getMovieDetail(best.id)
      }

      const metadata: ScrapedMetadata = {
        tmdbId: detail.id,
        title: detail.title || detail.name || title,
        originalTitle: detail.original_title || detail.original_name || '',
        poster: detail.poster_path ? `${TMDB_IMG}/w500${detail.poster_path}` : '',
        backdrop: detail.backdrop_path ? `${TMDB_IMG}/original${detail.backdrop_path}` : '',
        rating: Math.round(detail.vote_average * 10) / 10,
        overview: detail.overview || '',
        genres: detail.genres.map(g => g.name),
        releaseDate: detail.release_date || detail.first_air_date || '',
        duration: detail.runtime || (detail.episode_run_time?.[0]) || 0,
        type
      }

      // 缓存结果
      this.cache[cacheKey] = metadata
      saveCache(this.cache)

      return metadata
    } catch (err) {
      // TMDB 不可用时静默跳过
      return null
    }
  }

  /** 清除缓存 */
  clearCache(): void {
    this.cache = {}
    saveCache(this.cache)
  }
}
