export type MediaType = 'movie' | 'tvshow' | 'music' | 'other'
export type StorageType = 'local' | 'aliyundrive'
export type ThemeMode = 'light' | 'dark' | 'system'
export type SourceBrowserViewMode = 'list' | 'grid'
export type SourceBrowserFilter = 'all' | 'video' | 'folder' | 'music'
export type SectionId =
  | 'home'
  | 'recent'
  | 'movies'
  | 'tvshows'
  | 'music'
  | 'sources'
  | 'settings'

export interface PlaybackProgress {
  currentTime: number
  totalDuration: number
  percentage: number
  lastPlayed: string
}

export interface EpisodeItem {
  season: number
  episode: number
  name: string
  duration?: number
  cloudFileId?: string
  filePath?: string
}

export interface SeasonItem {
  seasonNumber: number
  name: string
  episodes: EpisodeItem[]
}

export interface MediaItem {
  id: string
  title: string
  originalTitle?: string
  type: MediaType
  year?: number
  poster: string
  backdrop?: string
  rating?: number
  genres: string[]
  overview?: string
  duration?: number
  dateAdded: string
  releaseDate?: string
  filePath?: string
  source: StorageType
  sourceId: string
  sourceName: string
  cloudFileId?: string
  tmdbId?: number
  progress?: PlaybackProgress
  seasons: SeasonItem[]
  fileExt?: string
}

export interface StorageAccount {
  id: string
  type: StorageType
  name: string
  createdAt: string
  userName?: string
}

export interface FileSourceItem {
  id: string
  name: string
  storageId: string
  storageType: StorageType
  storageName: string
  path: string
  createdAt: string
}

export interface SourceBreadcrumbItem {
  id: string
  name: string
}

export interface SourceBrowserEntry {
  id: string
  name: string
  type: 'folder' | 'video' | 'audio' | 'other'
  storageType: StorageType
  sourceId: string
  parentId: string
  path: string
  updatedAt: string
  duration?: number
  sizeLabel?: string
  mediaId?: string
  cloudFileId?: string
  filePath?: string
  thumbnail?: string
}

export interface SourceBrowserSnapshot {
  sourceId: string
  sourceName: string
  storageType: StorageType
  currentFolderId: string
  breadcrumbs: SourceBreadcrumbItem[]
  entries: SourceBrowserEntry[]
  nextMarker?: string
}

export interface StorageBrowserSnapshot {
  storageId: string
  storageName: string
  storageType: StorageType
  currentFolderId: string
  breadcrumbs: SourceBreadcrumbItem[]
  entries: SourceBrowserEntry[]
  nextMarker?: string
}

export interface NavigationSection {
  id: SectionId
  title: string
  subtitle: string
}

export interface AppSettings {
  theme: ThemeMode
  tmdbApiKey: string
  subtitleApiKey: string
  aliyunClientId: string
  aliyunClientSecret: string
}

export interface AliyunDriveStatus {
  isLoggedIn: boolean
  clientId: string
  clientSecretConfigured: boolean
  userName?: string
  userId?: string
  avatar?: string
  driveId?: string
  authorizationSource?: string
}

export type AliyunQrState =
  | 'idle'
  | 'loading'
  | 'waiting'
  | 'scanned'
  | 'success'
  | 'expired'
  | 'error'

export interface AliyunQrSession {
  sid: string
  qrCodeUrl: string
  state: AliyunQrState
  statusText: string
  authCode?: string
  lastError?: string
}

export interface SubtitleCue {
  startTime: number
  endTime: number
  text: string
}

export interface LyricLine {
  time: number
  text: string
}

export interface SubtitleSearchResult {
  id: string
  language: string
  languageName: string
  fileName: string
  source: string
  downloadUrl: string
  rating?: number
}

export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

export interface PlaybackQualityItem {
  id: string
  label: string
  url: string
  format: 'hls' | 'direct'
}

export interface PlaybackQueueItem {
  id: string
  title: string
}

export interface PlaybackSession {
  mediaId?: string
  cloudFileId?: string
  parentFolderId?: string
  title: string
  subtitle: string
  sourceLabel: string
  status: PlaybackStatus
  progress: number
  currentTime: number
  duration: number
  downloadUrl?: string
  activeQualityId?: string
  availableQualities: PlaybackQualityItem[]
  playlist: PlaybackQueueItem[]
  playlistIndex: number
  message?: string
}

export interface LocalSelectionResult {
  paths: string[]
  message: string
}

export interface OctovSnapshot {
  library: MediaItem[]
  continueWatching: MediaItem[]
  recentlyAdded: MediaItem[]
  storages: StorageAccount[]
  sources: FileSourceItem[]
  settings: AppSettings
  aliyunStatus: AliyunDriveStatus
  aliyunQrSession: AliyunQrSession
  playback: PlaybackSession
}
