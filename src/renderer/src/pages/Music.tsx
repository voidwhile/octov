import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Music, Play, Disc3 } from 'lucide-react'
import { MediaItem } from '../types'
import { getLibraryMusic, getScanStatus, onScanChange, loadCachedMedia, scanAllSources } from '../data/mediaLibrary'
import './Music.css'

// 格式分类配置
const FORMAT_GROUPS: Record<string, { label: string; color: string; exts: string[] }> = {
  mp3:   { label: 'MP3',     color: '#f97316', exts: ['mp3'] },
  flac:  { label: 'FLAC',    color: '#8b5cf6', exts: ['flac', 'alac'] },
  wav:   { label: 'WAV',     color: '#06b6d4', exts: ['wav', 'aiff'] },
  other: { label: '其他格式', color: '#6b7280', exts: ['aac', 'm4a', 'ogg', 'opus', 'wma', 'ape'] }
}

/** 从文件路径获取扩展名（小写） */
function getFileExt(filePath?: string): string {
  return filePath?.split('.').pop()?.toLowerCase() || ''
}

/** 音乐库页面 */
export default function MusicPage(): JSX.Element {
  const navigate = useNavigate()
  const { format } = useParams<{ format?: string }>()

  const [allTracks, setAllTracks] = useState<MediaItem[]>([])
  const [scanStatus, setScanStatus] = useState(getScanStatus())
  const [currentTrack, setCurrentTrack] = useState<MediaItem | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  /** 刷新音乐列表 */
  const refresh = (): void => {
    setAllTracks(getLibraryMusic())
    setScanStatus(getScanStatus())
  }

  useEffect(() => {
    loadCachedMedia().then(() => {
      refresh()
      scanAllSources()
    })
    const unsubscribe = onScanChange(refresh)
    return unsubscribe
  }, [])

  /** 当前格式信息 */
  const formatGroup = format ? FORMAT_GROUPS[format] : null

  /** 按格式过滤 */
  const tracks: MediaItem[] = format
    ? (FORMAT_GROUPS[format]
      ? allTracks.filter(t => FORMAT_GROUPS[format].exts.includes(t.fileExt || ''))
      : allTracks)
    : allTracks

  /** 播放音乐文件 */
  const handlePlay = (track: MediaItem, index: number): void => {
    setCurrentTrack(track)
    setIsPlaying(true)
    navigate(`/music-player/${encodeURIComponent(track.id)}`, {
      state: {
        playlist: tracks,
        currentIndex: index,
        filePath: track.filePath,
        cloudFileId: track.cloudFileId,
        title: track.title,
        fileExt: track.fileExt
      }
    })
  }

  /** 获取文件扩展名显示 */
  const getExt = (track: MediaItem): string =>
    (track.fileExt || track.filePath?.split('.').pop() || 'AUDIO').toUpperCase()

  const heroColor = formatGroup?.color || 'var(--color-accent)'
  const heroLabel = formatGroup?.label || '音乐库'
  const heroCount = tracks.length

  return (
    <div className="music-page">
      {/* Hero 区域 */}
      <div className="music-hero" style={{ '--music-hero-color': heroColor } as React.CSSProperties}>
        <div className="music-hero-icon" style={{ background: `linear-gradient(135deg, ${heroColor}, ${heroColor}99)` }}>
          <Disc3 size={56} className="music-hero-disc" />
        </div>
        <div className="music-hero-info">
          <h1 className="music-hero-title">{heroLabel}</h1>
          <p className="music-hero-subtitle">
            {scanStatus.isScanning
              ? '正在扫描文件源...'
              : `共 ${heroCount} 首曲目${format ? '' : ` · 全部格式`}`}
          </p>
        </div>
      </div>

      {/* 音乐列表 */}
      <div className="music-list">
        {scanStatus.isScanning && allTracks.length === 0 ? (
          <div className="music-empty">
            <div className="music-empty-spinner" />
            <p>正在扫描音乐文件...</p>
          </div>
        ) : tracks.length === 0 ? (
          <div className="music-empty">
            <Music size={64} className="music-empty-icon" />
            <p className="music-empty-title">
              {format ? `没有 ${heroLabel} 格式的音乐` : '暂无音乐'}
            </p>
            <p className="music-empty-desc">请在文件源中添加包含音乐文件的文件夹</p>
          </div>
        ) : (
          <>
            {/* 列表头 */}
            <div className="music-list-header">
              <span className="music-col-num">#</span>
              <span className="music-col-title">标题</span>
              <span className="music-col-format">格式</span>
              <span className="music-col-action"></span>
            </div>

            {/* 音乐条目 */}
            {tracks.map((track, index) => (
              <div
                key={track.id}
                className={`music-track-item ${currentTrack?.id === track.id ? 'active' : ''}`}
                onClick={() => handlePlay(track, index)}
              >
                <div className="music-col-num">
                  {currentTrack?.id === track.id && isPlaying ? (
                    <div className="music-playing-bars">
                      <span /><span /><span />
                    </div>
                  ) : (
                    <span className="music-track-index">{index + 1}</span>
                  )}
                  <button
                    className="music-play-btn"
                    onClick={(e) => { e.stopPropagation(); handlePlay(track, index) }}
                  >
                    <Play size={14} fill="currentColor" />
                  </button>
                </div>

                <div className="music-col-title">
                  <div className="music-track-cover">
                    {track.poster ? (
                      <img src={track.poster} alt={track.title} />
                    ) : (
                      <Music size={18} className="music-track-cover-icon" />
                    )}
                  </div>
                  <div className="music-track-info">
                    <span className="music-track-name">{track.title}</span>
                    <span className="music-track-path">
                      {track.filePath?.split('/').slice(-2, -1)[0] || '未知专辑'}
                    </span>
                  </div>
                </div>

                <div className="music-col-format">
                  <span className="music-format-tag">
                    {getExt(track)}
                  </span>
                </div>

                <div className="music-col-action">
                  <button
                    className="music-play-icon-btn"
                    onClick={(e) => { e.stopPropagation(); handlePlay(track) }}
                  >
                    <Play size={16} fill="currentColor" />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
