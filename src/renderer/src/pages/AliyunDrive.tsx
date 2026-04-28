import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import {
  Cloud,
  FolderOpen,
  Film,
  FileText,
  Play,
  ChevronRight,
  LogOut,
  AlertCircle,
  List,
  LayoutGrid,
  Home,
  RefreshCw,
  Smartphone
} from 'lucide-react'
import { useAliyunDrive, QrCodeState } from '../hooks/useAliyunDrive'
import { AliyunDriveFile } from '../types'
import './AliyunDrive.css'

/** 格式化文件大小 */
function formatSize(bytes?: number): string {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/** 格式化时长 */
function formatDuration(seconds?: number): string {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}小时${m}分`
  return `${m}分钟`
}

/** 格式化日期 */
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return dateStr
  }
}

/** 扫码状态提示文案 */
function getQrStateText(state: QrCodeState): string {
  switch (state) {
    case 'loading': return '正在获取二维码...'
    case 'waiting': return '请使用阿里云盘 App 扫描二维码'
    case 'scanned': return '扫描成功，请在手机上确认授权'
    case 'success': return '授权成功，正在加载...'
    case 'expired': return '二维码已过期，请刷新重试'
    case 'error': return '出错了，请重试'
    default: return ''
  }
}

/** 面包屑项 */
interface BreadcrumbItem {
  id: string
  name: string
}

/** 阿里云盘文件浏览器页面 */
export default function AliyunDrivePage(): JSX.Element {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const drive = useAliyunDrive()

  // 读取 URL 参数：指定初始文件夹
  const initFolderId = searchParams.get('folderId') || 'root'
  const initFolderName = searchParams.get('name') || '全部文件'

  // 从 location.state 恢复面包屑路径，否则只显示当前目录
  const initBreadcrumb = (location.state as any)?.breadcrumb || [
    { id: initFolderId, name: initFolderName }
  ]

  const [files, setFiles] = useState<AliyunDriveFile[]>([])
  const [fileLoading, setFileLoading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>(initBreadcrumb)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [filterType, setFilterType] = useState<'all' | 'video' | 'folder'>('all')
  const [nextMarker, setNextMarker] = useState<string>('')

  // URL 参数变化时重新加载文件列表
  useEffect(() => {
    // 从 state 恢复面包屑
    const stateBreadcrumb = (location.state as any)?.breadcrumb
    if (stateBreadcrumb) {
      setBreadcrumb(stateBreadcrumb)
    } else {
      setBreadcrumb([{ id: initFolderId, name: initFolderName }])
    }
    if (drive.status.isLoggedIn) {
      loadFiles(initFolderId)
    }
  }, [initFolderId, initFolderName, drive.status.isLoggedIn])

  /** 加载文件列表 */
  const loadFiles = useCallback(async (parentFileId: string, append = false) => {
    setFileLoading(true)
    setFileError(null)
    try {
      const result = await drive.listFiles(parentFileId, {
        limit: 100,
        marker: append ? nextMarker : undefined
      })
      if (append) {
        setFiles(prev => [...prev, ...result.items])
      } else {
        setFiles(result.items)
      }
      setNextMarker(result.next_marker || '')
    } catch (err: any) {
      setFileError(err.message)
    } finally {
      setFileLoading(false)
    }
  }, [drive, nextMarker])

  /** 进入文件夹（更新 URL 并传递面包屑路径） */
  const enterFolder = useCallback((file: AliyunDriveFile) => {
    const newBreadcrumb = [...breadcrumb, { id: file.file_id, name: file.name }]
    navigate(
      `/sources/aliyun?folderId=${file.file_id}&name=${encodeURIComponent(file.name)}`,
      { state: { breadcrumb: newBreadcrumb } }
    )
  }, [navigate, breadcrumb])

  /** 导航到面包屑指定层级 */
  const navigateToBreadcrumb = useCallback((index: number) => {
    const target = breadcrumb[index]
    const newBreadcrumb = breadcrumb.slice(0, index + 1)
    navigate(
      `/sources/aliyun?folderId=${target.id}&name=${encodeURIComponent(target.name)}`,
      { state: { breadcrumb: newBreadcrumb } }
    )
  }, [breadcrumb, navigate])

  /** 播放视频文件 */
  const playVideo = useCallback(async (file: AliyunDriveFile) => {
    // 传递 parentId 以支持上一集/下一集
    const parentId = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].id : 'root'
    const currentPath = `/sources/aliyun?folderId=${parentId}&name=${encodeURIComponent(breadcrumb[breadcrumb.length - 1]?.name || '')}`
    navigate(`/player/cloud/${file.file_id}?name=${encodeURIComponent(file.name)}&parentId=${parentId}`, { state: { from: currentPath } })
  }, [navigate, breadcrumb])

  /** 处理文件点击 */
  const handleFileClick = useCallback((file: AliyunDriveFile) => {
    if (file.type === 'folder') {
      enterFolder(file)
    } else if (file.category === 'video') {
      playVideo(file)
    }
  }, [enterFolder, playVideo])

  /** 筛选后的文件 */
  const filteredFiles = files.filter(f => {
    if (filterType === 'video') return f.category === 'video'
    if (filterType === 'folder') return f.type === 'folder'
    return true
  })

  /** 获取文件图标类型 */
  const getFileIconType = (file: AliyunDriveFile): string => {
    if (file.type === 'folder') return 'folder'
    if (file.category === 'video') return 'video'
    return 'other'
  }

  // ---- 未登录状态：显示扫码登录 ----
  if (!drive.status.isLoggedIn) {
    return (
      <div className="aliyun-page">
        <div className="aliyun-connect">
          <div className="aliyun-connect-icon">
            <Cloud size={36} />
          </div>
          <h2 className="aliyun-connect-title">连接阿里云盘</h2>

          {drive.error && (
            <div className="aliyun-error" style={{ maxWidth: 400 }}>
              <AlertCircle size={16} className="aliyun-error-icon" />
              <span className="aliyun-error-text">{drive.error}</span>
            </div>
          )}

          {/* 二维码区域 */}
          {drive.qrCodeUrl ? (
            <div className="aliyun-qr-area">
              <div className={`aliyun-qr-wrapper ${drive.qrState === 'expired' ? 'expired' : ''} ${drive.qrState === 'scanned' ? 'scanned' : ''}`}>
                <img
                  src={drive.qrCodeUrl}
                  alt="扫码登录"
                  className="aliyun-qr-image"
                />
                {/* 过期遮罩 */}
                {drive.qrState === 'expired' && (
                  <div className="aliyun-qr-overlay">
                    <RefreshCw size={28} />
                    <span>已过期</span>
                  </div>
                )}
                {/* 已扫码遮罩 */}
                {drive.qrState === 'scanned' && (
                  <div className="aliyun-qr-overlay scanned">
                    <Smartphone size={28} />
                    <span>请在手机确认</span>
                  </div>
                )}
                {/* 成功遮罩 */}
                {drive.qrState === 'success' && (
                  <div className="aliyun-qr-overlay success">
                    <div className="aliyun-loading-spinner" />
                  </div>
                )}
              </div>

              <p className="aliyun-qr-hint">{getQrStateText(drive.qrState)}</p>

              {(drive.qrState === 'expired' || drive.qrState === 'error') && (
                <button
                  className="aliyun-login-btn"
                  onClick={drive.startQrLogin}
                  style={{ marginTop: 'var(--spacing-md)' }}
                >
                  <RefreshCw size={16} />
                  刷新二维码
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="aliyun-connect-desc">
                使用阿里云盘手机 App 扫码，即可浏览和播放你的云盘视频。
              </p>
              <button
                className="aliyun-login-btn"
                onClick={drive.startQrLogin}
                disabled={drive.qrState === 'loading'}
              >
                <Cloud size={18} />
                {drive.qrState === 'loading' ? '正在加载...' : '开始扫码登录'}
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ---- 已登录状态：文件浏览器 ----
  const currentFolderId = breadcrumb[breadcrumb.length - 1].id

  return (
    <div className="aliyun-page">
      {/* 用户信息栏 */}
      <div className="aliyun-user-bar">
        <div className="aliyun-user-info">
          <div className="aliyun-user-avatar">
            {drive.status.userInfo?.avatar ? (
              <img src={drive.status.userInfo.avatar} alt="" />
            ) : (
              <Cloud size={18} />
            )}
          </div>
          <div>
            <div className="aliyun-user-name">
              {drive.status.userInfo?.user_name || '阿里云盘用户'}
            </div>
            <div className="aliyun-user-sub">已连接</div>
          </div>
        </div>
        <button className="aliyun-logout-btn" onClick={drive.logout}>
          <LogOut size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          退出
        </button>
      </div>

      {/* 面包屑导航 */}
      <div className="aliyun-breadcrumb">
        {breadcrumb.map((item, index) => (
          <span key={item.id} style={{ display: 'flex', alignItems: 'center' }}>
            {index > 0 && <ChevronRight size={14} className="aliyun-breadcrumb-sep" />}
            <span
              className={`aliyun-breadcrumb-item ${index === breadcrumb.length - 1 ? 'active' : ''}`}
              onClick={() => index < breadcrumb.length - 1 && navigateToBreadcrumb(index)}
            >
              {index === 0 && <Home size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
              {item.name}
            </span>
          </span>
        ))}
      </div>

      {/* 工具栏 */}
      <div className="aliyun-toolbar">
        <div className="aliyun-toolbar-left">
          {['all', 'video', 'folder'].map((type) => (
            <button
              key={type}
              className={`aliyun-filter-chip ${filterType === type ? 'active' : ''}`}
              onClick={() => setFilterType(type as any)}
            >
              {type === 'all' ? '全部' : type === 'video' ? '视频' : '文件夹'}
            </button>
          ))}
        </div>

        <div className="aliyun-view-toggle">
          <button
            className={`aliyun-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List size={14} />
          </button>
          <button
            className={`aliyun-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {fileError && (
        <div className="aliyun-error">
          <AlertCircle size={16} className="aliyun-error-icon" />
          <span className="aliyun-error-text">{fileError}</span>
        </div>
      )}

      {/* 文件列表 */}
      {fileLoading && files.length === 0 ? (
        <div className="aliyun-loading">
          <div className="aliyun-loading-spinner" />
          <span>正在加载...</span>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="aliyun-empty">
          <FolderOpen size={48} className="aliyun-empty-icon" />
          <span>
            {filterType === 'video' ? '该目录下没有视频文件' : '该目录为空'}
          </span>
        </div>
      ) : viewMode === 'list' ? (
        <div className="aliyun-file-list">
          {filteredFiles.map((file, index) => (
            <div
              key={file.file_id}
              className="aliyun-file-item"
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={() => handleFileClick(file)}
            >
              {file.thumbnail ? (
                <img className="aliyun-file-thumb" src={file.thumbnail} alt="" />
              ) : (
                <div className={`aliyun-file-icon ${getFileIconType(file)}`}>
                  {file.type === 'folder' ? <FolderOpen size={18} /> :
                   file.category === 'video' ? <Film size={18} /> :
                   <FileText size={18} />}
                </div>
              )}

              <div className="aliyun-file-info">
                <div className="aliyun-file-name">{file.name}</div>
                <div className="aliyun-file-meta">
                  {file.type === 'folder' ? (
                    <span>文件夹</span>
                  ) : (
                    <>
                      <span>{formatSize(file.size)}</span>
                      {file.video_media_metadata?.duration && (
                        <span>{formatDuration(file.video_media_metadata.duration)}</span>
                      )}
                    </>
                  )}
                  <span>{formatDate(file.updated_at)}</span>
                </div>
              </div>

              <div className="aliyun-file-actions">
                {file.category === 'video' && (
                  <button
                    className="aliyun-file-action-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      playVideo(file)
                    }}
                  >
                    <Play size={16} fill="currentColor" />
                  </button>
                )}
                {file.type === 'folder' && (
                  <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="aliyun-video-grid">
          {filteredFiles.map((file, index) => (
            <div
              key={file.file_id}
              className="aliyun-video-card"
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={() => handleFileClick(file)}
            >
              <div className="aliyun-video-card-thumb">
                {file.thumbnail ? (
                  <img src={file.thumbnail} alt="" />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {file.type === 'folder' ? <FolderOpen size={28} color="var(--color-text-tertiary)" /> :
                     <Film size={28} color="var(--color-text-tertiary)" />}
                  </div>
                )}
                {file.category === 'video' && (
                  <div className="aliyun-video-card-play">
                    <div className="aliyun-video-card-play-icon">
                      <Play size={18} fill="currentColor" />
                    </div>
                  </div>
                )}
              </div>
              <div className="aliyun-video-card-info">
                <div className="aliyun-video-card-name">{file.name}</div>
                <div className="aliyun-video-card-meta">
                  {file.type === 'folder' ? '文件夹' :
                    `${formatSize(file.size)}${file.video_media_metadata?.duration ? ' · ' + formatDuration(file.video_media_metadata.duration) : ''}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 加载更多 */}
      {nextMarker && !fileLoading && (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
          <button
            className="aliyun-filter-chip active"
            onClick={() => loadFiles(currentFolderId, true)}
          >
            加载更多
          </button>
        </div>
      )}

      {fileLoading && files.length > 0 && (
        <div className="aliyun-loading">
          <div className="aliyun-loading-spinner" />
        </div>
      )}
    </div>
  )
}
