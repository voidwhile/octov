# Octov

> 跨平台视频库播放器，支持阿里云盘视频管理与播放。

---

## ✨ 功能特性

- **📁 文件源管理** — 连接阿里云盘，选择文件夹作为视频源
- **🔍 智能分类** — 自动扫描视频文件，识别电影与电视剧
- **🎬 TMDB 元数据** — 自动获取海报、评分、简介、类型标签
- **📺 媒体库展示** — 精美的海报墙，支持继续观看、最近添加
- **▶️ 流畅播放** — HLS 流媒体播放，支持上一集/下一集、倍速
- **💬 在线字幕** — 自动搜索并加载匹配字幕
- **🔄 播放记录** — 自动保存进度，支持断点续播
- **🌙 深色模式** — 浅色/深色/跟随系统主题切换

## 🖥️ 截图

（待补充）

## 📦 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Electron 39 + electron-vite |
| 前端 | React 19 + TypeScript 5 |
| 构建 | Vite 7 |
| 播放 | hls.js |
| API | TMDB v3 · OpenSubtitles · 阿里云盘 Open API |

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建

```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

## ⚙️ 配置

### TMDB API Key

用于获取视频元数据（海报、评分、简介）。

1. 注册 [TMDB 账号](https://www.themoviedb.org/signup)
2. 进入 [API 设置](https://www.themoviedb.org/settings/api)
3. 申请 Developer API Key
4. 在应用「设置」页面填入 API Key

### 阿里云盘 App 配置

使用阿里云盘功能前，需要先在开放平台创建应用：

1. 注册并登录 [阿里云盘开放平台](https://open.alipan.com)
2. 创建应用，获取 `client_id` 和 `client_secret`
3. 复制 `.env.example` 为 `.env`，填入你的凭据：
   ```bash
   cp .env.example .env
   ```
   ```env
   MAIN_VITE_ALIYUN_CLIENT_ID=你的client_id
   MAIN_VITE_ALIYUN_CLIENT_SECRET=你的client_secret
   ```
4. 在应用侧边栏点击文件源，扫码授权登录
5. 添加文件夹为文件源

### OpenSubtitles API Key（可选）

用于在线搜索和下载字幕。

1. 注册 [OpenSubtitles 账号](https://www.opensubtitles.com)
2. 在 [API Consumers](https://www.opensubtitles.com/consumers) 页面创建应用
3. 获取 API Key
4. 在应用「设置」页面填入 API Key

## 📂 项目结构

```
src/
├── main/                    # Electron 主进程
│   ├── index.ts             # 主入口 + IPC 处理
│   ├── aliyundrive.ts       # 阿里云盘客户端
│   ├── tmdb.ts              # TMDB 元数据刮削
│   ├── scanner.ts           # 媒体扫描引擎
│   ├── storage.ts           # 文件源持久化
│   └── subtitle.ts          # 字幕客户端
├── preload/                 # 预加载脚本
│   └── index.ts             # IPC 桥接
└── renderer/                # React 渲染进程
    └── src/
        ├── App.tsx           # 根组件 + 路由
        ├── components/       # 通用组件
        │   ├── Sidebar.tsx   # 侧边栏导航
        │   ├── Header.tsx    # 顶部栏（搜索/刷新/主题）
        │   ├── MediaCard.tsx # 视频卡片
        │   └── MediaRow.tsx  # 横向滚动行
        ├── pages/            # 页面
        │   ├── Home.tsx      # 首页（继续观看/最近添加）
        │   ├── Movies.tsx    # 电影列表
        │   ├── TVShows.tsx   # 电视剧列表
        │   ├── Detail.tsx    # 视频详情
        │   ├── Player.tsx    # 视频播放器
        │   ├── AliyunDrive.tsx  # 阿里云盘文件浏览器
        │   ├── FileSources.tsx  # 文件源管理
        │   └── Settings.tsx  # 设置页面
        ├── data/             # 数据层
        │   ├── mediaLibrary.ts  # 媒体库管理
        │   └── playHistory.ts   # 播放记录管理
        ├── hooks/            # 自定义 Hooks
        └── types/            # TypeScript 类型定义
```

## 📄 本地数据

应用数据存储在 `userData` 目录下：

| 文件 | 说明 |
|------|------|
| `aliyundrive-config.json` | 阿里云盘授权 token |
| `file-sources.json` | 已添加的文件源 |
| `media-cache.json` | 媒体库扫描缓存 |
| `play-history.json` | 播放记录 |
| `app-settings.json` | 应用设置（TMDB Key） |
| `tmdb-cache.json` | TMDB 元数据缓存 |

## 📋 文档

- [产品需求文档 (PRD)](docs/PRD.md)

## 📝 License

Apache-2.0
