// ============================================
// Octov - 核心类型定义
// ============================================

/** 媒体类型 */
export type MediaType = 'movie' | 'tvshow' | 'other' | 'music'

/** 文件源类型 */
export type FileSourceType = 'local' | 'aliyundrive'

/** 媒体条目 */
export interface MediaItem {
  id: string
  /** 标题 */
  title: string
  /** 原始标题 */
  originalTitle?: string
  /** 媒体类型 */
  type: MediaType
  /** 年份 */
  year?: number
  /** 封面图 URL */
  poster: string
  /** 背景横幅图 URL */
  backdrop?: string
  /** 评分 (0-10) */
  rating?: number
  /** 类型标签 */
  genres?: string[]
  /** 剧情简介 */
  overview?: string
  /** 时长 (分钟) */
  duration?: number
  /** 添加日期 */
  dateAdded: string
  /** 发布日期 */
  releaseDate?: string
  /** 文件路径 */
  filePath?: string
  /** 文件源 */
  source?: FileSourceType
  /** 电视剧季列表 */
  seasons?: Season[]
  /** 播放进度 */
  progress?: PlaybackProgress
  /** 阿里云盘文件 ID */
  cloudFileId?: string
  /** TMDB ID（用于字幕搜索） */
  tmdbId?: number
  /** 所属文件源 ID */
  sourceId?: string
  /** 文件扩展名（小写，如 mp3/flac/wav），用于音乐分类 */
  fileExt?: string
}

/** 电视剧季 */
export interface Season {
  /** 季号 */
  seasonNumber: number
  /** 季名称 */
  name: string
  /** 集列表 */
  episodes: Episode[]
}

/** 电视剧集 */
export interface Episode {
  /** 集号 */
  episodeNumber: number
  /** 集名称 */
  name: string
  /** 时长 (分钟) */
  duration?: number
  /** 简介 */
  overview?: string
  /** 缩略图 */
  thumbnail?: string
  /** 文件路径 */
  filePath?: string
  /** 播放进度 */
  progress?: PlaybackProgress
}

/** 播放进度 */
export interface PlaybackProgress {
  /** 当前播放位置 (秒) */
  currentTime: number
  /** 总时长 (秒) */
  totalDuration: number
  /** 播放百分比 0-100 */
  percentage: number
  /** 最后播放时间 */
  lastPlayed: string
}

/** 文件源 */
export interface FileSource {
  id: string
  /** 名称 */
  name: string
  /** 类型 */
  type: FileSourceType
  /** 路径或标识 */
  path: string
  /** 图标 */
  icon?: string
}

/** 侧边栏导航项 */
export interface SidebarNavItem {
  id: string
  /** 显示名称 */
  label: string
  /** 图标名称 */
  icon: string
  /** 路由路径 */
  path: string
  /** 是否为分组 */
  isGroup?: boolean
  /** 子项 */
  children?: SidebarNavItem[]
}

/** 主题模式 */
export type ThemeMode = 'light' | 'dark' | 'system'

/** 视图模式 */
export type ViewMode = 'grid' | 'list'

/** 排序方式 */
export type SortBy = 'name' | 'dateAdded' | 'releaseDate' | 'rating'

/** 排序方向 */
export type SortOrder = 'asc' | 'desc'

// ============================================
// 阿里云盘相关类型
// ============================================

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

/** 阿里云盘连接状态 */
export interface AliyunDriveStatus {
  isLoggedIn: boolean
  clientId: string
  userInfo: {
    user_id?: string
    user_name?: string
    avatar?: string
    default_drive_id?: string
  } | null
}

/** 阿里云盘 API 响应 */
export interface AliyunApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

/** 视频播放信息 */
export interface VideoPlayTemplate {
  template_id: string
  status: string
  url: string
}

/** 阿里云盘 API 接口 */
export interface AliyunDriveApi {
  getStatus: () => Promise<AliyunDriveStatus>
  setClientId: (clientId: string) => Promise<{ success: boolean }>
  getQrCode: () => Promise<AliyunApiResponse<{ qrCodeUrl: string; sid: string }>>
  pollQrCodeStatus: (sid: string) => Promise<AliyunApiResponse<{ status: string; authCode?: string }>>
  completeAuth: (authCode: string) => Promise<{ success: boolean; userInfo?: any; error?: string }>
  logout: () => Promise<{ success: boolean }>
  listFiles: (parentFileId: string, options?: any) => Promise<AliyunApiResponse<{ items: AliyunDriveFile[]; next_marker: string }>>
  listVideoFiles: (parentFileId: string, marker?: string) => Promise<AliyunApiResponse<{ items: AliyunDriveFile[]; next_marker: string }>>
  getFileDetail: (fileId: string) => Promise<AliyunApiResponse<AliyunDriveFile>>
  searchFiles: (query: string, options?: any) => Promise<AliyunApiResponse<{ items: AliyunDriveFile[]; next_marker: string }>>
  getVideoPlayInfo: (fileId: string) => Promise<AliyunApiResponse<{ template_list: VideoPlayTemplate[]; meta?: any }>>
  getDownloadUrl: (fileId: string, expireSec?: number) => Promise<AliyunApiResponse<{ url: string; expiration: string }>>
  updatePlayCursor: (fileId: string, playCursor: number) => Promise<{ success: boolean }>
  getProxyUrl: (url: string) => Promise<string>
}

// ============================================
// 存储管理相关类型
// ============================================

/** 存储账户 */
export interface StorageAccount {
  id: string
  type: 'local' | 'aliyundrive'
  name: string
  createdAt: string
  userInfo?: {
    userId: string
    userName: string
    avatar?: string
  }
}

/** 文件源 */
export interface FileSourceItemType {
  id: string
  name: string
  storageId: string
  storageType: 'local' | 'aliyundrive'
  storageName: string
  path: string
  createdAt: string
}

/** 字幕条目 */
export interface SubtitleCue {
  startTime: number
  endTime: number
  text: string
}

/** 字幕搜索结果 */
export interface SubtitleSearchResult {
  id: string
  language: string
  languageName: string
  fileName: string
  source: string
  downloadUrl: string
  rating?: number
}

// 扩展 Window 接口
declare global {
  interface Window {
    aliyunDrive: AliyunDriveApi
    api: {
      selectFolder: () => Promise<string | null>
      getSystemTheme: () => Promise<string>
      getPlatform: () => Promise<string>
    }
    storage: {
      getStorages: () => Promise<StorageAccount[]>
      addStorage: (data: any) => Promise<StorageAccount>
      updateStorage: (id: string, name: string) => Promise<boolean>
      deleteStorage: (id: string) => Promise<boolean>
      getSources: () => Promise<FileSourceItemType[]>
      addSource: (data: any) => Promise<FileSourceItemType>
      deleteSource: (id: string) => Promise<boolean>
      updateSource: (id: string, name: string) => Promise<boolean>
    }
    tmdb: {
      searchMovie: (query: string, year?: number) => Promise<any>
      searchTV: (query: string, year?: number) => Promise<any>
      scrape: (cacheKey: string, title: string, type: string, year?: number) => Promise<any>
    }
    scanner: {
      scanSource: (source: any) => Promise<any>
    }
    subtitle: {
      search: (query: string, tmdbId?: number, season?: number, episode?: number) => Promise<any>
      download: (fileId: string) => Promise<any>
    }
    cache: {
      loadMedia: () => Promise<{ success: boolean; data: any[] }>
      saveMedia: (items: any[]) => Promise<{ success: boolean }>
      getAudioSize: () => Promise<{ success: boolean; size?: number }>
      clearAudio: () => Promise<{ success: boolean; error?: string }>
    }
    playHistory: {
      load: () => Promise<{ success: boolean; data: any[] }>
      save: (records: any[]) => Promise<{ success: boolean }>
    }
    appConfig: {
      getTmdbKey: () => Promise<{ success: boolean; data: string }>
      setTmdbKey: (key: string) => Promise<{ success: boolean }>
      getSubtitleKey: () => Promise<{ success: boolean; data: string }>
      setSubtitleKey: (key: string) => Promise<{ success: boolean }>
    }
    audio: {
      downloadAndCache: (fileId: string, fileName: string) => Promise<{ success: boolean; path?: string; error?: string }>
      getLyrics: (title: string) => Promise<{ success: boolean; lyric?: string; error?: string }>
    }
  }
}
