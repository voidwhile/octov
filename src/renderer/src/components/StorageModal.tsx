import { useState, useEffect, useCallback } from 'react'
import {
  X,
  CheckSquare,
  Plus,
  ChevronLeft,
  ChevronRight,
  Cloud,
  HardDrive,
  Trash2,
  Smartphone,
  RefreshCw,
  Check,
  FolderOpen,
  FolderPlus,
  Loader2
} from 'lucide-react'
import { useAliyunDrive } from '../hooks/useAliyunDrive'
import { StorageAccount, AliyunDriveFile } from '../types'
import './StorageModal.css'

interface StorageModalProps {
  /** 是否显示 */
  visible: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 数据变更回调（添加/删除存储或文件源后） */
  onDataChange?: () => void
}

/** 弹窗子页面 */
type ModalView = 'storages' | 'add' | 'add-aliyun' | 'browse-cloud'

/** 存储管理弹窗 */
export default function StorageModal({
  visible,
  onClose,
  onDataChange
}: StorageModalProps): JSX.Element | null {
  const [activeTab, setActiveTab] = useState<'storages' | 'add'>('storages')
  const [view, setView] = useState<ModalView>('storages')
  const [storages, setStorages] = useState<StorageAccount[]>([])
  const [storageName, setStorageName] = useState('')
  const [authSuccess, setAuthSuccess] = useState(false)

  // 云盘目录浏览状态
  const [browseStorage, setBrowseStorage] = useState<StorageAccount | null>(null)
  const [browsePath, setBrowsePath] = useState<Array<{ id: string; name: string }>>([])
  const [browseFiles, setBrowseFiles] = useState<AliyunDriveFile[]>([])
  const [browseLoading, setBrowseLoading] = useState(false)
  const [addedFolderIds, setAddedFolderIds] = useState<Set<string>>(new Set())
  const [addingFolderId, setAddingFolderId] = useState<string | null>(null)

  const drive = useAliyunDrive()

  /** 加载存储列表 */
  const loadStorages = useCallback(async () => {
    const list = await window.storage.getStorages()
    setStorages(list)
  }, [])

  /** 加载已添加的文件源 ID，用于标记已添加状态 */
  const loadAddedSources = useCallback(async () => {
    const sources = await window.storage.getSources()
    setAddedFolderIds(new Set(sources.map(s => s.path)))
  }, [])

  useEffect(() => {
    if (visible) {
      loadStorages()
      loadAddedSources()
      setView('storages')
      setActiveTab('storages')
      setAuthSuccess(false)
      setStorageName('')
    }
  }, [visible, loadStorages, loadAddedSources])

  /** 当阿里云盘登录成功时 */
  useEffect(() => {
    if (drive.status.isLoggedIn && view === 'add-aliyun') {
      setAuthSuccess(true)
      if (!storageName) {
        setStorageName(
          drive.status.userInfo?.user_name
            ? `${drive.status.userInfo.user_name}的阿里云盘`
            : '我的阿里云盘'
        )
      }
    }
  }, [drive.status.isLoggedIn, view, storageName, drive.status.userInfo])

  /** 切换到添加存储 Tab */
  const switchToAdd = useCallback(() => {
    setActiveTab('add')
    setView('add')
  }, [])

  /** 切换到已添加存储 Tab */
  const switchToStorages = useCallback(() => {
    setActiveTab('storages')
    setView('storages')
  }, [])

  /** 删除存储 */
  const handleDeleteStorage = useCallback(async (id: string) => {
    await window.storage.deleteStorage(id)
    await loadStorages()
    await loadAddedSources()
    onDataChange?.()
  }, [loadStorages, loadAddedSources, onDataChange])

  /** 点击添加阿里云盘 */
  const handleAddAliyun = useCallback(() => {
    setView('add-aliyun')
    setAuthSuccess(false)
    setStorageName('')
    if (drive.status.isLoggedIn) {
      setAuthSuccess(true)
      setStorageName(
        drive.status.userInfo?.user_name
          ? `${drive.status.userInfo.user_name}的阿里云盘`
          : '我的阿里云盘'
      )
    } else {
      drive.startQrLogin()
    }
  }, [drive])

  /** 提交添加阿里云盘存储 → 进入目录浏览 */
  const handleSubmitAliyun = useCallback(async () => {
    if (!storageName || !authSuccess) return
    const newStorage = await window.storage.addStorage({
      type: 'aliyundrive',
      name: storageName,
      userInfo: drive.status.userInfo
        ? {
            userId: drive.status.userInfo.user_id || '',
            userName: drive.status.userInfo.user_name || '',
            avatar: drive.status.userInfo.avatar || ''
          }
        : undefined
    })
    await loadStorages()
    onDataChange?.()
    // 添加成功后直接进入目录浏览
    handleBrowseStorage(newStorage)
  }, [storageName, authSuccess, drive.status.userInfo, loadStorages, onDataChange])

  /** 添加本地目录 */
  const handleAddLocal = useCallback(async () => {
    const folderPath = await window.api.selectFolder()
    if (!folderPath) return

    const dirName = folderPath.split('/').pop() || folderPath.split('\\').pop() || '本地目录'

    const storage = await window.storage.addStorage({
      type: 'local',
      name: dirName
    })

    await window.storage.addSource({
      name: dirName,
      storageId: storage.id,
      storageType: 'local',
      storageName: storage.name,
      path: folderPath
    })

    await loadStorages()
    await loadAddedSources()
    onDataChange?.()
    setView('storages')
    setActiveTab('storages')
  }, [loadStorages, loadAddedSources, onDataChange])

  // ---- 云盘目录浏览 ----

  /** 加载指定目录的文件列表 */
  const loadFolder = useCallback(async (folderId: string) => {
    setBrowseLoading(true)
    try {
      const result = await window.aliyunDrive.listFiles(folderId, { limit: 200 })
      if (result.success && result.data) {
        // 只显示文件夹
        const folders = (result.data.items || []).filter(
          (f: AliyunDriveFile) => f.type === 'folder'
        )
        setBrowseFiles(folders)
      } else {
        setBrowseFiles([])
      }
    } catch (err) {
      console.error('加载云盘目录失败:', err)
      setBrowseFiles([])
    } finally {
      setBrowseLoading(false)
    }
  }, [])

  /** 进入存储的目录浏览 */
  const handleBrowseStorage = useCallback((storage: StorageAccount) => {
    if (storage.type !== 'aliyundrive') return
    setBrowseStorage(storage)
    setBrowsePath([{ id: 'root', name: storage.name }])
    setView('browse-cloud')
    setActiveTab('storages')
    loadFolder('root')
  }, [loadFolder])

  /** 进入子文件夹 */
  const handleEnterFolder = useCallback((folder: AliyunDriveFile) => {
    setBrowsePath(prev => [...prev, { id: folder.file_id, name: folder.name }])
    loadFolder(folder.file_id)
  }, [loadFolder])

  /** 面包屑导航：点击路径中的某一级 */
  const handleBreadcrumbClick = useCallback((index: number) => {
    const newPath = browsePath.slice(0, index + 1)
    setBrowsePath(newPath)
    loadFolder(newPath[newPath.length - 1].id)
  }, [browsePath, loadFolder])

  /** 添加文件夹为文件源 */
  const handleAddFolderAsSource = useCallback(async (folder: AliyunDriveFile) => {
    if (!browseStorage) return
    setAddingFolderId(folder.file_id)
    try {
      await window.storage.addSource({
        name: folder.name,
        storageId: browseStorage.id,
        storageType: 'aliyundrive',
        storageName: browseStorage.name,
        path: folder.file_id
      })
      await loadAddedSources()
      onDataChange?.()
    } catch (err) {
      console.error('添加文件源失败:', err)
    } finally {
      setAddingFolderId(null)
    }
  }, [browseStorage, loadAddedSources, onDataChange])

  /** 将当前目录添加为文件源（根目录或当前浏览的文件夹） */
  const handleAddCurrentFolder = useCallback(async () => {
    if (!browseStorage || browsePath.length === 0) return
    const current = browsePath[browsePath.length - 1]
    setAddingFolderId(current.id)
    try {
      await window.storage.addSource({
        name: current.name,
        storageId: browseStorage.id,
        storageType: 'aliyundrive',
        storageName: browseStorage.name,
        path: current.id
      })
      await loadAddedSources()
      onDataChange?.()
    } catch (err) {
      console.error('添加文件源失败:', err)
    } finally {
      setAddingFolderId(null)
    }
  }, [browseStorage, browsePath, loadAddedSources, onDataChange])

  if (!visible) return null

  /** 渲染内容区 */
  const renderContent = (): JSX.Element => {
    switch (view) {
      case 'storages':
        return (
          <>
            <div className="storage-modal-header">
              <span className="storage-modal-title">已添加的存储</span>
            </div>
            <div className="storage-modal-body">
              {storages.length === 0 ? (
                <div className="storage-empty">
                  <Cloud size={32} />
                  <span>暂无存储</span>
                  <span style={{ fontSize: 'var(--font-size-xs)' }}>
                    点击左侧「添加存储」开始
                  </span>
                </div>
              ) : (
                storages.map(s => (
                  <div
                    key={s.id}
                    className="storage-list-item"
                    onClick={() => handleBrowseStorage(s)}
                  >
                    <div className={`storage-list-icon ${s.type}`}>
                      {s.type === 'aliyundrive' ? <Cloud size={16} /> : <HardDrive size={16} />}
                    </div>
                    <span className="storage-list-name">{s.name}</span>
                    {s.type === 'aliyundrive' && (
                      <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                    )}
                    <div className="storage-list-actions">
                      <button
                        className="storage-list-action-btn delete"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteStorage(s.id)
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )

      case 'add':
        return (
          <>
            <div className="storage-modal-header">
              <span className="storage-modal-title">添加存储</span>
            </div>
            <div className="storage-modal-body">
              <div className="storage-type-group">
                <div className="storage-type-group-title">本地存储</div>
                <div className="storage-type-item" onClick={handleAddLocal}>
                  <div className="storage-type-icon" style={{ background: 'linear-gradient(135deg, #A0E8AF, #4CAF50)', color: 'white', borderRadius: '8px' }}>
                    <HardDrive size={16} />
                  </div>
                  <span className="storage-type-name">添加本地目录</span>
                </div>
              </div>
              <div className="storage-type-group">
                <div className="storage-type-group-title">云盘存储</div>
                <div className="storage-type-item" onClick={handleAddAliyun}>
                  <div className="storage-type-icon" style={{ background: 'linear-gradient(135deg, #6BB8FF, #4099FF)', color: 'white', borderRadius: '8px' }}>
                    <Cloud size={16} />
                  </div>
                  <span className="storage-type-name">添加阿里云盘</span>
                </div>
              </div>
            </div>
          </>
        )

      case 'add-aliyun':
        return (
          <>
            <div className="storage-modal-header">
              <button
                className="storage-modal-back"
                onClick={() => { setView('add'); setActiveTab('add') }}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="storage-modal-title">添加阿里云盘</span>
            </div>
            <div className="storage-modal-body">
              <div className="storage-form">
                <div className="storage-form-row">
                  <span className="storage-form-label">名称</span>
                  <input
                    className="storage-form-input"
                    value={storageName}
                    onChange={(e) => setStorageName(e.target.value)}
                    placeholder="我的阿里云盘"
                  />
                </div>

                {authSuccess ? (
                  <div className="storage-qr-area">
                    <div className="storage-success-check">
                      <Check size={20} />
                      授权成功
                    </div>
                  </div>
                ) : drive.qrCodeUrl ? (
                  <div className="storage-qr-area">
                    <div className="storage-qr-wrapper">
                      <img src={drive.qrCodeUrl} alt="扫码登录" />
                      {drive.qrState === 'scanned' && (
                        <div className="storage-qr-overlay">
                          <Smartphone size={20} />
                          <span>请在手机确认</span>
                        </div>
                      )}
                      {drive.qrState === 'expired' && (
                        <div
                          className="storage-qr-overlay"
                          style={{ background: 'rgba(0,0,0,0.65)', cursor: 'pointer' }}
                          onClick={drive.startQrLogin}
                        >
                          <RefreshCw size={20} />
                          <span>已过期，点击刷新</span>
                        </div>
                      )}
                    </div>
                    <span className="storage-qr-hint">
                      {drive.qrState === 'waiting' && '请使用阿里云盘 App 扫描二维码'}
                      {drive.qrState === 'scanned' && '扫描成功，请在手机上确认'}
                      {drive.qrState === 'expired' && '二维码已过期'}
                    </span>
                  </div>
                ) : (
                  <div className="storage-qr-area">
                    <div className="aliyun-loading-spinner" />
                    <span className="storage-qr-hint">正在获取二维码...</span>
                  </div>
                )}

                <button
                  className="storage-form-submit"
                  disabled={!storageName || !authSuccess}
                  onClick={handleSubmitAliyun}
                >
                  添加并选择文件夹
                </button>
              </div>
            </div>
          </>
        )

      case 'browse-cloud':
        return (
          <>
            <div className="storage-modal-header">
              <button
                className="storage-modal-back"
                onClick={() => {
                  if (browsePath.length > 1) {
                    // 返回上级目录
                    handleBreadcrumbClick(browsePath.length - 2)
                  } else {
                    // 返回存储列表
                    setView('storages')
                    setActiveTab('storages')
                  }
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="storage-modal-title">选择文件夹</span>
            </div>

            {/* 面包屑导航 */}
            <div className="storage-breadcrumb">
              {browsePath.map((item, index) => (
                <span key={item.id} className="storage-breadcrumb-item">
                  {index > 0 && <ChevronRight size={12} className="storage-breadcrumb-sep" />}
                  <span
                    className={`storage-breadcrumb-text ${index === browsePath.length - 1 ? 'active' : ''}`}
                    onClick={() => handleBreadcrumbClick(index)}
                  >
                    {item.name}
                  </span>
                </span>
              ))}
            </div>

            {/* 当前文件夹操作栏 */}
            {browsePath.length > 1 && (
              <div className="storage-folder-action-bar">
                <button
                  className="storage-add-current-btn"
                  disabled={addedFolderIds.has(browsePath[browsePath.length - 1].id) || addingFolderId === browsePath[browsePath.length - 1].id}
                  onClick={handleAddCurrentFolder}
                >
                  {addedFolderIds.has(browsePath[browsePath.length - 1].id) ? (
                    <><Check size={14} /> 已添加</>
                  ) : addingFolderId === browsePath[browsePath.length - 1].id ? (
                    <><Loader2 size={14} className="spinning" /> 添加中...</>
                  ) : (
                    <><FolderPlus size={14} /> 将「{browsePath[browsePath.length - 1].name}」添加为文件源</>
                  )}
                </button>
              </div>
            )}

            <div className="storage-modal-body">
              {browseLoading ? (
                <div className="storage-empty">
                  <div className="aliyun-loading-spinner" />
                  <span>加载中...</span>
                </div>
              ) : browseFiles.length === 0 ? (
                <div className="storage-empty">
                  <FolderOpen size={32} />
                  <span>暂无文件夹</span>
                </div>
              ) : (
                browseFiles.map(folder => (
                  <div key={folder.file_id} className="storage-folder-item">
                    <div
                      className="storage-folder-info"
                      onClick={() => handleEnterFolder(folder)}
                    >
                      <FolderOpen size={18} style={{ color: '#FFD93D', flexShrink: 0 }} />
                      <span className="storage-folder-name">{folder.name}</span>
                      <ChevronRight size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                    </div>
                    <button
                      className={`storage-folder-add-btn ${addedFolderIds.has(folder.file_id) ? 'added' : ''}`}
                      disabled={addedFolderIds.has(folder.file_id) || addingFolderId === folder.file_id}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddFolderAsSource(folder)
                      }}
                    >
                      {addedFolderIds.has(folder.file_id) ? (
                        <Check size={14} />
                      ) : addingFolderId === folder.file_id ? (
                        <Loader2 size={14} className="spinning" />
                      ) : (
                        <Plus size={14} />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )

      default:
        return <div />
    }
  }

  return (
    <div className="storage-modal-overlay" onClick={onClose}>
      <div className="storage-modal" onClick={(e) => e.stopPropagation()}>
        {/* 左侧导航 */}
        <div className="storage-modal-sidebar">
          <button className="storage-modal-close" onClick={onClose}>
            <X size={16} />
          </button>

          <div
            className={`storage-modal-tab ${activeTab === 'storages' ? 'active' : ''}`}
            onClick={switchToStorages}
          >
            <CheckSquare size={14} />
            已添加的存储
          </div>

          <div
            className={`storage-modal-tab ${activeTab === 'add' ? 'active' : ''}`}
            onClick={switchToAdd}
          >
            <Plus size={14} />
            添加存储
          </div>
        </div>

        {/* 右侧内容 */}
        <div className="storage-modal-content">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
