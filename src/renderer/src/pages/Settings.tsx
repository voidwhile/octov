import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor, Palette, Key, Check, MessageSquare, HardDrive, Cloud, LogOut, User } from 'lucide-react'
import { ThemeMode } from '../types'
import { useAliyunDrive } from '../hooks/useAliyunDrive'
import './Settings.css'
import octovLogo from '../../../../resources/octov-logo.png'

interface SettingsProps {
  theme: ThemeMode
  onThemeChange: (mode: ThemeMode) => void
}

/** 设置页面 */
export default function Settings({ theme, onThemeChange }: SettingsProps): JSX.Element {
  const [tmdbKey, setTmdbKey] = useState('')
  const [tmdbSaved, setTmdbSaved] = useState(false)
  const [tmdbLoading, setTmdbLoading] = useState(true)

  const [subtitleKey, setSubtitleKey] = useState('')
  const [subtitleSaved, setSubtitleSaved] = useState(false)
  const [subtitleLoading, setSubtitleLoading] = useState(true)
  const [version, setVersion] = useState('')
  
  const [cacheSize, setCacheSize] = useState<number | null>(null)
  const [isClearingCache, setIsClearingCache] = useState(false)

  // 阿里云盘账号状态
  const drive = useAliyunDrive()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  /** 解除云盘授权 */
  const handleDriveLogout = async () => {
    setIsLoggingOut(true)
    try {
      await drive.logout()
    } finally {
      setIsLoggingOut(false)
    }
  }

  /** 加载版本号 */
  useEffect(() => {
    // @ts-ignore
    window.api.getVersion().then(setVersion)
  }, [])

  /** 主题选项 */
  const themeOptions: { value: ThemeMode; label: string; icon: JSX.Element }[] = [
    { value: 'system', label: '跟随系统', icon: <Monitor size={14} /> },
    { value: 'light', label: '浅色', icon: <Sun size={14} /> },
    { value: 'dark', label: '深色', icon: <Moon size={14} /> }
  ]

  // 加载已保存的 API Keys 和缓存大小
  useEffect(() => {
    window.appConfig.getTmdbKey().then((result) => {
      if (result.success && result.data) {
        setTmdbKey(result.data)
      }
      setTmdbLoading(false)
    })
    window.appConfig.getSubtitleKey().then((result) => {
      if (result.success && result.data) {
        setSubtitleKey(result.data)
      }
      setSubtitleLoading(false)
    })
    window.cache.getSize().then((result) => {
      if (result.success && result.size !== undefined) {
        setCacheSize(result.size)
      }
    })
  }, [])

  /** 保存 TMDB API Key */
  const saveTmdbKey = async (): Promise<void> => {
    const result = await window.appConfig.setTmdbKey(tmdbKey.trim())
    if (result.success) {
      setTmdbSaved(true)
      setTimeout(() => setTmdbSaved(false), 2000)
    }
  }

  /** 保存 OpenSubtitles API Key */
  const saveSubtitleKey = async (): Promise<void> => {
    const result = await window.appConfig.setSubtitleKey(subtitleKey.trim())
    if (result.success) {
      setSubtitleSaved(true)
      setTimeout(() => setSubtitleSaved(false), 2000)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleClearCache = async () => {
    setIsClearingCache(true)
    const res = await window.cache.clear()
    if (res.success) {
      setCacheSize(0)
    }
    setIsClearingCache(false)
  }

  return (
    <div className="settings-page">
      {/* 外观设置 */}
      <section className="settings-section">
        <h3 className="settings-section-title">外观</h3>
        <div className="settings-group">
          <div className="settings-item">
            <div className="settings-item-left">
              <div className="settings-item-icon">
                <Palette size={18} />
              </div>
              <div className="settings-item-info">
                <span className="settings-item-label">主题</span>
                <span className="settings-item-desc">选择应用的外观主题</span>
              </div>
            </div>
            <div className="settings-theme-options">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`settings-theme-option ${theme === opt.value ? 'active' : ''}`}
                  onClick={() => onThemeChange(opt.value)}
                >
                  {opt.icon}
                  <span style={{ marginLeft: 4 }}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 元数据设置 */}
      <section className="settings-section">
        <h3 className="settings-section-title">元数据</h3>
        <div className="settings-group">
          <div className="settings-item settings-item-column">
            <div className="settings-item-left">
              <div className="settings-item-icon" style={{
                background: 'linear-gradient(135deg, #01B4E4, #0D253F)',
                color: 'white'
              }}>
                <Key size={18} />
              </div>
              <div className="settings-item-info">
                <span className="settings-item-label">TMDB API Key</span>
                <span className="settings-item-desc">
                  用于获取视频的海报、评分、简介等元数据。
                  <a
                    href="https://www.themoviedb.org/settings/api"
                    target="_blank"
                    rel="noreferrer"
                    className="settings-link"
                    onClick={(e) => {
                      e.preventDefault()
                      window.electron.openExternal('https://www.themoviedb.org/settings/api')
                    }}
                  >
                    获取 API Key →
                  </a>
                </span>
              </div>
            </div>
            <div className="settings-tmdb-input">
              <input
                type="text"
                className="settings-input"
                placeholder={tmdbLoading ? '加载中...' : '请输入 TMDB API Key (v3)'}
                value={tmdbKey}
                onChange={(e) => {
                  setTmdbKey(e.target.value)
                  setTmdbSaved(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveTmdbKey()
                }}
                disabled={tmdbLoading}
              />
              <button
                className={`settings-save-btn ${tmdbSaved ? 'saved' : ''}`}
                onClick={saveTmdbKey}
                disabled={tmdbLoading || tmdbSaved}
              >
                {tmdbSaved ? <><Check size={14} /> 已保存</> : '保存'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 字幕设置 */}
      <section className="settings-section">
        <h3 className="settings-section-title">字幕</h3>
        <div className="settings-group">
          <div className="settings-item settings-item-column">
            <div className="settings-item-left">
              <div className="settings-item-icon" style={{
                background: 'linear-gradient(135deg, #2DB87F, #1A6B4B)',
                color: 'white'
              }}>
                <MessageSquare size={18} />
              </div>
              <div className="settings-item-info">
                <span className="settings-item-label">OpenSubtitles API Key</span>
                <span className="settings-item-desc">
                  用于在线搜索和下载字幕。
                  <a
                    href="https://www.opensubtitles.com/consumers"
                    target="_blank"
                    rel="noreferrer"
                    className="settings-link"
                    onClick={(e) => {
                      e.preventDefault()
                      window.electron.openExternal('https://www.opensubtitles.com/consumers')
                    }}
                  >
                    获取 API Key →
                  </a>
                </span>
              </div>
            </div>
            <div className="settings-tmdb-input">
              <input
                type="text"
                className="settings-input"
                placeholder={subtitleLoading ? '加载中...' : '请输入 OpenSubtitles API Key'}
                value={subtitleKey}
                onChange={(e) => {
                  setSubtitleKey(e.target.value)
                  setSubtitleSaved(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveSubtitleKey()
                }}
                disabled={subtitleLoading}
              />
              <button
                className={`settings-save-btn ${subtitleSaved ? 'saved' : ''}`}
                onClick={saveSubtitleKey}
                disabled={subtitleLoading || subtitleSaved}
              >
                {subtitleSaved ? <><Check size={14} /> 已保存</> : '保存'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 阿里云盘账号 */}
      <section className="settings-section">
        <h3 className="settings-section-title">阿里云盘</h3>
        <div className="settings-group">
          <div className="settings-item">
            <div className="settings-item-left">
              <div className="settings-item-icon" style={{
                background: drive.status.isLoggedIn
                  ? 'linear-gradient(135deg, #FF6A00, #EE0979)'
                  : 'var(--color-bg-tertiary)',
                color: drive.status.isLoggedIn ? 'white' : 'var(--color-text-secondary)'
              }}>
                {drive.status.userInfo?.avatar ? (
                  <img
                    src={drive.status.userInfo.avatar}
                    alt=""
                    style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : drive.status.isLoggedIn ? (
                  <User size={18} />
                ) : (
                  <Cloud size={18} />
                )}
              </div>
              <div className="settings-item-info">
                <span className="settings-item-label">
                  {drive.status.isLoggedIn
                    ? (drive.status.userInfo?.user_name || '阿里云盘用户')
                    : '未连接'}
                </span>
                <span className="settings-item-desc">
                  {drive.status.isLoggedIn
                    ? '已授权，可在云盘页面浏览和播放视频'
                    : '前往「云盘」页面扫码授权'}
                </span>
              </div>
            </div>
            {drive.status.isLoggedIn && (
              <button
                className="settings-drive-logout-btn"
                onClick={handleDriveLogout}
                disabled={isLoggingOut}
              >
                <LogOut size={14} />
                {isLoggingOut ? '退出中...' : '解除授权'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 存储管理 */}
      <section className="settings-section">
        <h3 className="settings-section-title">存储</h3>
        <div className="settings-group">
          <div className="settings-item settings-item-column">
            <div className="settings-item-left">
              <div className="settings-item-icon" style={{
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: 'white'
              }}>
                <HardDrive size={18} />
              </div>
              <div className="settings-item-info">
                <span className="settings-item-label">应用缓存</span>
                <span className="settings-item-desc">
                  清理视频缓冲、图片缓存以及音频临时文件。这不会影响您的播放记录或配置。
                </span>
              </div>
            </div>
            <div className="settings-tmdb-input" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', paddingLeft: 12 }}>
                当前占用：{cacheSize !== null ? formatSize(cacheSize) : '加载中...'}
              </span>
              <button
                className="settings-save-btn"
                onClick={handleClearCache}
                disabled={isClearingCache || cacheSize === 0 || cacheSize === null}
                style={{ width: 'auto', padding: '0 16px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
              >
                {isClearingCache ? '清理中...' : '清空缓存'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 关于 */}
      <section className="settings-section">
        <h3 className="settings-section-title">关于</h3>
        <div className="settings-group">
          <div className="settings-about">
            <img className="settings-about-logo" src={octovLogo} alt="Octov" />
            <div className="settings-about-name">Octov</div>
            <div className="settings-about-version">版本 {version || '...'}</div>
            <div className="settings-about-desc">
              跨平台视频库播放器。支持本地文件和阿里云盘，
              <br />
              自动获取影视元数据，提供精美的媒体库管理体验。
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
