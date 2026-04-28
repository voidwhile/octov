import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor, Palette, Key, Check, MessageSquare } from 'lucide-react'
import { ThemeMode } from '../types'
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

  /** 主题选项 */
  const themeOptions: { value: ThemeMode; label: string; icon: JSX.Element }[] = [
    { value: 'system', label: '跟随系统', icon: <Monitor size={14} /> },
    { value: 'light', label: '浅色', icon: <Sun size={14} /> },
    { value: 'dark', label: '深色', icon: <Moon size={14} /> }
  ]

  // 加载已保存的 API Keys
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

      {/* 关于 */}
      <section className="settings-section">
        <h3 className="settings-section-title">关于</h3>
        <div className="settings-group">
          <div className="settings-about">
            <img className="settings-about-logo" src={octovLogo} alt="Octov" />
            <div className="settings-about-name">Octov</div>
            <div className="settings-about-version">版本 1.0.0</div>
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
