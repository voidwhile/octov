import { useState } from 'react'
import { ThemeMode } from '../types'

/**
 * 主题切换 Hook
 * 支持三种模式：跟随系统、浅色、深色
 */
export function useTheme(): {
  theme: ThemeMode
  setTheme: (mode: ThemeMode) => void
  isDark: boolean
} {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('octov-theme') as ThemeMode | null
    return saved || 'system'
  })

  const getSystemDark = (): boolean => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  const isDark = theme === 'dark' || (theme === 'system' && getSystemDark())

  // 应用主题到 DOM
  const applyTheme = (mode: ThemeMode): void => {
    const dark = mode === 'dark' || (mode === 'system' && getSystemDark())
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }

  const setTheme = (mode: ThemeMode): void => {
    setThemeState(mode)
    localStorage.setItem('octov-theme', mode)
    applyTheme(mode)
  }

  // 初始化时应用主题
  applyTheme(theme)

  return { theme, setTheme, isDark }
}
