import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  FolderOpen,
  Film,
  Music,
  FileText,
  Play,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import './LocalFiles.css'

/** 本地文件项（扫描结果） */
interface LocalFileItem {
  id: string
  title: string
  type: 'movie' | 'tvshow' | 'music'
  year?: number
  filePath?: string
  fileExt?: string
  source: 'local'
  sourceId: string
  scannedAt: string
}

/** 格式化文件扩展名标签 */
function ExtBadge({ ext }: { ext?: string }) {
  if (!ext) return null
  return <span className="local-ext-badge">{ext.toUpperCase()}</span>
}

/** 本地文件浏览页 */
export default function LocalFilesPage(): JSX.Element {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // 从 URL 获取文件夹路径
  const folderPath = searchParams.get('path') || ''

  const [items, setItems] = useState<LocalFileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'video' | 'music'>('all')

  /** 扫描本地文件夹 */
  const scanFolder = useCallback(async () => {
    if (!folderPath) {
      setError('未指定文件夹路径')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 构造一个临时文件源对象传给后端扫描器
      const tempSource = {
        id: 'temp-local',
        name: '本地文件',
        storageId: 'local',
        storageType: 'local' as const,
        storageName: '本地',
        path: folderPath,
        createdAt: new Date().toISOString()
      }

      const result = await window.scanner.scanSource(tempSource)
      if (result.success) {
        setItems(result.data || [])
      } else {
        setError(result.error || '扫描失败')
      }
    } catch (err: any) {
      setError(err.message || '扫描出错')
    } finally {
      setLoading(false)
    }
  }, [folderPath])

  useEffect(() => {
    scanFolder()
  }, [scanFolder])

  /** 播放文件 */
  const playFile = useCallback((item: LocalFileItem) => {
    if (!item.filePath) return

    if (item.type === 'music') {
      // 本地音乐：跳转到音乐播放器（传递本地路径）
      navigate(`/music-player/${encodeURIComponent(item.id)}`, {
        state: { filePath: item.filePath, title: item.title, fileExt: item.fileExt }
      })
    } else {
      // 本地视频：跳转到视频播放器
      navigate(`/player/${encodeURIComponent(item.id)}`, {
        state: { localPath: item.filePath, title: item.title }
      })
    }
  }, [navigate])

  /** 筛选后的文件列表 */
  const filteredItems = items.filter(item => {
    if (filterType === 'video') return item.type === 'movie' || item.type === 'tvshow'
    if (filterType === 'music') return item.type === 'music'
    return true
  })

  /** 统计数字 */
  const videoCount = items.filter(i => i.type === 'movie' || i.type === 'tvshow').length
  const musicCount = items.filter(i => i.type === 'music').length

  // ---- 未指定路径 ----
  if (!folderPath) {
    return (
      <div className="local-page">
        <div className="local-empty">
          <FolderOpen size={48} className="local-empty-icon" />
          <span>未指定文件夹路径</span>
        </div>
      </div>
    )
  }

  return (
    <div className="local-page">
      {/* 文件夹路径信息栏 */}
      <div className="local-info-bar">
        <div className="local-info-path">
          <FolderOpen size={16} />
          <span title={folderPath}>{folderPath}</span>
        </div>
        <button
          className="local-refresh-btn"
          onClick={scanFolder}
          disabled={loading}
          title="重新扫描"
        >
          <RefreshCw size={14} className={loading ? 'spinning' : ''} />
          {loading ? '扫描中...' : '刷新'}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="local-error">
          <AlertCircle size={16} className="local-error-icon" />
          <span className="local-error-text">{error}</span>
        </div>
      )}

      {/* 工具栏：筛选器 + 统计 */}
      {!loading && items.length > 0 && (
        <div className="local-toolbar">
          <div className="local-filters">
            {[
              { key: 'all', label: `全部 (${items.length})` },
              { key: 'video', label: `视频 (${videoCount})` },
              { key: 'music', label: `音乐 (${musicCount})` }
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`local-filter-chip ${filterType === key ? 'active' : ''}`}
                onClick={() => setFilterType(key as any)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 加载中 */}
      {loading && (
        <div className="local-loading">
          <div className="local-loading-spinner" />
          <span>正在扫描文件...</span>
        </div>
      )}

      {/* 空状态 */}
      {!loading && !error && items.length === 0 && (
        <div className="local-empty">
          <FolderOpen size={48} className="local-empty-icon" />
          <span>该文件夹中没有找到媒体文件</span>
          <p className="local-empty-hint">支持视频：mp4、mkv、avi 等；音频：mp3、flac、wav 等</p>
        </div>
      )}

      {/* 文件列表 */}
      {!loading && filteredItems.length > 0 && (
        <div className="local-file-list">
          {filteredItems.map((item, index) => {
            const isVideo = item.type === 'movie' || item.type === 'tvshow'
            const isMusic = item.type === 'music'

            return (
              <div
                key={item.id}
                className="local-file-item"
                style={{ animationDelay: `${index * 20}ms` }}
                onClick={() => playFile(item)}
              >
                {/* 图标 */}
                <div className={`local-file-icon ${isVideo ? 'video' : isMusic ? 'music' : 'other'}`}>
                  {isVideo ? <Film size={18} /> : isMusic ? <Music size={18} /> : <FileText size={18} />}
                </div>

                {/* 文件信息 */}
                <div className="local-file-info">
                  <div className="local-file-name">
                    {item.title}
                    {item.year && <span className="local-file-year">{item.year}</span>}
                    <ExtBadge ext={item.fileExt} />
                  </div>
                  <div className="local-file-path">{item.filePath}</div>
                </div>

                {/* 播放按钮（hover 显示） */}
                <div className="local-file-actions">
                  <button
                    className="local-play-btn"
                    onClick={(e) => { e.stopPropagation(); playFile(item) }}
                    title="播放"
                  >
                    <Play size={15} fill="currentColor" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
