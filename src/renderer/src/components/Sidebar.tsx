import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Play,
  Clock,
  Film,
  Tv,
  LayoutGrid,
  ListVideo,
  Tag,
  FolderOpen,
  HardDrive,
  Cloud,
  Settings,
  ChevronDown
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { FileSourceItemType } from '../types'
import './Sidebar.css'
import octovLogo from '../../../../resources/octov-logo.png'

/** 侧边栏导航组件 */
export default function Sidebar(): JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    library: true,
    sources: true
  })
  const [fileSources, setFileSources] = useState<FileSourceItemType[]>([])

  /** 加载文件源列表 */
  const loadSources = useCallback(async () => {
    try {
      const list = await window.storage.getSources()
      setFileSources(list)
    } catch {
      // 静默处理
    }
  }, [])

  useEffect(() => {
    loadSources()
    // 定期刷新（监听不到存储变化时的兜底）
    const timer = setInterval(loadSources, 5000)
    return () => clearInterval(timer)
  }, [loadSources])

  /** 切换分组展开/折叠 */
  const toggleGroup = (group: string): void => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }))
  }

  /** 检查当前路径是否激活 */
  const isActive = (path: string): boolean => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <aside className="sidebar">
      {/* macOS 标题栏拖拽区域 */}
      <div className="sidebar-titlebar drag-region" />

      {/* Logo */}
      <div className="sidebar-logo">
        <img className="sidebar-logo-icon" src={octovLogo} alt="Octov" />
        <span className="sidebar-logo-text">Octov</span>
      </div>

      {/* 导航 */}
      <nav className="sidebar-nav">
        {/* 媒体库分组 */}
        <div className="sidebar-group">
          <div className="sidebar-group-header" onClick={() => toggleGroup('library')}>
            <span className="sidebar-group-title">媒体库</span>
            <ChevronDown
              className={`sidebar-group-arrow ${!expandedGroups.library ? 'collapsed' : ''}`}
            />
          </div>

          {expandedGroups.library && (
            <>
              <NavLink
                to="/"
                className={`sidebar-item ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}
              >
                <Play className="sidebar-item-icon" />
                <span className="sidebar-item-label">继续观看</span>
              </NavLink>

              <NavLink
                to="/recent"
                className={`sidebar-item ${isActive('/recent') ? 'active' : ''}`}
              >
                <Clock className="sidebar-item-icon" />
                <span className="sidebar-item-label">最近添加</span>
              </NavLink>

              <NavLink
                to="/movies"
                className={`sidebar-item ${isActive('/movies') ? 'active' : ''}`}
              >
                <Film className="sidebar-item-icon" />
                <span className="sidebar-item-label">电影</span>
              </NavLink>

              <NavLink
                to="/tvshows"
                className={`sidebar-item ${isActive('/tvshows') ? 'active' : ''}`}
              >
                <Tv className="sidebar-item-icon" />
                <span className="sidebar-item-label">电视剧</span>
              </NavLink>

              <NavLink
                to="/other"
                className={`sidebar-item ${isActive('/other') ? 'active' : ''}`}
              >
                <LayoutGrid className="sidebar-item-icon" />
                <span className="sidebar-item-label">其他</span>
              </NavLink>
            </>
          )}
        </div>

        <div className="sidebar-divider" />

        {/* 文件源分组 - 动态数据驱动 */}
        <div className="sidebar-group">
          <div
            className={`sidebar-group-header ${isActive('/sources') ? 'active' : ''}`}
            onClick={() => navigate('/sources')}
          >
            <span className="sidebar-group-title">文件源</span>
            <div
              className="sidebar-group-arrow-wrapper"
              onClick={(e) => {
                e.stopPropagation()
                toggleGroup('sources')
              }}
            >
              <ChevronDown
                className={`sidebar-group-arrow ${!expandedGroups.sources ? 'collapsed' : ''}`}
              />
            </div>
          </div>

          {expandedGroups.sources && (
            <>
              {fileSources.length === 0 ? (
                <NavLink
                  to="/sources"
                  className={`sidebar-item ${isActive('/sources') && location.pathname === '/sources' ? 'active' : ''}`}
                >
                  <FolderOpen className="sidebar-item-icon" />
                  <span className="sidebar-item-label" style={{ opacity: 0.5, fontStyle: 'italic' }}>
                    添加文件源...
                  </span>
                </NavLink>
              ) : (
                fileSources.map(source => (
                  <NavLink
                    key={source.id}
                    to={source.storageType === 'aliyundrive'
                      ? `/sources/aliyun?folderId=${source.path}&name=${encodeURIComponent(source.name)}`
                      : `/sources/local?path=${encodeURIComponent(source.path)}`
                    }
                    className="sidebar-item"
                  >
                    {source.storageType === 'aliyundrive'
                      ? <Cloud className="sidebar-item-icon" />
                      : <HardDrive className="sidebar-item-icon" />
                    }
                    <span className="sidebar-item-label">{source.name}</span>
                  </NavLink>
                ))
              )}
            </>
          )}
        </div>

        <div className="sidebar-divider" />

        {/* 设置 */}
        <NavLink
          to="/settings"
          className={`sidebar-item ${isActive('/settings') ? 'active' : ''}`}
        >
          <Settings className="sidebar-item-icon" />
          <span className="sidebar-item-label">设置</span>
        </NavLink>
      </nav>

      {/* 底部版本 */}
      <div className="sidebar-footer">
        <div className="sidebar-version">Octov v1.0.0</div>
      </div>
    </aside>
  )
}
