// ============================================
// Octov - 媒体库数据模块
// 仅使用云盘扫描的真实数据
// ============================================

import { MediaItem, FileSourceItemType } from '../types'

// ---- 扫描结果缓存 ----

/** 云盘扫描得到的媒体项 */
let cloudMediaItems: MediaItem[] = []
/** 是否正在扫描 */
let isScanning = false
/** 是否已完成首次扫描 */
let hasScanned = false
/** 是否已加载过磁盘缓存 */
let cacheLoaded = false
/** 扫描状态变化回调列表 */
const scanListeners: Array<() => void> = []

/** 注册扫描状态监听 */
export function onScanChange(listener: () => void): () => void {
  scanListeners.push(listener)
  return () => {
    const idx = scanListeners.indexOf(listener)
    if (idx >= 0) scanListeners.splice(idx, 1)
  }
}

/** 通知所有监听器 */
function notifyScanChange(): void {
  scanListeners.forEach(fn => fn())
}

/** 获取扫描状态 */
export function getScanStatus(): { isScanning: boolean; hasScanned: boolean; count: number } {
  return { isScanning, hasScanned, count: cloudMediaItems.length }
}

/**
 * 从磁盘加载媒体缓存（启动时调用，秒加载，无需等待扫描）
 */
export async function loadCachedMedia(): Promise<void> {
  if (cacheLoaded) return
  cacheLoaded = true
  try {
    const result = await window.cache.loadMedia()
    if (result.success && result.data && result.data.length > 0) {
      cloudMediaItems = result.data
      hasScanned = true
      notifyScanChange()
    }
  } catch {
    // 缓存加载失败，不影响后续扫描
  }
}

/**
 * 扫描所有云盘文件源
 * 调用主进程的扫描器，获取分类+TMDB刮削后的媒体数据
 * @param force 是否强制重新扫描（用于文件源变更后触发）
 */
export async function scanAllSources(force = false): Promise<void> {
  if (isScanning) return
  if (!force && hasScanned) return // 非强制模式下已扫描过就不再扫描
  isScanning = true
  notifyScanChange()

  try {
    // 获取所有文件源
    const sources: FileSourceItemType[] = await window.storage.getSources()

    // 筛选阿里云盘类型的文件源
    const cloudSources = sources.filter(s => s.storageType === 'aliyundrive')

    if (cloudSources.length === 0) {
      cloudMediaItems = []
      hasScanned = true
      isScanning = false
      notifyScanChange()
      // 清空缓存
      window.cache.saveMedia([]).catch(() => {})
      return
    }

    const allItems: MediaItem[] = []

    for (const source of cloudSources) {
      try {
        const result = await window.scanner.scanSource(source)
        if (result.success && result.data) {
          // 将扫描结果转换为 MediaItem
          for (const item of result.data) {
            const mediaItem: MediaItem = {
              id: item.id,
              title: item.title,
              originalTitle: item.originalTitle,
              type: item.type,
              year: item.year,
              poster: item.poster || '',
              backdrop: item.backdrop,
              rating: item.rating,
              genres: item.genres,
              overview: item.overview,
              duration: item.duration,
              dateAdded: item.scannedAt || new Date().toISOString(),
              releaseDate: item.releaseDate,
              cloudFileId: item.cloudFileId,
              source: 'aliyundrive',
              sourceId: item.sourceId,
              tmdbId: item.tmdbId,
              // 电视剧剧集转换
              seasons: item.episodes && item.episodes.length > 0
                ? convertEpisodesToSeasons(item.episodes)
                : undefined
            }
            allItems.push(mediaItem)
          }
        }
      } catch (err) {
        console.error('扫描文件源失败:', source.name, err)
      }
    }

    cloudMediaItems = allItems
    hasScanned = true

    // 保存缓存到磁盘
    window.cache.saveMedia(allItems).catch(() => {})
  } catch (err) {
    console.error('扫描所有文件源失败:', err)
  } finally {
    isScanning = false
    notifyScanChange()
  }
}

/**
 * 将扫描器的 episodes 扁平列表转换为 Season[] 结构
 */
function convertEpisodesToSeasons(
  episodes: Array<{ season: number; episode: number; name: string; cloudFileId?: string; duration?: number }>
): import('../types').Season[] {
  const seasonMap = new Map<number, import('../types').Episode[]>()

  for (const ep of episodes) {
    if (!seasonMap.has(ep.season)) {
      seasonMap.set(ep.season, [])
    }
    seasonMap.get(ep.season)!.push({
      episodeNumber: ep.episode,
      name: ep.name,
      duration: ep.duration,
      filePath: ep.cloudFileId
    })
  }

  return Array.from(seasonMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([seasonNum, eps]) => ({
      seasonNumber: seasonNum,
      name: `第${seasonNum}季`,
      episodes: eps.sort((a, b) => a.episodeNumber - b.episodeNumber)
    }))
}

// ---- 媒体库查询接口 ----

/** 获取所有媒体 */
export function getAllMedia(): MediaItem[] {
  return [...cloudMediaItems]
}

/** 获取电影列表 */
export function getLibraryMovies(): MediaItem[] {
  return cloudMediaItems.filter(i => i.type === 'movie')
}

/** 获取电视剧列表 */
export function getLibraryTVShows(): MediaItem[] {
  return cloudMediaItems.filter(i => i.type === 'tvshow')
}

/** 获取继续观看列表（有播放进度的） */
export function getLibraryContinueWatching(): MediaItem[] {
  return cloudMediaItems.filter(i => i.progress && i.progress.percentage > 0 && i.progress.percentage < 95)
}

/** 获取最近添加列表 */
export function getLibraryRecentlyAdded(): MediaItem[] {
  return [...cloudMediaItems]
    .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
    .slice(0, 20)
}

/** 根据 ID 获取媒体项 */
export function getLibraryById(id: string): MediaItem | undefined {
  return cloudMediaItems.find(item => item.id === id)
}

/** 搜索媒体 */
export function searchLibrary(query: string): MediaItem[] {
  const lower = query.toLowerCase()
  return cloudMediaItems.filter(
    item =>
      item.title.toLowerCase().includes(lower) ||
      item.originalTitle?.toLowerCase().includes(lower) ||
      item.genres?.some(g => g.includes(lower))
  )
}
