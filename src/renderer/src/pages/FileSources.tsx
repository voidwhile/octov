import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderOpen, Plus, Trash2 } from 'lucide-react'
import { FileSourceItemType } from '../types'
import StorageModal from '../components/StorageModal'
import { scanAllSources } from '../data/mediaLibrary'
import './FileSources.css'

/** 文件源管理页面 */
export default function FileSources(): JSX.Element {
  const navigate = useNavigate()
  const [sources, setSources] = useState<FileSourceItemType[]>([])
  const [showModal, setShowModal] = useState(false)

  /** 加载文件源列表 */
  const loadSources = useCallback(async () => {
    const list = await window.storage.getSources()
    setSources(list)
  }, [])

  useEffect(() => {
    loadSources()
  }, [loadSources])

  /** 删除文件源 */
  const handleDelete = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await window.storage.deleteSource(id)
    loadSources()
    // 删除后重新扫描媒体库
    scanAllSources(true)
  }, [loadSources])

  /** 点击文件源跳转到浏览页 */
  const handleClick = useCallback((source: FileSourceItemType) => {
    if (source.storageType === 'aliyundrive') {
      navigate(`/sources/aliyun?folderId=${source.path}&name=${encodeURIComponent(source.name)}`)
    } else {
      navigate(`/sources/local?path=${encodeURIComponent(source.path)}`)
    }
  }, [navigate])

  /** 文件源变更后刷新列表并重新扫描媒体库 */
  const handleDataChange = useCallback(() => {
    loadSources()
    // 自动触发媒体库重新扫描
    scanAllSources(true)
  }, [loadSources])

  return (
    <div className="file-sources-page">
      <div className="file-sources-subtitle">已添加的文件源</div>

      <div className="file-source-list">
        {sources.map((source, index) => (
          <div
            key={source.id}
            className="file-source-item"
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => handleClick(source)}
          >
            <div className="file-source-icon">
              <FolderOpen size={24} />
            </div>
            <div className="file-source-info">
              <div className="file-source-name">{source.name}</div>
              <div className="file-source-desc">{source.storageName}</div>
            </div>
            <div className="file-source-actions">
              <button
                className="file-source-action-btn edit"
                title="修改"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowModal(true)
                }}
              >
                <Plus size={14} />
              </button>
              <button
                className="file-source-action-btn delete"
                title="删除"
                onClick={(e) => handleDelete(source.id, e)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        <div className="file-source-add" onClick={() => setShowModal(true)}>
          <div className="file-source-add-icon">
            <Plus size={28} />
          </div>
          <span className="file-source-add-text">添加 / 修改文件源</span>
        </div>
      </div>

      <div className="file-sources-footer">
        为了保证自动刮削搜索电影剧集的准确性，请参照文件源使用教程
      </div>

      <StorageModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onDataChange={handleDataChange}
      />
    </div>
  )
}
