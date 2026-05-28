import http from '@ohos.net.http'
import {
  AliyunDriveStatus,
  AliyunQrSession,
  AppSettings,
  EpisodeItem,
  FileSourceItem,
  LocalSelectionResult,
  MediaItem,
  OctovSnapshot,
  PlaybackProgress,
  PlaybackQualityItem,
  PlaybackQueueItem,
  PlaybackSession,
  SeasonItem,
  SourceBrowserEntry,
  SourceBrowserSnapshot,
  SourceBreadcrumbItem,
  StorageAccount,
  SubtitleSearchResult
} from '../models/OctovModels'
import { MAIN_VITE_ALIYUN_CLIENT_ID, MAIN_VITE_ALIYUN_CLIENT_SECRET } from '../config/EnvConfig'
import { PlatformAdapters } from './PlatformAdapters'

const ALIYUN_API_BASE: string = 'https://openapi.alipan.com'
const ALIYUN_SCOPES: Array<string> = ['user:base', 'file:all:read', 'file:all:write']

export interface LocalSourceAddResult {
  snapshot: OctovSnapshot
  result: LocalSelectionResult
}

interface AliyunQrCodeResponse {
  qrCodeUrl: string
  sid: string
}

interface AliyunQrStatusResponse {
  status: string
  authCode?: string
}

interface AliyunTokenPayload {
  access_token: string
  refresh_token?: string
  token_type?: string
  expires_in?: number
  default_drive_id?: string
  user_id?: string
  user_name?: string
  avatar?: string
}

interface AliyunDriveInfoPayload {
  default_drive_id?: string
  user_id?: string
  name?: string
  nick_name?: string
  avatar?: string
}

interface AliyunFileListItem {
  file_id: string
  parent_file_id?: string
  name: string
  type: string
  category?: string
  size?: number
  updated_at?: string
  thumbnail?: string
  video_media_metadata?: AliyunVideoMediaMetadata
}

interface AliyunFileListResponse {
  items?: Array<AliyunFileListItem>
  next_marker?: string
}

interface AliyunSearchResponse {
  items?: Array<AliyunFileListItem>
  next_marker?: string
}

interface AliyunVideoMediaMetadata {
  duration?: number
}

interface AliyunVideoPreviewTask {
  template_id?: string
  status?: string
  url?: string
}

interface AliyunVideoPreviewPayload {
  live_transcoding_task_list?: Array<AliyunVideoPreviewTask>
  meta?: AliyunVideoMediaMetadata
}

interface AliyunVideoPreviewPlayInfoResponse {
  video_preview_play_info?: AliyunVideoPreviewPayload
}

interface AliyunDownloadUrlResponse {
  url?: string
  expiration?: string
}

interface AliyunTokenState {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  obtainedAt: number
  driveId: string
  userId: string
  userName: string
  avatar: string
}

interface AliyunQrCodeRequestBody {
  client_id: string
  client_secret: string
  scopes: Array<string>
  width: number
  height: number
}

interface AliyunTokenRequestBody {
  client_id: string
  client_secret: string
  grant_type: string
  code: string
}

function formatFileSize(bytes: number): string {
  const units: Array<string> = ['B', 'KB', 'MB', 'GB', 'TB']
  let value: number = bytes
  let index: number = 0
  while (value >= 1024 && index < units.length - 1) {
    value = value / 1024
    index += 1
  }
  return value.toFixed(1) + ' ' + units[index]
}

function createDefaultSettings(): AppSettings {
  return {
    theme: 'system',
    tmdbApiKey: '',
    subtitleApiKey: '',
    aliyunClientId: MAIN_VITE_ALIYUN_CLIENT_ID,
    aliyunClientSecret: MAIN_VITE_ALIYUN_CLIENT_SECRET
  }
}

function createDefaultAliyunStatus(clientId: string, clientSecret: string): AliyunDriveStatus {
  return {
    isLoggedIn: false,
    clientId: clientId,
    clientSecretConfigured: clientSecret.length > 0,
    userName: '',
    userId: '',
    avatar: '',
    driveId: '',
    authorizationSource: clientId.length > 0 ? '.env' : 'not_configured'
  }
}

function createDefaultAliyunQrSession(): AliyunQrSession {
  return {
    sid: '',
    qrCodeUrl: '',
    state: 'idle',
    statusText: '等待开始扫码登录。'
  }
}

function createDefaultPlayback(): PlaybackSession {
  return {
    title: '未开始播放',
    subtitle: '等待选择媒体',
    sourceLabel: 'Mock Player',
    status: 'idle',
    progress: 0,
    currentTime: 0,
    duration: 0,
    availableQualities: [],
    playlist: [],
    playlistIndex: -1,
    message: '等待接入 HarmonyOS AVPlayer。'
  }
}

function toId(prefix: string, value: string): string {
  return prefix + '-' + value.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()
}

function cloneProgress(progress: PlaybackProgress | undefined): PlaybackProgress | undefined {
  if (progress === undefined) {
    return undefined
  }
  return {
    currentTime: progress.currentTime,
    totalDuration: progress.totalDuration,
    percentage: progress.percentage,
    lastPlayed: progress.lastPlayed
  }
}

function cloneEpisode(item: EpisodeItem): EpisodeItem {
  return {
    season: item.season,
    episode: item.episode,
    name: item.name,
    duration: item.duration,
    cloudFileId: item.cloudFileId,
    filePath: item.filePath
  }
}

function cloneSeason(item: SeasonItem): SeasonItem {
  const episodes: Array<EpisodeItem> = []
  let index: number = 0
  while (index < item.episodes.length) {
    episodes.push(cloneEpisode(item.episodes[index]))
    index += 1
  }
  return {
    seasonNumber: item.seasonNumber,
    name: item.name,
    episodes: episodes
  }
}

function cloneMediaItem(item: MediaItem): MediaItem {
  const seasons: Array<SeasonItem> = []
  let seasonIndex: number = 0
  while (seasonIndex < item.seasons.length) {
    seasons.push(cloneSeason(item.seasons[seasonIndex]))
    seasonIndex += 1
  }
  const genres: Array<string> = []
  let genreIndex: number = 0
  while (genreIndex < item.genres.length) {
    genres.push(item.genres[genreIndex])
    genreIndex += 1
  }
  return {
    id: item.id,
    title: item.title,
    originalTitle: item.originalTitle,
    type: item.type,
    year: item.year,
    poster: item.poster,
    backdrop: item.backdrop,
    rating: item.rating,
    genres: genres,
    overview: item.overview,
    duration: item.duration,
    dateAdded: item.dateAdded,
    releaseDate: item.releaseDate,
    filePath: item.filePath,
    source: item.source,
    sourceId: item.sourceId,
    sourceName: item.sourceName,
    cloudFileId: item.cloudFileId,
    tmdbId: item.tmdbId,
    progress: cloneProgress(item.progress),
    seasons: seasons,
    fileExt: item.fileExt
  }
}

function cloneMediaList(items: Array<MediaItem>): Array<MediaItem> {
  const list: Array<MediaItem> = []
  let index: number = 0
  while (index < items.length) {
    list.push(cloneMediaItem(items[index]))
    index += 1
  }
  return list
}

function cloneStorageList(items: Array<StorageAccount>): Array<StorageAccount> {
  const list: Array<StorageAccount> = []
  let index: number = 0
  while (index < items.length) {
    const item: StorageAccount = items[index]
    list.push({
      id: item.id,
      type: item.type,
      name: item.name,
      createdAt: item.createdAt,
      userName: item.userName
    })
    index += 1
  }
  return list
}

function cloneSourceList(items: Array<FileSourceItem>): Array<FileSourceItem> {
  const list: Array<FileSourceItem> = []
  let index: number = 0
  while (index < items.length) {
    const item: FileSourceItem = items[index]
    list.push({
      id: item.id,
      name: item.name,
      storageId: item.storageId,
      storageType: item.storageType,
      storageName: item.storageName,
      path: item.path,
      createdAt: item.createdAt
    })
    index += 1
  }
  return list
}

function cloneSettings(item: AppSettings): AppSettings {
  return {
    theme: item.theme,
    tmdbApiKey: item.tmdbApiKey,
    subtitleApiKey: item.subtitleApiKey,
    aliyunClientId: item.aliyunClientId,
    aliyunClientSecret: item.aliyunClientSecret
  }
}

function cloneAliyunStatus(item: AliyunDriveStatus): AliyunDriveStatus {
  return {
    isLoggedIn: item.isLoggedIn,
    clientId: item.clientId,
    clientSecretConfigured: item.clientSecretConfigured,
    userName: item.userName,
    userId: item.userId,
    avatar: item.avatar,
    driveId: item.driveId,
    authorizationSource: item.authorizationSource
  }
}

function cloneAliyunQrSession(item: AliyunQrSession): AliyunQrSession {
  return {
    sid: item.sid,
    qrCodeUrl: item.qrCodeUrl,
    state: item.state,
    statusText: item.statusText,
    authCode: item.authCode,
    lastError: item.lastError
  }
}

function clonePlayback(item: PlaybackSession): PlaybackSession {
  const qualities: Array<PlaybackQualityItem> = []
  let qualityIndex: number = 0
  while (qualityIndex < item.availableQualities.length) {
    qualities.push({
      id: item.availableQualities[qualityIndex].id,
      label: item.availableQualities[qualityIndex].label,
      url: item.availableQualities[qualityIndex].url,
      format: item.availableQualities[qualityIndex].format
    })
    qualityIndex += 1
  }
  const playlist: Array<PlaybackQueueItem> = []
  let playlistIndex: number = 0
  while (playlistIndex < item.playlist.length) {
    playlist.push({
      id: item.playlist[playlistIndex].id,
      title: item.playlist[playlistIndex].title
    })
    playlistIndex += 1
  }
  return {
    mediaId: item.mediaId,
    cloudFileId: item.cloudFileId,
    parentFolderId: item.parentFolderId,
    title: item.title,
    subtitle: item.subtitle,
    sourceLabel: item.sourceLabel,
    status: item.status,
    progress: item.progress,
    currentTime: item.currentTime,
    duration: item.duration,
    downloadUrl: item.downloadUrl,
    activeQualityId: item.activeQualityId,
    availableQualities: qualities,
    playlist: playlist,
    playlistIndex: item.playlistIndex,
    message: item.message
  }
}

function appendProgress(base: Array<MediaItem>, percentages: Array<number>): Array<MediaItem> {
  const items: Array<MediaItem> = []
  let index: number = 0
  while (index < base.length) {
    const item: MediaItem = cloneMediaItem(base[index])
    if (index < percentages.length && item.type !== 'music') {
      item.progress = {
        currentTime: percentages[index] * 10,
        totalDuration: 3600,
        percentage: percentages[index],
        lastPlayed: new Date(Date.now() - index * 86400000).toISOString()
      }
    }
    items.push(item)
    index += 1
  }
  return items
}

function compareDate(left: MediaItem, right: MediaItem): number {
  const leftValue: number = new Date(left.dateAdded).getTime()
  const rightValue: number = new Date(right.dateAdded).getTime()
  if (leftValue > rightValue) {
    return -1
  }
  if (leftValue < rightValue) {
    return 1
  }
  return 0
}

function buildAliyunStatusText(state: string): string {
  if (state === 'ScanSuccess') {
    return '扫码成功，请在阿里云盘 App 中确认授权。'
  }
  if (state === 'LoginSuccess') {
    return '授权成功，正在同步账号信息。'
  }
  if (state === 'QRCodeExpired') {
    return '二维码已过期，请重新获取。'
  }
  if (state === 'WaitLogin') {
    return '请使用阿里云盘 App 扫描二维码。'
  }
  return '正在等待授权结果。'
}

function createSeedLibrary(): Array<MediaItem> {
  const now: number = Date.now()
  const seasonOne: SeasonItem = {
    seasonNumber: 1,
    name: 'Season 1',
    episodes: [
      {
        season: 1,
        episode: 1,
        name: 'Pilot',
        duration: 82,
        filePath: '/storage/Users/Movies/The.Last.of.Us.S01E01.mkv'
      },
      {
        season: 1,
        episode: 2,
        name: 'Infected',
        duration: 53,
        filePath: '/storage/Users/Movies/The.Last.of.Us.S01E02.mkv'
      }
    ]
  }

  const list: Array<MediaItem> = [
    {
      id: 'seed-dune-2',
      title: 'Dune: Part Two',
      originalTitle: 'Dune: Part Two',
      type: 'movie',
      year: 2024,
      poster: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
      backdrop: 'https://image.tmdb.org/t/p/original/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
      rating: 8.4,
      genres: ['Sci-Fi', 'Adventure'],
      overview: 'Desktop information architecture translated into a HarmonyOS-friendly media wall.',
      duration: 166,
      dateAdded: new Date(now - 2 * 86400000).toISOString(),
      releaseDate: '2024-03-01',
      source: 'aliyundrive',
      sourceId: 'source-aliyun-demo',
      sourceName: 'Aliyun Drive',
      seasons: [],
      cloudFileId: 'seed-cloud-01',
      tmdbId: 693134
    },
    {
      id: 'seed-last-of-us',
      title: 'The Last of Us',
      originalTitle: 'The Last of Us',
      type: 'tvshow',
      year: 2023,
      poster: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
      backdrop: 'https://image.tmdb.org/t/p/original/aocAMAdfl6zG0E2H1bhz7LCXuvE.jpg',
      rating: 8.7,
      genres: ['Drama', 'Adventure'],
      overview: 'TV structure is preserved so the next step can bind episode playback and subtitle workflow.',
      duration: 58,
      dateAdded: new Date(now - 8 * 86400000).toISOString(),
      releaseDate: '2023-01-15',
      source: 'local',
      sourceId: 'source-local-demo',
      sourceName: 'Local Media',
      seasons: [seasonOne]
    },
    {
      id: 'seed-spiderverse',
      title: 'Spider-Man: Across the Spider-Verse',
      originalTitle: 'Spider-Man: Across the Spider-Verse',
      type: 'movie',
      year: 2023,
      poster: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
      backdrop: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
      rating: 8.4,
      genres: ['Animation', 'Action'],
      overview: 'Used as a bold poster-wall sample for foldables and 2-in-1 devices.',
      duration: 140,
      dateAdded: new Date(now - 5 * 86400000).toISOString(),
      releaseDate: '2023-06-02',
      source: 'aliyundrive',
      sourceId: 'source-aliyun-demo',
      sourceName: 'Aliyun Drive',
      seasons: [],
      cloudFileId: 'seed-cloud-02',
      tmdbId: 569094
    },
    {
      id: 'seed-blade-runner',
      title: 'Blade Runner 2049',
      originalTitle: 'Blade Runner 2049',
      type: 'movie',
      year: 2017,
      poster: 'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
      backdrop: 'https://image.tmdb.org/t/p/original/u4izHlsHk8jwalt5m7E2uzrGDQg.jpg',
      rating: 8.1,
      genres: ['Sci-Fi', 'Thriller'],
      overview: 'Useful for validating continue-watching cards and long-detail layouts.',
      duration: 163,
      dateAdded: new Date(now - 15 * 86400000).toISOString(),
      releaseDate: '2017-10-06',
      source: 'local',
      sourceId: 'source-local-demo',
      sourceName: 'Local Media',
      seasons: [],
      filePath: '/storage/Users/Movies/Blade.Runner.2049.mkv',
      tmdbId: 335984
    },
    {
      id: 'seed-world-execute',
      title: 'world.execute(me);',
      originalTitle: 'Mili',
      type: 'music',
      poster: '',
      genres: ['Electronic', 'Soundtrack'],
      overview: 'Music remains a first-class section and uses the same playback dock.',
      duration: 4,
      dateAdded: new Date(now - 1 * 86400000).toISOString(),
      source: 'aliyundrive',
      sourceId: 'source-aliyun-demo',
      sourceName: 'Aliyun Drive',
      seasons: [],
      cloudFileId: 'seed-cloud-music-01',
      fileExt: 'flac'
    },
    {
      id: 'seed-interstellar',
      title: 'Interstellar',
      originalTitle: 'Interstellar',
      type: 'movie',
      year: 2014,
      poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      backdrop: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
      rating: 8.4,
      genres: ['Sci-Fi', 'Drama'],
      overview: 'A stable long-form catalog sample for home, recent, and detail pages.',
      duration: 169,
      dateAdded: new Date(now - 10 * 86400000).toISOString(),
      releaseDate: '2014-11-07',
      source: 'local',
      sourceId: 'source-local-demo',
      sourceName: 'Local Media',
      seasons: [],
      filePath: '/storage/Users/Movies/Interstellar.mkv',
      tmdbId: 157336
    }
  ]
  return appendProgress(list, [32, 57, 0, 81, 0, 19])
}

class AliyunAuthService {
  private async requestString(url: string, options: http.HttpRequestOptions): Promise<string> {
    const request = http.createHttp()
    try {
      const response = await request.request(url, options)
      const statusCode: number = Number(response.responseCode)
      const bodyText: string = typeof response.result === 'string' ? response.result : ''
      if (statusCode < 200 || statusCode >= 300) {
        throw new Error('Aliyun request failed: ' + statusCode.toString() + ' ' + bodyText)
      }
      return bodyText
    } catch (error) {
      throw new Error(String(error))
    } finally {
      request.destroy()
    }
  }

  async getQrCode(clientId: string, clientSecret: string): Promise<AliyunQrCodeResponse> {
    const body: AliyunQrCodeRequestBody = {
      client_id: clientId,
      client_secret: clientSecret,
      scopes: ALIYUN_SCOPES,
      width: 430,
      height: 430
    }
    const options: http.HttpRequestOptions = {
      method: http.RequestMethod.POST,
      header: {
        'Content-Type': 'application/json'
      },
      extraData: JSON.stringify(body),
      expectDataType: http.HttpDataType.STRING
    }
    const resultText: string = await this.requestString(ALIYUN_API_BASE + '/oauth/authorize/qrcode', options)
    return JSON.parse(resultText) as AliyunQrCodeResponse
  }

  async pollQrCodeStatus(sid: string): Promise<AliyunQrStatusResponse> {
    const options: http.HttpRequestOptions = {
      method: http.RequestMethod.GET,
      header: {
        'Content-Type': 'application/json'
      },
      expectDataType: http.HttpDataType.STRING
    }
    const resultText: string = await this.requestString(ALIYUN_API_BASE + '/oauth/qrcode/' + sid + '/status', options)
    return JSON.parse(resultText) as AliyunQrStatusResponse
  }

  async exchangeToken(clientId: string, clientSecret: string, authCode: string): Promise<AliyunTokenState> {
    const body: AliyunTokenRequestBody = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code: authCode
    }
    const options: http.HttpRequestOptions = {
      method: http.RequestMethod.POST,
      header: {
        'Content-Type': 'application/json'
      },
      extraData: JSON.stringify(body),
      expectDataType: http.HttpDataType.STRING
    }
    const resultText: string = await this.requestString(ALIYUN_API_BASE + '/oauth/access_token', options)
    const payload: AliyunTokenPayload = JSON.parse(resultText) as AliyunTokenPayload
    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token === undefined ? '' : payload.refresh_token,
      tokenType: payload.token_type === undefined ? 'Bearer' : payload.token_type,
      expiresIn: payload.expires_in === undefined ? 7200 : payload.expires_in,
      obtainedAt: Date.now(),
      driveId: payload.default_drive_id === undefined ? '' : payload.default_drive_id,
      userId: payload.user_id === undefined ? '' : payload.user_id,
      userName: payload.user_name === undefined ? '' : payload.user_name,
      avatar: payload.avatar === undefined ? '' : payload.avatar
    }
  }

  async fetchDriveInfo(token: AliyunTokenState): Promise<AliyunDriveInfoPayload> {
    const options: http.HttpRequestOptions = {
      method: http.RequestMethod.POST,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token.tokenType + ' ' + token.accessToken
      },
      extraData: JSON.stringify({}),
      expectDataType: http.HttpDataType.STRING
    }
    const resultText: string = await this.requestString(ALIYUN_API_BASE + '/adrive/v1.0/user/getDriveInfo', options)
    return JSON.parse(resultText) as AliyunDriveInfoPayload
  }

  async listFiles(token: AliyunTokenState, parentFileId: string, marker?: string): Promise<AliyunFileListResponse> {
    const options: http.HttpRequestOptions = {
      method: http.RequestMethod.POST,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token.tokenType + ' ' + token.accessToken
      },
      extraData: JSON.stringify({
        drive_id: token.driveId,
        parent_file_id: parentFileId,
        limit: 100,
        order_by: 'updated_at',
        order_direction: 'DESC',
        marker: marker === undefined ? '' : marker
      }),
      expectDataType: http.HttpDataType.STRING
    }
    const resultText: string = await this.requestString(ALIYUN_API_BASE + '/adrive/v1.0/openFile/list', options)
    return JSON.parse(resultText) as AliyunFileListResponse
  }

  async searchFiles(token: AliyunTokenState, query: string, marker?: string): Promise<AliyunSearchResponse> {
    const options: http.HttpRequestOptions = {
      method: http.RequestMethod.POST,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token.tokenType + ' ' + token.accessToken
      },
      extraData: JSON.stringify({
        drive_id: token.driveId,
        query: query,
        limit: 50,
        marker: marker === undefined ? '' : marker
      }),
      expectDataType: http.HttpDataType.STRING
    }
    const resultText: string = await this.requestString(ALIYUN_API_BASE + '/adrive/v1.0/openFile/search', options)
    return JSON.parse(resultText) as AliyunSearchResponse
  }

  async getVideoPlayInfo(token: AliyunTokenState, fileId: string): Promise<AliyunVideoPreviewPlayInfoResponse> {
    const options: http.HttpRequestOptions = {
      method: http.RequestMethod.POST,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token.tokenType + ' ' + token.accessToken
      },
      extraData: JSON.stringify({
        drive_id: token.driveId,
        file_id: fileId,
        category: 'live_transcoding',
        get_subtitle_info: true
      }),
      expectDataType: http.HttpDataType.STRING
    }
    const resultText: string = await this.requestString(ALIYUN_API_BASE + '/adrive/v1.0/openFile/getVideoPreviewPlayInfo', options)
    return JSON.parse(resultText) as AliyunVideoPreviewPlayInfoResponse
  }

  async getDownloadUrl(token: AliyunTokenState, fileId: string): Promise<AliyunDownloadUrlResponse> {
    const options: http.HttpRequestOptions = {
      method: http.RequestMethod.POST,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token.tokenType + ' ' + token.accessToken
      },
      extraData: JSON.stringify({
        drive_id: token.driveId,
        file_id: fileId,
        expire_sec: 900
      }),
      expectDataType: http.HttpDataType.STRING
    }
    const resultText: string = await this.requestString(ALIYUN_API_BASE + '/adrive/v1.0/openFile/getDownloadUrl', options)
    return JSON.parse(resultText) as AliyunDownloadUrlResponse
  }

  async updatePlayCursor(token: AliyunTokenState, fileId: string, playCursor: number): Promise<void> {
    const options: http.HttpRequestOptions = {
      method: http.RequestMethod.POST,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token.tokenType + ' ' + token.accessToken
      },
      extraData: JSON.stringify({
        drive_id: token.driveId,
        file_id: fileId,
        play_cursor: playCursor.toString()
      }),
      expectDataType: http.HttpDataType.STRING
    }
    await this.requestString(ALIYUN_API_BASE + '/adrive/v1.0/openFile/video/updateRecord', options)
  }
}

export class OctovRepository {
  private static instance: OctovRepository | undefined = undefined
  private bootstrapped: boolean = false
  private settings: AppSettings = createDefaultSettings()
  private aliyunStatus: AliyunDriveStatus = createDefaultAliyunStatus(MAIN_VITE_ALIYUN_CLIENT_ID, MAIN_VITE_ALIYUN_CLIENT_SECRET)
  private aliyunQrSession: AliyunQrSession = createDefaultAliyunQrSession()
  private aliyunToken: AliyunTokenState | undefined = undefined
  private playbackSession: PlaybackSession = createDefaultPlayback()
  private storages: Array<StorageAccount> = []
  private sources: Array<FileSourceItem> = []
  private mediaLibrary: Array<MediaItem> = []
  private currentPlaybackMediaId: string = ''
  private aliyunAuthService: AliyunAuthService = new AliyunAuthService()

  static shared(): OctovRepository {
    if (OctovRepository.instance === undefined) {
      OctovRepository.instance = new OctovRepository()
    }
    return OctovRepository.instance
  }

  async bootstrap(): Promise<OctovSnapshot> {
    if (!this.bootstrapped) {
      this.seed()
      this.bootstrapped = true
    }
    return this.snapshot()
  }

  getSettings(): AppSettings {
    return cloneSettings(this.settings)
  }

  getAliyunStatus(): AliyunDriveStatus {
    return cloneAliyunStatus(this.aliyunStatus)
  }

  getAliyunQrSession(): AliyunQrSession {
    return cloneAliyunQrSession(this.aliyunQrSession)
  }

  updateSettings(next: AppSettings): OctovSnapshot {
    this.settings = cloneSettings(next)
    this.applyAliyunCredentialsToStatus()
    return this.snapshot()
  }

  updateAliyunCredentials(clientId: string, clientSecret: string): OctovSnapshot {
    this.settings.aliyunClientId = clientId
    this.settings.aliyunClientSecret = clientSecret
    this.applyAliyunCredentialsToStatus()
    this.aliyunQrSession = createDefaultAliyunQrSession()
    return this.snapshot()
  }

  async requestAliyunQrCode(): Promise<OctovSnapshot> {
    if (this.settings.aliyunClientId.length === 0) {
      this.aliyunQrSession = {
        sid: '',
        qrCodeUrl: '',
        state: 'error',
        statusText: '未配置阿里云盘 client_id。',
        lastError: 'missing_client_id'
      }
      return this.snapshot()
    }
    this.aliyunQrSession = {
      sid: '',
      qrCodeUrl: '',
      state: 'loading',
      statusText: '正在获取二维码...'
    }
    try {
      const payload: AliyunQrCodeResponse = await this.aliyunAuthService.getQrCode(
        this.settings.aliyunClientId,
        this.settings.aliyunClientSecret
      )
      this.aliyunQrSession = {
        sid: payload.sid,
        qrCodeUrl: payload.qrCodeUrl,
        state: 'waiting',
        statusText: '请使用阿里云盘 App 扫描二维码。'
      }
    } catch (error) {
      this.aliyunQrSession = {
        sid: '',
        qrCodeUrl: '',
        state: 'error',
        statusText: '获取二维码失败。',
        lastError: String(error)
      }
    }
    return this.snapshot()
  }

  async pollAliyunQrCodeStatus(): Promise<OctovSnapshot> {
    if (this.aliyunQrSession.sid.length === 0) {
      return await this.requestAliyunQrCode()
    }
    try {
      const payload: AliyunQrStatusResponse = await this.aliyunAuthService.pollQrCodeStatus(this.aliyunQrSession.sid)
      if (payload.status === 'LoginSuccess' && payload.authCode !== undefined && payload.authCode.length > 0) {
        await this.completeAliyunAuth(payload.authCode)
        return this.snapshot()
      }
      this.aliyunQrSession.state = payload.status === 'ScanSuccess' ? 'scanned' :
        payload.status === 'QRCodeExpired' ? 'expired' : 'waiting'
      this.aliyunQrSession.statusText = buildAliyunStatusText(payload.status)
      this.aliyunQrSession.authCode = payload.authCode
      return this.snapshot()
    } catch (error) {
      this.aliyunQrSession.state = 'error'
      this.aliyunQrSession.statusText = '轮询扫码状态失败。'
      this.aliyunQrSession.lastError = String(error)
      return this.snapshot()
    }
  }

  async completeAliyunAuth(authCode: string): Promise<OctovSnapshot> {
    try {
      const tokenState: AliyunTokenState = await this.aliyunAuthService.exchangeToken(
        this.settings.aliyunClientId,
        this.settings.aliyunClientSecret,
        authCode
      )
      const driveInfo: AliyunDriveInfoPayload = await this.aliyunAuthService.fetchDriveInfo(tokenState)
      if (driveInfo.default_drive_id !== undefined) {
        tokenState.driveId = driveInfo.default_drive_id
      }
      if (driveInfo.user_id !== undefined) {
        tokenState.userId = driveInfo.user_id
      }
      if (driveInfo.name !== undefined && driveInfo.name.length > 0) {
        tokenState.userName = driveInfo.name
      } else if (driveInfo.nick_name !== undefined) {
        tokenState.userName = driveInfo.nick_name
      }
      if (driveInfo.avatar !== undefined) {
        tokenState.avatar = driveInfo.avatar
      }
      this.aliyunToken = tokenState
      this.aliyunStatus.isLoggedIn = true
      this.aliyunStatus.userName = tokenState.userName
      this.aliyunStatus.userId = tokenState.userId
      this.aliyunStatus.avatar = tokenState.avatar
      this.aliyunStatus.driveId = tokenState.driveId
      this.aliyunStatus.authorizationSource = '.env'
      this.aliyunQrSession = {
        sid: '',
        qrCodeUrl: '',
        state: 'success',
        statusText: '授权成功，已连接阿里云盘。'
      }
      return this.snapshot()
    } catch (error) {
      this.aliyunToken = undefined
      this.aliyunStatus.isLoggedIn = false
      this.aliyunStatus.userName = ''
      this.aliyunStatus.userId = ''
      this.aliyunStatus.avatar = ''
      this.aliyunStatus.driveId = ''
      this.aliyunQrSession = {
        sid: '',
        qrCodeUrl: '',
        state: 'error',
        statusText: '完成授权失败。',
        lastError: String(error)
      }
      return this.snapshot()
    }
  }

  logoutAliyun(): OctovSnapshot {
    this.aliyunToken = undefined
    this.aliyunStatus.isLoggedIn = false
    this.aliyunStatus.userName = ''
    this.aliyunStatus.userId = ''
    this.aliyunStatus.avatar = ''
    this.aliyunStatus.driveId = ''
    this.aliyunQrSession = createDefaultAliyunQrSession()
    this.applyAliyunCredentialsToStatus()
    return this.snapshot()
  }

  async rescanSources(): Promise<OctovSnapshot> {
    this.mediaLibrary = createSeedLibrary()
    return this.snapshot()
  }

  async addLocalSourceFromPicker(): Promise<LocalSourceAddResult> {
    const result: LocalSelectionResult = await PlatformAdapters.filePicker().pickFolders()
    if (result.paths.length > 0) {
      const firstPath: string = result.paths[0]
      const source: FileSourceItem = {
        id: toId('source-local', firstPath),
        name: 'Imported Local Folder',
        storageId: 'local-main',
        storageType: 'local',
        storageName: 'Local Media',
        path: firstPath,
        createdAt: new Date().toISOString()
      }
      this.addSourceIfNeeded(source)
    }
    return {
      snapshot: this.snapshot(),
      result: result
    }
  }

  async openMedia(item: MediaItem): Promise<OctovSnapshot> {
    let source: string = item.id
    if (item.filePath !== undefined) {
      source = item.filePath
    } else if (item.cloudFileId !== undefined) {
      source = item.cloudFileId
    }
    this.currentPlaybackMediaId = item.id
    this.playbackSession = await PlatformAdapters.player().open(source, item.title)
    this.playbackSession.availableQualities = []
    this.playbackSession.playlist = []
    this.playbackSession.playlistIndex = -1
    if (item.progress !== undefined && item.progress.percentage > 0 && item.progress.percentage < 95) {
      this.playbackSession = await PlatformAdapters.player().seek(item.progress.percentage)
      this.playbackSession.message = '恢复到上次播放进度。'
    }
    this.playbackSession.sourceLabel = item.sourceName
    this.playbackSession.mediaId = item.id
    this.syncPlaybackToLibrary()
    return this.snapshot()
  }

  async openCloudFile(
    cloudFileId: string,
    title: string,
    sourceName: string,
    parentFolderId?: string,
    sourceId?: string
  ): Promise<OctovSnapshot> {
    this.currentPlaybackMediaId = ''
    let playbackSource: string = cloudFileId
    let playbackMessage: string = '已为云盘文件创建播放会话。'
    let qualities: Array<PlaybackQualityItem> = []
    let activeQualityId: string = ''
    let playlist: Array<PlaybackQueueItem> = []
    let playlistIndex: number = -1
    if (
      this.aliyunToken !== undefined &&
      this.aliyunStatus.isLoggedIn &&
      parentFolderId !== undefined &&
      parentFolderId.length > 0
    ) {
      try {
        const downloadPayload: AliyunDownloadUrlResponse = await this.aliyunAuthService.getDownloadUrl(this.aliyunToken, cloudFileId)
        if (downloadPayload.url !== undefined && downloadPayload.url.length > 0) {
          playbackSource = downloadPayload.url
        }
      } catch (_error) {
      }
      try {
        const playInfoPayload: AliyunVideoPreviewPlayInfoResponse = await this.aliyunAuthService.getVideoPlayInfo(this.aliyunToken, cloudFileId)
        qualities = this.mapAliyunPlaybackQualities(playInfoPayload)
        if (qualities.length > 0) {
          activeQualityId = qualities[0].id
          if (playbackSource === cloudFileId) {
            playbackSource = qualities[0].url
          }
        }
      } catch (_error) {
      }
      try {
        const listPayload: AliyunFileListResponse = await this.aliyunAuthService.listFiles(this.aliyunToken, parentFolderId)
        playlist = this.buildCloudPlaybackQueue(listPayload.items === undefined ? [] : listPayload.items)
        playlistIndex = this.findPlaybackQueueIndex(playlist, cloudFileId)
      } catch (_error) {
      }
    }
    this.playbackSession = await PlatformAdapters.player().open(playbackSource, title)
    this.playbackSession.mediaId = sourceId === undefined || sourceId.length === 0 ? cloudFileId : sourceId + ':' + cloudFileId
    this.playbackSession.cloudFileId = cloudFileId
    this.playbackSession.parentFolderId = parentFolderId
    this.playbackSession.sourceLabel = sourceName
    this.playbackSession.subtitle = sourceName
    this.playbackSession.downloadUrl = playbackSource === cloudFileId ? '' : playbackSource
    this.playbackSession.availableQualities = qualities
    this.playbackSession.activeQualityId = activeQualityId
    this.playbackSession.playlist = playlist
    this.playbackSession.playlistIndex = playlistIndex
    if (qualities.length > 0) {
      playbackMessage = '云盘播放信息已就绪，可选清晰度 ' + qualities.length.toString() + ' 个。'
    } else if (playbackSource !== cloudFileId) {
      playbackMessage = '云盘原始下载链接已就绪。'
    }
    this.playbackSession.message = playbackMessage
    return this.snapshot()
  }

  async playPreviousCloudItem(): Promise<OctovSnapshot> {
    if (this.playbackSession.playlistIndex <= 0) {
      return this.snapshot()
    }
    const target: PlaybackQueueItem = this.playbackSession.playlist[this.playbackSession.playlistIndex - 1]
    return await this.openCloudFile(
      target.id,
      target.title,
      this.playbackSession.sourceLabel,
      this.playbackSession.parentFolderId
    )
  }

  async playNextCloudItem(): Promise<OctovSnapshot> {
    if (
      this.playbackSession.playlistIndex < 0 ||
      this.playbackSession.playlistIndex >= this.playbackSession.playlist.length - 1
    ) {
      return this.snapshot()
    }
    const target: PlaybackQueueItem = this.playbackSession.playlist[this.playbackSession.playlistIndex + 1]
    return await this.openCloudFile(
      target.id,
      target.title,
      this.playbackSession.sourceLabel,
      this.playbackSession.parentFolderId
    )
  }

  async selectPlaybackQuality(qualityId: string): Promise<OctovSnapshot> {
    let index: number = 0
    let selected: PlaybackQualityItem | undefined = undefined
    while (index < this.playbackSession.availableQualities.length) {
      if (this.playbackSession.availableQualities[index].id === qualityId) {
        selected = this.playbackSession.availableQualities[index]
        break
      }
      index += 1
    }
    if (selected === undefined) {
      return this.snapshot()
    }
    const previousProgress: number = this.playbackSession.progress
    const previousStatus: string = this.playbackSession.status
    const previousSession: PlaybackSession = clonePlayback(this.playbackSession)
    this.playbackSession = await PlatformAdapters.player().open(selected.url, previousSession.title)
    if (previousProgress > 0) {
      this.playbackSession = await PlatformAdapters.player().seek(previousProgress)
    }
    if (previousStatus === 'playing') {
      this.playbackSession = await PlatformAdapters.player().play()
    }
    this.playbackSession.mediaId = previousSession.mediaId
    this.playbackSession.cloudFileId = previousSession.cloudFileId
    this.playbackSession.parentFolderId = previousSession.parentFolderId
    this.playbackSession.title = previousSession.title
    this.playbackSession.subtitle = previousSession.subtitle
    this.playbackSession.sourceLabel = previousSession.sourceLabel
    this.playbackSession.downloadUrl = selected.url
    this.playbackSession.availableQualities = previousSession.availableQualities
    this.playbackSession.activeQualityId = qualityId
    this.playbackSession.playlist = previousSession.playlist
    this.playbackSession.playlistIndex = previousSession.playlistIndex
    this.playbackSession.message = '已切换到 ' + selected.label + ' 清晰度。'
    return this.snapshot()
  }

  async browseSource(sourceId: string, folderId?: string): Promise<SourceBrowserSnapshot> {
    const source: FileSourceItem | undefined = this.findSourceById(sourceId)
    if (source === undefined) {
      return {
        sourceId: sourceId,
        sourceName: 'Unknown Source',
        storageType: 'local',
        currentFolderId: '',
        breadcrumbs: [],
        entries: []
      }
    }
    if (source.storageType === 'aliyundrive') {
      return await this.browseAliyunSource(source, folderId)
    }
    return this.browseLocalSource(source)
  }

  async loadMoreSource(sourceId: string, folderId: string, marker: string): Promise<SourceBrowserSnapshot> {
    const source: FileSourceItem | undefined = this.findSourceById(sourceId)
    if (source === undefined) {
      return {
        sourceId: sourceId,
        sourceName: 'Unknown Source',
        storageType: 'local',
        currentFolderId: folderId,
        breadcrumbs: [],
        entries: [],
        nextMarker: ''
      }
    }
    if (source.storageType === 'aliyundrive' && this.aliyunToken !== undefined && this.aliyunStatus.isLoggedIn) {
      try {
        const payload: AliyunFileListResponse = await this.aliyunAuthService.listFiles(this.aliyunToken, folderId, marker)
        return this.buildAliyunRemoteSnapshot(
          source,
          folderId,
          payload.items === undefined ? [] : payload.items,
          payload.next_marker
        )
      } catch (_error) {
      }
    }
    return await this.browseSource(sourceId, folderId)
  }

  async searchSource(sourceId: string, query: string, marker?: string): Promise<SourceBrowserSnapshot> {
    const source: FileSourceItem | undefined = this.findSourceById(sourceId)
    if (source === undefined) {
      return {
        sourceId: sourceId,
        sourceName: 'Unknown Source',
        storageType: 'local',
        currentFolderId: '',
        breadcrumbs: [],
        entries: [],
        nextMarker: ''
      }
    }
    if (source.storageType === 'aliyundrive' && this.aliyunToken !== undefined && this.aliyunStatus.isLoggedIn) {
      try {
        const payload: AliyunSearchResponse = await this.aliyunAuthService.searchFiles(this.aliyunToken, query, marker)
        return {
          sourceId: source.id,
          sourceName: source.name,
          storageType: source.storageType,
          currentFolderId: source.path,
          breadcrumbs: [
            { id: source.path, name: source.name },
            { id: 'search', name: '搜索结果' }
          ],
          entries: this.mapAliyunEntries(source, source.path, payload.items === undefined ? [] : payload.items),
          nextMarker: payload.next_marker === undefined ? '' : payload.next_marker
        }
      } catch (_error) {
      }
    }
    const localSnapshot: SourceBrowserSnapshot = this.browseLocalSource(source)
    const filtered: Array<SourceBrowserEntry> = []
    let index: number = 0
    const normalizedQuery: string = query.toLowerCase()
    while (index < localSnapshot.entries.length) {
      const entry: SourceBrowserEntry = localSnapshot.entries[index]
      if (entry.name.toLowerCase().includes(normalizedQuery)) {
        filtered.push(entry)
      }
      index += 1
    }
    return {
      sourceId: localSnapshot.sourceId,
      sourceName: localSnapshot.sourceName,
      storageType: localSnapshot.storageType,
      currentFolderId: localSnapshot.currentFolderId,
      breadcrumbs: [
        { id: source.path, name: source.name },
        { id: 'search', name: '搜索结果' }
      ],
      entries: filtered,
      nextMarker: ''
    }
  }

  removeSource(sourceId: string): OctovSnapshot {
    const nextSources: Array<FileSourceItem> = []
    let index: number = 0
    while (index < this.sources.length) {
      const source: FileSourceItem = this.sources[index]
      if (source.id !== sourceId) {
        nextSources.push(source)
      }
      index += 1
    }
    this.sources = nextSources

    const nextLibrary: Array<MediaItem> = []
    let itemIndex: number = 0
    while (itemIndex < this.mediaLibrary.length) {
      const item: MediaItem = this.mediaLibrary[itemIndex]
      if (item.sourceId !== sourceId) {
        nextLibrary.push(item)
      }
      itemIndex += 1
    }
    this.mediaLibrary = nextLibrary
    return this.snapshot()
  }

  async playCurrentMedia(): Promise<OctovSnapshot> {
    this.playbackSession = await PlatformAdapters.player().play()
    this.syncPlaybackToLibrary()
    await this.syncCloudPlaybackCursor()
    return this.snapshot()
  }

  async pauseCurrentMedia(): Promise<OctovSnapshot> {
    this.playbackSession = await PlatformAdapters.player().pause()
    this.syncPlaybackToLibrary()
    await this.syncCloudPlaybackCursor()
    return this.snapshot()
  }

  async stopCurrentMedia(): Promise<OctovSnapshot> {
    await this.syncCloudPlaybackCursor()
    this.playbackSession = await PlatformAdapters.player().stop()
    this.syncPlaybackToLibrary()
    this.currentPlaybackMediaId = ''
    return this.snapshot()
  }

  async seekCurrentMedia(progress: number): Promise<OctovSnapshot> {
    this.playbackSession = await PlatformAdapters.player().seek(progress)
    this.syncPlaybackToLibrary()
    await this.syncCloudPlaybackCursor()
    return this.snapshot()
  }

  async searchSubtitles(query: string, tmdbId?: number, season?: number, episode?: number): Promise<Array<SubtitleSearchResult>> {
    const results: Array<SubtitleSearchResult> = []
    results.push({
      id: 'mock-subtitle-1',
      language: 'zh-CN',
      languageName: '简体中文',
      fileName: query + '.zh-CN.srt',
      source: 'Mock Catalog',
      downloadUrl: '',
      rating: 4.8
    })
    results.push({
      id: 'mock-subtitle-2',
      language: 'en',
      languageName: 'English',
      fileName: query + '.en.srt',
      source: 'Mock Catalog',
      downloadUrl: '',
      rating: 4.2
    })
    if (season !== undefined && episode !== undefined && tmdbId !== undefined) {
      results.push({
        id: 'mock-subtitle-3',
        language: 'zh-TW',
        languageName: '繁体中文',
        fileName: 'tmdb-' + tmdbId.toString() + '-s' + season.toString() + 'e' + episode.toString() + '.ass',
        source: 'Episode Match',
        downloadUrl: '',
        rating: 4.5
      })
    }
    return results
  }

  private seed(): void {
    const now: string = new Date().toISOString()
    this.storages = [
      {
        id: 'local-main',
        type: 'local',
        name: 'Local Media',
        createdAt: now,
        userName: 'This Device'
      },
      {
        id: 'aliyun-main',
        type: 'aliyundrive',
        name: 'Aliyun Drive',
        createdAt: now,
        userName: 'Not Authorized'
      }
    ]
    this.sources = [
      {
        id: 'source-local-demo',
        name: 'Movies Demo',
        storageId: 'local-main',
        storageType: 'local',
        storageName: 'Local Media',
        path: '/storage/Users/Movies',
        createdAt: now
      },
      {
        id: 'source-aliyun-demo',
        name: 'Cloud Favorites',
        storageId: 'aliyun-main',
        storageType: 'aliyundrive',
        storageName: 'Aliyun Drive',
        path: 'root',
        createdAt: now
      }
    ]
    this.mediaLibrary = createSeedLibrary()
    this.playbackSession = createDefaultPlayback()
    this.applyAliyunCredentialsToStatus()
    this.aliyunQrSession = createDefaultAliyunQrSession()
  }

  private applyAliyunCredentialsToStatus(): void {
    this.aliyunStatus.clientId = this.settings.aliyunClientId
    this.aliyunStatus.clientSecretConfigured = this.settings.aliyunClientSecret.length > 0
    if (!this.aliyunStatus.isLoggedIn) {
      this.aliyunStatus.authorizationSource = this.settings.aliyunClientId.length > 0 ? '.env' : 'not_configured'
    }
  }

  private addSourceIfNeeded(source: FileSourceItem): void {
    let exists: boolean = false
    let index: number = 0
    while (index < this.sources.length) {
      const current: FileSourceItem = this.sources[index]
      if (current.path === source.path && current.storageType === source.storageType) {
        exists = true
        break
      }
      index += 1
    }
    if (!exists) {
      this.sources.push(source)
    }
  }

  private buildContinueWatching(items: Array<MediaItem>): Array<MediaItem> {
    const list: Array<MediaItem> = []
    let index: number = 0
    while (index < items.length) {
      const item: MediaItem = items[index]
      if (item.progress !== undefined && item.progress.percentage > 0 && item.progress.percentage < 95) {
        list.push(cloneMediaItem(item))
      }
      index += 1
    }
    list.sort((left: MediaItem, right: MediaItem) => {
      const leftTime: number = left.progress === undefined ? 0 : new Date(left.progress.lastPlayed).getTime()
      const rightTime: number = right.progress === undefined ? 0 : new Date(right.progress.lastPlayed).getTime()
      if (leftTime > rightTime) {
        return -1
      }
      if (leftTime < rightTime) {
        return 1
      }
      return 0
    })
    return list
  }

  private buildRecentlyAdded(items: Array<MediaItem>): Array<MediaItem> {
    const list: Array<MediaItem> = cloneMediaList(items)
    list.sort(compareDate)
    if (list.length > 18) {
      return list.slice(0, 18)
    }
    return list
  }

  private snapshot(): OctovSnapshot {
    const library: Array<MediaItem> = cloneMediaList(this.mediaLibrary)
    return {
      library: library,
      continueWatching: this.buildContinueWatching(library),
      recentlyAdded: this.buildRecentlyAdded(library),
      storages: cloneStorageList(this.storages),
      sources: cloneSourceList(this.sources),
      settings: cloneSettings(this.settings),
      aliyunStatus: cloneAliyunStatus(this.aliyunStatus),
      aliyunQrSession: cloneAliyunQrSession(this.aliyunQrSession),
      playback: clonePlayback(this.playbackSession)
    }
  }

  private syncPlaybackToLibrary(): void {
    if (this.currentPlaybackMediaId.length === 0) {
      return
    }
    const item: MediaItem | undefined = this.findMediaItemById(this.currentPlaybackMediaId)
    if (item === undefined || this.playbackSession.duration <= 0) {
      return
    }
    item.progress = {
      currentTime: this.playbackSession.currentTime,
      totalDuration: this.playbackSession.duration,
      percentage: this.playbackSession.progress,
      lastPlayed: new Date().toISOString()
    }
    if (this.playbackSession.status === 'idle' && this.playbackSession.progress === 0) {
      this.currentPlaybackMediaId = ''
    }
  }

  private async syncCloudPlaybackCursor(): Promise<void> {
    if (
      this.aliyunToken === undefined ||
      !this.aliyunStatus.isLoggedIn ||
      this.playbackSession.cloudFileId === undefined ||
      this.playbackSession.cloudFileId.length === 0 ||
      this.playbackSession.currentTime <= 0
    ) {
      return
    }
    try {
      await this.aliyunAuthService.updatePlayCursor(
        this.aliyunToken,
        this.playbackSession.cloudFileId,
        Math.floor(this.playbackSession.currentTime)
      )
    } catch (_error) {
    }
  }

  private findMediaItemById(mediaId: string): MediaItem | undefined {
    let index: number = 0
    while (index < this.mediaLibrary.length) {
      if (this.mediaLibrary[index].id === mediaId) {
        return this.mediaLibrary[index]
      }
      index += 1
    }
    return undefined
  }

  private findSourceById(sourceId: string): FileSourceItem | undefined {
    let index: number = 0
    while (index < this.sources.length) {
      if (this.sources[index].id === sourceId) {
        return this.sources[index]
      }
      index += 1
    }
    return undefined
  }

  private browseLocalSource(source: FileSourceItem): SourceBrowserSnapshot {
    const entries: Array<SourceBrowserEntry> = []
    let index: number = 0
    while (index < this.mediaLibrary.length) {
      const item: MediaItem = this.mediaLibrary[index]
      if (item.sourceId === source.id) {
        entries.push({
          id: 'local-entry-' + item.id,
          name: item.title,
          type: item.type === 'music' ? 'audio' : 'video',
          storageType: source.storageType,
          sourceId: source.id,
          parentId: source.id,
          path: item.filePath === undefined ? source.path : item.filePath,
          updatedAt: item.dateAdded,
          duration: item.duration,
          mediaId: item.id,
          filePath: item.filePath,
          thumbnail: item.poster,
          sizeLabel: item.fileExt === undefined ? '' : item.fileExt.toUpperCase()
        })
      }
      index += 1
    }
    return {
      sourceId: source.id,
      sourceName: source.name,
      storageType: source.storageType,
      currentFolderId: source.id,
      breadcrumbs: [
        { id: source.id, name: source.name }
      ],
      entries: entries,
      nextMarker: ''
    }
  }

  private async browseAliyunSource(source: FileSourceItem, folderId?: string): Promise<SourceBrowserSnapshot> {
    if (this.aliyunToken !== undefined && this.aliyunStatus.isLoggedIn) {
      try {
        const remoteFolderId: string = folderId === undefined || folderId.length === 0 ? source.path : folderId
        const payload: AliyunFileListResponse = await this.aliyunAuthService.listFiles(this.aliyunToken, remoteFolderId)
        return this.buildAliyunRemoteSnapshot(
          source,
          remoteFolderId,
          payload.items === undefined ? [] : payload.items,
          payload.next_marker
        )
      } catch (_error) {
      }
    }
    return this.buildAliyunMockSnapshot(source, folderId)
  }

  private mapAliyunEntries(
    source: FileSourceItem,
    folderId: string,
    remoteItems: Array<AliyunFileListItem>
  ): Array<SourceBrowserEntry> {
    const entries: Array<SourceBrowserEntry> = []
    let index: number = 0
    while (index < remoteItems.length) {
      const item: AliyunFileListItem = remoteItems[index]
      entries.push({
        id: item.file_id,
        name: item.name,
        type: item.type === 'folder' ? 'folder' : item.category === 'video' ? 'video' : item.category === 'audio' ? 'audio' : 'other',
        storageType: 'aliyundrive',
        sourceId: source.id,
        parentId: folderId,
        path: item.file_id,
        updatedAt: item.updated_at === undefined ? new Date().toISOString() : item.updated_at,
        duration: item.video_media_metadata === undefined ? undefined : item.video_media_metadata.duration,
        sizeLabel: item.size === undefined ? undefined : formatFileSize(item.size),
        cloudFileId: item.file_id,
        thumbnail: item.thumbnail
      })
      index += 1
    }
    return entries
  }

  private mapAliyunPlaybackQualities(payload: AliyunVideoPreviewPlayInfoResponse): Array<PlaybackQualityItem> {
    const result: Array<PlaybackQualityItem> = []
    const tasks: Array<AliyunVideoPreviewTask> =
      payload.video_preview_play_info === undefined || payload.video_preview_play_info.live_transcoding_task_list === undefined
        ? []
        : payload.video_preview_play_info.live_transcoding_task_list
    let index: number = 0
    while (index < tasks.length) {
      const task: AliyunVideoPreviewTask = tasks[index]
      if (
        task.template_id !== undefined &&
        task.status === 'finished' &&
        task.url !== undefined &&
        task.url.length > 0
      ) {
        result.push({
          id: task.template_id,
          label: this.qualityLabel(task.template_id),
          url: task.url,
          format: 'hls'
        })
      }
      index += 1
    }
    result.sort((left: PlaybackQualityItem, right: PlaybackQualityItem) => left.label.localeCompare(right.label))
    return result
  }

  private qualityLabel(templateId: string): string {
    if (templateId === 'LD') {
      return '360P'
    }
    if (templateId === 'SD') {
      return '540P'
    }
    if (templateId === 'HD') {
      return '720P'
    }
    if (templateId === 'FHD') {
      return '1080P'
    }
    if (templateId === 'QHD') {
      return '2K'
    }
    if (templateId === '4K') {
      return '4K'
    }
    return templateId
  }

  private buildCloudPlaybackQueue(remoteItems: Array<AliyunFileListItem>): Array<PlaybackQueueItem> {
    const result: Array<PlaybackQueueItem> = []
    let index: number = 0
    while (index < remoteItems.length) {
      const item: AliyunFileListItem = remoteItems[index]
      if (item.type !== 'folder' && item.category === 'video') {
        result.push({
          id: item.file_id,
          title: item.name
        })
      }
      index += 1
    }
    result.sort((left: PlaybackQueueItem, right: PlaybackQueueItem) => left.title.localeCompare(right.title))
    return result
  }

  private findPlaybackQueueIndex(items: Array<PlaybackQueueItem>, cloudFileId: string): number {
    let index: number = 0
    while (index < items.length) {
      if (items[index].id === cloudFileId) {
        return index
      }
      index += 1
    }
    return -1
  }

  private buildAliyunRemoteSnapshot(
    source: FileSourceItem,
    folderId: string,
    remoteItems: Array<AliyunFileListItem>,
    nextMarker?: string
  ): SourceBrowserSnapshot {
    const entries: Array<SourceBrowserEntry> = this.mapAliyunEntries(source, folderId, remoteItems)
    const currentName: string = folderId === source.path ? source.name : 'Cloud Folder'
    return {
      sourceId: source.id,
      sourceName: source.name,
      storageType: source.storageType,
      currentFolderId: folderId,
      breadcrumbs: [
        { id: source.path, name: source.name },
        { id: folderId, name: currentName }
      ],
      entries: entries,
      nextMarker: nextMarker === undefined ? '' : nextMarker
    }
  }

  private buildAliyunMockSnapshot(source: FileSourceItem, folderId?: string): SourceBrowserSnapshot {
    const currentFolderId: string = folderId === undefined || folderId.length === 0 ? source.path : folderId
    const entries: Array<SourceBrowserEntry> = []
    const breadcrumbs: Array<SourceBreadcrumbItem> = [
      { id: source.path, name: source.name }
    ]
    let index: number = 0
    while (index < this.mediaLibrary.length) {
      const item: MediaItem = this.mediaLibrary[index]
      if (item.sourceId === source.id) {
        if (item.type === 'tvshow') {
          const showFolderId: string = 'cloud-show-' + item.id
          if (currentFolderId === source.path) {
            entries.push({
              id: showFolderId,
              name: item.title,
              type: 'folder',
              storageType: 'aliyundrive',
              sourceId: source.id,
              parentId: source.path,
              path: showFolderId,
              updatedAt: item.dateAdded,
              thumbnail: item.poster
            })
          } else if (currentFolderId === showFolderId) {
            breadcrumbs.push({ id: showFolderId, name: item.title })
            let seasonIndex: number = 0
            while (seasonIndex < item.seasons.length) {
              const season: SeasonItem = item.seasons[seasonIndex]
              const seasonFolderId: string = showFolderId + '-season-' + season.seasonNumber.toString()
              entries.push({
                id: seasonFolderId,
                name: season.name,
                type: 'folder',
                storageType: 'aliyundrive',
                sourceId: source.id,
                parentId: showFolderId,
                path: seasonFolderId,
                updatedAt: item.dateAdded,
                thumbnail: item.poster
              })
              seasonIndex += 1
            }
          } else {
            let seasonIndex: number = 0
            while (seasonIndex < item.seasons.length) {
              const season: SeasonItem = item.seasons[seasonIndex]
              const seasonFolderId: string = showFolderId + '-season-' + season.seasonNumber.toString()
              if (currentFolderId === seasonFolderId) {
                breadcrumbs.push({ id: showFolderId, name: item.title })
                breadcrumbs.push({ id: seasonFolderId, name: season.name })
                let episodeIndex: number = 0
                while (episodeIndex < season.episodes.length) {
                  const episode: EpisodeItem = season.episodes[episodeIndex]
                  entries.push({
                    id: seasonFolderId + '-episode-' + episode.episode.toString(),
                    name: 'E' + episode.episode.toString() + ' ' + episode.name,
                    type: 'video',
                    storageType: 'aliyundrive',
                    sourceId: source.id,
                    parentId: seasonFolderId,
                    path: episode.cloudFileId === undefined ? item.id : episode.cloudFileId,
                    updatedAt: item.dateAdded,
                    duration: episode.duration,
                    mediaId: item.id,
                    cloudFileId: episode.cloudFileId === undefined ? item.cloudFileId : episode.cloudFileId,
                    thumbnail: item.poster
                  })
                  episodeIndex += 1
                }
              }
              seasonIndex += 1
            }
          }
        } else if (currentFolderId === source.path) {
          entries.push({
            id: 'cloud-item-' + item.id,
            name: item.title,
            type: item.type === 'music' ? 'audio' : 'video',
            storageType: 'aliyundrive',
            sourceId: source.id,
            parentId: source.path,
            path: item.cloudFileId === undefined ? item.id : item.cloudFileId,
            updatedAt: item.dateAdded,
            duration: item.duration,
            mediaId: item.id,
            cloudFileId: item.cloudFileId,
            thumbnail: item.poster,
            sizeLabel: item.fileExt === undefined ? undefined : item.fileExt.toUpperCase()
          })
        }
      }
      index += 1
    }
    return {
      sourceId: source.id,
      sourceName: source.name,
      storageType: source.storageType,
      currentFolderId: currentFolderId,
      breadcrumbs: breadcrumbs,
      entries: entries,
      nextMarker: ''
    }
  }
}
