import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect, useCallback } from 'react'
import Hls from 'hls.js'
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
  Film,
  MessageSquare,
  Settings2
} from 'lucide-react'
import { getLibraryById } from '../data/mediaLibrary'
import { updatePlayRecord, getPlayRecord } from '../data/playHistory'
import { SubtitleCue, SubtitleSearchResult } from '../types'
import './Player.css'

/** 播放器页面 */
export default function Player(): JSX.Element {
  const { id, fileId } = useParams<{ id: string; fileId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const controlsTimerRef = useRef<NodeJS.Timeout>()
  const progressTimerRef = useRef<NodeJS.Timeout>()

  // 记录进入播放器前的页面路径，返回时直接跳转
  const location = useLocation()
  const returnPathRef = useRef(location.state?.from || '/')

  /** 退出播放器，回退到进入播放器前的页面 */
  const goBack = useCallback(() => {
    navigate(-1)
  }, [navigate])

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSpeedPanel, setShowSpeedPanel] = useState(false)
  const [hlsError, setHlsError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 字幕状态
  const [subtitles, setSubtitles] = useState<SubtitleSearchResult[]>([])
  const [activeCues, setActiveCues] = useState<SubtitleCue[]>([])
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('')
  const [showSubtitlePanel, setShowSubtitlePanel] = useState(false)
  const [subtitleEnabled, setSubtitleEnabled] = useState(false)

  // 清晰度
  const [qualities, setQualities] = useState<{ id: string; label: string; url: string }[]>([])
  const [activeQuality, setActiveQuality] = useState('')
  const [showQualityPanel, setShowQualityPanel] = useState(false)

  // 获取媒体信息
  const isCloudVideo = !!fileId
  const videoName = searchParams.get('name') || ''
  const parentId = searchParams.get('parentId') || ''
  const item = !isCloudVideo ? getLibraryById(id || '') : null

  // 播放列表（同目录下的视频文件）
  const [playlist, setPlaylist] = useState<{ file_id: string; name: string }[]>([])
  const currentIndex = playlist.findIndex(f => f.file_id === fileId)
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex >= 0 && currentIndex < playlist.length - 1

  /** 格式化时间 */
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const qualitiesRef = useRef<{ id: string; label: string; url: string; isHls: boolean }[]>([])
  const activeQualityRef = useRef<string>('')
  const loadIdRef = useRef(0) // 防止 StrictMode 双重加载

  /** 播放 URL */
  const playUrl = useCallback((url: string, isHls: boolean) => {
    const video = videoRef.current
    if (!video) return

    console.log('[播放器] playUrl:', isHls ? 'HLS' : 'MP4', url.substring(0, 80))

    // 清理旧 HLS 实例
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
    // 清理旧事件
    video.onloadedmetadata = null
    video.onerror = null
    setHlsError(null)

    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 60,
          manifestLoadingMaxRetry: 2,
          manifestLoadingRetryDelay: 500,
          manifestLoadingTimeOut: 10000,
          levelLoadingMaxRetry: 2,
          fragLoadingMaxRetry: 2
        })
        hlsRef.current = hls
        hls.loadSource(url)
        hls.attachMedia(video)

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('[播放器] HLS manifest 解析成功')
          setIsLoading(false)
          video.play().then(() => setIsPlaying(true)).catch(() => {})
        })

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            console.error('[播放器] HLS 致命错误:', data.type, data.details)
            hls.destroy()
            hlsRef.current = null
            setHlsError(`HLS 播放失败: ${data.details || '未知错误'}`)
            setIsLoading(false)
          }
        })
      }
    } else {
      // 直接播放 MP4 / 本地代理 URL
      video.src = url
      video.onloadedmetadata = () => {
        console.log('[播放器] 视频元数据加载成功, 时长:', video.duration)
        setIsLoading(false)
        video.play().then(() => setIsPlaying(true)).catch(() => {})
      }
      video.onerror = () => {
        console.error('[播放器] 视频加载错误:', video.error?.message, video.error?.code)
        setHlsError(`播放失败: ${video.error?.message || '视频格式不支持'}`)
        setIsLoading(false)
      }
    }
  }, [])

  /** 切换清晰度 */
  const switchQuality = useCallback((qualityId: string) => {
    const q = qualities.find(q => q.id === qualityId)
    if (q) {
      const currentPos = videoRef.current?.currentTime || 0
      setActiveQuality(qualityId)
      activeQualityRef.current = qualityId
      setIsLoading(true)
      playUrl(q.url, q.isHls)
      setTimeout(() => {
        if (videoRef.current) videoRef.current.currentTime = currentPos
      }, 500)
    }
    setShowQualityPanel(false)
  }, [qualities, playUrl])

  /** 加载云盘视频 */
  useEffect(() => {
    if (!isCloudVideo || !fileId) return

    // 用递增 ID 防止 StrictMode 双重加载
    const currentLoadId = ++loadIdRef.current

    const doLoad = async () => {
      try {
        setIsLoading(true)
        setHlsError(null)

        const [downloadInfo, playInfo] = await Promise.all([
          window.aliyunDrive.getDownloadUrl(fileId),
          window.aliyunDrive.getVideoPlayInfo(fileId)
        ])

        // 被后来的加载取代则放弃
        if (currentLoadId !== loadIdRef.current) return

        const qualityList: { id: string; label: string; url: string; isHls: boolean }[] = []

        // HLS 转码流作为备选
        if (playInfo.success && playInfo.data) {
          const templates = playInfo.data.template_list || []
          const available = templates.filter(t => t.status === 'finished' && t.url)
          const labels: Record<string, string> = {
            'LD': '360P', 'SD': '540P', 'HD': '720P',
            'FHD': '1080P', 'QHD': '2K', '4K': '4K'
          }
          for (const tid of ['LD', 'SD', 'HD', 'FHD', 'QHD', '4K']) {
            const t = available.find(a => a.template_id === tid)
            if (t) {
              qualityList.push({ id: t.template_id, label: labels[tid] || tid, url: t.url, isHls: true })
            }
          }
        }

        // 原画通过本地 HTTP 代理（最可靠）
        if (downloadInfo.success && downloadInfo.data?.url) {
          const proxyUrl = await window.aliyunDrive.getProxyUrl(downloadInfo.data.url)
          qualityList.push({ id: 'original', label: '原画', url: proxyUrl, isHls: false })
        }

        if (currentLoadId !== loadIdRef.current) return

        if (qualityList.length === 0) {
          setHlsError('暂无可用的播放地址')
          setIsLoading(false)
          return
        }

        console.log('[播放器] 可用清晰度:', qualityList.map(q => q.label).join(', '))
        setQualities(qualityList)
        qualitiesRef.current = qualityList

        // 默认用原画代理（最可靠）
        const preferredOrder = ['SD', 'HD', 'FHD', 'LD', 'original']
        let initial = qualityList[0]
        for (const pref of preferredOrder) {
          const found = qualityList.find(q => q.id === pref)
          if (found) { initial = found; break }
        }
        console.log('[播放器] 播放:', initial.label, initial.url.substring(0, 60))

        setActiveQuality(initial.id)
        activeQualityRef.current = initial.id
        playUrl(initial.url, initial.isHls)
      } catch (err: any) {
        if (currentLoadId !== loadIdRef.current) return
        console.error('[播放器] 加载失败:', err)
        setHlsError(err.message || '加载失败')
        setIsLoading(false)
      }
    }
    doLoad()

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, isCloudVideo])

  /** 保存当前播放进度到播放记录 */
  const saveProgress = useCallback(() => {
    const video = videoRef.current
    if (!isCloudVideo || !fileId || !video || video.currentTime <= 0) return
    updatePlayRecord({
      fileId,
      name: videoName || '',
      title: item?.title,
      poster: item?.poster,
      currentTime: video.currentTime,
      totalDuration: video.duration || 0,
      parentId
    })
  }, [isCloudVideo, fileId, videoName, parentId, item])

  /** 定时同步播放进度到云盘 + 保存播放记录 */
  useEffect(() => {
    if (isCloudVideo && fileId && isPlaying) {
      // 播放开始时立即保存一次
      saveProgress()

      progressTimerRef.current = setInterval(() => {
        const video = videoRef.current
        if (video && video.currentTime > 0) {
          // 同步到云盘
          window.aliyunDrive.updatePlayCursor(fileId, Math.floor(video.currentTime))
          // 保存本地播放记录
          saveProgress()
        }
      }, 15000) // 每 15 秒同步一次
    }
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    }
  }, [isCloudVideo, fileId, isPlaying, saveProgress])

  /** 退出播放器时保存进度 */
  useEffect(() => {
    return () => {
      // 组件卸载时保存最终进度
      const video = videoRef.current
      if (isCloudVideo && fileId && video && video.currentTime > 0) {
        updatePlayRecord({
          fileId,
          name: videoName || '',
          title: item?.title,
          poster: item?.poster,
          currentTime: video.currentTime,
          totalDuration: video.duration || 0,
          parentId
        })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId])

  /** 搜索在线字幕 */
  useEffect(() => {
    const searchSubtitles = async () => {
      const title = item?.title || videoName
      if (!title) return
      try {
        const result = await window.subtitle.search(
          title,
          item?.tmdbId,
          undefined,
          undefined
        )
        if (result.success && result.data) {
          setSubtitles(result.data)
        }
      } catch (err) {
        console.error('字幕搜索失败:', err)
      }
    }
    searchSubtitles()
  }, [item, videoName])

  /** 加载字幕 */
  const loadSubtitle = useCallback(async (sub: SubtitleSearchResult) => {
    try {
      const result = await window.subtitle.download(sub.id)
      if (result.success && result.data?.cues) {
        setActiveCues(result.data.cues)
        setSubtitleEnabled(true)
        setShowSubtitlePanel(false)
      }
    } catch (err) {
      console.error('加载字幕失败:', err)
    }
  }, [])

  /** 更新当前字幕 */
  useEffect(() => {
    if (!subtitleEnabled || activeCues.length === 0) {
      setCurrentSubtitle('')
      return
    }
    const cue = activeCues.find(
      c => currentTime >= c.startTime && currentTime <= c.endTime
    )
    setCurrentSubtitle(cue?.text || '')
  }, [currentTime, subtitleEnabled, activeCues])

  /** 显示控制栏并自动隐藏 */
  const showControlsTemporarily = useCallback((): void => {
    setShowControls(true)
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000)
    }
  }, [isPlaying])

  useEffect(() => {
    const handleMouseMove = (): void => showControlsTemporarily()
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [showControlsTemporarily])

  /** 键盘快捷键 */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const video = videoRef.current
      if (!video) return
      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          video.currentTime = Math.max(0, video.currentTime - 10)
          break
        case 'ArrowRight':
          video.currentTime = Math.min(video.duration, video.currentTime + 10)
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume(v => Math.min(1, v + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume(v => Math.max(0, v - 0.1))
          break
        case 'Escape':
          goBack()
          break
        case 'f':
        case 'F':
          toggleFullscreen()
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const togglePlay = (): void => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  const toggleFullscreen = (): void => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    const video = videoRef.current
    if (!video) return
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    video.currentTime = percent * video.duration
  }

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]
  const selectSpeed = (rate: number): void => {
    setPlaybackRate(rate)
    if (videoRef.current) videoRef.current.playbackRate = rate
    setShowSpeedPanel(false)
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const displayTitle = item?.title || videoName || '视频播放器'

  // 加载同目录播放列表
  useEffect(() => {
    if (!isCloudVideo || !parentId) return
    const loadPlaylist = async () => {
      try {
        const result = await window.aliyunDrive.listFiles(parentId, { limit: 200 })
        if (!result.success || !result.data) {
          console.error('[播放器] 播放列表加载失败:', result.error)
          return
        }
        const videos = (result.data.items || [])
          .filter((f: any) => f.type === 'file' && f.category === 'video')
          .sort((a: any, b: any) => a.name.localeCompare(b.name, 'zh-CN', { numeric: true }))
        setPlaylist(videos.map((f: any) => ({ file_id: f.file_id, name: f.name })))
      } catch (err) {
        console.error('[播放器] 加载播放列表异常:', err)
      }
    }
    loadPlaylist()
  }, [parentId, isCloudVideo])

  /** 上一集 */
  const playPrev = () => {
    if (!hasPrev) return
    const prev = playlist[currentIndex - 1]
    navigate(`/player/cloud/${prev.file_id}?name=${encodeURIComponent(prev.name)}&parentId=${parentId}`, { replace: true, state: { from: returnPathRef.current } })
  }

  /** 下一集 */
  const playNext = () => {
    if (!hasNext) return
    const next = playlist[currentIndex + 1]
    navigate(`/player/cloud/${next.file_id}?name=${encodeURIComponent(next.name)}&parentId=${parentId}`, { replace: true, state: { from: returnPathRef.current } })
  }

  return (
    <div
      className={`player-page ${showControls ? 'show-controls' : ''} ${!isPlaying ? 'paused' : ''}`}
    >
      <div className="player-video-container" onClick={togglePlay}>
        {/* 顶部栏 */}
        <div className="player-top-bar" onClick={(e) => e.stopPropagation()}>
          <button className="player-back-btn" onClick={goBack}>
            <ArrowLeft size={20} />
          </button>
          <span className="player-title">{displayTitle}</span>
        </div>

        {/* 视频 */}
        <video
          ref={videoRef}
          className="player-video"
          src={isCloudVideo ? undefined : item?.filePath}
          onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
          onLoadedMetadata={() => {
            const video = videoRef.current
            if (video) {
              setDuration(video.duration || 0)
              // 恢复上次播放位置
              if (isCloudVideo && fileId) {
                const record = getPlayRecord(fileId)
                if (record && record.percentage < 95 && record.currentTime > 5) {
                  video.currentTime = record.currentTime
                }
              }
            }
          }}
          onEnded={() => {
            setIsPlaying(false)
            // 播放结束保存记录
            if (isCloudVideo && fileId && videoRef.current) {
              updatePlayRecord({
                fileId,
                name: videoName || '',
                title: item?.title,
                poster: item?.poster,
                currentTime: videoRef.current.duration,
                totalDuration: videoRef.current.duration || 0,
                parentId
              })
            }
          }}
          onPause={() => {
            // 暂停时保存记录
            if (isCloudVideo && fileId && videoRef.current && videoRef.current.currentTime > 0) {
              updatePlayRecord({
                fileId,
                name: videoName || '',
                title: item?.title,
                poster: item?.poster,
                currentTime: videoRef.current.currentTime,
                totalDuration: videoRef.current.duration || 0,
                parentId
              })
            }
          }}
          muted={isMuted}
        />

        {/* 字幕显示 */}
        {currentSubtitle && (
          <div className="player-subtitle">
            <span>{currentSubtitle}</span>
          </div>
        )}

        {/* 加载状态 */}
        {isLoading && isCloudVideo && (
          <div className="player-center-play" style={{ opacity: 1 }}>
            <div className="aliyun-loading-spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          </div>
        )}

        {/* HLS 错误 */}
        {hlsError && (
          <div className="player-center-play" style={{ opacity: 1, flexDirection: 'column', gap: '12px' }}>
            <Film size={32} />
            <div style={{ fontSize: '14px', maxWidth: '300px', textAlign: 'center' }}>{hlsError}</div>
          </div>
        )}

        {/* 中间大播放按钮 */}
        {!isPlaying && !isLoading && !hlsError && (
          <div className="player-center-play" style={{ opacity: 1 }}>
            <Play size={32} fill="white" />
          </div>
        )}

        {/* 控制栏 */}
        <div className="player-controls" onClick={(e) => e.stopPropagation()}>
          <div className="player-progress">
            <span className="player-time">{formatTime(currentTime)}</span>
            <div className="player-progress-bar" onClick={handleProgressClick}>
              <div className="player-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="player-time">{formatTime(duration)}</span>
          </div>

          <div className="player-buttons">
            <div className="player-buttons-left">
              <button className="player-btn" onClick={playPrev} disabled={!hasPrev} title="上一集">
                <SkipBack size={20} />
              </button>
              <button className="player-btn play" onClick={togglePlay}>
                {isPlaying ? <Pause size={24} /> : <Play size={24} fill="white" />}
              </button>
              <button className="player-btn" onClick={playNext} disabled={!hasNext} title="下一集">
                <SkipForward size={20} />
              </button>

              <div className="player-volume">
                <button className="player-btn" onClick={() => setIsMuted(!isMuted)}>
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <div
                  className="player-volume-slider"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const v = (e.clientX - rect.left) / rect.width
                    setVolume(Math.max(0, Math.min(1, v)))
                    if (videoRef.current) videoRef.current.volume = Math.max(0, Math.min(1, v))
                  }}
                >
                  <div className="player-volume-fill" style={{ width: `${isMuted ? 0 : volume * 100}%` }} />
                </div>
              </div>
            </div>

            <div className="player-buttons-right">
              {/* 字幕按钮 */}
              <div style={{ position: 'relative' }}>
                <button
                  className="player-btn"
                  onClick={() => { setShowSubtitlePanel(!showSubtitlePanel); setShowQualityPanel(false); setShowSpeedPanel(false) }}
                  style={{ color: subtitleEnabled ? '#4099FF' : undefined }}
                >
                  <MessageSquare size={18} />
                </button>
                {showSubtitlePanel && (
                  <div className="player-panel" onClick={(e) => e.stopPropagation()}>
                    <div className="player-panel-title">字幕</div>
                    <div
                      className={`player-panel-item ${!subtitleEnabled ? 'active' : ''}`}
                      onClick={() => { setSubtitleEnabled(false); setShowSubtitlePanel(false) }}
                    >
                      关闭字幕
                    </div>
                    {subtitles.length === 0 ? (
                      <div className="player-panel-item" style={{ color: 'var(--color-text-tertiary)' }}>
                        未找到字幕
                      </div>
                    ) : (
                      subtitles.slice(0, 10).map(sub => (
                        <div
                          key={sub.id}
                          className="player-panel-item"
                          onClick={() => loadSubtitle(sub)}
                        >
                          {sub.languageName} - {sub.fileName.slice(0, 30)}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* 清晰度选择（仅云端视频） */}
              {isCloudVideo && qualities.length > 0 && (
                <div style={{ position: 'relative' }}>
                  <button
                    className="player-speed"
                    onClick={() => { setShowQualityPanel(!showQualityPanel); setShowSubtitlePanel(false); setShowSpeedPanel(false) }}
                  >
                    {qualities.find(q => q.id === activeQuality)?.label || '清晰度'}
                  </button>
                  {showQualityPanel && (
                    <div className="player-panel" onClick={(e) => e.stopPropagation()}>
                      <div className="player-panel-title">清晰度</div>
                      {qualities.map(q => (
                        <div
                          key={q.id}
                          className={`player-panel-item ${q.id === activeQuality ? 'active' : ''}`}
                          onClick={() => switchQuality(q.id)}
                        >
                          {q.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 倍速选择 */}
              <div style={{ position: 'relative' }}>
                <button
                  className="player-speed"
                  onClick={() => { setShowSpeedPanel(!showSpeedPanel); setShowQualityPanel(false); setShowSubtitlePanel(false) }}
                >
                  {playbackRate}x
                </button>
                {showSpeedPanel && (
                  <div className="player-panel" onClick={(e) => e.stopPropagation()}>
                    <div className="player-panel-title">播放速度</div>
                    {speeds.map(s => (
                      <div
                        key={s}
                        className={`player-panel-item ${s === playbackRate ? 'active' : ''}`}
                        onClick={() => selectSpeed(s)}
                      >
                        {s}x{s === 1 ? ' (正常)' : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 全屏 */}
              <button className="player-btn" onClick={toggleFullscreen}>
                <Maximize size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 空状态 */}
      {!item && !isCloudVideo && (
        <div className="player-empty">
          <Film size={64} className="player-empty-icon" />
          <div className="player-empty-text">暂无可播放的视频</div>
          <div className="player-empty-sub">请从媒体库中选择一个视频</div>
        </div>
      )}
    </div>
  )
}
