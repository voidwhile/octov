import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Home from './pages/Home'
import Movies from './pages/Movies'
import TVShows from './pages/TVShows'
import Detail from './pages/Detail'
import Player from './pages/Player'
import Settings from './pages/Settings'
import SearchPage from './pages/Search'
import AliyunDrivePage from './pages/AliyunDrive'
import FileSources from './pages/FileSources'
import LocalFilesPage from './pages/LocalFiles'
import MusicPage from './pages/Music'
import MusicPlayer from './pages/MusicPlayer'
import { useTheme } from './hooks/useTheme'
import './App.css'

/** 页面标题映射 */
const PAGE_TITLES: Record<string, string> = {
  '/': '媒体库',
  '/recent': '最近添加',
  '/movies': '电影',
  '/tvshows': '电视剧',
  '/other': '其他',
  '/music': '音乐',
  '/sources': '文件源',
  '/sources/local': '本地文件',
  '/sources/aliyun': '阿里云盘',
  '/settings': '设置',
  '/search': '搜索'
}

/** 获取当前页面标题 */
function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/detail/')) return '详情'
  if (pathname.startsWith('/search')) return '搜索结果'
  if (pathname.startsWith('/music/format/')) {
    const fmt = pathname.split('/').pop()?.toUpperCase() || ''
    return `音乐 · ${fmt === 'OTHER' ? '其他格式' : fmt}`
  }
  return PAGE_TITLES[pathname] || '媒体库'
}

/** 主布局 - 包含侧边栏和内容区 */
function MainLayout(): JSX.Element {
  const location = useLocation()
  const { theme, setTheme, isDark } = useTheme()

  // 播放器页面由根 Routes 处理，不会走到这里
  // 安全守卫：万一路由异常，返回空白而非破损布局
  if (location.pathname.startsWith('/player/')) {
    return <></> 
  }

  const pageTitle = getPageTitle(location.pathname)

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Header
          title={pageTitle}
          isDark={isDark}
          onToggleTheme={() => setTheme(isDark ? 'light' : 'dark')}
        />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/recent" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/tvshows" element={<TVShows />} />
            <Route path="/detail/:id" element={<Detail />} />
            <Route path="/settings" element={<Settings theme={theme} onThemeChange={setTheme} />} />
            <Route path="/search" element={<SearchPage />} />
            {/* 其他预留路由 */}
            <Route path="/other" element={<div className="media-row-empty" style={{height: '300px'}}>功能开发中...</div>} />
            <Route path="/music" element={<MusicPage />} />
            <Route path="/music/format/:format" element={<MusicPage />} />
            <Route path="/sources" element={<FileSources />} />
            <Route path="/sources/local" element={<LocalFilesPage />} />
            <Route path="/sources/aliyun" element={<AliyunDrivePage />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

/** 根组件 */
export default function App(): JSX.Element {
  return (
    <Router>
      <Routes>
        <Route path="/player/cloud/:fileId" element={<Player />} />
        <Route path="/player/:id" element={<Player />} />
        <Route path="/music-player/:id" element={<MusicPlayer />} />
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </Router>
  )
}
