import { ConfigurationConstant } from '@kit.AbilityKit'
import common from '@ohos.app.ability.common'
import {
  AliyunDriveStatus,
  AliyunQrSession,
  AppSettings,
  EpisodeItem,
  FileSourceItem,
  MediaItem,
  NavigationSection,
  OctovSnapshot,
  PlaybackQualityItem,
  PlaybackSession,
  SeasonItem,
  SectionId,
  SourceBrowserEntry,
  SourceBrowserFilter,
  SourceBrowserSnapshot,
  SourceBrowserViewMode,
  SourceBreadcrumbItem,
  StorageAccount
} from '../models/OctovModels'
import { OctovRepository } from '../services/OctovServices'

const sections: NavigationSection[] = [
  { id: 'home', title: '首页', subtitle: '继续观看与推荐内容' },
  { id: 'recent', title: '最近新增', subtitle: '刚刚加入媒体库的内容' },
  { id: 'movies', title: '电影', subtitle: '电影海报流与详情页' },
  { id: 'tvshows', title: '剧集', subtitle: '季与分集结构' },
  { id: 'music', title: '音乐', subtitle: '音乐入口与播放占位' },
  { id: 'sources', title: '媒体源', subtitle: '本地目录与阿里云盘' },
  { id: 'settings', title: '设置', subtitle: '主题与服务配置' }
]

const repository: OctovRepository = OctovRepository.shared()

@Entry
@Component
struct Index {
  @State currentSection: SectionId = 'home'
  @State selectedMedia: MediaItem | undefined = undefined
  @State library: MediaItem[] = []
  @State continueWatching: MediaItem[] = []
  @State recentlyAdded: MediaItem[] = []
  @State storages: StorageAccount[] = []
  @State sources: FileSourceItem[] = []
  @State activeSourceId: string = ''
  @State sourceManagementView: 'overview' | 'aliyun-auth' = 'overview'
  @State sourceBrowserEntries: SourceBrowserEntry[] = []
  @State sourceBrowserName: string = ''
  @State sourceBrowserStorageType: 'local' | 'aliyundrive' = 'local'
  @State sourceBrowserCurrentFolderId: string = ''
  @State sourceBreadcrumbs: SourceBreadcrumbItem[] = []
  @State sourceBrowserFilter: SourceBrowserFilter = 'all'
  @State sourceBrowserViewMode: SourceBrowserViewMode = 'list'
  @State sourceBrowserNextMarker: string = ''
  @State sourceBrowserSearchQuery: string = ''
  @State settings: AppSettings = repository.getSettings()
  @State aliyunStatus: AliyunDriveStatus = repository.getAliyunStatus()
  @State aliyunQrSession: AliyunQrSession = repository.getAliyunQrSession()
  @State playback: PlaybackSession = {
    title: '尚未开始播放',
    subtitle: '请选择一个媒体项',
    sourceLabel: 'Mock Player',
    status: 'idle',
    progress: 0,
    currentTime: 0,
    duration: 0,
    availableQualities: [],
    playlist: [],
    playlistIndex: -1,
    message: '等待接入 HarmonyOS AVPlayer。'
  }
  @State keyword: string = ''
  @State subtitleResults: string = ''
  @State statusMessage: string = '准备就绪'
  private horizontalScroller: Scroller = new Scroller()
  private aliyunPollingTimer: number = -1
  private aliyunPollingInFlight: boolean = false

  aboutToAppear(): void {
    this.refreshSnapshot()
  }

  aboutToDisappear(): void {
    this.stopAliyunPolling()
  }

  private async refreshSnapshot(): Promise<void> {
    this.applySnapshot(await repository.bootstrap())
  }

  private applySnapshot(snapshot: OctovSnapshot): void {
    this.library = snapshot.library
    this.continueWatching = snapshot.continueWatching
    this.recentlyAdded = snapshot.recentlyAdded
    this.storages = snapshot.storages
    this.sources = snapshot.sources
    this.settings = snapshot.settings
    this.aliyunStatus = snapshot.aliyunStatus
    this.aliyunQrSession = snapshot.aliyunQrSession
    this.playback = snapshot.playback
    this.applyThemeMode()
  }

  private applyThemeMode(): void {
    const hostContext = this.getUIContext().getHostContext() as common.UIAbilityContext
    if (hostContext === undefined) {
      return
    }
    try {
      if (this.settings.theme === 'dark') {
        hostContext.setColorMode(ConfigurationConstant.ColorMode.COLOR_MODE_DARK)
      } else if (this.settings.theme === 'light') {
        hostContext.setColorMode(ConfigurationConstant.ColorMode.COLOR_MODE_LIGHT)
      } else {
        hostContext.setColorMode(ConfigurationConstant.ColorMode.COLOR_MODE_NOT_SET)
      }
    } catch (_error) {
      this.statusMessage = '主题已保存，系统色彩模式将在支持的环境中生效。'
    }
  }

  private useDarkPalette(): boolean {
    if (this.settings.theme === 'dark') {
      return true
    }
    if (this.settings.theme === 'light') {
      return false
    }
    const hostContext = this.getUIContext().getHostContext() as common.UIAbilityContext
    if (hostContext !== undefined && hostContext.config.colorMode === ConfigurationConstant.ColorMode.COLOR_MODE_LIGHT) {
      return false
    }
    return true
  }

  private pageBackground(): string {
    return this.useDarkPalette() ? '#06111F' : '#F3F7FB'
  }

  private contentBackground(): string {
    return this.useDarkPalette() ? '#0A1628' : '#FFFFFF'
  }

  private sidebarBackground(): string {
    return this.useDarkPalette() ? '#08111D' : '#EAF0F8'
  }

  private cardBackground(): string {
    return this.useDarkPalette() ? '#111C2E' : '#F7FAFC'
  }

  private cardBackgroundStrong(): string {
    return this.useDarkPalette() ? '#0D1726' : '#EDF2F7'
  }

  private textPrimary(): string {
    return this.useDarkPalette() ? '#F8FAFC' : '#102136'
  }

  private textSecondary(): string {
    return this.useDarkPalette() ? '#94A3B8' : '#5B6B80'
  }

  private textMuted(): string {
    return this.useDarkPalette() ? '#64748B' : '#7B8798'
  }

  private accentBackground(): string {
    return '#2F6BFF'
  }

  private accentText(): string {
    return '#D6E4FF'
  }

  private successBackground(): string {
    return this.useDarkPalette() ? '#0F766E' : '#0F8A80'
  }

  private warningBackground(): string {
    return this.useDarkPalette() ? '#8A6116' : '#B88312'
  }

  private dangerBackground(): string {
    return this.useDarkPalette() ? '#7F1D1D' : '#B83232'
  }

  private playerBackground(): string {
    return this.useDarkPalette() ? '#091423' : '#E9F0F8'
  }

  private findCurrentSection(): NavigationSection {
    let index: number = 0
    while (index < sections.length) {
      if (sections[index].id === this.currentSection) {
        return sections[index]
      }
      index += 1
    }
    return sections[0]
  }

  private getSectionTitle(): string {
    return this.findCurrentSection().title
  }

  private getSectionSubtitle(): string {
    return this.findCurrentSection().subtitle
  }

  private visibleMedia(): MediaItem[] {
    let base: MediaItem[] = this.library
    if (this.currentSection === 'movies') {
      base = this.filterByType('movie')
    } else if (this.currentSection === 'tvshows') {
      base = this.filterByType('tvshow')
    } else if (this.currentSection === 'music') {
      base = this.filterByType('music')
    } else if (this.currentSection === 'recent') {
      base = this.recentlyAdded
    }

    const query: string = this.keyword.trim().toLowerCase()
    if (query.length === 0) {
      return base
    }

    const filtered: MediaItem[] = []
    let index: number = 0
    while (index < base.length) {
      const item: MediaItem = base[index]
      let matched: boolean = item.title.toLowerCase().includes(query)
      if (!matched && item.originalTitle !== undefined) {
        matched = item.originalTitle.toLowerCase().includes(query)
      }
      if (!matched) {
        matched = item.genres.join(' ').toLowerCase().includes(query)
      }
      if (matched) {
        filtered.push(item)
      }
      index += 1
    }
    return filtered
  }

  private filterByType(type: string): MediaItem[] {
    const filtered: MediaItem[] = []
    let index: number = 0
    while (index < this.library.length) {
      const item: MediaItem = this.library[index]
      if (item.type === type) {
        filtered.push(item)
      }
      index += 1
    }
    return filtered
  }

  private setTheme(theme: 'system' | 'light' | 'dark'): void {
    this.settings.theme = theme
  }

  private aliyunStateLabel(): string {
    if (this.aliyunQrSession.state === 'loading') {
      return '正在获取二维码'
    }
    if (this.aliyunQrSession.state === 'waiting') {
      return '等待扫码'
    }
    if (this.aliyunQrSession.state === 'scanned') {
      return '已扫码，等待手机确认'
    }
    if (this.aliyunQrSession.state === 'success') {
      return '授权成功'
    }
    if (this.aliyunQrSession.state === 'expired') {
      return '二维码已过期'
    }
    if (this.aliyunQrSession.state === 'error') {
      return '授权出错'
    }
    return '未开始'
  }

  private shouldContinueAliyunPolling(): boolean {
    return this.aliyunQrSession.state === 'waiting' || this.aliyunQrSession.state === 'scanned'
  }

  private stopAliyunPolling(): void {
    if (this.aliyunPollingTimer >= 0) {
      clearTimeout(this.aliyunPollingTimer)
      this.aliyunPollingTimer = -1
    }
  }

  private scheduleAliyunPolling(): void {
    if (!this.shouldContinueAliyunPolling()) {
      this.stopAliyunPolling()
      return
    }
    if (this.aliyunPollingTimer >= 0) {
      clearTimeout(this.aliyunPollingTimer)
    }
    this.aliyunPollingTimer = setTimeout(() => {
      this.pollAliyunQrCodeStatus(true)
    }, 2000)
  }

  private aliyunGuideText(): string {
    if (this.aliyunStatus.isLoggedIn) {
      return '阿里云盘已连接，后续会继续补齐文件浏览、扫描与播放链路。'
    }
    if (this.aliyunQrSession.state === 'scanned') {
      return '第 3 步：请在手机上的阿里云盘 App 中确认授权，应用会自动继续。'
    }
    if (this.aliyunQrSession.state === 'expired') {
      return '二维码已过期，请重新获取二维码。'
    }
    if (this.aliyunQrSession.state === 'error') {
      return '授权流程中断，请检查凭据后重新获取二维码。'
    }
    if (this.aliyunQrSession.qrCodeUrl.length > 0) {
      return '第 2 步：请使用阿里云盘 App 扫描二维码，页面会自动轮询授权结果。'
    }
    return '第 1 步：确认 client_id 和 client_secret 无误，然后点击“获取二维码”。'
  }

  private async rescanSources(): Promise<void> {
    this.statusMessage = '正在重新扫描媒体源...'
    this.applySnapshot(await repository.rescanSources())
    this.statusMessage = '媒体源扫描完成。'
  }

  private async addLocalSource(): Promise<void> {
    const payload = await repository.addLocalSourceFromPicker()
    this.applySnapshot(payload.snapshot)
    this.statusMessage = payload.result.message
  }

  private sourceEntries(): SourceBrowserEntry[] {
    const result: SourceBrowserEntry[] = []
    let index: number = 0
    const keyword: string = this.keyword.trim().toLowerCase()
    while (index < this.sourceBrowserEntries.length) {
      const entry: SourceBrowserEntry = this.sourceBrowserEntries[index]
      let accepted: boolean = this.sourceBrowserFilter === 'all'
      if (this.sourceBrowserFilter === 'folder') {
        accepted = entry.type === 'folder'
      } else if (this.sourceBrowserFilter === 'video') {
        accepted = entry.type === 'video'
      } else if (this.sourceBrowserFilter === 'music') {
        accepted = entry.type === 'audio'
      }
      if (accepted && keyword.length > 0) {
        accepted = entry.name.toLowerCase().includes(keyword)
      }
      if (accepted) {
        result.push(entry)
      }
      index += 1
    }
    return result
  }

  private async openSourceBrowser(source: FileSourceItem, folderId?: string): Promise<void> {
    const snapshot: SourceBrowserSnapshot = await repository.browseSource(source.id, folderId)
    this.activeSourceId = snapshot.sourceId
    this.sourceBrowserEntries = snapshot.entries
    this.sourceBrowserName = snapshot.sourceName
    this.sourceBrowserStorageType = snapshot.storageType
    this.sourceBrowserCurrentFolderId = snapshot.currentFolderId
    this.sourceBreadcrumbs = snapshot.breadcrumbs
    this.sourceBrowserFilter = 'all'
    this.sourceBrowserNextMarker = snapshot.nextMarker === undefined ? '' : snapshot.nextMarker
    this.sourceBrowserSearchQuery = ''
    this.statusMessage = '已打开文件源：' + snapshot.sourceName
  }

  private closeSourceBrowser(): void {
    this.activeSourceId = ''
    this.sourceBrowserEntries = []
    this.sourceBrowserName = ''
    this.sourceBrowserCurrentFolderId = ''
    this.sourceBreadcrumbs = []
    this.sourceBrowserFilter = 'all'
    this.sourceBrowserNextMarker = ''
    this.sourceBrowserSearchQuery = ''
    this.statusMessage = '已返回文件源概览。'
  }

  private async browseSourceFolder(entry: SourceBrowserEntry): Promise<void> {
    const source: FileSourceItem = this.findSourceById(entry.sourceId)
    await this.openSourceBrowser(source, entry.path)
  }

  private async loadMoreSourceBrowser(): Promise<void> {
    if (this.activeSourceId.length === 0 || this.sourceBrowserNextMarker.length === 0) {
      return
    }
    const snapshot: SourceBrowserSnapshot = await repository.loadMoreSource(
      this.activeSourceId,
      this.sourceBrowserCurrentFolderId,
      this.sourceBrowserNextMarker
    )
    this.sourceBrowserEntries = this.sourceBrowserEntries.concat(snapshot.entries)
    this.sourceBrowserNextMarker = snapshot.nextMarker === undefined ? '' : snapshot.nextMarker
    this.statusMessage = '已加载更多云盘文件。'
  }

  private async searchSourceBrowser(): Promise<void> {
    if (this.activeSourceId.length === 0) {
      return
    }
    const query: string = this.sourceBrowserSearchQuery.trim()
    if (query.length === 0) {
      const source: FileSourceItem = this.findSourceById(this.activeSourceId)
      await this.openSourceBrowser(source, this.sourceBrowserCurrentFolderId)
      return
    }
    const snapshot: SourceBrowserSnapshot = await repository.searchSource(this.activeSourceId, query)
    this.sourceBrowserEntries = snapshot.entries
    this.sourceBreadcrumbs = snapshot.breadcrumbs
    this.sourceBrowserCurrentFolderId = snapshot.currentFolderId
    this.sourceBrowserNextMarker = snapshot.nextMarker === undefined ? '' : snapshot.nextMarker
    this.statusMessage = '已搜索云盘文件：' + query
  }

  private async removeSource(source: FileSourceItem): Promise<void> {
    this.applySnapshot(repository.removeSource(source.id))
    if (this.activeSourceId === source.id) {
      this.closeSourceBrowser()
    }
    this.statusMessage = '已移除文件源：' + source.name
  }

  private findSourceById(sourceId: string): FileSourceItem {
    let index: number = 0
    while (index < this.sources.length) {
      if (this.sources[index].id === sourceId) {
        return this.sources[index]
      }
      index += 1
    }
    return this.sources[0]
  }

  private async openMedia(item: MediaItem): Promise<void> {
    this.applySnapshot(await repository.openMedia(item))
    this.statusMessage = '已为 ' + item.title + ' 打开播放会话。'
  }

  private async requestAliyunQrCode(): Promise<void> {
    this.stopAliyunPolling()
    this.statusMessage = '正在获取阿里云盘二维码...'
    this.applySnapshot(await repository.requestAliyunQrCode())
    this.statusMessage = this.aliyunQrSession.statusText
    if (this.shouldContinueAliyunPolling()) {
      this.scheduleAliyunPolling()
    }
  }

  private openAliyunAuthPage(): void {
    this.sourceManagementView = 'aliyun-auth'
    this.statusMessage = this.aliyunStatus.isLoggedIn ? '正在查看阿里云盘连接状态。' : '请按页面步骤完成阿里云盘授权。'
  }

  private closeAliyunAuthPage(): void {
    this.sourceManagementView = 'overview'
    this.statusMessage = '已返回媒体源概览。'
  }

  private saveAliyunCredentials(): void {
    this.stopAliyunPolling()
    this.applySnapshot(repository.updateAliyunCredentials(this.settings.aliyunClientId, this.settings.aliyunClientSecret))
    this.statusMessage = '阿里云盘凭据已更新。'
  }

  private async startAliyunAuthorization(): Promise<void> {
    this.saveAliyunCredentials()
    await this.requestAliyunQrCode()
  }

  private findFirstAliyunSource(): FileSourceItem | undefined {
    let index: number = 0
    while (index < this.sources.length) {
      if (this.sources[index].storageType === 'aliyundrive') {
        return this.sources[index]
      }
      index += 1
    }
    return undefined
  }

  private async openAliyunSourceRoot(): Promise<void> {
    const source: FileSourceItem | undefined = this.findFirstAliyunSource()
    if (source === undefined) {
      this.statusMessage = '当前还没有可浏览的阿里云盘媒体源。'
      this.currentSection = 'sources'
      this.sourceManagementView = 'overview'
      return
    }
    this.currentSection = 'sources'
    this.sourceManagementView = 'overview'
    await this.openSourceBrowser(source)
    this.statusMessage = '已打开阿里云盘媒体源。'
  }

  private async pollAliyunQrCodeStatus(fromPolling: boolean = false): Promise<void> {
    if (this.aliyunPollingInFlight) {
      return
    }
    this.aliyunPollingInFlight = true
    if (!fromPolling) {
      this.statusMessage = '正在检查阿里云盘扫码状态...'
    }
    try {
      this.applySnapshot(await repository.pollAliyunQrCodeStatus())
      this.statusMessage = this.aliyunQrSession.statusText
      if (this.shouldContinueAliyunPolling()) {
        this.scheduleAliyunPolling()
      } else {
        this.stopAliyunPolling()
      }
    } finally {
      this.aliyunPollingInFlight = false
    }
  }

  private async playCurrent(): Promise<void> {
    this.applySnapshot(await repository.playCurrentMedia())
  }

  private async pauseCurrent(): Promise<void> {
    this.applySnapshot(await repository.pauseCurrentMedia())
  }

  private async stopCurrent(): Promise<void> {
    this.applySnapshot(await repository.stopCurrentMedia())
  }

  private async seekCurrent(progress: number): Promise<void> {
    this.applySnapshot(await repository.seekCurrentMedia(progress))
  }

  private async playPreviousCloudItem(): Promise<void> {
    this.applySnapshot(await repository.playPreviousCloudItem())
  }

  private async playNextCloudItem(): Promise<void> {
    this.applySnapshot(await repository.playNextCloudItem())
  }

  private async selectPlaybackQuality(qualityId: string): Promise<void> {
    this.applySnapshot(await repository.selectPlaybackQuality(qualityId))
  }

  private async searchSubtitles(item: MediaItem): Promise<void> {
    this.statusMessage = '正在搜索字幕：' + item.title
    let season: number | undefined = undefined
    let episode: number | undefined = undefined
    if (item.seasons.length > 0) {
      season = item.seasons[0].seasonNumber
      if (item.seasons[0].episodes.length > 0) {
        episode = item.seasons[0].episodes[0].episode
      }
    }
    const results = await repository.searchSubtitles(item.title, item.tmdbId, season, episode)
    if (results.length === 0) {
      this.subtitleResults = '没有找到可用字幕。'
    } else {
      let content: string = ''
      let index: number = 0
      while (index < results.length && index < 6) {
        const row = results[index].languageName + ' | ' + results[index].fileName + ' | ' + results[index].source
        if (index === 0) {
          content = row
        } else {
          content = content + '\n' + row
        }
        index += 1
      }
      this.subtitleResults = content
    }
    this.statusMessage = '字幕搜索完成。'
  }

  build() {
    Row() {
      this.Sidebar()
      Column() {
        this.TopBar()
        if (this.selectedMedia !== undefined) {
          this.DetailPanel(this.selectedMedia)
        } else {
          this.SectionPanel()
        }
        this.PlayerDock()
        this.BottomStatus()
      }
      .layoutWeight(1)
      .height('100%')
      .backgroundColor(this.contentBackground())
    }
    .width('100%')
    .height('100%')
    .backgroundColor(this.pageBackground())
  }

  @Builder
  private Sidebar() {
    Column({ space: 10 }) {
      Column({ space: 4 }) {
        Text('Octov HM')
          .fontSize(28)
          .fontWeight(FontWeight.Bold)
          .fontColor(this.textPrimary())
        Text('HarmonyOS 功能迁移工作区')
          .fontSize(12)
          .fontColor(this.textSecondary())
      }
      .alignItems(HorizontalAlign.Start)
      .margin({ bottom: 18 })

      ForEach(sections, (section: NavigationSection) => {
        Button() {
          Column({ space: 2 }) {
            Text(section.title)
              .fontSize(16)
              .fontWeight(this.currentSection === section.id ? FontWeight.Bold : FontWeight.Medium)
              .fontColor(this.textPrimary())
            Text(section.subtitle)
              .fontSize(11)
              .fontColor(this.currentSection === section.id ? this.accentText() : this.textMuted())
          }
          .alignItems(HorizontalAlign.Start)
          .width('100%')
          .padding(16)
        }
        .type(ButtonType.Normal)
        .backgroundColor(this.currentSection === section.id ? this.accentBackground() : this.cardBackground())
        .borderRadius(18)
        .width('100%')
        .onClick(() => {
          this.currentSection = section.id
          this.selectedMedia = undefined
          this.subtitleResults = ''
        })
      })

      Blank()

      Column({ space: 8 }) {
        Text('阿里云盘状态')
          .fontSize(12)
          .fontColor(this.textSecondary())
        Text(this.aliyunStatus.isLoggedIn ? '已连接：' + (this.aliyunStatus.userName ?? '未命名账号') : '尚未授权')
          .fontSize(14)
          .fontColor(this.textPrimary())
          .maxLines(2)
        Text(this.aliyunStateLabel())
          .fontSize(12)
          .fontColor('#7DD3FC')
      }
      .alignItems(HorizontalAlign.Start)
      .padding(16)
      .width('100%')
      .backgroundColor(this.cardBackground())
      .borderRadius(18)
    }
    .width(292)
    .height('100%')
    .padding({ left: 18, right: 18, top: 28, bottom: 24 })
    .backgroundColor(this.sidebarBackground())
  }

  @Builder
  private TopBar() {
    Row({ space: 16 }) {
      Column({ space: 4 }) {
        Text(this.getSectionTitle())
          .fontSize(30)
          .fontWeight(FontWeight.Bold)
          .fontColor(this.textPrimary())
        Text(this.getSectionSubtitle())
          .fontSize(13)
          .fontColor(this.textSecondary())
      }
      .alignItems(HorizontalAlign.Start)

      Blank()

      TextInput({ text: this.keyword, placeholder: '搜索片名、原名或类型' })
        .width('34%')
        .height(44)
        .backgroundColor(this.cardBackground())
        .fontColor(this.textPrimary())
        .placeholderColor(this.textMuted())
        .borderRadius(16)
        .onChange((value: string) => {
          this.keyword = value
        })

      Button('重新扫描')
        .height(44)
        .padding({ left: 18, right: 18 })
        .backgroundColor(this.accentBackground())
        .borderRadius(16)
        .onClick(() => {
          this.rescanSources()
        })
    }
    .padding({ left: 28, right: 28, top: 22, bottom: 18 })
  }

  @Builder
  private SectionPanel() {
    if (this.currentSection === 'home') {
      this.HomePanel()
    } else if (this.currentSection === 'sources') {
      this.SourcesPanel()
    } else if (this.currentSection === 'settings') {
      this.SettingsPanel()
    } else {
      this.LibraryPanel(this.visibleMedia(), '媒体库')
    }
  }

  @Builder
  private HomePanel() {
    Scroll() {
      Column({ space: 22 }) {
        this.InfoBanner('迁移目标', 'hm 分支会继续对齐 dev 分支功能能力，界面遵循 HarmonyOS 风格，但媒体源、授权、播放与扫描链路保持一致。')
        this.RowSection('继续观看', this.continueWatching)
        this.RowSection('最近新增', this.recentlyAdded)
        this.LibraryGrid(this.visibleMedia(), '精选内容')
      }
      .alignItems(HorizontalAlign.Start)
      .padding({ left: 28, right: 28, bottom: 28 })
      .width('100%')
    }
    .scrollBar(BarState.Off)
  }

  @Builder
  private RowSection(title: string, items: MediaItem[]) {
    Column({ space: 14 }) {
      Row() {
        Text(title)
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          .fontColor(this.textPrimary())
        Blank()
        Text(items.length.toString() + ' 项')
          .fontSize(12)
          .fontColor(this.textSecondary())
      }
      .width('100%')

      Scroll(this.horizontalScroller) {
        Row({ space: 14 }) {
          ForEach(items, (item: MediaItem) => {
            this.MediaCard(item, 220, 300)
          })
        }
      }
      .scrollable(ScrollDirection.Horizontal)
      .scrollBar(BarState.Off)
      .width('100%')
    }
    .width('100%')
  }

  @Builder
  private LibraryPanel(items: MediaItem[], title: string) {
    Scroll() {
      this.LibraryGrid(items, title)
    }
    .scrollBar(BarState.Off)
  }

  @Builder
  private LibraryGrid(items: MediaItem[], title: string) {
    Column({ space: 16 }) {
      Row() {
        Text(title)
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          .fontColor(this.textPrimary())
        Blank()
        Text(items.length.toString() + ' 条')
          .fontSize(12)
          .fontColor(this.textSecondary())
      }
      .width('100%')

      Flex({ wrap: FlexWrap.Wrap, justifyContent: FlexAlign.Start, alignItems: ItemAlign.Start }) {
        ForEach(items, (item: MediaItem) => {
          this.MediaCard(item, 228, 316)
        })
      }
      .width('100%')
    }
    .alignItems(HorizontalAlign.Start)
    .padding({ left: 28, right: 28, bottom: 28 })
    .width('100%')
  }

  @Builder
  private MediaCard(item: MediaItem, width: number, height: number) {
    Button() {
      Column({ space: 10 }) {
        Stack({ alignContent: Alignment.BottomStart }) {
          if (item.poster.length > 0) {
            Image(item.poster)
              .width(width)
              .height(height - 96)
              .objectFit(ImageFit.Cover)
              .borderRadius(22)
          } else {
            Column() {
              Text(item.type === 'music' ? 'MUSIC' : item.type === 'tvshow' ? 'TV' : 'MOVIE')
                .fontSize(22)
                .fontWeight(FontWeight.Bold)
                .fontColor(this.textPrimary())
            }
            .width(width)
            .height(height - 96)
            .justifyContent(FlexAlign.Center)
            .backgroundColor(this.cardBackgroundStrong())
            .borderRadius(22)
          }

          if (item.progress !== undefined && item.progress.percentage > 0) {
            Row() {
              Text('已观看 ' + item.progress.percentage.toString() + '%')
                .fontSize(11)
                .fontColor('#F8FAFC')
            }
            .padding({ left: 10, right: 10, top: 6, bottom: 6 })
            .backgroundColor('#132B6B')
            .borderRadius(999)
            .margin({ left: 12, bottom: 12 })
          }
        }

        Column({ space: 5 }) {
          Text(item.title)
            .fontSize(15)
            .fontWeight(FontWeight.Bold)
            .fontColor(this.textPrimary())
            .maxLines(1)
            .textOverflow({ overflow: TextOverflow.Ellipsis })
          Text((item.year === undefined ? '--' : item.year.toString()) + ' | ' + item.genres.join(' / '))
            .fontSize(12)
            .fontColor(this.textSecondary())
            .maxLines(1)
          Text(item.sourceName)
            .fontSize(11)
            .fontColor('#7DD3FC')
            .maxLines(1)
        }
        .alignItems(HorizontalAlign.Start)
        .width('100%')
      }
      .width(width)
      .padding(10)
      .alignItems(HorizontalAlign.Start)
    }
    .type(ButtonType.Normal)
    .width(width)
    .height(height)
    .margin({ right: 16, bottom: 16 })
    .backgroundColor(this.cardBackgroundStrong())
    .borderRadius(26)
    .onClick(() => {
      this.selectedMedia = item
      this.subtitleResults = ''
    })
  }

  @Builder
  private DetailPanel(item: MediaItem) {
    Scroll() {
      Column({ space: 18 }) {
        Row({ space: 12 }) {
          Button('返回')
            .backgroundColor(this.cardBackground())
            .borderRadius(16)
            .onClick(() => {
              this.selectedMedia = undefined
            })
          Button('搜索字幕')
            .backgroundColor(this.accentBackground())
            .borderRadius(16)
            .onClick(() => {
              this.searchSubtitles(item)
            })
          Button(item.source === 'aliyundrive' ? '打开云盘播放会话' : '打开本地播放会话')
            .backgroundColor(this.successBackground())
            .borderRadius(16)
            .onClick(() => {
              this.openMedia(item)
            })
          Blank()
        }
        .width('100%')

        Row({ space: 22 }) {
          if (item.poster.length > 0) {
            Image(item.poster)
              .width(280)
              .height(420)
              .objectFit(ImageFit.Cover)
              .borderRadius(28)
          } else {
            Column() {
              Text(item.type.toUpperCase())
                .fontSize(28)
                .fontWeight(FontWeight.Bold)
                .fontColor(this.textPrimary())
            }
            .width(280)
            .height(420)
            .justifyContent(FlexAlign.Center)
            .backgroundColor(this.cardBackgroundStrong())
            .borderRadius(28)
          }

          Column({ space: 14 }) {
            Text(item.title)
              .fontSize(34)
              .fontWeight(FontWeight.Bold)
              .fontColor(this.textPrimary())
            if (item.originalTitle !== undefined) {
              Text(item.originalTitle)
                .fontSize(15)
                .fontColor('#A5B4FC')
            }
            Text((item.year === undefined ? '--' : item.year.toString()) + ' | ' + item.genres.join(' / ') + ' | ' +
              (item.duration === undefined ? '--' : item.duration.toString()) + ' min')
              .fontSize(14)
              .fontColor(this.textSecondary())
            Text('来源：' + item.sourceName)
              .fontSize(13)
              .fontColor('#7DD3FC')
            if (item.rating !== undefined) {
              Text('评分 ' + item.rating.toFixed(1))
                .fontSize(13)
                .fontColor('#FBBF24')
            }
            Text(item.overview === undefined ? '暂无简介。' : item.overview)
              .fontSize(14)
              .fontColor(this.textSecondary())
              .lineHeight(22)
            if (item.progress !== undefined && item.progress.percentage > 0) {
              Text('观看进度 ' + item.progress.percentage.toString() + '%')
                .fontSize(13)
                .fontColor('#93C5FD')
            }
            if (this.subtitleResults.length > 0) {
              Column({ space: 8 }) {
                Text('字幕结果')
                  .fontSize(16)
                  .fontWeight(FontWeight.Bold)
                  .fontColor(this.textPrimary())
                Text(this.subtitleResults)
                  .fontSize(13)
                  .fontColor(this.textSecondary())
                  .lineHeight(20)
              }
              .alignItems(HorizontalAlign.Start)
              .padding(18)
              .width('100%')
              .backgroundColor(this.cardBackground())
              .borderRadius(22)
            }
          }
          .alignItems(HorizontalAlign.Start)
          .layoutWeight(1)
        }
        .alignItems(VerticalAlign.Top)
        .width('100%')

        if (item.seasons.length > 0) {
          Column({ space: 12 }) {
            Text('季与分集')
              .fontSize(20)
              .fontWeight(FontWeight.Bold)
              .fontColor(this.textPrimary())
            ForEach(item.seasons, (season: SeasonItem) => {
              Column({ space: 10 }) {
                Text(season.name)
                  .fontSize(16)
                  .fontWeight(FontWeight.Medium)
                  .fontColor(this.accentText())
                ForEach(season.episodes, (episode: EpisodeItem) => {
                  Row() {
                    Text('E' + episode.episode.toString() + ' | ' + episode.name)
                      .fontSize(14)
                      .fontColor(this.textPrimary())
                      .maxLines(1)
                    Blank()
                    Text((episode.duration === undefined ? '--' : episode.duration.toString()) + ' min')
                      .fontSize(12)
                      .fontColor(this.textSecondary())
                  }
                  .width('100%')
                  .padding(14)
                  .backgroundColor(this.cardBackgroundStrong())
                  .borderRadius(16)
                })
              }
              .alignItems(HorizontalAlign.Start)
              .padding(18)
              .width('100%')
              .backgroundColor(this.cardBackground())
              .borderRadius(22)
            })
          }
          .alignItems(HorizontalAlign.Start)
          .width('100%')
        }
      }
      .alignItems(HorizontalAlign.Start)
      .padding(28)
      .width('100%')
    }
    .scrollBar(BarState.Off)
  }

  @Builder
  private SourcesPanel() {
    if (this.sourceManagementView === 'aliyun-auth') {
      this.AliyunAuthPanel()
    } else {
      Scroll() {
        Column({ space: 18 }) {
          this.InfoBanner('媒体源说明', 'hm 分支延续 dev 分支的媒体源能力，入口改为更简单的本地目录和阿里云盘两条主链路。')

          Row({ space: 18 }) {
            Column({ space: 12 }) {
              Text('存储账号')
                .fontSize(18)
                .fontWeight(FontWeight.Bold)
                .fontColor(this.textPrimary())
              ForEach(this.storages, (storage: StorageAccount) => {
                Column({ space: 6 }) {
                  Text(storage.name)
                    .fontSize(15)
                    .fontWeight(FontWeight.Bold)
                    .fontColor(this.textPrimary())
                  Text(storage.type + ' | ' + (storage.userName === undefined ? '未登录' : storage.userName))
                    .fontSize(12)
                    .fontColor(this.textSecondary())
                }
                .alignItems(HorizontalAlign.Start)
                .padding(16)
                .width('100%')
                .backgroundColor(this.cardBackground())
                .borderRadius(18)
              })
            }
            .layoutWeight(1)
            .alignItems(HorizontalAlign.Start)

            Column({ space: 12 }) {
              Text('文件源')
                .fontSize(18)
                .fontWeight(FontWeight.Bold)
                .fontColor(this.textPrimary())
              ForEach(this.sources, (source: FileSourceItem) => {
                Column() {
                  Row({ space: 12 }) {
                    Column({ space: 6 }) {
                      Text(source.name)
                        .fontSize(15)
                        .fontWeight(FontWeight.Bold)
                        .fontColor(this.textPrimary())
                      Text(source.storageName + ' | ' + source.path)
                        .fontSize(12)
                        .fontColor(this.textSecondary())
                        .maxLines(2)
                    }
                    .alignItems(HorizontalAlign.Start)
                    .layoutWeight(1)

                    Button('移除')
                      .fontSize(11)
                      .backgroundColor(this.dangerBackground())
                      .borderRadius(12)
                      .onClick(() => {
                        this.removeSource(source)
                      })
                  }
                  .width('100%')
                  .alignItems(VerticalAlign.Center)
                }
                .padding(16)
                .width('100%')
                .backgroundColor(this.activeSourceId === source.id ? this.accentBackground() : this.cardBackground())
                .borderRadius(18)
                .onClick(() => {
                  this.openSourceBrowser(source)
                })
              })
            }
            .layoutWeight(1)
            .alignItems(HorizontalAlign.Start)
          }
          .width('100%')

          if (this.activeSourceId.length > 0) {
            this.SourceBrowserPanel()
          }

          Column({ space: 12 }) {
            Text('本地目录接入')
              .fontSize(18)
              .fontWeight(FontWeight.Bold)
              .fontColor(this.textPrimary())
            Text('当前仍使用 mock 目录选择器，但仓库层、媒体源模型和重新扫描入口已经打通，方便继续补齐真实目录授权。')
              .fontSize(13)
              .lineHeight(20)
              .fontColor(this.textSecondary())
            Row({ space: 12 }) {
              Button('添加本地媒体目录')
                .backgroundColor(this.successBackground())
                .borderRadius(16)
                .onClick(() => {
                  this.addLocalSource()
                })
              Button('重新扫描')
                .backgroundColor(this.accentBackground())
                .borderRadius(16)
                .onClick(() => {
                  this.rescanSources()
                })
            }
          }
          .alignItems(HorizontalAlign.Start)
          .padding(20)
          .width('100%')
          .backgroundColor(this.cardBackgroundStrong())
          .borderRadius(24)

          Column({ space: 12 }) {
            Text('阿里云盘')
              .fontSize(18)
              .fontWeight(FontWeight.Bold)
              .fontColor(this.textPrimary())
            Text(
              this.aliyunStatus.isLoggedIn
                ? '当前已连接：' + (this.aliyunStatus.userName ?? '未命名账号') + '。进入单独页面可以重新扫码、查看状态或退出登录。'
                : '授权流程已经改成单独页面。进入后按保存凭据、扫码确认、完成授权三步操作即可。'
            )
              .fontSize(13)
              .lineHeight(20)
              .fontColor(this.textSecondary())
            Row({ space: 12 }) {
              Button(this.aliyunStatus.isLoggedIn ? '管理阿里云盘' : '连接阿里云盘')
                .backgroundColor(this.accentBackground())
                .borderRadius(16)
                .onClick(() => {
                  this.openAliyunAuthPage()
                })
              if (this.aliyunStatus.isLoggedIn) {
                Button('打开云盘媒体源')
                  .backgroundColor(this.successBackground())
                  .borderRadius(16)
                  .onClick(() => {
                    this.openAliyunSourceRoot()
                  })
              }
            }
          }
          .alignItems(HorizontalAlign.Start)
          .padding(20)
          .width('100%')
          .backgroundColor(this.cardBackgroundStrong())
          .borderRadius(24)
        }
        .alignItems(HorizontalAlign.Start)
        .padding({ left: 28, right: 28, bottom: 28 })
        .width('100%')
      }
      .scrollBar(BarState.Off)
    }
  }

  @Builder
  private AliyunAuthPanel() {
    Scroll() {
      Column({ space: 18 }) {
        Row({ space: 12 }) {
          Button('返回媒体源')
            .backgroundColor(this.cardBackground())
            .fontColor(this.textPrimary())
            .borderRadius(16)
            .onClick(() => {
              this.closeAliyunAuthPage()
            })
          Column({ space: 4 }) {
            Text('阿里云盘授权')
              .fontSize(20)
              .fontWeight(FontWeight.Bold)
              .fontColor(this.textPrimary())
            Text('按 1-2-3 三步完成授权，流程参考 dev 分支的独立授权页。')
              .fontSize(12)
              .fontColor(this.textSecondary())
          }
          .alignItems(HorizontalAlign.Start)
          .layoutWeight(1)
        }
        .width('100%')

        this.InfoBanner(
          '操作步骤',
          this.aliyunStatus.isLoggedIn
            ? '当前账号已连接。你可以重新扫码、更换凭据，或者直接打开云盘媒体源。'
            : this.aliyunGuideText()
        )

        Column({ space: 12 }) {
          Text('1. 凭据')
            .fontSize(18)
            .fontWeight(FontWeight.Bold)
            .fontColor(this.textPrimary())
          Text('默认可使用 hm/.env 里的 client_id 和 client_secret；如果要切换账号，也可以直接在这里覆盖。')
            .fontSize(13)
            .lineHeight(20)
            .fontColor(this.textSecondary())
          TextInput({ text: this.settings.aliyunClientId, placeholder: '阿里云盘 Client ID' })
            .height(44)
            .backgroundColor(this.cardBackground())
            .fontColor(this.textPrimary())
            .placeholderColor(this.textMuted())
            .borderRadius(16)
            .onChange((value: string) => {
              this.settings.aliyunClientId = value
            })
          TextInput({ text: this.settings.aliyunClientSecret, placeholder: '阿里云盘 Client Secret' })
            .height(44)
            .backgroundColor(this.cardBackground())
            .fontColor(this.textPrimary())
            .placeholderColor(this.textMuted())
            .borderRadius(16)
            .onChange((value: string) => {
              this.settings.aliyunClientSecret = value
            })
          Row({ space: 12 }) {
            Button('仅保存凭据')
              .backgroundColor(this.cardBackground())
              .fontColor(this.textPrimary())
              .borderRadius(16)
              .onClick(() => {
                this.saveAliyunCredentials()
              })
            Button(
              this.aliyunQrSession.state === 'expired' || this.aliyunQrSession.state === 'error'
                ? '保存并重新获取二维码'
                : '保存并开始扫码授权'
            )
              .backgroundColor(this.accentBackground())
              .borderRadius(16)
              .onClick(() => {
                this.startAliyunAuthorization()
              })
          }
        }
        .alignItems(HorizontalAlign.Start)
        .padding(20)
        .width('100%')
        .backgroundColor(this.cardBackgroundStrong())
        .borderRadius(24)

        Column({ space: 12 }) {
          Text('2. 扫码')
            .fontSize(18)
            .fontWeight(FontWeight.Bold)
            .fontColor(this.textPrimary())
          Text('点击上面的主按钮后，这里会显示二维码。使用阿里云盘 App 扫描，页面会自动轮询状态。')
            .fontSize(13)
            .lineHeight(20)
            .fontColor(this.textSecondary())
          if (this.aliyunQrSession.qrCodeUrl.length > 0) {
            Column({ space: 8 }) {
              Image(this.aliyunQrSession.qrCodeUrl)
                .width(240)
                .height(240)
                .borderRadius(18)
              Text('当前状态：' + this.aliyunStateLabel())
                .fontSize(12)
                .fontColor(this.textSecondary())
              Text(this.aliyunQrSession.statusText)
                .fontSize(12)
                .lineHeight(18)
                .fontColor(this.textSecondary())
            }
            .alignItems(HorizontalAlign.Start)
          } else {
            this.InfoBanner('等待二维码', '先完成上一步，主按钮会自动保存凭据并开始获取二维码。')
          }
          if (this.aliyunQrSession.lastError !== undefined && this.aliyunQrSession.lastError.length > 0) {
            Text('最近错误：' + this.aliyunQrSession.lastError)
              .fontSize(12)
              .fontColor('#FCA5A5')
              .maxLines(3)
          }
          Row({ space: 12 }) {
            Button('手动检查状态')
              .backgroundColor(this.warningBackground())
              .borderRadius(16)
              .onClick(() => {
                this.pollAliyunQrCodeStatus(false)
              })
            if (this.aliyunQrSession.qrCodeUrl.length > 0) {
              Button('重新获取二维码')
                .backgroundColor(this.cardBackground())
                .fontColor(this.textPrimary())
                .borderRadius(16)
                .onClick(() => {
                  this.startAliyunAuthorization()
                })
            }
          }
        }
        .alignItems(HorizontalAlign.Start)
        .padding(20)
        .width('100%')
        .backgroundColor(this.cardBackgroundStrong())
        .borderRadius(24)

        Column({ space: 12 }) {
          Text('3. 完成')
            .fontSize(18)
            .fontWeight(FontWeight.Bold)
            .fontColor(this.textPrimary())
          Text(this.aliyunStatus.isLoggedIn ? '授权已完成，可以直接打开云盘媒体源继续浏览。' : '扫码确认成功后，这里会显示已连接账号。')
            .fontSize(13)
            .lineHeight(20)
            .fontColor(this.textSecondary())
          Text(this.aliyunStatus.isLoggedIn ? '已连接：' + (this.aliyunStatus.userName ?? '未命名账号') : '当前尚未完成授权')
            .fontSize(13)
            .fontColor(this.textPrimary())
          Row({ space: 12 }) {
            if (this.aliyunStatus.isLoggedIn) {
              Button('打开云盘媒体源')
                .backgroundColor(this.successBackground())
                .borderRadius(16)
                .onClick(() => {
                  this.openAliyunSourceRoot()
                })
              Button('退出登录')
                .backgroundColor(this.dangerBackground())
                .borderRadius(16)
                .onClick(() => {
                  this.stopAliyunPolling()
                  this.applySnapshot(repository.logoutAliyun())
                  this.statusMessage = '阿里云盘授权已清除。'
                })
            }
          }
        }
        .alignItems(HorizontalAlign.Start)
        .padding(20)
        .width('100%')
        .backgroundColor(this.cardBackgroundStrong())
        .borderRadius(24)
      }
      .alignItems(HorizontalAlign.Start)
      .padding({ left: 28, right: 28, bottom: 28 })
      .width('100%')
    }
    .scrollBar(BarState.Off)
  }
  @Builder
  private SourceBrowserPanel() {
    Column({ space: 14 }) {
      Row({ space: 12 }) {
        Button('返回文件源')
          .backgroundColor(this.cardBackground())
          .borderRadius(16)
          .onClick(() => {
            this.closeSourceBrowser()
          })

        Text(this.sourceBrowserName)
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          .fontColor(this.textPrimary())

        Blank()

        Button(this.sourceBrowserViewMode === 'list' ? '列表' : '宫格')
          .backgroundColor(this.cardBackground())
          .borderRadius(16)
          .onClick(() => {
            this.sourceBrowserViewMode = this.sourceBrowserViewMode === 'list' ? 'grid' : 'list'
          })
      }
      .width('100%')

      if (this.sourceBrowserStorageType === 'aliyundrive') {
        Row({ space: 12 }) {
          TextInput({ text: this.sourceBrowserSearchQuery, placeholder: '搜索云盘文件名' })
            .layoutWeight(1)
            .height(42)
            .backgroundColor(this.cardBackground())
            .fontColor(this.textPrimary())
            .placeholderColor(this.textMuted())
            .borderRadius(14)
            .onChange((value: string) => {
              this.sourceBrowserSearchQuery = value
            })
          Button('搜索')
            .backgroundColor(this.accentBackground())
            .borderRadius(14)
            .onClick(() => {
              this.searchSourceBrowser()
            })
        }
        .width('100%')
      }

      Row({ space: 10 }) {
        ForEach(['all', 'video', 'folder', 'music'], (filter: string) => {
          Button(
            filter === 'all' ? '全部' : filter === 'video' ? '视频' : filter === 'folder' ? '文件夹' : '音乐'
          )
            .fontSize(12)
            .backgroundColor(this.sourceBrowserFilter === filter ? this.accentBackground() : this.cardBackground())
            .fontColor(this.sourceBrowserFilter === filter ? '#FFFFFF' : this.textPrimary())
            .borderRadius(14)
            .onClick(() => {
              this.sourceBrowserFilter = filter as SourceBrowserFilter
            })
        })
      }
      .width('100%')

      Row({ space: 6 }) {
        ForEach(this.sourceBreadcrumbs, (item: SourceBreadcrumbItem) => {
          Button(item.name)
            .fontSize(12)
            .backgroundColor('#00000000')
            .fontColor(item.id === this.sourceBrowserCurrentFolderId ? this.accentText() : this.textSecondary())
            .onClick(() => {
              if (item.id !== this.sourceBrowserCurrentFolderId) {
                const source: FileSourceItem = this.findSourceById(this.activeSourceId)
                this.openSourceBrowser(source, item.id)
              }
            })
        })
        Blank()
        Text(this.sourceEntries().length.toString() + ' 项')
          .fontSize(12)
          .fontColor(this.textSecondary())
      }
      .width('100%')

      if (this.sourceEntries().length === 0) {
        this.InfoBanner('当前目录为空', '可以切换筛选条件，或返回上一级目录继续浏览。')
      } else if (this.sourceBrowserViewMode === 'list') {
        Column({ space: 10 }) {
          ForEach(this.sourceEntries(), (entry: SourceBrowserEntry) => {
            this.SourceBrowserRow(entry)
          })
        }
        .width('100%')
      } else {
        Flex({ wrap: FlexWrap.Wrap, justifyContent: FlexAlign.Start, alignItems: ItemAlign.Start }) {
          ForEach(this.sourceEntries(), (entry: SourceBrowserEntry) => {
            this.SourceBrowserCard(entry)
          })
        }
        .width('100%')
      }

      if (this.sourceBrowserNextMarker.length > 0) {
        Button('加载更多')
          .backgroundColor(this.accentBackground())
          .borderRadius(16)
          .onClick(() => {
            this.loadMoreSourceBrowser()
          })
      }
    }
    .alignItems(HorizontalAlign.Start)
    .padding(20)
    .width('100%')
    .backgroundColor(this.cardBackgroundStrong())
    .borderRadius(24)
  }

  @Builder
  private SourceBrowserRow(entry: SourceBrowserEntry) {
    Column() {
      Row({ space: 12 }) {
        Column({ space: 4 }) {
          Text(entry.name)
            .fontSize(15)
            .fontWeight(FontWeight.Bold)
            .fontColor(this.textPrimary())
            .maxLines(1)
          Text(this.sourceEntryMeta(entry))
            .fontSize(12)
            .fontColor(this.textSecondary())
            .maxLines(2)
        }
        .alignItems(HorizontalAlign.Start)
        .layoutWeight(1)

        if (entry.type !== 'folder') {
          Text('打开')
            .fontSize(12)
            .fontColor('#93C5FD')
        }
      }
      .width('100%')
      .alignItems(VerticalAlign.Center)
    }
    .width('100%')
    .padding(16)
    .backgroundColor(this.cardBackground())
    .borderRadius(18)
    .onClick(() => {
      if (entry.type === 'folder') {
        this.browseSourceFolder(entry)
      } else {
        this.openBrowserEntry(entry)
      }
    })
  }

  @Builder
  private SourceBrowserCard(entry: SourceBrowserEntry) {
    Button() {
      Column({ space: 8 }) {
        Column() {
          Text(entry.type === 'folder' ? 'FOLDER' : entry.type === 'audio' ? 'MUSIC' : 'VIDEO')
            .fontSize(20)
            .fontWeight(FontWeight.Bold)
            .fontColor(this.textPrimary())
        }
        .width(210)
        .height(140)
        .justifyContent(FlexAlign.Center)
        .backgroundColor(this.cardBackground())
        .borderRadius(20)

        Text(entry.name)
          .fontSize(14)
          .fontWeight(FontWeight.Bold)
          .fontColor(this.textPrimary())
          .maxLines(1)
        Text(this.sourceEntryMeta(entry))
          .fontSize(11)
          .fontColor(this.textSecondary())
          .maxLines(2)
      }
      .width(210)
      .alignItems(HorizontalAlign.Start)
    }
    .type(ButtonType.Normal)
    .width(210)
    .margin({ right: 14, bottom: 14 })
    .padding(12)
    .backgroundColor(this.cardBackgroundStrong())
    .borderRadius(22)
    .onClick(() => {
      if (entry.type === 'folder') {
        this.browseSourceFolder(entry)
      } else {
        this.openBrowserEntry(entry)
      }
    })
  }

  private sourceEntryMeta(entry: SourceBrowserEntry): string {
    let meta: string = entry.type === 'folder' ? '文件夹' : entry.path
    if (entry.sizeLabel !== undefined && entry.sizeLabel.length > 0) {
      meta = meta + ' | ' + entry.sizeLabel
    }
    if (entry.duration !== undefined) {
      meta = meta + ' | ' + entry.duration.toString() + ' min'
    }
    return meta
  }

  private async openBrowserEntry(entry: SourceBrowserEntry): Promise<void> {
    if (entry.mediaId !== undefined && entry.mediaId.length > 0) {
      const item: MediaItem | undefined = this.findMediaById(entry.mediaId)
      if (item !== undefined) {
        await this.openMedia(item)
        this.statusMessage = '已打开播放会话：' + item.title
      }
    } else if (entry.cloudFileId !== undefined && entry.cloudFileId.length > 0) {
      this.applySnapshot(
        await repository.openCloudFile(
          entry.cloudFileId,
          entry.name,
          this.sourceBrowserName,
          this.sourceBrowserCurrentFolderId,
          this.activeSourceId
        )
      )
      this.statusMessage = '已打开云盘文件：' + entry.name
    }
  }

  private findMediaById(mediaId: string): MediaItem | undefined {
    let index: number = 0
    while (index < this.library.length) {
      if (this.library[index].id === mediaId) {
        return this.library[index]
      }
      index += 1
    }
    return undefined
  }

  @Builder
  private SettingsPanel() {
    Scroll() {
      Column({ space: 18 }) {
        this.InfoBanner('主题', '支持浅色、深色和跟随系统三种显示样式，同时作用于页面色板和系统色彩模式。')

        Column({ space: 12 }) {
          Text('外部服务')
            .fontSize(18)
            .fontWeight(FontWeight.Bold)
            .fontColor(this.textPrimary())

          TextInput({ text: this.settings.tmdbApiKey, placeholder: 'TMDB API Key' })
            .height(44)
            .backgroundColor(this.cardBackground())
            .fontColor(this.textPrimary())
            .placeholderColor(this.textMuted())
            .borderRadius(16)
            .onChange((value: string) => {
              this.settings.tmdbApiKey = value
            })

          TextInput({ text: this.settings.subtitleApiKey, placeholder: 'OpenSubtitles API Key' })
            .height(44)
            .backgroundColor(this.cardBackground())
            .fontColor(this.textPrimary())
            .placeholderColor(this.textMuted())
            .borderRadius(16)
            .onChange((value: string) => {
              this.settings.subtitleApiKey = value
            })

          Row({ space: 12 }) {
            Button('跟随系统')
              .backgroundColor(this.settings.theme === 'system' ? this.accentBackground() : this.cardBackground())
              .fontColor(this.settings.theme === 'system' ? '#FFFFFF' : this.textPrimary())
              .borderRadius(16)
              .onClick(() => {
                this.setTheme('system')
              })
            Button('浅色')
              .backgroundColor(this.settings.theme === 'light' ? this.accentBackground() : this.cardBackground())
              .fontColor(this.settings.theme === 'light' ? '#FFFFFF' : this.textPrimary())
              .borderRadius(16)
              .onClick(() => {
                this.setTheme('light')
              })
            Button('深色')
              .backgroundColor(this.settings.theme === 'dark' ? this.accentBackground() : this.cardBackground())
              .fontColor(this.settings.theme === 'dark' ? '#FFFFFF' : this.textPrimary())
              .borderRadius(16)
              .onClick(() => {
                this.setTheme('dark')
              })
          }

          Row({ space: 12 }) {
            Button('保存设置')
              .backgroundColor(this.accentBackground())
              .borderRadius(16)
              .onClick(() => {
                this.applySnapshot(repository.updateSettings(this.settings))
                this.statusMessage = '设置已更新。'
              })
            Button('应用主题')
              .backgroundColor(this.successBackground())
              .borderRadius(16)
              .onClick(() => {
                this.applyThemeMode()
              })
          }
        }
        .alignItems(HorizontalAlign.Start)
        .padding(20)
        .width('100%')
        .backgroundColor(this.cardBackgroundStrong())
        .borderRadius(24)

        this.InfoBanner('播放', '底部 mini player 已接通，下一步会继续用 HarmonyOS AVPlayer 替换当前 mock 适配器。')
      }
      .alignItems(HorizontalAlign.Start)
      .padding({ left: 28, right: 28, bottom: 28 })
      .width('100%')
    }
    .scrollBar(BarState.Off)
  }

  @Builder
  private PlayerDock() {
    Column({ space: 10 }) {
      Row() {
        Column({ space: 4 }) {
          Text(this.playback.title)
            .fontSize(16)
            .fontWeight(FontWeight.Bold)
            .fontColor(this.textPrimary())
            .maxLines(1)
          Text(this.playback.status + ' | ' + this.playback.sourceLabel)
            .fontSize(12)
            .fontColor(this.textSecondary())
            .maxLines(1)
        }
        .alignItems(HorizontalAlign.Start)
        .layoutWeight(1)

        Text(this.playback.progress.toString() + '%')
          .fontSize(12)
          .fontColor(this.textSecondary())
      }
      .width('100%')

      Slider({
        value: this.playback.progress,
        min: 0,
        max: 100,
        step: 1
      })
        .blockColor('#2F6BFF')
        .trackColor('#1E293B')
        .selectedColor('#60A5FA')
        .onChange((value: number) => {
          this.seekCurrent(value)
        })

      Row({ space: 12 }) {
        Button('播放')
          .backgroundColor(this.accentBackground())
          .borderRadius(14)
          .onClick(() => {
            this.playCurrent()
          })
        Button('暂停')
          .backgroundColor(this.successBackground())
          .borderRadius(14)
          .onClick(() => {
            this.pauseCurrent()
          })
        Button('停止')
          .backgroundColor(this.dangerBackground())
          .borderRadius(14)
          .onClick(() => {
            this.stopCurrent()
          })
        Blank()
        Text(this.playback.message === undefined ? '等待播放器接入' : this.playback.message)
          .fontSize(12)
          .fontColor(this.textSecondary())
          .maxLines(1)
      }
      .width('100%')
      this.CloudPlaybackMeta()
    }
    .alignItems(HorizontalAlign.Start)
    .padding({ left: 28, right: 28, top: 14, bottom: 14 })
    .backgroundColor(this.playerBackground())
  }

  @Builder
  private CloudPlaybackMeta() {
    Column({ space: 8 }) {
      if (this.playback.playlist.length > 0) {
        Row({ space: 12 }) {
          if (this.playback.playlistIndex > 0) {
            Button('上一个')
              .backgroundColor(this.cardBackground())
              .fontColor(this.textPrimary())
              .borderRadius(14)
              .onClick(() => {
                this.playPreviousCloudItem()
              })
          }
          Text(
            '队列位置 ' +
              (this.playback.playlistIndex + 1).toString() +
              ' / ' +
              this.playback.playlist.length.toString()
          )
            .fontSize(11)
            .fontColor(this.textSecondary())
          if (this.playback.playlistIndex >= 0 && this.playback.playlistIndex < this.playback.playlist.length - 1) {
            Button('下一个')
              .backgroundColor(this.cardBackground())
              .fontColor(this.textPrimary())
              .borderRadius(14)
              .onClick(() => {
                this.playNextCloudItem()
              })
          }
          Blank()
        }
        .width('100%')
      }

      if (this.playback.availableQualities.length > 0) {
        Column({ space: 8 }) {
          Text('云盘清晰度')
            .fontSize(12)
            .fontWeight(FontWeight.Medium)
            .fontColor(this.textSecondary())
          Row({ space: 8 }) {
            ForEach(this.playback.availableQualities, (item: PlaybackQualityItem) => {
              Button(item.label)
                .fontSize(11)
                .backgroundColor(this.playback.activeQualityId === item.id ? this.accentBackground() : this.cardBackground())
                .fontColor(this.playback.activeQualityId === item.id ? '#FFFFFF' : this.textPrimary())
                .borderRadius(12)
                .onClick(() => {
                  this.selectPlaybackQuality(item.id)
                })
            })
          }
        }
        .alignItems(HorizontalAlign.Start)
        .width('100%')
      }

      if (this.playback.downloadUrl !== undefined && this.playback.downloadUrl.length > 0) {
        Text('播放链接已就绪')
          .fontSize(11)
          .fontColor(this.textSecondary())
          .maxLines(1)
      }
    }
    .alignItems(HorizontalAlign.Start)
    .width('100%')
  }

  @Builder
  private InfoBanner(title: string, body: string) {
    Column({ space: 10 }) {
      Text(title)
        .fontSize(17)
        .fontWeight(FontWeight.Bold)
        .fontColor(this.textPrimary())
      Text(body)
        .fontSize(13)
        .lineHeight(20)
        .fontColor(this.textSecondary())
    }
    .alignItems(HorizontalAlign.Start)
    .padding(20)
    .width('100%')
    .backgroundColor(this.cardBackground())
    .borderRadius(24)
  }

  @Builder
  private BottomStatus() {
    Row() {
      Text(this.statusMessage)
        .fontSize(12)
        .fontColor(this.textSecondary())
      Blank()
      Text('媒体库 ' + this.library.length.toString() + ' | 继续观看 ' + this.continueWatching.length.toString())
        .fontSize(12)
        .fontColor(this.textMuted())
    }
    .width('100%')
    .padding({ left: 28, right: 28, top: 12, bottom: 16 })
    .backgroundColor(this.contentBackground())
  }
}
