import media from '@ohos.multimedia.media'
import { LocalSelectionResult, PlaybackSession } from '../models/OctovModels'

export interface FilePickerAdapter {
  pickFolders(): Promise<LocalSelectionResult>
}

export interface PlayerAdapter {
  open(source: string, title: string, mediaKind?: 'video' | 'audio'): Promise<PlaybackSession>
  play(): Promise<PlaybackSession>
  pause(): Promise<PlaybackSession>
  stop(): Promise<PlaybackSession>
  seek(progress: number): Promise<PlaybackSession>
  attachSurface(surfaceId: string): Promise<PlaybackSession>
  current(): PlaybackSession
}

function createIdleSession(): PlaybackSession {
  return {
    title: 'No media selected',
    subtitle: 'Pick a media item to start playback',
    sourceLabel: 'Player',
    status: 'idle',
    progress: 0,
    currentTime: 0,
    duration: 0,
    availableQualities: [],
    playlist: [],
    playlistIndex: -1,
    message: 'Player is ready.'
  }
}

function normalizeSource(source: string): string {
  if (source.indexOf('://') >= 0) {
    return source
  }
  const normalizedPath: string = source.replace(/\\/g, '/')
  if (normalizedPath.startsWith('/')) {
    return 'file://' + normalizedPath
  }
  if (/^[A-Za-z]:\//.test(normalizedPath)) {
    return 'file:///' + normalizedPath
  }
  return source
}

function toPlaybackStatus(state: media.AVPlayerState): 'idle' | 'loading' | 'playing' | 'paused' | 'error' {
  if (state === 'playing') {
    return 'playing'
  }
  if (state === 'error') {
    return 'error'
  }
  if (state === 'initialized') {
    return 'loading'
  }
  if (state === 'idle' || state === 'released' || state === 'stopped') {
    return 'idle'
  }
  return 'paused'
}

class MockFilePickerAdapter implements FilePickerAdapter {
  async pickFolders(): Promise<LocalSelectionResult> {
    return {
      paths: ['/storage/Users/currentUser/Movies'],
      message: 'Selected local folder.'
    }
  }
}

class HarmonyPlayerAdapter implements PlayerAdapter {
  private player: media.AVPlayer | undefined = undefined
  private session: PlaybackSession = createIdleSession()
  private surfaceId: string = ''
  private currentSource: string = ''
  private currentTitle: string = ''
  private currentMediaKind: 'video' | 'audio' = 'video'
  private shouldResumePlayback: boolean = false
  private listenersBound: boolean = false

  private async ensurePlayer(): Promise<media.AVPlayer> {
    if (this.player !== undefined) {
      return this.player
    }
    this.player = await media.createAVPlayer()
    this.bindPlayerEvents(this.player)
    return this.player
  }

  private bindPlayerEvents(player: media.AVPlayer): void {
    if (this.listenersBound) {
      return
    }
    this.listenersBound = true
    player.on('stateChange', (_state: media.AVPlayerState) => {
      this.session = this.snapshotFromPlayer()
    })
    player.on('seekDone', () => {
      this.session = this.snapshotFromPlayer()
    })
    player.on('endOfStream', () => {
      this.session = this.snapshotFromPlayer('Playback completed.')
    })
    player.on('error', (error: Error) => {
      this.session = {
        mediaId: this.session.mediaId,
        cloudFileId: this.session.cloudFileId,
        parentFolderId: this.session.parentFolderId,
        title: this.currentTitle.length > 0 ? this.currentTitle : this.session.title,
        subtitle: this.session.subtitle,
        sourceLabel: this.session.sourceLabel,
        status: 'error',
        progress: this.session.progress,
        currentTime: this.session.currentTime,
        duration: this.session.duration,
        downloadUrl: this.session.downloadUrl,
        activeQualityId: this.session.activeQualityId,
        availableQualities: this.session.availableQualities.slice(),
        playlist: this.session.playlist.slice(),
        playlistIndex: this.session.playlistIndex,
        message: error.message
      }
    })
  }

  private snapshotFromPlayer(message?: string): PlaybackSession {
    if (this.player === undefined) {
      return createIdleSession()
    }
    let durationSeconds: number = 0
    let currentSeconds: number = 0
    try {
      durationSeconds = Math.max(0, Math.round(this.player.duration / 1000))
    } catch (_error) {
      durationSeconds = this.session.duration
    }
    try {
      currentSeconds = Math.max(0, Math.round(this.player.currentTime / 1000))
    } catch (_error) {
      currentSeconds = this.session.currentTime
    }
    let progress: number = 0
    if (durationSeconds > 0) {
      progress = Math.min(100, Math.max(0, Math.round(currentSeconds * 100 / durationSeconds)))
    }
    const nextMessage: string = message !== undefined
      ? message
      : (this.currentMediaKind === 'audio' ? 'Audio is ready.' : 'Video is ready.')
    return {
      mediaId: this.session.mediaId,
      cloudFileId: this.session.cloudFileId,
      parentFolderId: this.session.parentFolderId,
      title: this.currentTitle.length > 0 ? this.currentTitle : this.session.title,
      subtitle: this.session.subtitle,
      sourceLabel: this.session.sourceLabel,
      status: toPlaybackStatus(this.player.state),
      progress: progress,
      currentTime: currentSeconds,
      duration: durationSeconds,
      downloadUrl: this.session.downloadUrl,
      activeQualityId: this.session.activeQualityId,
      availableQualities: this.session.availableQualities.slice(),
      playlist: this.session.playlist.slice(),
      playlistIndex: this.session.playlistIndex,
      message: nextMessage
    }
  }

  private async resetPlayerIfNeeded(player: media.AVPlayer): Promise<void> {
    if (player.state !== 'idle' && player.state !== 'released') {
      await player.reset()
    }
  }

  async open(source: string, title: string, mediaKind?: 'video' | 'audio'): Promise<PlaybackSession> {
    const player: media.AVPlayer = await this.ensurePlayer()
    this.currentSource = normalizeSource(source)
    this.currentTitle = title
    this.currentMediaKind = mediaKind === undefined ? 'video' : mediaKind
    this.shouldResumePlayback = false
    await this.resetPlayerIfNeeded(player)
    if (this.currentMediaKind === 'video' && this.surfaceId.length > 0) {
      player.surfaceId = this.surfaceId
    }
    player.url = this.currentSource
    this.session = {
      mediaId: this.session.mediaId,
      cloudFileId: this.session.cloudFileId,
      parentFolderId: this.session.parentFolderId,
      title: title,
      subtitle: this.session.subtitle,
      sourceLabel: this.session.sourceLabel,
      status: 'loading',
      progress: 0,
      currentTime: 0,
      duration: 0,
      downloadUrl: this.session.downloadUrl,
      activeQualityId: this.session.activeQualityId,
      availableQualities: this.session.availableQualities.slice(),
      playlist: this.session.playlist.slice(),
      playlistIndex: this.session.playlistIndex,
      message: this.currentMediaKind === 'audio' ? 'Loading audio...' : 'Loading video...'
    }
    await player.prepare()
    this.session = this.snapshotFromPlayer(this.currentMediaKind === 'audio' ? 'Tap play to start audio.' : 'Tap play to start video.')
    return this.current()
  }

  async play(): Promise<PlaybackSession> {
    const player: media.AVPlayer = await this.ensurePlayer()
    await player.play()
    this.shouldResumePlayback = true
    this.session = this.snapshotFromPlayer('Playing now.')
    return this.current()
  }

  async pause(): Promise<PlaybackSession> {
    const player: media.AVPlayer = await this.ensurePlayer()
    if (player.state === 'playing') {
      await player.pause()
    }
    this.shouldResumePlayback = false
    this.session = this.snapshotFromPlayer('Playback paused.')
    return this.current()
  }

  async stop(): Promise<PlaybackSession> {
    const player: media.AVPlayer = await this.ensurePlayer()
    if (player.state === 'playing' || player.state === 'paused' || player.state === 'prepared' || player.state === 'completed') {
      await player.stop()
    }
    await this.resetPlayerIfNeeded(player)
    this.currentSource = ''
    this.currentTitle = ''
    this.shouldResumePlayback = false
    this.session = createIdleSession()
    return this.current()
  }

  async seek(progress: number): Promise<PlaybackSession> {
    const player: media.AVPlayer = await this.ensurePlayer()
    const snapshot: PlaybackSession = this.snapshotFromPlayer()
    let safeProgress: number = progress
    if (safeProgress < 0) {
      safeProgress = 0
    }
    if (safeProgress > 100) {
      safeProgress = 100
    }
    if (snapshot.duration > 0) {
      const targetMs: number = Math.round(snapshot.duration * 1000 * safeProgress / 100)
      await player.seek(targetMs, media.SeekMode.SEEK_CLOSEST)
    }
    this.session = this.snapshotFromPlayer('Playback position updated.')
    return this.current()
  }

  async attachSurface(surfaceId: string): Promise<PlaybackSession> {
    this.surfaceId = surfaceId
    const player: media.AVPlayer = await this.ensurePlayer()
    if (this.currentMediaKind !== 'video') {
      return this.current()
    }
    if (player.state === 'released') {
      this.player = undefined
      return this.current()
    }
    if (player.state === 'idle' && this.currentSource.length === 0) {
      return this.current()
    }
    try {
      player.surfaceId = surfaceId
    } catch (_error) {
      if (this.currentSource.length > 0) {
        const shouldResume: boolean = this.shouldResumePlayback
        const title: string = this.currentTitle
        await this.open(this.currentSource, title, 'video')
        if (shouldResume) {
          await this.play()
        }
      }
    }
    this.session = this.snapshotFromPlayer('Video surface attached.')
    return this.current()
  }

  current(): PlaybackSession {
    if (this.player !== undefined) {
      this.session = this.snapshotFromPlayer(this.session.message)
    }
    return {
      mediaId: this.session.mediaId,
      cloudFileId: this.session.cloudFileId,
      parentFolderId: this.session.parentFolderId,
      title: this.session.title,
      subtitle: this.session.subtitle,
      sourceLabel: this.session.sourceLabel,
      status: this.session.status,
      progress: this.session.progress,
      currentTime: this.session.currentTime,
      duration: this.session.duration,
      downloadUrl: this.session.downloadUrl,
      activeQualityId: this.session.activeQualityId,
      availableQualities: this.session.availableQualities.slice(),
      playlist: this.session.playlist.slice(),
      playlistIndex: this.session.playlistIndex,
      message: this.session.message
    }
  }
}

export class PlatformAdapters {
  private static filePickerAdapter: FilePickerAdapter = new MockFilePickerAdapter()
  private static playerAdapter: PlayerAdapter = new HarmonyPlayerAdapter()

  static filePicker(): FilePickerAdapter {
    return PlatformAdapters.filePickerAdapter
  }

  static player(): PlayerAdapter {
    return PlatformAdapters.playerAdapter
  }
}
