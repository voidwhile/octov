import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, RefreshCw, Sun, Moon } from 'lucide-react'
import './Header.css'

interface HeaderProps {
  title: string
  isDark: boolean
  onToggleTheme: () => void
}

/** 顶部栏组件 */
export default function Header({ title, isDark, onToggleTheme }: HeaderProps): JSX.Element {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  /** 刷新媒体库：重新扫描文件源并获取视频元数据 */
  const handleRefresh = (): void => {
    if (isRefreshing) return
    setIsRefreshing(true)
    // 强制重新扫描所有文件源（包括 TMDB 元数据刮削）
    import('../data/mediaLibrary').then(({ scanAllSources }) => {
      scanAllSources(true).finally(() => setIsRefreshing(false))
    })
  }

  /** 搜索提交 */
  const handleSearchSubmit = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`)
    }
  }

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
        <button
          className={`header-refresh ${isRefreshing ? 'spinning' : ''}`}
          onClick={handleRefresh}
          title="刷新"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="header-right">
        <div className="header-search">
          <Search className="header-search-icon" />
          <input
            className="header-search-input"
            type="text"
            placeholder="搜索..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchSubmit}
          />
        </div>

        <button className="header-theme-btn" onClick={onToggleTheme} title="切换主题">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
}
