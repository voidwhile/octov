import { useState, useEffect, useCallback, useRef } from 'react'
import { AliyunDriveFile, AliyunDriveStatus } from '../types'

/** 扫码状态 */
export type QrCodeState =
  | 'idle'          // 初始状态
  | 'loading'       // 正在获取二维码
  | 'waiting'       // 等待扫码
  | 'scanned'       // 已扫码，等待确认
  | 'success'       // 授权成功
  | 'expired'       // 二维码已过期
  | 'error'         // 出错

/** 阿里云盘状态和操作 Hook */
export function useAliyunDrive() {
  const [status, setStatus] = useState<AliyunDriveStatus>({
    isLoggedIn: false,
    clientId: '',
    userInfo: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 扫码相关状态
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [qrState, setQrState] = useState<QrCodeState>('idle')
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /** 刷新状态 */
  const refreshStatus = useCallback(async () => {
    try {
      if (typeof window.aliyunDrive === 'undefined') {
        setLoading(false)
        return
      }
      const s = await window.aliyunDrive.getStatus()
      setStatus(s)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // 初始化
  useEffect(() => {
    refreshStatus()
  }, [refreshStatus])

  // 组件卸载时停止轮询
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [])

  /** 停止轮询 */
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  /** 开始扫码登录 */
  const startQrLogin = useCallback(async () => {
    setQrState('loading')
    setError(null)
    stopPolling()

    try {
      // 1. 获取二维码
      const qrResult = await window.aliyunDrive.getQrCode()
      if (!qrResult.success) {
        throw new Error(qrResult.error || '获取二维码失败')
      }

      setQrCodeUrl(qrResult.data!.qrCodeUrl)
      setQrState('waiting')

      const sid = qrResult.data!.sid

      // 2. 开始轮询扫码状态（每 2 秒一次）
      pollingRef.current = setInterval(async () => {
        try {
          const pollResult = await window.aliyunDrive.pollQrCodeStatus(sid)
          if (!pollResult.success) return

          const { status: pollStatus, authCode } = pollResult.data!

          if (pollStatus === 'ScanSuccess') {
            setQrState('scanned')
          } else if (pollStatus === 'LoginSuccess' && authCode) {
            // 3. 扫码成功，换取 token
            stopPolling()
            setQrState('success')

            const authResult = await window.aliyunDrive.completeAuth(authCode)
            if (authResult.success) {
              await refreshStatus()
            } else {
              setError(authResult.error || '授权失败')
              setQrState('error')
            }
          } else if (pollStatus === 'QRCodeExpired') {
            stopPolling()
            setQrState('expired')
          }
        } catch (err: any) {
          console.error('轮询扫码状态错误:', err)
        }
      }, 2000)

    } catch (err: any) {
      setError(err.message)
      setQrState('error')
    }
  }, [refreshStatus, stopPolling])

  /** 设置 Client ID */
  const setClientId = useCallback(async (clientId: string) => {
    try {
      await window.aliyunDrive.setClientId(clientId)
      await refreshStatus()
    } catch (err: any) {
      setError(err.message)
    }
  }, [refreshStatus])

  /** 退出 */
  const logout = useCallback(async () => {
    stopPolling()
    try {
      await window.aliyunDrive.logout()
      setQrState('idle')
      setQrCodeUrl('')
      await refreshStatus()
    } catch (err: any) {
      setError(err.message)
    }
  }, [refreshStatus, stopPolling])

  /** 获取文件列表 */
  const listFiles = useCallback(async (
    parentFileId: string = 'root',
    options?: any
  ): Promise<{ items: AliyunDriveFile[]; next_marker: string }> => {
    const result = await window.aliyunDrive.listFiles(parentFileId, options)
    if (!result.success) throw new Error(result.error)
    return result.data!
  }, [])

  /** 获取视频文件列表 */
  const listVideoFiles = useCallback(async (
    parentFileId: string = 'root',
    marker?: string
  ): Promise<{ items: AliyunDriveFile[]; next_marker: string }> => {
    const result = await window.aliyunDrive.listVideoFiles(parentFileId, marker)
    if (!result.success) throw new Error(result.error)
    return result.data!
  }, [])

  /** 搜索文件 */
  const searchFiles = useCallback(async (
    query: string,
    options?: any
  ): Promise<{ items: AliyunDriveFile[]; next_marker: string }> => {
    const result = await window.aliyunDrive.searchFiles(query, options)
    if (!result.success) throw new Error(result.error)
    return result.data!
  }, [])

  /** 获取视频播放信息 */
  const getVideoPlayInfo = useCallback(async (fileId: string) => {
    const result = await window.aliyunDrive.getVideoPlayInfo(fileId)
    if (!result.success) throw new Error(result.error)
    return result.data!
  }, [])

  /** 获取下载地址 */
  const getDownloadUrl = useCallback(async (fileId: string) => {
    const result = await window.aliyunDrive.getDownloadUrl(fileId)
    if (!result.success) throw new Error(result.error)
    return result.data!
  }, [])

  /** 更新播放进度 */
  const updatePlayCursor = useCallback(async (fileId: string, playCursor: number) => {
    await window.aliyunDrive.updatePlayCursor(fileId, playCursor)
  }, [])

  return {
    status,
    loading,
    error,
    // 扫码相关
    qrCodeUrl,
    qrState,
    startQrLogin,
    // 操作
    isAvailable: typeof window.aliyunDrive !== 'undefined',
    refreshStatus,
    setClientId,
    logout,
    // 文件 API
    listFiles,
    listVideoFiles,
    searchFiles,
    getVideoPlayInfo,
    getDownloadUrl,
    updatePlayCursor
  }
}
