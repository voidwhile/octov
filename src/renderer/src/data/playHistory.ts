// ============================================
// Octov - 播放记录管理模块
// 持久化存储播放历史，支持继续观看
// ============================================

/** 播放记录条目 */
export interface PlayRecord {
  /** 云盘文件 ID（唯一标识） */
  fileId: string
  /** 视频名称 */
  name: string
  /** 视频标题（TMDB 刮削或文件名） */
  title?: string
  /** 海报 */
  poster?: string
  /** 播放位置（秒） */
  currentTime: number
  /** 总时长（秒） */
  totalDuration: number
  /** 播放百分比 0-100 */
  percentage: number
  /** 最后播放时间 */
  lastPlayed: string
  /** 父目录 ID（用于导航） */
  parentId?: string
}

// ---- 内存缓存 ----
let records: PlayRecord[] = []
let loaded = false
const listeners: Array<() => void> = []

/** 注册变更监听 */
export function onHistoryChange(listener: () => void): () => void {
  listeners.push(listener)
  return () => {
    const idx = listeners.indexOf(listener)
    if (idx >= 0) listeners.splice(idx, 1)
  }
}

function notify(): void {
  listeners.forEach(fn => fn())
}

/** 从磁盘加载播放记录 */
export async function loadPlayHistory(): Promise<void> {
  if (loaded) return
  loaded = true
  try {
    const result = await window.playHistory.load()
    if (result.success && result.data) {
      records = result.data
    }
  } catch {
    // 加载失败不影响使用
  }
}

/** 保存到磁盘 */
function saveToFile(): void {
  window.playHistory.save(records).catch(() => {})
}

/**
 * 更新播放记录
 * 每次播放过程中定期调用
 */
export function updatePlayRecord(record: Omit<PlayRecord, 'lastPlayed' | 'percentage'>): void {
  const percentage = record.totalDuration > 0
    ? Math.round((record.currentTime / record.totalDuration) * 100)
    : 0

  const existing = records.findIndex(r => r.fileId === record.fileId)
  const newRecord: PlayRecord = {
    ...record,
    percentage,
    lastPlayed: new Date().toISOString()
  }

  if (existing >= 0) {
    records[existing] = newRecord
  } else {
    records.unshift(newRecord)
  }

  // 最多保留 100 条记录
  if (records.length > 100) {
    records = records.slice(0, 100)
  }

  saveToFile()
  notify()
}

/**
 * 获取继续观看列表
 * 过滤掉已看完（>= 95%）的，按最后播放时间从近到远排序
 */
export function getContinueWatching(): PlayRecord[] {
  return [...records]
    .filter(r => r.percentage > 0 && r.percentage < 95)
    .sort((a, b) => new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime())
    .slice(0, 20)
}

/**
 * 获取最近播放列表
 * 包含所有记录，按最后播放时间排序
 */
export function getRecentlyPlayed(): PlayRecord[] {
  return [...records]
    .sort((a, b) => new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime())
    .slice(0, 30)
}

/** 获取指定文件的播放记录 */
export function getPlayRecord(fileId: string): PlayRecord | undefined {
  return records.find(r => r.fileId === fileId)
}
