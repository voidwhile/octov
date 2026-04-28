// ============================================
// Octov - 存储管理服务
// 管理存储账户和文件源
// ============================================

import * as path from 'path'
import * as fs from 'fs'
import { app } from 'electron'

// ---- 类型定义 ----

/** 存储账户 */
export interface StorageAccount {
  id: string
  /** 存储类型 */
  type: 'local' | 'aliyundrive'
  /** 显示名称 */
  name: string
  /** 创建时间 */
  createdAt: string
  /** 阿里云盘用户信息 */
  userInfo?: {
    userId: string
    userName: string
    avatar?: string
  }
}

/** 文件源 */
export interface FileSourceItem {
  id: string
  /** 文件源名称 */
  name: string
  /** 所属存储账户 ID */
  storageId: string
  /** 存储类型 */
  storageType: 'local' | 'aliyundrive'
  /** 存储账户显示名 */
  storageName: string
  /** 文件夹路径（本地）或文件夹 ID（云盘） */
  path: string
  /** 创建时间 */
  createdAt: string
}

// ---- 持久化 ----

function getStoragePath(): string {
  return path.join(app.getPath('userData'), 'storages.json')
}

function getSourcesPath(): string {
  return path.join(app.getPath('userData'), 'file-sources.json')
}

function readStorages(): StorageAccount[] {
  try {
    const data = fs.readFileSync(getStoragePath(), 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

function saveStorages(storages: StorageAccount[]): void {
  fs.writeFileSync(getStoragePath(), JSON.stringify(storages, null, 2))
}

function readSources(): FileSourceItem[] {
  try {
    const data = fs.readFileSync(getSourcesPath(), 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

function saveSources(sources: FileSourceItem[]): void {
  fs.writeFileSync(getSourcesPath(), JSON.stringify(sources, null, 2))
}

// ---- 存储管理类 ----

export class StorageManager {
  private storages: StorageAccount[]
  private sources: FileSourceItem[]

  constructor() {
    this.storages = readStorages()
    this.sources = readSources()
  }

  /** 生成唯一 ID */
  private genId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  }

  // ---- 存储账户 CRUD ----

  /** 获取所有存储账户 */
  getStorages(): StorageAccount[] {
    return this.storages
  }

  /** 添加存储账户 */
  addStorage(account: Omit<StorageAccount, 'id' | 'createdAt'>): StorageAccount {
    const storage: StorageAccount = {
      ...account,
      id: this.genId(),
      createdAt: new Date().toISOString()
    }
    this.storages.push(storage)
    saveStorages(this.storages)
    return storage
  }

  /** 更新存储账户名称 */
  updateStorage(id: string, name: string): boolean {
    const storage = this.storages.find(s => s.id === id)
    if (!storage) return false
    storage.name = name
    saveStorages(this.storages)
    return true
  }

  /** 删除存储账户（同时删除其下所有文件源） */
  deleteStorage(id: string): boolean {
    const idx = this.storages.findIndex(s => s.id === id)
    if (idx === -1) return false
    this.storages.splice(idx, 1)
    this.sources = this.sources.filter(s => s.storageId !== id)
    saveStorages(this.storages)
    saveSources(this.sources)
    return true
  }

  /** 根据类型查找存储 */
  getStorageByType(type: string): StorageAccount | undefined {
    return this.storages.find(s => s.type === type)
  }

  // ---- 文件源 CRUD ----

  /** 获取所有文件源 */
  getSources(): FileSourceItem[] {
    return this.sources
  }

  /** 添加文件源 */
  addSource(source: Omit<FileSourceItem, 'id' | 'createdAt'>): FileSourceItem {
    const item: FileSourceItem = {
      ...source,
      id: this.genId(),
      createdAt: new Date().toISOString()
    }
    this.sources.push(item)
    saveSources(this.sources)
    return item
  }

  /** 删除文件源 */
  deleteSource(id: string): boolean {
    const idx = this.sources.findIndex(s => s.id === id)
    if (idx === -1) return false
    this.sources.splice(idx, 1)
    saveSources(this.sources)
    return true
  }

  /** 更新文件源名称 */
  updateSource(id: string, name: string): boolean {
    const source = this.sources.find(s => s.id === id)
    if (!source) return false
    source.name = name
    saveSources(this.sources)
    return true
  }
}
