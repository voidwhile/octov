import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  ListOrdered,
  ListMusic,
  X
} from 'lucide-react'
import { MediaItem } from '../types'
import './MusicPlayer.css'

interface LyricLine {
  time: number
  text: string
}

/** 解析 LRC 歌词 */
function parseLRC(lrc: string): LyricLine[] {
  const lines = lrc.split('\n')
  const result: LyricLine[] = []
  const timeReg = /\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g
  
  for (const line of lines) {
    const matches = [...line.matchAll(timeReg)]
    const text = line.replace(timeReg, '').trim()
    if (!text) continue
    
    for (const match of matches) {
      const min = parseInt(match[1])
      const sec = parseInt(match[2])
      const ms = parseInt(match[3] || '0')
      const time = min * 60 + sec + ms / (match[3]?.length === 3 ? 1000 : 100)
      result.push({ time, text })
    }
  }
  
  return result.sort((a, b) => a.time - b.time)
}

/** 音乐播放器页面 */
export default function MusicPlayer(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const audioRef = useRef<HTMLAudioElement>(null)
  const lyricsRef = useRef<HTMLDivElement>(null)

  const {
    playlist = [],
    currentIndex = -1,
    filePath: initialFilePath,
    cloudFileId: initialCloudFileId,
    title: initialTitle,
    fileExt: initialFileExt
  } = (location.state as {
    playlist?: MediaItem[]
    currentIndex?: number
    filePath?: string
    cloudFileId?: string
    title: string
    fileExt?: string
  }) || {}

  const [currentTrackIndex, setCurrentTrackIndex] = useState(currentIndex)
  const [playMode, setPlayMode] = useState<'sequence' | 'loopAll' | 'loopSingle' | 'random'>('sequence')
  const [showPlaylist, setShowPlaylist] = useState(false)

  const currentTrack = playlist[currentTrackIndex] || null
  const filePath = currentTrack?.filePath || initialFilePath
  const cloudFileId = currentTrack?.cloudFileId || initialCloudFileId
  const title = currentTrack?.title || initialTitle
  const fileExt = currentTrack?.fileExt || initialFileExt

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [lyrics, setLyrics] = useState<LyricLine[]>([])
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1)
  const [isHoveringLyrics, setIsHoveringLyrics] = useState(false)

  const scrollToActiveLyric = useCallback((index: number) => {
    if (lyricsRef.current && index >= 0) {
      const lineEl = lyricsRef.current.children[index] as HTMLElement
      if (lineEl) {
        const containerHeight = lyricsRef.current.clientHeight
        const targetScroll = lineEl.offsetTop - containerHeight / 2 + lineEl.clientHeight / 2
        lyricsRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' })
      }
    } else if (lyricsRef.current && index === -1) {
      lyricsRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  /** 格式化时间 */
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${String(s).padStart(2, '0')}`
  }

  /** 返回 */
  const goBack = useCallback(() => navigate(-1), [navigate])

  const [downloadProgress, setDownloadProgress] = useState<string | null>(null)

  /** 加载音频文件（本地或云盘） */
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const loadAudio = async () => {
      setIsLoading(true)
      setError(null)
      setDownloadProgress(null)
      audio.volume = isMuted ? 0 : volume

      // 异步获取在线歌词
      setLyrics([])
      setCurrentLyricIndex(-1)
      window.audio.getLyrics(title).then(res => {
        if (res.success && res.lyric) {
          setLyrics(parseLRC(res.lyric))
        } else {
          setLyrics([])
        }
      }).catch(err => {
        console.error('Failed to get lyrics:', err)
        setLyrics([])
      })

      let src = ''

      if (filePath) {
        // 本地文件直接播放
        src = `file://${filePath}`
      } else if (cloudFileId) {
        // 云盘文件：下载到临时目录后用 file:// 播放（彻底避免卡顿）
        try {
          const fileName = `${cloudFileId}.${fileExt || 'mp3'}` // 使用正确的扩展名以防浏览器解析失败
          setDownloadProgress('正在加载音乐...')
          const result = await window.audio.downloadAndCache(cloudFileId, fileName)
          if (result.success && result.path) {
            src = `file://${result.path}`
          } else {
            setError(result.error || '加载失败')
            setIsLoading(false)
            setDownloadProgress(null)
            return
          }
        } catch (e: any) {
          setError(`加载失败: ${e.message}`)
          setIsLoading(false)
          setDownloadProgress(null)
          return
        }
        setDownloadProgress(null)
      } else {
        setError('未提供音频来源')
        setIsLoading(false)
        return
      }

      audio.onloadedmetadata = () => {
        setDuration(audio.duration)
        setIsLoading(false)
        audio.play().then(() => setIsPlaying(true)).catch(e => {
          setError(`播放失败: ${e.message}`)
          setIsLoading(false)
        })
      }
      audio.onerror = () => {
        setError('音频文件加载失败')
        setIsLoading(false)
      }
      audio.src = src
    }

    loadAudio()

    return () => {
      audio.pause()
      audio.src = ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath, cloudFileId])

  /** 音量同步 */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  /** 播放/暂停 */
  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play()
      setIsPlaying(true)
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }

  /** 上一首 */
  const playPrev = useCallback(() => {
    if (!playlist || playlist.length === 0) return
    if (playMode === 'random') {
      const nextIdx = Math.floor(Math.random() * playlist.length)
      setCurrentTrackIndex(nextIdx)
      return
    }
    let prevIdx = currentTrackIndex - 1
    if (prevIdx < 0) {
      prevIdx = playlist.length - 1
    }
    setCurrentTrackIndex(prevIdx)
  }, [playlist, playMode, currentTrackIndex])

  /** 下一首 */
  const playNext = useCallback((userInitiated = false) => {
    if (!playlist || playlist.length === 0) return

    if (!userInitiated && playMode === 'loopSingle') {
      // 自动播放下一首且单曲循环时，直接重新播放
      const audio = audioRef.current
      if (audio) {
        audio.currentTime = 0
        audio.play()
      }
      return
    }

    if (playMode === 'random') {
      const nextIdx = Math.floor(Math.random() * playlist.length)
      setCurrentTrackIndex(nextIdx)
      return
    }

    let nextIdx = currentTrackIndex + 1
    if (nextIdx >= playlist.length) {
      if (playMode === 'sequence' && !userInitiated) {
        // 顺序播放到最后一首自动结束
        setIsPlaying(false)
        return
      }
      nextIdx = 0 // loopAll 或是手动切歌，回到第一首
    }
    setCurrentTrackIndex(nextIdx)
  }, [playlist, playMode, currentTrackIndex])

  /** 点击进度条跳转 */
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    audio.currentTime = percent * audio.duration
  }

  /** 键盘快捷键 */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const audio = audioRef.current
      if (!audio) return
      switch (e.key) {
        case ' ': e.preventDefault(); togglePlay(); break
        case 'ArrowLeft': audio.currentTime = Math.max(0, audio.currentTime - 10); break
        case 'ArrowRight': audio.currentTime = Math.min(audio.duration, audio.currentTime + 10); break
        case 'Escape': goBack(); break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goBack])

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="music-player-page">
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          const time = audioRef.current?.currentTime || 0
          setCurrentTime(time)

          if (lyrics.length > 0) {
            let nextIndex = lyrics.length - 1
            for (let i = 0; i < lyrics.length; i++) {
              if (time < lyrics[i].time) {
                nextIndex = i - 1
                break
              }
            }
            if (nextIndex !== currentLyricIndex) {
              setCurrentLyricIndex(nextIndex)
              if (!isHoveringLyrics) {
                scrollToActiveLyric(nextIndex)
              }
            }
          }
        }}
        onEnded={() => playNext(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* 返回按钮 */}
      <button className="music-player-back" onClick={goBack}>
        <ArrowLeft size={20} />
      </button>

      {/* 主体内容区 (左右双列) */}
      <div className="music-player-main-content">
        {/* 左侧：黑胶唱片 */}
        <div className="music-player-left-col">
          <div className="music-player-cover-wrap">
            <div className={`music-player-disc ${isPlaying ? 'spinning' : ''}`}>
              <div className="music-player-disc-inner">
                <Music size={64} className="music-player-disc-icon" />
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：歌曲信息与巨大歌词 */}
        <div className="music-player-right-col">
          <div className="music-player-info">
            <h1 className="music-player-title" title={title || '未知曲目'}>{title || '未知曲目'}</h1>
            <p className="music-player-artist">
              {filePath?.split('/').slice(-2, -1)[0] || '未知专辑'}
            </p>
          </div>

          <div 
            className="music-player-lyrics-container" 
            ref={lyricsRef}
            onMouseEnter={() => setIsHoveringLyrics(true)}
            onMouseLeave={() => {
              setIsHoveringLyrics(false)
              scrollToActiveLyric(currentLyricIndex)
            }}
          >
            {lyrics.length > 0 ? (
              lyrics.map((line, idx) => (
                <div
                  key={idx}
                  className={`music-player-lyric-line ${idx === currentLyricIndex ? 'active' : ''}`}
                >
                  {line.text}
                </div>
              ))
            ) : (
              <div className="music-player-lyric-empty">
                {isLoading ? '' : '暂无歌词'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部全宽控制栏 */}
      <div className="music-player-bottom-bar">
        {/* 顶部进度条 */}
        <div className="music-player-progress-wrap">
          <span className="music-player-time">{formatTime(currentTime)}</span>
          <div className="music-player-progress-bar" onClick={handleProgressClick}>
            <div className="music-player-progress-fill" style={{ width: `${progressPercent}%` }} />
            <div className="music-player-progress-thumb" style={{ left: `${progressPercent}%` }} />
          </div>
          <span className="music-player-time">{formatTime(duration)}</span>
        </div>

        {/* 底部操作区 */}
        <div className="music-player-controls-row">
          <div className="music-player-controls-left">
            {/* 状态提示 */}
            {downloadProgress && (
              <div className="music-player-status">
                <div className="music-player-spinner" style={{width: 14, height: 14, borderWidth: 2}} />
                <span>{downloadProgress}</span>
              </div>
            )}
            {error && (
              <div className="music-player-error">
                <Music size={16} />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="music-player-controls-center">
            <button
              className="music-player-mode-btn"
              onClick={() => {
                if (playMode === 'sequence') setPlayMode('loopAll')
                else if (playMode === 'loopAll') setPlayMode('loopSingle')
                else if (playMode === 'loopSingle') setPlayMode('random')
                else setPlayMode('sequence')
              }}
              title="播放模式"
            >
              {playMode === 'sequence' && <ListOrdered size={20} />}
              {playMode === 'loopAll' && <Repeat size={20} />}
              {playMode === 'loopSingle' && <Repeat1 size={20} />}
              {playMode === 'random' && <Shuffle size={20} />}
            </button>

            <button 
              className="music-player-btn" 
              onClick={playPrev}
              disabled={!playlist || playlist.length <= 1}
            >
              <SkipBack size={22} />
            </button>

            <button
              className="music-player-play-btn"
              onClick={togglePlay}
              disabled={isLoading || !!error}
            >
              {isLoading ? (
                <div className="music-player-spinner" />
              ) : isPlaying ? (
                <Pause size={28} fill="white" />
              ) : (
                <Play size={28} fill="white" />
              )}
            </button>

            <button 
              className="music-player-btn" 
              onClick={() => playNext(true)}
              disabled={!playlist || playlist.length <= 1}
            >
              <SkipForward size={22} />
            </button>
          </div>

          <div className="music-player-controls-right">
            {/* 音量控制 */}
            <div className="music-player-volume">
              <button className="music-player-vol-btn" onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <div
                className="music-player-vol-bar"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const v = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
                  setVolume(v)
                }}
              >
                <div className="music-player-vol-fill" style={{ width: `${isMuted ? 0 : volume * 100}%` }} />
              </div>
            </div>

            <button 
              className={`music-player-playlist-btn ${showPlaylist ? 'active' : ''}`}
              onClick={() => setShowPlaylist(!showPlaylist)}
              title="播放列表"
            >
              <ListMusic size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 播放列表抽屉遮罩 */}
      <div 
        className={`music-player-playlist-overlay ${showPlaylist ? 'visible' : ''}`} 
        onClick={() => setShowPlaylist(false)}
      />

      {/* 播放列表抽屉 */}
      <div className={`music-player-playlist-drawer ${showPlaylist ? 'visible' : ''}`}>
        <div className="playlist-drawer-header">
          <h2>播放列表 ({playlist.length})</h2>
          <button onClick={() => setShowPlaylist(false)}><X size={20} /></button>
        </div>
        <div className="playlist-drawer-content">
          {playlist.map((item, index) => (
            <div 
              key={item.id} 
              className={`playlist-item ${index === currentTrackIndex ? 'playing' : ''}`}
              onClick={() => {
                setCurrentTrackIndex(index)
              }}
            >
              <div className="playlist-item-index">
                {index === currentTrackIndex && isPlaying ? (
                  <div className="music-playing-bars"><span/><span/><span/></div>
                ) : (
                  index + 1
                )}
              </div>
              <div className="playlist-item-info">
                <div className="playlist-item-title">{item.title}</div>
                <div className="playlist-item-artist">{item.filePath?.split('/').slice(-2, -1)[0] || '未知专辑'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
