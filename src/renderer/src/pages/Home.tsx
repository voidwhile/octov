import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import MediaRow from '../components/MediaRow'
import {
  getLibraryRecentlyAdded,
  getLibraryMovies,
  getLibraryTVShows,
  scanAllSources,
  getScanStatus,
  onScanChange,
  loadCachedMedia
} from '../data/mediaLibrary'
import { loadPlayHistory, getRecentlyPlayed, onHistoryChange, PlayRecord } from '../data/playHistory'
import { MediaItem } from '../types'
import { Play, CheckCircle } from 'lucide-react'
import './Home.css'

/** 格式化播放时间 */
function formatPlayTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}时${m}分`
  return `${m}分`
}

/** 格式化最后播放时间（相对时间） */
function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

/** 媒体库主页 */
export default function Home(): JSX.Element {
  const navigate = useNavigate()
  const [recentPlayed, setRecentPlayed] = useState<PlayRecord[]>([])
  const [recentlyAdded, setRecentlyAdded] = useState<MediaItem[]>([])
  const [movies, setMovies] = useState<MediaItem[]>([])
  const [tvshows, setTVShows] = useState<MediaItem[]>([])
  const [scanStatus, setScanStatus] = useState(getScanStatus())

  /** 刷新数据 */
  const refreshData = useCallback(() => {
    setRecentPlayed(getRecentlyPlayed())
    setRecentlyAdded(getLibraryRecentlyAdded())
    setMovies(getLibraryMovies())
    setTVShows(getLibraryTVShows())
    setScanStatus(getScanStatus())
  }, [])

  useEffect(() => {
    // 加载磁盘缓存和播放记录
    Promise.all([loadCachedMedia(), loadPlayHistory()]).then(() => {
      refreshData()
      if (!getScanStatus().hasScanned) {
        scanAllSources()
      }
    })

    // 监听扫描状态和播放记录变化
    const unsub1 = onScanChange(refreshData)
    const unsub2 = onHistoryChange(refreshData)
    return () => { unsub1(); unsub2() }
  }, [refreshData])

  return (
    <div className="home-page">
      {/* 扫描进度指示 */}
      {scanStatus.isScanning && (
        <div className="home-scan-bar">
          <div className="aliyun-loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
          <span>正在扫描文件源中的视频...</span>
        </div>
      )}

      {/* 继续观看 - 所有播放记录 */}
      {recentPlayed.length > 0 && (
        <section className="media-row">
          <div className="media-row-header">
            <h2 className="media-row-title">继续观看</h2>
            <span className="media-row-count">{recentPlayed.length} 个视频</span>
          </div>
          <div className="continue-watching-grid">
            {recentPlayed.map((record, index) => {
              const isCompleted = record.percentage >= 95
              return (
                <div
                  key={record.fileId}
                  className={`continue-card ${isCompleted ? 'completed' : ''}`}
                  style={{ animationDelay: `${index * 40}ms` }}
                  onClick={() => navigate(
                    `/player/cloud/${record.fileId}?name=${encodeURIComponent(record.name)}${record.parentId ? `&parentId=${record.parentId}` : ''}`,
                    { state: { from: '/' } }
                  )}
                >
                  <div className="continue-card-poster">
                    {record.poster ? (
                      <img src={record.poster} alt={record.title || record.name} loading="lazy" />
                    ) : (
                      <div className="continue-card-placeholder">
                        <Play size={24} />
                      </div>
                    )}
                    <div className="continue-card-overlay">
                      <div className="continue-card-play">
                        {isCompleted ? <CheckCircle size={20} /> : <Play size={20} fill="white" />}
                      </div>
                    </div>
                    {/* 进度条 */}
                    <div className="continue-card-progress">
                      <div
                        className={`continue-card-progress-bar ${isCompleted ? 'completed' : ''}`}
                        style={{ width: `${Math.min(record.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="continue-card-info">
                    <div className="continue-card-title">{record.title || record.name}</div>
                    <div className="continue-card-meta">
                      {isCompleted ? (
                        <span className="continue-card-completed">已看完</span>
                      ) : (
                        <span>{formatPlayTime(record.currentTime)} / {formatPlayTime(record.totalDuration)}</span>
                      )}
                      <span className="continue-card-time">{formatRelativeTime(record.lastPlayed)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 最近添加 */}
      <MediaRow
        title="最近添加"
        items={recentlyAdded}
        viewAllLink="/recent"
      />

      {/* 电影 */}
      {movies.length > 0 && (
        <MediaRow
          title="电影"
          items={movies.slice(0, 10)}
          viewAllLink="/movies"
        />
      )}

      {/* 电视剧 */}
      {tvshows.length > 0 && (
        <MediaRow
          title="电视剧"
          items={tvshows.slice(0, 10)}
          viewAllLink="/tvshows"
        />
      )}
    </div>
  )
}
