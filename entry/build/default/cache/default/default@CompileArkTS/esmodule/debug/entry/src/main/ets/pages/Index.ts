if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Index_Params {
    currentSection?: SectionId;
    selectedMedia?: MediaItem | undefined;
    library?: MediaItem[];
    continueWatching?: MediaItem[];
    recentlyAdded?: MediaItem[];
    storages?: StorageAccount[];
    sources?: FileSourceItem[];
    activeSourceId?: string;
    sourceManagementView?: 'overview' | 'aliyun-auth';
    playbackExperienceOpen?: boolean;
    sourceBrowserEntries?: SourceBrowserEntry[];
    sourceBrowserName?: string;
    sourceBrowserStorageType?: 'local' | 'aliyundrive';
    sourceBrowserCurrentFolderId?: string;
    sourceBreadcrumbs?: SourceBreadcrumbItem[];
    sourceBrowserFilter?: SourceBrowserFilter;
    sourceBrowserViewMode?: SourceBrowserViewMode;
    sourceBrowserNextMarker?: string;
    sourceBrowserSearchQuery?: string;
    settings?: AppSettings;
    aliyunStatus?: AliyunDriveStatus;
    aliyunQrSession?: AliyunQrSession;
    playback?: PlaybackSession;
    keyword?: string;
    subtitleResults?: string;
    activeSubtitleText?: string;
    subtitleCues?: Array<SubtitleCue>;
    lyricLines?: Array<LyricLine>;
    currentLyricIndex?: number;
    statusMessage?: string;
    horizontalScroller?: Scroller;
    aliyunPollingTimer?: number;
    aliyunPollingInFlight?: boolean;
    playbackRefreshTimer?: number;
    videoSurfaceController?: XComponentController;
    videoSurfaceId?: string;
}
import ConfigurationConstant from "@ohos:app.ability.ConfigurationConstant";
import type common from "@ohos:app.ability.common";
import type { AliyunDriveStatus, AliyunQrSession, AppSettings, EpisodeItem, FileSourceItem, MediaItem, NavigationSection, OctovSnapshot, PlaybackQualityItem, PlaybackSession, SeasonItem, SectionId, SubtitleCue, LyricLine, SourceBrowserEntry, SourceBrowserFilter, SourceBrowserSnapshot, SourceBrowserViewMode, SourceBreadcrumbItem, StorageAccount } from '../models/OctovModels';
import { OctovRepository } from "@normalized:N&&&entry/src/main/ets/services/OctovServices&";
const sections: NavigationSection[] = [
    { id: 'home', title: '首页', subtitle: '继续观看与推荐内容' },
    { id: 'recent', title: '最近新增', subtitle: '刚刚加入媒体库的内容' },
    { id: 'movies', title: '电影', subtitle: '电影海报流与详情页' },
    { id: 'tvshows', title: '剧集', subtitle: '季与分集结构' },
    { id: 'music', title: '音乐', subtitle: '音乐入口与播放占位' },
    { id: 'sources', title: '媒体源', subtitle: '本地目录与阿里云盘' },
    { id: 'settings', title: '设置', subtitle: '主题与服务配置' }
];
const repository: OctovRepository = OctovRepository.shared();
class Index extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__currentSection = new ObservedPropertySimplePU('home', this, "currentSection");
        this.__selectedMedia = new ObservedPropertyObjectPU(undefined, this, "selectedMedia");
        this.__library = new ObservedPropertyObjectPU([], this, "library");
        this.__continueWatching = new ObservedPropertyObjectPU([], this, "continueWatching");
        this.__recentlyAdded = new ObservedPropertyObjectPU([], this, "recentlyAdded");
        this.__storages = new ObservedPropertyObjectPU([], this, "storages");
        this.__sources = new ObservedPropertyObjectPU([], this, "sources");
        this.__activeSourceId = new ObservedPropertySimplePU('', this, "activeSourceId");
        this.__sourceManagementView = new ObservedPropertySimplePU('overview', this, "sourceManagementView");
        this.__playbackExperienceOpen = new ObservedPropertySimplePU(false, this, "playbackExperienceOpen");
        this.__sourceBrowserEntries = new ObservedPropertyObjectPU([], this, "sourceBrowserEntries");
        this.__sourceBrowserName = new ObservedPropertySimplePU('', this, "sourceBrowserName");
        this.__sourceBrowserStorageType = new ObservedPropertySimplePU('local', this, "sourceBrowserStorageType");
        this.__sourceBrowserCurrentFolderId = new ObservedPropertySimplePU('', this, "sourceBrowserCurrentFolderId");
        this.__sourceBreadcrumbs = new ObservedPropertyObjectPU([], this, "sourceBreadcrumbs");
        this.__sourceBrowserFilter = new ObservedPropertySimplePU('all', this, "sourceBrowserFilter");
        this.__sourceBrowserViewMode = new ObservedPropertySimplePU('list', this, "sourceBrowserViewMode");
        this.__sourceBrowserNextMarker = new ObservedPropertySimplePU('', this, "sourceBrowserNextMarker");
        this.__sourceBrowserSearchQuery = new ObservedPropertySimplePU('', this, "sourceBrowserSearchQuery");
        this.__settings = new ObservedPropertyObjectPU(repository.getSettings(), this, "settings");
        this.__aliyunStatus = new ObservedPropertyObjectPU(repository.getAliyunStatus(), this, "aliyunStatus");
        this.__aliyunQrSession = new ObservedPropertyObjectPU(repository.getAliyunQrSession(), this, "aliyunQrSession");
        this.__playback = new ObservedPropertyObjectPU({
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
        }, this, "playback");
        this.__keyword = new ObservedPropertySimplePU('', this, "keyword");
        this.__subtitleResults = new ObservedPropertySimplePU('', this, "subtitleResults");
        this.__activeSubtitleText = new ObservedPropertySimplePU('', this, "activeSubtitleText");
        this.__subtitleCues = new ObservedPropertyObjectPU([], this, "subtitleCues");
        this.__lyricLines = new ObservedPropertyObjectPU([], this, "lyricLines");
        this.__currentLyricIndex = new ObservedPropertySimplePU(-1, this, "currentLyricIndex");
        this.__statusMessage = new ObservedPropertySimplePU('准备就绪', this, "statusMessage");
        this.horizontalScroller = new Scroller();
        this.aliyunPollingTimer = -1;
        this.aliyunPollingInFlight = false;
        this.playbackRefreshTimer = -1;
        this.videoSurfaceController = new XComponentController();
        this.videoSurfaceId = '';
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Index_Params) {
        if (params.currentSection !== undefined) {
            this.currentSection = params.currentSection;
        }
        if (params.selectedMedia !== undefined) {
            this.selectedMedia = params.selectedMedia;
        }
        if (params.library !== undefined) {
            this.library = params.library;
        }
        if (params.continueWatching !== undefined) {
            this.continueWatching = params.continueWatching;
        }
        if (params.recentlyAdded !== undefined) {
            this.recentlyAdded = params.recentlyAdded;
        }
        if (params.storages !== undefined) {
            this.storages = params.storages;
        }
        if (params.sources !== undefined) {
            this.sources = params.sources;
        }
        if (params.activeSourceId !== undefined) {
            this.activeSourceId = params.activeSourceId;
        }
        if (params.sourceManagementView !== undefined) {
            this.sourceManagementView = params.sourceManagementView;
        }
        if (params.playbackExperienceOpen !== undefined) {
            this.playbackExperienceOpen = params.playbackExperienceOpen;
        }
        if (params.sourceBrowserEntries !== undefined) {
            this.sourceBrowserEntries = params.sourceBrowserEntries;
        }
        if (params.sourceBrowserName !== undefined) {
            this.sourceBrowserName = params.sourceBrowserName;
        }
        if (params.sourceBrowserStorageType !== undefined) {
            this.sourceBrowserStorageType = params.sourceBrowserStorageType;
        }
        if (params.sourceBrowserCurrentFolderId !== undefined) {
            this.sourceBrowserCurrentFolderId = params.sourceBrowserCurrentFolderId;
        }
        if (params.sourceBreadcrumbs !== undefined) {
            this.sourceBreadcrumbs = params.sourceBreadcrumbs;
        }
        if (params.sourceBrowserFilter !== undefined) {
            this.sourceBrowserFilter = params.sourceBrowserFilter;
        }
        if (params.sourceBrowserViewMode !== undefined) {
            this.sourceBrowserViewMode = params.sourceBrowserViewMode;
        }
        if (params.sourceBrowserNextMarker !== undefined) {
            this.sourceBrowserNextMarker = params.sourceBrowserNextMarker;
        }
        if (params.sourceBrowserSearchQuery !== undefined) {
            this.sourceBrowserSearchQuery = params.sourceBrowserSearchQuery;
        }
        if (params.settings !== undefined) {
            this.settings = params.settings;
        }
        if (params.aliyunStatus !== undefined) {
            this.aliyunStatus = params.aliyunStatus;
        }
        if (params.aliyunQrSession !== undefined) {
            this.aliyunQrSession = params.aliyunQrSession;
        }
        if (params.playback !== undefined) {
            this.playback = params.playback;
        }
        if (params.keyword !== undefined) {
            this.keyword = params.keyword;
        }
        if (params.subtitleResults !== undefined) {
            this.subtitleResults = params.subtitleResults;
        }
        if (params.activeSubtitleText !== undefined) {
            this.activeSubtitleText = params.activeSubtitleText;
        }
        if (params.subtitleCues !== undefined) {
            this.subtitleCues = params.subtitleCues;
        }
        if (params.lyricLines !== undefined) {
            this.lyricLines = params.lyricLines;
        }
        if (params.currentLyricIndex !== undefined) {
            this.currentLyricIndex = params.currentLyricIndex;
        }
        if (params.statusMessage !== undefined) {
            this.statusMessage = params.statusMessage;
        }
        if (params.horizontalScroller !== undefined) {
            this.horizontalScroller = params.horizontalScroller;
        }
        if (params.aliyunPollingTimer !== undefined) {
            this.aliyunPollingTimer = params.aliyunPollingTimer;
        }
        if (params.aliyunPollingInFlight !== undefined) {
            this.aliyunPollingInFlight = params.aliyunPollingInFlight;
        }
        if (params.playbackRefreshTimer !== undefined) {
            this.playbackRefreshTimer = params.playbackRefreshTimer;
        }
        if (params.videoSurfaceController !== undefined) {
            this.videoSurfaceController = params.videoSurfaceController;
        }
        if (params.videoSurfaceId !== undefined) {
            this.videoSurfaceId = params.videoSurfaceId;
        }
    }
    updateStateVars(params: Index_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__currentSection.purgeDependencyOnElmtId(rmElmtId);
        this.__selectedMedia.purgeDependencyOnElmtId(rmElmtId);
        this.__library.purgeDependencyOnElmtId(rmElmtId);
        this.__continueWatching.purgeDependencyOnElmtId(rmElmtId);
        this.__recentlyAdded.purgeDependencyOnElmtId(rmElmtId);
        this.__storages.purgeDependencyOnElmtId(rmElmtId);
        this.__sources.purgeDependencyOnElmtId(rmElmtId);
        this.__activeSourceId.purgeDependencyOnElmtId(rmElmtId);
        this.__sourceManagementView.purgeDependencyOnElmtId(rmElmtId);
        this.__playbackExperienceOpen.purgeDependencyOnElmtId(rmElmtId);
        this.__sourceBrowserEntries.purgeDependencyOnElmtId(rmElmtId);
        this.__sourceBrowserName.purgeDependencyOnElmtId(rmElmtId);
        this.__sourceBrowserStorageType.purgeDependencyOnElmtId(rmElmtId);
        this.__sourceBrowserCurrentFolderId.purgeDependencyOnElmtId(rmElmtId);
        this.__sourceBreadcrumbs.purgeDependencyOnElmtId(rmElmtId);
        this.__sourceBrowserFilter.purgeDependencyOnElmtId(rmElmtId);
        this.__sourceBrowserViewMode.purgeDependencyOnElmtId(rmElmtId);
        this.__sourceBrowserNextMarker.purgeDependencyOnElmtId(rmElmtId);
        this.__sourceBrowserSearchQuery.purgeDependencyOnElmtId(rmElmtId);
        this.__settings.purgeDependencyOnElmtId(rmElmtId);
        this.__aliyunStatus.purgeDependencyOnElmtId(rmElmtId);
        this.__aliyunQrSession.purgeDependencyOnElmtId(rmElmtId);
        this.__playback.purgeDependencyOnElmtId(rmElmtId);
        this.__keyword.purgeDependencyOnElmtId(rmElmtId);
        this.__subtitleResults.purgeDependencyOnElmtId(rmElmtId);
        this.__activeSubtitleText.purgeDependencyOnElmtId(rmElmtId);
        this.__subtitleCues.purgeDependencyOnElmtId(rmElmtId);
        this.__lyricLines.purgeDependencyOnElmtId(rmElmtId);
        this.__currentLyricIndex.purgeDependencyOnElmtId(rmElmtId);
        this.__statusMessage.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__currentSection.aboutToBeDeleted();
        this.__selectedMedia.aboutToBeDeleted();
        this.__library.aboutToBeDeleted();
        this.__continueWatching.aboutToBeDeleted();
        this.__recentlyAdded.aboutToBeDeleted();
        this.__storages.aboutToBeDeleted();
        this.__sources.aboutToBeDeleted();
        this.__activeSourceId.aboutToBeDeleted();
        this.__sourceManagementView.aboutToBeDeleted();
        this.__playbackExperienceOpen.aboutToBeDeleted();
        this.__sourceBrowserEntries.aboutToBeDeleted();
        this.__sourceBrowserName.aboutToBeDeleted();
        this.__sourceBrowserStorageType.aboutToBeDeleted();
        this.__sourceBrowserCurrentFolderId.aboutToBeDeleted();
        this.__sourceBreadcrumbs.aboutToBeDeleted();
        this.__sourceBrowserFilter.aboutToBeDeleted();
        this.__sourceBrowserViewMode.aboutToBeDeleted();
        this.__sourceBrowserNextMarker.aboutToBeDeleted();
        this.__sourceBrowserSearchQuery.aboutToBeDeleted();
        this.__settings.aboutToBeDeleted();
        this.__aliyunStatus.aboutToBeDeleted();
        this.__aliyunQrSession.aboutToBeDeleted();
        this.__playback.aboutToBeDeleted();
        this.__keyword.aboutToBeDeleted();
        this.__subtitleResults.aboutToBeDeleted();
        this.__activeSubtitleText.aboutToBeDeleted();
        this.__subtitleCues.aboutToBeDeleted();
        this.__lyricLines.aboutToBeDeleted();
        this.__currentLyricIndex.aboutToBeDeleted();
        this.__statusMessage.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __currentSection: ObservedPropertySimplePU<SectionId>;
    get currentSection() {
        return this.__currentSection.get();
    }
    set currentSection(newValue: SectionId) {
        this.__currentSection.set(newValue);
    }
    private __selectedMedia: ObservedPropertyObjectPU<MediaItem | undefined>;
    get selectedMedia() {
        return this.__selectedMedia.get();
    }
    set selectedMedia(newValue: MediaItem | undefined) {
        this.__selectedMedia.set(newValue);
    }
    private __library: ObservedPropertyObjectPU<MediaItem[]>;
    get library() {
        return this.__library.get();
    }
    set library(newValue: MediaItem[]) {
        this.__library.set(newValue);
    }
    private __continueWatching: ObservedPropertyObjectPU<MediaItem[]>;
    get continueWatching() {
        return this.__continueWatching.get();
    }
    set continueWatching(newValue: MediaItem[]) {
        this.__continueWatching.set(newValue);
    }
    private __recentlyAdded: ObservedPropertyObjectPU<MediaItem[]>;
    get recentlyAdded() {
        return this.__recentlyAdded.get();
    }
    set recentlyAdded(newValue: MediaItem[]) {
        this.__recentlyAdded.set(newValue);
    }
    private __storages: ObservedPropertyObjectPU<StorageAccount[]>;
    get storages() {
        return this.__storages.get();
    }
    set storages(newValue: StorageAccount[]) {
        this.__storages.set(newValue);
    }
    private __sources: ObservedPropertyObjectPU<FileSourceItem[]>;
    get sources() {
        return this.__sources.get();
    }
    set sources(newValue: FileSourceItem[]) {
        this.__sources.set(newValue);
    }
    private __activeSourceId: ObservedPropertySimplePU<string>;
    get activeSourceId() {
        return this.__activeSourceId.get();
    }
    set activeSourceId(newValue: string) {
        this.__activeSourceId.set(newValue);
    }
    private __sourceManagementView: ObservedPropertySimplePU<'overview' | 'aliyun-auth'>;
    get sourceManagementView() {
        return this.__sourceManagementView.get();
    }
    set sourceManagementView(newValue: 'overview' | 'aliyun-auth') {
        this.__sourceManagementView.set(newValue);
    }
    private __playbackExperienceOpen: ObservedPropertySimplePU<boolean>;
    get playbackExperienceOpen() {
        return this.__playbackExperienceOpen.get();
    }
    set playbackExperienceOpen(newValue: boolean) {
        this.__playbackExperienceOpen.set(newValue);
    }
    private __sourceBrowserEntries: ObservedPropertyObjectPU<SourceBrowserEntry[]>;
    get sourceBrowserEntries() {
        return this.__sourceBrowserEntries.get();
    }
    set sourceBrowserEntries(newValue: SourceBrowserEntry[]) {
        this.__sourceBrowserEntries.set(newValue);
    }
    private __sourceBrowserName: ObservedPropertySimplePU<string>;
    get sourceBrowserName() {
        return this.__sourceBrowserName.get();
    }
    set sourceBrowserName(newValue: string) {
        this.__sourceBrowserName.set(newValue);
    }
    private __sourceBrowserStorageType: ObservedPropertySimplePU<'local' | 'aliyundrive'>;
    get sourceBrowserStorageType() {
        return this.__sourceBrowserStorageType.get();
    }
    set sourceBrowserStorageType(newValue: 'local' | 'aliyundrive') {
        this.__sourceBrowserStorageType.set(newValue);
    }
    private __sourceBrowserCurrentFolderId: ObservedPropertySimplePU<string>;
    get sourceBrowserCurrentFolderId() {
        return this.__sourceBrowserCurrentFolderId.get();
    }
    set sourceBrowserCurrentFolderId(newValue: string) {
        this.__sourceBrowserCurrentFolderId.set(newValue);
    }
    private __sourceBreadcrumbs: ObservedPropertyObjectPU<SourceBreadcrumbItem[]>;
    get sourceBreadcrumbs() {
        return this.__sourceBreadcrumbs.get();
    }
    set sourceBreadcrumbs(newValue: SourceBreadcrumbItem[]) {
        this.__sourceBreadcrumbs.set(newValue);
    }
    private __sourceBrowserFilter: ObservedPropertySimplePU<SourceBrowserFilter>;
    get sourceBrowserFilter() {
        return this.__sourceBrowserFilter.get();
    }
    set sourceBrowserFilter(newValue: SourceBrowserFilter) {
        this.__sourceBrowserFilter.set(newValue);
    }
    private __sourceBrowserViewMode: ObservedPropertySimplePU<SourceBrowserViewMode>;
    get sourceBrowserViewMode() {
        return this.__sourceBrowserViewMode.get();
    }
    set sourceBrowserViewMode(newValue: SourceBrowserViewMode) {
        this.__sourceBrowserViewMode.set(newValue);
    }
    private __sourceBrowserNextMarker: ObservedPropertySimplePU<string>;
    get sourceBrowserNextMarker() {
        return this.__sourceBrowserNextMarker.get();
    }
    set sourceBrowserNextMarker(newValue: string) {
        this.__sourceBrowserNextMarker.set(newValue);
    }
    private __sourceBrowserSearchQuery: ObservedPropertySimplePU<string>;
    get sourceBrowserSearchQuery() {
        return this.__sourceBrowserSearchQuery.get();
    }
    set sourceBrowserSearchQuery(newValue: string) {
        this.__sourceBrowserSearchQuery.set(newValue);
    }
    private __settings: ObservedPropertyObjectPU<AppSettings>;
    get settings() {
        return this.__settings.get();
    }
    set settings(newValue: AppSettings) {
        this.__settings.set(newValue);
    }
    private __aliyunStatus: ObservedPropertyObjectPU<AliyunDriveStatus>;
    get aliyunStatus() {
        return this.__aliyunStatus.get();
    }
    set aliyunStatus(newValue: AliyunDriveStatus) {
        this.__aliyunStatus.set(newValue);
    }
    private __aliyunQrSession: ObservedPropertyObjectPU<AliyunQrSession>;
    get aliyunQrSession() {
        return this.__aliyunQrSession.get();
    }
    set aliyunQrSession(newValue: AliyunQrSession) {
        this.__aliyunQrSession.set(newValue);
    }
    private __playback: ObservedPropertyObjectPU<PlaybackSession>;
    get playback() {
        return this.__playback.get();
    }
    set playback(newValue: PlaybackSession) {
        this.__playback.set(newValue);
    }
    private __keyword: ObservedPropertySimplePU<string>;
    get keyword() {
        return this.__keyword.get();
    }
    set keyword(newValue: string) {
        this.__keyword.set(newValue);
    }
    private __subtitleResults: ObservedPropertySimplePU<string>;
    get subtitleResults() {
        return this.__subtitleResults.get();
    }
    set subtitleResults(newValue: string) {
        this.__subtitleResults.set(newValue);
    }
    private __activeSubtitleText: ObservedPropertySimplePU<string>;
    get activeSubtitleText() {
        return this.__activeSubtitleText.get();
    }
    set activeSubtitleText(newValue: string) {
        this.__activeSubtitleText.set(newValue);
    }
    private __subtitleCues: ObservedPropertyObjectPU<Array<SubtitleCue>>;
    get subtitleCues() {
        return this.__subtitleCues.get();
    }
    set subtitleCues(newValue: Array<SubtitleCue>) {
        this.__subtitleCues.set(newValue);
    }
    private __lyricLines: ObservedPropertyObjectPU<Array<LyricLine>>;
    get lyricLines() {
        return this.__lyricLines.get();
    }
    set lyricLines(newValue: Array<LyricLine>) {
        this.__lyricLines.set(newValue);
    }
    private __currentLyricIndex: ObservedPropertySimplePU<number>;
    get currentLyricIndex() {
        return this.__currentLyricIndex.get();
    }
    set currentLyricIndex(newValue: number) {
        this.__currentLyricIndex.set(newValue);
    }
    private __statusMessage: ObservedPropertySimplePU<string>;
    get statusMessage() {
        return this.__statusMessage.get();
    }
    set statusMessage(newValue: string) {
        this.__statusMessage.set(newValue);
    }
    private horizontalScroller: Scroller;
    private aliyunPollingTimer: number;
    private aliyunPollingInFlight: boolean;
    private playbackRefreshTimer: number;
    private videoSurfaceController: XComponentController;
    private videoSurfaceId: string;
    aboutToAppear(): void {
        this.refreshSnapshot();
    }
    aboutToDisappear(): void {
        this.stopAliyunPolling();
        this.stopPlaybackRefresh();
    }
    private async refreshSnapshot(): Promise<void> {
        this.applySnapshot(await repository.bootstrap());
    }
    private applySnapshot(snapshot: OctovSnapshot): void {
        this.library = snapshot.library;
        this.continueWatching = snapshot.continueWatching;
        this.recentlyAdded = snapshot.recentlyAdded;
        this.storages = snapshot.storages;
        this.sources = snapshot.sources;
        this.settings = snapshot.settings;
        this.aliyunStatus = snapshot.aliyunStatus;
        this.aliyunQrSession = snapshot.aliyunQrSession;
        this.playback = snapshot.playback;
        this.applyThemeMode();
        this.updateTimedText();
    }
    private updateTimedText(): void {
        const currentSecond: number = this.playback.currentTime;
        let subtitleText: string = '';
        let subtitleIndex: number = 0;
        while (subtitleIndex < this.subtitleCues.length) {
            const cue: SubtitleCue = this.subtitleCues[subtitleIndex];
            if (currentSecond >= cue.startTime && currentSecond <= cue.endTime) {
                subtitleText = cue.text;
                break;
            }
            subtitleIndex += 1;
        }
        this.activeSubtitleText = subtitleText;
        let lyricIndex: number = -1;
        let lineIndex: number = 0;
        while (lineIndex < this.lyricLines.length) {
            if (currentSecond >= this.lyricLines[lineIndex].time) {
                lyricIndex = lineIndex;
            }
            else {
                break;
            }
            lineIndex += 1;
        }
        this.currentLyricIndex = lyricIndex;
    }
    private parseLrc(content: string): Array<LyricLine> {
        const result: Array<LyricLine> = [];
        const lines: Array<string> = content.split('\n');
        let index: number = 0;
        while (index < lines.length) {
            const line: string = lines[index];
            const matches: Array<RegExpMatchArray> = Array.from(line.matchAll(/\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g));
            const text: string = line.replace(/\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g, '').trim();
            if (matches.length > 0 && text.length > 0) {
                let matchIndex: number = 0;
                while (matchIndex < matches.length) {
                    const match: RegExpMatchArray = matches[matchIndex];
                    const min: number = parseInt(match[1], 10);
                    const sec: number = parseInt(match[2], 10);
                    const rawMs: string = match[3] === undefined ? '0' : match[3];
                    const divisor: number = rawMs.length === 3 ? 1000 : 100;
                    result.push({
                        time: min * 60 + sec + parseInt(rawMs, 10) / divisor,
                        text: text
                    });
                    matchIndex += 1;
                }
            }
            index += 1;
        }
        result.sort((left: LyricLine, right: LyricLine) => left.time - right.time);
        return result;
    }
    private async loadPlaybackTextData(item: MediaItem): Promise<void> {
        this.subtitleCues = [];
        this.activeSubtitleText = '';
        this.lyricLines = [];
        this.currentLyricIndex = -1;
        if (item.type === 'music') {
            const lyricContent: string = await repository.loadPlaybackLyrics(item);
            if (lyricContent.length > 0) {
                this.lyricLines = this.parseLrc(lyricContent);
            }
        }
        else {
            this.subtitleCues = await repository.loadPlaybackSubtitles(item);
            this.subtitleResults = this.subtitleCues.length > 0 ? '已加载字幕' : '';
        }
        this.updateTimedText();
    }
    private schedulePlaybackRefresh(): void {
        this.stopPlaybackRefresh();
        this.playbackRefreshTimer = setTimeout(async () => {
            if (!this.hasActivePlayback() && this.playback.status !== 'loading') {
                this.stopPlaybackRefresh();
                return;
            }
            this.applySnapshot(await repository.refreshPlayback());
            this.schedulePlaybackRefresh();
        }, 500);
    }
    private stopPlaybackRefresh(): void {
        if (this.playbackRefreshTimer >= 0) {
            clearTimeout(this.playbackRefreshTimer);
            this.playbackRefreshTimer = -1;
        }
    }
    private applyThemeMode(): void {
        const hostContext = this.getUIContext().getHostContext() as common.UIAbilityContext;
        if (hostContext === undefined) {
            return;
        }
        try {
            if (this.settings.theme === 'dark') {
                hostContext.setColorMode(ConfigurationConstant.ColorMode.COLOR_MODE_DARK);
            }
            else if (this.settings.theme === 'light') {
                hostContext.setColorMode(ConfigurationConstant.ColorMode.COLOR_MODE_LIGHT);
            }
            else {
                hostContext.setColorMode(ConfigurationConstant.ColorMode.COLOR_MODE_NOT_SET);
            }
        }
        catch (_error) {
            this.statusMessage = '主题已保存，系统色彩模式将在支持的环境中生效。';
        }
    }
    private useDarkPalette(): boolean {
        if (this.settings.theme === 'dark') {
            return true;
        }
        if (this.settings.theme === 'light') {
            return false;
        }
        const hostContext = this.getUIContext().getHostContext() as common.UIAbilityContext;
        if (hostContext !== undefined && hostContext.config.colorMode === ConfigurationConstant.ColorMode.COLOR_MODE_LIGHT) {
            return false;
        }
        return true;
    }
    private pageBackground(): string {
        return this.useDarkPalette() ? '#06111F' : '#F3F7FB';
    }
    private contentBackground(): string {
        return this.useDarkPalette() ? '#0A1628' : '#FFFFFF';
    }
    private sidebarBackground(): string {
        return this.useDarkPalette() ? '#08111D' : '#EAF0F8';
    }
    private cardBackground(): string {
        return this.useDarkPalette() ? '#111C2E' : '#F7FAFC';
    }
    private cardBackgroundStrong(): string {
        return this.useDarkPalette() ? '#0D1726' : '#EDF2F7';
    }
    private textPrimary(): string {
        return this.useDarkPalette() ? '#F8FAFC' : '#102136';
    }
    private textSecondary(): string {
        return this.useDarkPalette() ? '#94A3B8' : '#5B6B80';
    }
    private textMuted(): string {
        return this.useDarkPalette() ? '#64748B' : '#7B8798';
    }
    private accentBackground(): string {
        return '#2F6BFF';
    }
    private accentText(): string {
        return '#D6E4FF';
    }
    private successBackground(): string {
        return this.useDarkPalette() ? '#0F766E' : '#0F8A80';
    }
    private warningBackground(): string {
        return this.useDarkPalette() ? '#8A6116' : '#B88312';
    }
    private dangerBackground(): string {
        return this.useDarkPalette() ? '#7F1D1D' : '#B83232';
    }
    private playerBackground(): string {
        return this.useDarkPalette() ? '#091423' : '#E9F0F8';
    }
    private findCurrentSection(): NavigationSection {
        let index: number = 0;
        while (index < sections.length) {
            if (sections[index].id === this.currentSection) {
                return sections[index];
            }
            index += 1;
        }
        return sections[0];
    }
    private getSectionTitle(): string {
        return this.findCurrentSection().title;
    }
    private getSectionSubtitle(): string {
        return this.findCurrentSection().subtitle;
    }
    private visibleMedia(): MediaItem[] {
        let base: MediaItem[] = this.library;
        if (this.currentSection === 'movies') {
            base = this.filterByType('movie');
        }
        else if (this.currentSection === 'tvshows') {
            base = this.filterByType('tvshow');
        }
        else if (this.currentSection === 'music') {
            base = this.filterByType('music');
        }
        else if (this.currentSection === 'recent') {
            base = this.recentlyAdded;
        }
        const query: string = this.keyword.trim().toLowerCase();
        if (query.length === 0) {
            return base;
        }
        const filtered: MediaItem[] = [];
        let index: number = 0;
        while (index < base.length) {
            const item: MediaItem = base[index];
            let matched: boolean = item.title.toLowerCase().includes(query);
            if (!matched && item.originalTitle !== undefined) {
                matched = item.originalTitle.toLowerCase().includes(query);
            }
            if (!matched) {
                matched = item.genres.join(' ').toLowerCase().includes(query);
            }
            if (matched) {
                filtered.push(item);
            }
            index += 1;
        }
        return filtered;
    }
    private filterByType(type: string): MediaItem[] {
        const filtered: MediaItem[] = [];
        let index: number = 0;
        while (index < this.library.length) {
            const item: MediaItem = this.library[index];
            if (item.type === type) {
                filtered.push(item);
            }
            index += 1;
        }
        return filtered;
    }
    private musicItemsByFormat(format: string): MediaItem[] {
        const target: string = format.toLowerCase();
        const filtered: MediaItem[] = [];
        let index: number = 0;
        while (index < this.library.length) {
            const item: MediaItem = this.library[index];
            if (item.type === 'music' && (item.fileExt ?? '').toLowerCase() === target) {
                filtered.push(item);
            }
            index += 1;
        }
        return filtered;
    }
    private musicItems(): MediaItem[] {
        return this.filterByType('music');
    }
    private hasActivePlayback(): boolean {
        return this.playback.status !== 'idle' ||
            this.playback.currentTime > 0 ||
            this.playback.duration > 0 ||
            (this.playback.mediaId !== undefined && this.playback.mediaId.length > 0);
    }
    private currentPlaybackItem(): MediaItem | undefined {
        if (this.playback.mediaId !== undefined && this.playback.mediaId.length > 0) {
            let index: number = 0;
            while (index < this.library.length) {
                if (this.library[index].id === this.playback.mediaId) {
                    return this.library[index];
                }
                index += 1;
            }
        }
        if (this.playback.cloudFileId !== undefined && this.playback.cloudFileId.length > 0) {
            let index: number = 0;
            while (index < this.library.length) {
                if (this.library[index].cloudFileId === this.playback.cloudFileId) {
                    return this.library[index];
                }
                index += 1;
            }
        }
        let index: number = 0;
        while (index < this.library.length) {
            if (this.library[index].title === this.playback.title) {
                return this.library[index];
            }
            index += 1;
        }
        return undefined;
    }
    private isMusicPlayback(): boolean {
        const item: MediaItem | undefined = this.currentPlaybackItem();
        return item !== undefined && item.type === 'music';
    }
    private formatPlaybackTime(seconds: number): string {
        const safeSeconds: number = seconds < 0 ? 0 : Math.floor(seconds);
        const hours: number = Math.floor(safeSeconds / 3600);
        const minutes: number = Math.floor((safeSeconds % 3600) / 60);
        const remain: number = safeSeconds % 60;
        if (hours > 0) {
            return hours.toString() + ':' + minutes.toString().padStart(2, '0') + ':' + remain.toString().padStart(2, '0');
        }
        return minutes.toString() + ':' + remain.toString().padStart(2, '0');
    }
    private playbackTitle(): string {
        return this.playback.title.length > 0 ? this.playback.title : 'Player';
    }
    private playbackSubtitle(): string {
        const item: MediaItem | undefined = this.currentPlaybackItem();
        if (item !== undefined) {
            if (item.type === 'music') {
                return (item.fileExt === undefined ? 'MUSIC' : item.fileExt.toUpperCase()) + ' | ' + item.sourceName;
            }
            const yearText: string = item.year === undefined ? '--' : item.year.toString();
            return yearText + ' | ' + item.sourceName;
        }
        return this.playback.sourceLabel;
    }
    private playbackStageLabel(): string {
        const item: MediaItem | undefined = this.currentPlaybackItem();
        if (item === undefined) {
            return 'PLAYER';
        }
        if (item.type === 'music') {
            return 'MUSIC';
        }
        if (item.type === 'tvshow') {
            return 'TV';
        }
        return 'VIDEO';
    }
    private musicPlaybackIndex(): number {
        const item: MediaItem | undefined = this.currentPlaybackItem();
        if (item === undefined) {
            return -1;
        }
        const tracks: MediaItem[] = this.musicItems();
        let index: number = 0;
        while (index < tracks.length) {
            if (tracks[index].id === item.id) {
                return index;
            }
            index += 1;
        }
        return -1;
    }
    private canPlayPreviousInExperience(): boolean {
        if (this.isMusicPlayback()) {
            return this.musicPlaybackIndex() > 0;
        }
        return this.playback.playlistIndex > 0;
    }
    private canPlayNextInExperience(): boolean {
        if (this.isMusicPlayback()) {
            const index: number = this.musicPlaybackIndex();
            return index >= 0 && index < this.musicItems().length - 1;
        }
        return this.playback.playlistIndex >= 0 && this.playback.playlistIndex < this.playback.playlist.length - 1;
    }
    private setTheme(theme: 'system' | 'light' | 'dark'): void {
        this.settings.theme = theme;
    }
    private aliyunStateLabel(): string {
        if (this.aliyunQrSession.state === 'loading') {
            return '正在获取二维码';
        }
        if (this.aliyunQrSession.state === 'waiting') {
            return '等待扫码';
        }
        if (this.aliyunQrSession.state === 'scanned') {
            return '已扫码，等待手机确认';
        }
        if (this.aliyunQrSession.state === 'success') {
            return '授权成功';
        }
        if (this.aliyunQrSession.state === 'expired') {
            return '二维码已过期';
        }
        if (this.aliyunQrSession.state === 'error') {
            return '授权出错';
        }
        return '未开始';
    }
    private shouldContinueAliyunPolling(): boolean {
        return this.aliyunQrSession.state === 'waiting' || this.aliyunQrSession.state === 'scanned';
    }
    private stopAliyunPolling(): void {
        if (this.aliyunPollingTimer >= 0) {
            clearTimeout(this.aliyunPollingTimer);
            this.aliyunPollingTimer = -1;
        }
    }
    private scheduleAliyunPolling(): void {
        if (!this.shouldContinueAliyunPolling()) {
            this.stopAliyunPolling();
            return;
        }
        if (this.aliyunPollingTimer >= 0) {
            clearTimeout(this.aliyunPollingTimer);
        }
        this.aliyunPollingTimer = setTimeout(() => {
            this.pollAliyunQrCodeStatus(true);
        }, 2000);
    }
    private aliyunGuideText(): string {
        if (this.aliyunStatus.isLoggedIn) {
            return '阿里云盘已连接，后续会继续补齐文件浏览、扫描与播放链路。';
        }
        if (this.aliyunQrSession.state === 'scanned') {
            return '第 3 步：请在手机上的阿里云盘 App 中确认授权，应用会自动继续。';
        }
        if (this.aliyunQrSession.state === 'expired') {
            return '二维码已过期，请重新获取二维码。';
        }
        if (this.aliyunQrSession.state === 'error') {
            return '授权流程中断，请检查凭据后重新获取二维码。';
        }
        if (this.aliyunQrSession.qrCodeUrl.length > 0) {
            return '第 2 步：请使用阿里云盘 App 扫描二维码，页面会自动轮询授权结果。';
        }
        return '第 1 步：确认 client_id 和 client_secret 无误，然后点击“获取二维码”。';
    }
    private async rescanSources(): Promise<void> {
        this.statusMessage = '正在重新扫描媒体源...';
        this.applySnapshot(await repository.rescanSources());
        this.statusMessage = '媒体源扫描完成。';
    }
    private async addLocalSource(): Promise<void> {
        const payload = await repository.addLocalSourceFromPicker();
        this.applySnapshot(payload.snapshot);
        this.statusMessage = payload.result.message;
    }
    private sourceEntries(): SourceBrowserEntry[] {
        const result: SourceBrowserEntry[] = [];
        let index: number = 0;
        const keyword: string = this.keyword.trim().toLowerCase();
        while (index < this.sourceBrowserEntries.length) {
            const entry: SourceBrowserEntry = this.sourceBrowserEntries[index];
            let accepted: boolean = this.sourceBrowserFilter === 'all';
            if (this.sourceBrowserFilter === 'folder') {
                accepted = entry.type === 'folder';
            }
            else if (this.sourceBrowserFilter === 'video') {
                accepted = entry.type === 'video';
            }
            else if (this.sourceBrowserFilter === 'music') {
                accepted = entry.type === 'audio';
            }
            if (accepted && keyword.length > 0) {
                accepted = entry.name.toLowerCase().includes(keyword);
            }
            if (accepted) {
                result.push(entry);
            }
            index += 1;
        }
        return result;
    }
    private async openSourceBrowser(source: FileSourceItem, folderId?: string): Promise<void> {
        const snapshot: SourceBrowserSnapshot = await repository.browseSource(source.id, folderId);
        this.activeSourceId = snapshot.sourceId;
        this.sourceBrowserEntries = snapshot.entries;
        this.sourceBrowserName = snapshot.sourceName;
        this.sourceBrowserStorageType = snapshot.storageType;
        this.sourceBrowserCurrentFolderId = snapshot.currentFolderId;
        this.sourceBreadcrumbs = snapshot.breadcrumbs;
        this.sourceBrowserFilter = 'all';
        this.sourceBrowserNextMarker = snapshot.nextMarker === undefined ? '' : snapshot.nextMarker;
        this.sourceBrowserSearchQuery = '';
        this.statusMessage = '已打开文件源：' + snapshot.sourceName;
    }
    private closeSourceBrowser(): void {
        this.activeSourceId = '';
        this.sourceBrowserEntries = [];
        this.sourceBrowserName = '';
        this.sourceBrowserCurrentFolderId = '';
        this.sourceBreadcrumbs = [];
        this.sourceBrowserFilter = 'all';
        this.sourceBrowserNextMarker = '';
        this.sourceBrowserSearchQuery = '';
        this.statusMessage = '已返回文件源概览。';
    }
    private async browseSourceFolder(entry: SourceBrowserEntry): Promise<void> {
        const source: FileSourceItem = this.findSourceById(entry.sourceId);
        await this.openSourceBrowser(source, entry.path);
    }
    private async loadMoreSourceBrowser(): Promise<void> {
        if (this.activeSourceId.length === 0 || this.sourceBrowserNextMarker.length === 0) {
            return;
        }
        const snapshot: SourceBrowserSnapshot = await repository.loadMoreSource(this.activeSourceId, this.sourceBrowserCurrentFolderId, this.sourceBrowserNextMarker);
        this.sourceBrowserEntries = this.sourceBrowserEntries.concat(snapshot.entries);
        this.sourceBrowserNextMarker = snapshot.nextMarker === undefined ? '' : snapshot.nextMarker;
        this.statusMessage = '已加载更多云盘文件。';
    }
    private async searchSourceBrowser(): Promise<void> {
        if (this.activeSourceId.length === 0) {
            return;
        }
        const query: string = this.sourceBrowserSearchQuery.trim();
        if (query.length === 0) {
            const source: FileSourceItem = this.findSourceById(this.activeSourceId);
            await this.openSourceBrowser(source, this.sourceBrowserCurrentFolderId);
            return;
        }
        const snapshot: SourceBrowserSnapshot = await repository.searchSource(this.activeSourceId, query);
        this.sourceBrowserEntries = snapshot.entries;
        this.sourceBreadcrumbs = snapshot.breadcrumbs;
        this.sourceBrowserCurrentFolderId = snapshot.currentFolderId;
        this.sourceBrowserNextMarker = snapshot.nextMarker === undefined ? '' : snapshot.nextMarker;
        this.statusMessage = '已搜索云盘文件：' + query;
    }
    private async removeSource(source: FileSourceItem): Promise<void> {
        this.applySnapshot(repository.removeSource(source.id));
        if (this.activeSourceId === source.id) {
            this.closeSourceBrowser();
        }
        this.statusMessage = '已移除文件源：' + source.name;
    }
    private findSourceById(sourceId: string): FileSourceItem {
        let index: number = 0;
        while (index < this.sources.length) {
            if (this.sources[index].id === sourceId) {
                return this.sources[index];
            }
            index += 1;
        }
        return this.sources[0];
    }
    private async openMedia(item: MediaItem): Promise<void> {
        this.playbackExperienceOpen = true;
        this.applySnapshot(await repository.openMedia(item));
        await this.loadPlaybackTextData(item);
        this.schedulePlaybackRefresh();
        this.statusMessage = '已为 ' + item.title + ' 打开播放会话。';
    }
    private closePlaybackExperience(): void {
        this.playbackExperienceOpen = false;
        this.stopPlaybackRefresh();
    }
    private async attachPlaybackSurface(): Promise<void> {
        if (this.videoSurfaceId.length === 0) {
            return;
        }
        this.applySnapshot(await repository.attachPlaybackSurface(this.videoSurfaceId));
        this.schedulePlaybackRefresh();
    }
    private async playPreviousInExperience(): Promise<void> {
        if (this.isMusicPlayback()) {
            const index: number = this.musicPlaybackIndex();
            if (index > 0) {
                await this.openMedia(this.musicItems()[index - 1]);
            }
            return;
        }
        await this.playPreviousCloudItem();
    }
    private async playNextInExperience(): Promise<void> {
        if (this.isMusicPlayback()) {
            const index: number = this.musicPlaybackIndex();
            const tracks: MediaItem[] = this.musicItems();
            if (index >= 0 && index < tracks.length - 1) {
                await this.openMedia(tracks[index + 1]);
            }
            return;
        }
        await this.playNextCloudItem();
    }
    private async requestAliyunQrCode(): Promise<void> {
        this.stopAliyunPolling();
        this.statusMessage = '正在获取阿里云盘二维码...';
        this.applySnapshot(await repository.requestAliyunQrCode());
        this.statusMessage = this.aliyunQrSession.statusText;
        if (this.shouldContinueAliyunPolling()) {
            this.scheduleAliyunPolling();
        }
    }
    private openAliyunAuthPage(): void {
        this.sourceManagementView = 'aliyun-auth';
        this.statusMessage = this.aliyunStatus.isLoggedIn ? '正在查看阿里云盘连接状态。' : '请按页面步骤完成阿里云盘授权。';
    }
    private closeAliyunAuthPage(): void {
        this.sourceManagementView = 'overview';
        this.statusMessage = '已返回媒体源概览。';
    }
    private saveAliyunCredentials(): void {
        this.stopAliyunPolling();
        this.applySnapshot(repository.updateAliyunCredentials(this.settings.aliyunClientId, this.settings.aliyunClientSecret));
        this.statusMessage = '阿里云盘凭据已更新。';
    }
    private async startAliyunAuthorization(): Promise<void> {
        this.saveAliyunCredentials();
        await this.requestAliyunQrCode();
    }
    private findFirstAliyunSource(): FileSourceItem | undefined {
        let index: number = 0;
        while (index < this.sources.length) {
            if (this.sources[index].storageType === 'aliyundrive') {
                return this.sources[index];
            }
            index += 1;
        }
        return undefined;
    }
    private async openAliyunSourceRoot(): Promise<void> {
        const source: FileSourceItem | undefined = this.findFirstAliyunSource();
        if (source === undefined) {
            this.statusMessage = '当前还没有可浏览的阿里云盘媒体源。';
            this.currentSection = 'sources';
            this.sourceManagementView = 'overview';
            return;
        }
        this.currentSection = 'sources';
        this.sourceManagementView = 'overview';
        await this.openSourceBrowser(source);
        this.statusMessage = '已打开阿里云盘媒体源。';
    }
    private async pollAliyunQrCodeStatus(fromPolling: boolean = false): Promise<void> {
        if (this.aliyunPollingInFlight) {
            return;
        }
        this.aliyunPollingInFlight = true;
        if (!fromPolling) {
            this.statusMessage = '正在检查阿里云盘扫码状态...';
        }
        try {
            this.applySnapshot(await repository.pollAliyunQrCodeStatus());
            this.statusMessage = this.aliyunQrSession.statusText;
            if (this.shouldContinueAliyunPolling()) {
                this.scheduleAliyunPolling();
            }
            else {
                this.stopAliyunPolling();
            }
        }
        finally {
            this.aliyunPollingInFlight = false;
        }
    }
    private async playCurrent(): Promise<void> {
        this.applySnapshot(await repository.playCurrentMedia());
        this.schedulePlaybackRefresh();
    }
    private async pauseCurrent(): Promise<void> {
        this.applySnapshot(await repository.pauseCurrentMedia());
    }
    private async stopCurrent(): Promise<void> {
        this.applySnapshot(await repository.stopCurrentMedia());
        this.playbackExperienceOpen = false;
        this.stopPlaybackRefresh();
        this.activeSubtitleText = '';
    }
    private async seekCurrent(progress: number): Promise<void> {
        this.applySnapshot(await repository.seekCurrentMedia(progress));
    }
    private async playPreviousCloudItem(): Promise<void> {
        this.applySnapshot(await repository.playPreviousCloudItem());
        this.schedulePlaybackRefresh();
    }
    private async playNextCloudItem(): Promise<void> {
        this.applySnapshot(await repository.playNextCloudItem());
        this.schedulePlaybackRefresh();
    }
    private async selectPlaybackQuality(qualityId: string): Promise<void> {
        this.applySnapshot(await repository.selectPlaybackQuality(qualityId));
        this.schedulePlaybackRefresh();
    }
    private async searchSubtitles(item: MediaItem): Promise<void> {
        this.statusMessage = '正在搜索字幕：' + item.title;
        let season: number | undefined = undefined;
        let episode: number | undefined = undefined;
        if (item.seasons.length > 0) {
            season = item.seasons[0].seasonNumber;
            if (item.seasons[0].episodes.length > 0) {
                episode = item.seasons[0].episodes[0].episode;
            }
        }
        const results = await repository.searchSubtitles(item.title, item.tmdbId, season, episode);
        if (results.length === 0) {
            this.subtitleResults = '没有找到可用字幕。';
        }
        else {
            let content: string = '';
            let index: number = 0;
            while (index < results.length && index < 6) {
                const row = results[index].languageName + ' | ' + results[index].fileName + ' | ' + results[index].source;
                if (index === 0) {
                    content = row;
                }
                else {
                    content = content + '\n' + row;
                }
                index += 1;
            }
            this.subtitleResults = content;
        }
        this.statusMessage = '字幕搜索完成。';
    }
    private mediaItemFromSourceEntry(entry: SourceBrowserEntry): MediaItem {
        const parts: Array<string> = entry.name.split('.');
        return {
            id: entry.mediaId === undefined || entry.mediaId.length === 0 ? entry.id : entry.mediaId,
            title: parts.length > 1 ? entry.name.substring(0, entry.name.length - parts[parts.length - 1].length - 1) : entry.name,
            type: entry.type === 'audio' ? 'music' : 'movie',
            poster: '',
            genres: [],
            dateAdded: entry.updatedAt,
            filePath: entry.filePath,
            source: entry.storageType,
            sourceId: entry.sourceId,
            sourceName: this.sourceBrowserName,
            cloudFileId: entry.cloudFileId,
            seasons: [],
            fileExt: parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
        };
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.height('100%');
            Row.backgroundColor(this.pageBackground());
        }, Row);
        this.Sidebar.bind(this)();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.layoutWeight(1);
            Column.height('100%');
            Column.backgroundColor(this.contentBackground());
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (!this.playbackExperienceOpen) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.TopBar.bind(this)();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.layoutWeight(1);
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.playbackExperienceOpen && this.hasActivePlayback()) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.PlaybackExperiencePanel.bind(this)();
                });
            }
            else if (this.selectedMedia !== undefined) {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.DetailPanel.bind(this)(ObservedObject.GetRawObject(this.selectedMedia));
                });
            }
            else {
                this.ifElseBranchUpdateFunction(2, () => {
                    this.SectionPanel.bind(this)();
                });
            }
        }, If);
        If.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (!this.playbackExperienceOpen) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.PlayerDock.bind(this)();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.CompactPlaybackStatus.bind(this)();
                });
            }
        }, If);
        If.pop();
        this.BottomStatus.bind(this)();
        Column.pop();
        Row.pop();
    }
    private Sidebar(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 10 });
            Column.width(292);
            Column.height('100%');
            Column.padding({ left: 18, right: 18, top: 28, bottom: 24 });
            Column.backgroundColor(this.sidebarBackground());
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.alignItems(HorizontalAlign.Start);
            Column.margin({ bottom: 18 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Octov HM');
            Text.fontSize(28);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('HarmonyOS 功能迁移工作区');
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const section = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Button.createWithChild();
                    Button.type(ButtonType.Normal);
                    Button.backgroundColor(this.currentSection === section.id ? this.accentBackground() : this.cardBackground());
                    Button.borderRadius(18);
                    Button.width('100%');
                    Button.onClick(() => {
                        this.currentSection = section.id;
                        this.selectedMedia = undefined;
                        this.subtitleResults = '';
                    });
                }, Button);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 2 });
                    Column.alignItems(HorizontalAlign.Start);
                    Column.width('100%');
                    Column.padding(16);
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(section.title);
                    Text.fontSize(16);
                    Text.fontWeight(this.currentSection === section.id ? FontWeight.Bold : FontWeight.Medium);
                    Text.fontColor(this.textPrimary());
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(section.subtitle);
                    Text.fontSize(11);
                    Text.fontColor(this.currentSection === section.id ? this.accentText() : this.textMuted());
                }, Text);
                Text.pop();
                Column.pop();
                Button.pop();
            };
            this.forEachUpdateFunction(elmtId, sections, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 8 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding(16);
            Column.width('100%');
            Column.backgroundColor(this.cardBackground());
            Column.borderRadius(18);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('阿里云盘状态');
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.aliyunStatus.isLoggedIn ? '已连接：' + (this.aliyunStatus.userName ?? '未命名账号') : '尚未授权');
            Text.fontSize(14);
            Text.fontColor(this.textPrimary());
            Text.maxLines(2);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.aliyunStateLabel());
            Text.fontSize(12);
            Text.fontColor('#7DD3FC');
        }, Text);
        Text.pop();
        Column.pop();
        Column.pop();
    }
    private TopBar(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 16 });
            Row.padding({ left: 28, right: 28, top: 22, bottom: 18 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.getSectionTitle());
            Text.fontSize(30);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.getSectionSubtitle());
            Text.fontSize(13);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ text: this.keyword, placeholder: '搜索片名、原名或类型' });
            TextInput.width('34%');
            TextInput.height(44);
            TextInput.backgroundColor(this.cardBackground());
            TextInput.fontColor(this.textPrimary());
            TextInput.placeholderColor(this.textMuted());
            TextInput.borderRadius(16);
            TextInput.onChange((value: string) => {
                this.keyword = value;
            });
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('重新扫描');
            Button.height(44);
            Button.padding({ left: 18, right: 18 });
            Button.backgroundColor(this.accentBackground());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.rescanSources();
            });
        }, Button);
        Button.pop();
        Row.pop();
    }
    private SectionPanel(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.currentSection === 'home') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.HomePanel.bind(this)();
                });
            }
            else if (this.currentSection === 'music') {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.MusicPanel.bind(this)();
                });
            }
            else if (this.currentSection === 'sources') {
                this.ifElseBranchUpdateFunction(2, () => {
                    this.SourcesPanel.bind(this)();
                });
            }
            else if (this.currentSection === 'settings') {
                this.ifElseBranchUpdateFunction(3, () => {
                    this.SettingsPanel.bind(this)();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(4, () => {
                    this.LibraryPanel.bind(this)(this.visibleMedia(), '媒体库');
                });
            }
        }, If);
        If.pop();
    }
    private HomePanel(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.scrollBar(BarState.Off);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 22 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding({ left: 28, right: 28, bottom: 28 });
            Column.width('100%');
        }, Column);
        this.InfoBanner.bind(this)('迁移目标', 'hm 分支会继续对齐 dev 分支功能能力，界面遵循 HarmonyOS 风格，但媒体源、授权、播放与扫描链路保持一致。');
        this.RowSection.bind(this)('继续观看', ObservedObject.GetRawObject(this.continueWatching));
        this.RowSection.bind(this)('最近新增', ObservedObject.GetRawObject(this.recentlyAdded));
        this.LibraryGrid.bind(this)(this.visibleMedia(), '精选内容');
        Column.pop();
        Scroll.pop();
    }
    private RowSection(title: string, items: MediaItem[], parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 14 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(title);
            Text.fontSize(20);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(items.length.toString() + ' 项');
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create(this.horizontalScroller);
            Scroll.scrollable(ScrollDirection.Horizontal);
            Scroll.scrollBar(BarState.Off);
            Scroll.width('100%');
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 14 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const item = _item;
                this.MediaCard.bind(this)(item, 220, 300);
            };
            this.forEachUpdateFunction(elmtId, items, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        Scroll.pop();
        Column.pop();
    }
    private LibraryPanel(items: MediaItem[], title: string, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.scrollBar(BarState.Off);
        }, Scroll);
        this.LibraryGrid.bind(this)(items, title);
        Scroll.pop();
    }
    private MusicPanel(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.scrollBar(BarState.Off);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 18 });
            Column.alignItems(HorizontalAlign.Start);
            Column.width('100%');
        }, Column);
        this.LibraryGrid.bind(this)(this.musicItemsByFormat('flac'), 'FLAC');
        this.LibraryGrid.bind(this)(this.musicItemsByFormat('wav'), 'WAV');
        this.LibraryGrid.bind(this)(this.musicItemsByFormat('mp3'), 'MP3');
        Column.pop();
        Scroll.pop();
    }
    private LibraryGrid(items: MediaItem[], title: string, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding({ left: 28, right: 28, bottom: 28 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(title);
            Text.fontSize(20);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(items.length.toString() + ' 条');
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Flex.create({ wrap: FlexWrap.Wrap, justifyContent: FlexAlign.Start, alignItems: ItemAlign.Start });
            Flex.width('100%');
        }, Flex);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const item = _item;
                this.MediaCard.bind(this)(item, 228, 316);
            };
            this.forEachUpdateFunction(elmtId, items, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Flex.pop();
        Column.pop();
    }
    private MediaCard(item: MediaItem, width: number, height: number, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithChild();
            Button.type(ButtonType.Normal);
            Button.width(width);
            Button.height(height);
            Button.margin({ right: 16, bottom: 16 });
            Button.backgroundColor(this.cardBackgroundStrong());
            Button.borderRadius(26);
            Button.onClick(() => {
                this.selectedMedia = item;
                this.subtitleResults = '';
            });
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 10 });
            Column.width(width);
            Column.padding(10);
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create({ alignContent: Alignment.BottomStart });
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (item.poster.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Image.create(item.poster);
                        Image.width(width);
                        Image.height(height - 96);
                        Image.objectFit(ImageFit.Cover);
                        Image.borderRadius(22);
                    }, Image);
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.width(width);
                        Column.height(height - 96);
                        Column.justifyContent(FlexAlign.Center);
                        Column.backgroundColor(this.cardBackgroundStrong());
                        Column.borderRadius(22);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(item.type === 'music' ? 'MUSIC' : item.type === 'tvshow' ? 'TV' : 'MOVIE');
                        Text.fontSize(22);
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor(this.textPrimary());
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (item.progress !== undefined && item.progress.percentage > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.padding({ left: 10, right: 10, top: 6, bottom: 6 });
                        Row.backgroundColor('#132B6B');
                        Row.borderRadius(999);
                        Row.margin({ left: 12, bottom: 12 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('已观看 ' + item.progress.percentage.toString() + '%');
                        Text.fontSize(11);
                        Text.fontColor('#F8FAFC');
                    }, Text);
                    Text.pop();
                    Row.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Stack.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 5 });
            Column.alignItems(HorizontalAlign.Start);
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(item.title);
            Text.fontSize(15);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
            Text.maxLines(1);
            Text.textOverflow({ overflow: TextOverflow.Ellipsis });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create((item.year === undefined ? '--' : item.year.toString()) + ' | ' + item.genres.join(' / '));
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
            Text.maxLines(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(item.sourceName);
            Text.fontSize(11);
            Text.fontColor('#7DD3FC');
            Text.maxLines(1);
        }, Text);
        Text.pop();
        Column.pop();
        Column.pop();
        Button.pop();
    }
    private DetailPanel(item: MediaItem, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.scrollBar(BarState.Off);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 18 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding(28);
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('返回');
            Button.backgroundColor(this.cardBackground());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.selectedMedia = undefined;
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('搜索字幕');
            Button.backgroundColor(this.accentBackground());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.searchSubtitles(item);
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(item.source === 'aliyundrive' ? '打开云盘播放会话' : '打开本地播放会话');
            Button.backgroundColor(this.successBackground());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.openMedia(item);
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 22 });
            Row.alignItems(VerticalAlign.Top);
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (item.poster.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Image.create(item.poster);
                        Image.width(280);
                        Image.height(420);
                        Image.objectFit(ImageFit.Cover);
                        Image.borderRadius(28);
                    }, Image);
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.width(280);
                        Column.height(420);
                        Column.justifyContent(FlexAlign.Center);
                        Column.backgroundColor(this.cardBackgroundStrong());
                        Column.borderRadius(28);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(item.type.toUpperCase());
                        Text.fontSize(28);
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor(this.textPrimary());
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 14 });
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(item.title);
            Text.fontSize(34);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (item.originalTitle !== undefined) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(item.originalTitle);
                        Text.fontSize(15);
                        Text.fontColor('#A5B4FC');
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create((item.year === undefined ? '--' : item.year.toString()) + ' | ' + item.genres.join(' / ') + ' | ' +
                (item.duration === undefined ? '--' : item.duration.toString()) + ' min');
            Text.fontSize(14);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('来源：' + item.sourceName);
            Text.fontSize(13);
            Text.fontColor('#7DD3FC');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (item.rating !== undefined) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('评分 ' + item.rating.toFixed(1));
                        Text.fontSize(13);
                        Text.fontColor('#FBBF24');
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(item.overview === undefined ? '暂无简介。' : item.overview);
            Text.fontSize(14);
            Text.fontColor(this.textSecondary());
            Text.lineHeight(22);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (item.progress !== undefined && item.progress.percentage > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('观看进度 ' + item.progress.percentage.toString() + '%');
                        Text.fontSize(13);
                        Text.fontColor('#93C5FD');
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.subtitleResults.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 8 });
                        Column.alignItems(HorizontalAlign.Start);
                        Column.padding(18);
                        Column.width('100%');
                        Column.backgroundColor(this.cardBackground());
                        Column.borderRadius(22);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('字幕结果');
                        Text.fontSize(16);
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor(this.textPrimary());
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.subtitleResults);
                        Text.fontSize(13);
                        Text.fontColor(this.textSecondary());
                        Text.lineHeight(20);
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Column.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (item.seasons.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 12 });
                        Column.alignItems(HorizontalAlign.Start);
                        Column.width('100%');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('季与分集');
                        Text.fontSize(20);
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor(this.textPrimary());
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const season = _item;
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Column.create({ space: 10 });
                                Column.alignItems(HorizontalAlign.Start);
                                Column.padding(18);
                                Column.width('100%');
                                Column.backgroundColor(this.cardBackground());
                                Column.borderRadius(22);
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create(season.name);
                                Text.fontSize(16);
                                Text.fontWeight(FontWeight.Medium);
                                Text.fontColor(this.accentText());
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                ForEach.create();
                                const forEachItemGenFunction = _item => {
                                    const episode = _item;
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        Row.create();
                                        Row.width('100%');
                                        Row.padding(14);
                                        Row.backgroundColor(this.cardBackgroundStrong());
                                        Row.borderRadius(16);
                                    }, Row);
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        Text.create('E' + episode.episode.toString() + ' | ' + episode.name);
                                        Text.fontSize(14);
                                        Text.fontColor(this.textPrimary());
                                        Text.maxLines(1);
                                    }, Text);
                                    Text.pop();
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        Blank.create();
                                    }, Blank);
                                    Blank.pop();
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        Text.create((episode.duration === undefined ? '--' : episode.duration.toString()) + ' min');
                                        Text.fontSize(12);
                                        Text.fontColor(this.textSecondary());
                                    }, Text);
                                    Text.pop();
                                    Row.pop();
                                };
                                this.forEachUpdateFunction(elmtId, season.episodes, forEachItemGenFunction);
                            }, ForEach);
                            ForEach.pop();
                            Column.pop();
                        };
                        this.forEachUpdateFunction(elmtId, item.seasons, forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Column.pop();
        Scroll.pop();
    }
    private PlaybackExperiencePanel(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isMusicPlayback()) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.MusicPlaybackExperience.bind(this)();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.VideoPlaybackExperience.bind(this)();
                });
            }
        }, If);
        If.pop();
    }
    private VideoPlaybackExperience(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.backgroundColor('#07111F');
            Scroll.scrollBar(BarState.Off);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 18 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding(28);
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('Back');
            Button.backgroundColor(this.cardBackground());
            Button.fontColor(this.textPrimary());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.closePlaybackExperience();
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.playbackTitle());
            Text.fontSize(24);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#F8FAFC');
            Text.maxLines(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.playbackSubtitle());
            Text.fontSize(12);
            Text.fontColor('#AFC3E6');
            Text.maxLines(1);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.playback.status.toUpperCase());
            Text.fontSize(11);
            Text.fontColor('#D6E4FF');
            Text.padding({ left: 10, right: 10, top: 6, bottom: 6 });
            Text.backgroundColor('#19376D');
            Text.borderRadius(999);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create({ alignContent: Alignment.Bottom });
            Stack.height(360);
            Stack.width('100%');
            Stack.linearGradient({
                angle: 135,
                colors: [['#091423', 0], ['#102B52', 0.55], ['#163D7A', 1]]
            });
            Stack.borderRadius(32);
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            XComponent.create({
                id: 'octov-video-surface',
                type: XComponentType.SURFACE,
                controller: this.videoSurfaceController
            }, "com.octo.octov/entry");
            XComponent.width('100%');
            XComponent.height('100%');
            XComponent.backgroundColor('#020817');
            XComponent.borderRadius(32);
            XComponent.onLoad(() => {
                this.videoSurfaceId = this.videoSurfaceController.getXComponentSurfaceId();
                this.attachPlaybackSurface();
            });
        }, XComponent);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.playback.status === 'idle' || this.playback.status === 'loading') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 12 });
                        Column.alignItems(HorizontalAlign.Center);
                        Column.width('100%');
                        Column.height('100%');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.playbackStageLabel());
                        Text.fontSize(26);
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor('#F8FAFC');
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.playback.message === undefined ? 'Player ready' : this.playback.message);
                        Text.fontSize(13);
                        Text.fontColor('#AFC3E6');
                        Text.textAlign(TextAlign.Center);
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.activeSubtitleText.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.activeSubtitleText);
                        Text.fontSize(20);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor('#F8FAFC');
                        Text.textAlign(TextAlign.Center);
                        Text.padding({ left: 18, right: 18, top: 10, bottom: 10 });
                        Text.backgroundColor('#66020B17');
                        Text.borderRadius(16);
                        Text.margin({ left: 24, right: 24, bottom: 24 });
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Stack.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 14 });
            Column.padding(22);
            Column.width('100%');
            Column.backgroundColor(this.cardBackgroundStrong());
            Column.borderRadius(28);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.formatPlaybackTime(this.playback.currentTime));
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.playback.progress.toString() + '%');
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(' / ');
            Text.fontSize(12);
            Text.fontColor(this.textMuted());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.formatPlaybackTime(this.playback.duration));
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Slider.create({
                value: this.playback.progress,
                min: 0,
                max: 100,
                step: 1
            });
            Slider.blockColor('#2F6BFF');
            Slider.trackColor('#243B55');
            Slider.selectedColor('#60A5FA');
            Slider.onChange((value: number) => {
                this.seekCurrent(value);
            });
        }, Slider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('Prev');
            Button.backgroundColor(this.canPlayPreviousInExperience() ? this.cardBackground() : this.cardBackgroundStrong());
            Button.fontColor(this.textPrimary());
            Button.borderRadius(14);
            Button.enabled(this.canPlayPreviousInExperience());
            Button.onClick(() => {
                this.playPreviousInExperience();
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(this.playback.status === 'playing' ? 'Pause' : 'Play');
            Button.backgroundColor(this.accentBackground());
            Button.fontColor('#FFFFFF');
            Button.borderRadius(14);
            Button.onClick(() => {
                if (this.playback.status === 'playing') {
                    this.pauseCurrent();
                }
                else {
                    this.playCurrent();
                }
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('Stop');
            Button.backgroundColor(this.dangerBackground());
            Button.fontColor('#FFFFFF');
            Button.borderRadius(14);
            Button.onClick(() => {
                this.stopCurrent();
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('Next');
            Button.backgroundColor(this.canPlayNextInExperience() ? this.cardBackground() : this.cardBackgroundStrong());
            Button.fontColor(this.textPrimary());
            Button.borderRadius(14);
            Button.enabled(this.canPlayNextInExperience());
            Button.onClick(() => {
                this.playNextInExperience();
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.currentPlaybackItem() !== undefined) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('Subtitles');
                        Button.backgroundColor(this.cardBackground());
                        Button.fontColor(this.textPrimary());
                        Button.borderRadius(14);
                        Button.onClick(() => {
                            this.searchSubtitles(this.currentPlaybackItem() as MediaItem);
                        });
                    }, Button);
                    Button.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.playback.availableQualities.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 10 });
                        Column.alignItems(HorizontalAlign.Start);
                        Column.padding(20);
                        Column.width('100%');
                        Column.backgroundColor(this.cardBackground());
                        Column.borderRadius(24);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('Quality');
                        Text.fontSize(13);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor(this.textSecondary());
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 8 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const item = _item;
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Button.createWithLabel(item.label);
                                Button.fontSize(11);
                                Button.backgroundColor(this.playback.activeQualityId === item.id ? this.accentBackground() : this.cardBackground());
                                Button.fontColor(this.playback.activeQualityId === item.id ? '#FFFFFF' : this.textPrimary());
                                Button.borderRadius(12);
                                Button.onClick(() => {
                                    this.selectPlaybackQuality(item.id);
                                });
                            }, Button);
                            Button.pop();
                        };
                        this.forEachUpdateFunction(elmtId, this.playback.availableQualities, forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                    Row.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.subtitleResults.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.InfoBanner.bind(this)('Subtitles', this.subtitleResults);
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Column.pop();
        Scroll.pop();
    }
    private MusicPlaybackExperience(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.scrollBar(BarState.Off);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 22 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding(28);
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('Back');
            Button.backgroundColor(this.cardBackground());
            Button.fontColor(this.textPrimary());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.closePlaybackExperience();
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Music Player');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 26 });
            Row.width('100%');
            Row.padding(28);
            Row.linearGradient({
                angle: 135,
                colors: [['#EEF5FF', 0], ['#DDEBFF', 0.48], ['#F7FBFF', 1]]
            });
            Row.borderRadius(32);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create({ alignContent: Alignment.Center });
            Stack.width(300);
            Stack.height(300);
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width(300);
            Column.height(300);
            Column.backgroundColor('#1C3E6E');
            Column.borderRadius(999);
        }, Column);
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width(96);
            Column.height(96);
            Column.backgroundColor('#0B1729');
            Column.borderRadius(999);
        }, Column);
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('MUSIC');
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#F8FAFC');
        }, Text);
        Text.pop();
        Stack.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.playbackTitle());
            Text.fontSize(34);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
            Text.maxLines(2);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.playbackSubtitle());
            Text.fontSize(14);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.playback.message === undefined ? 'Ready to play' : this.playback.message);
            Text.fontSize(13);
            Text.fontColor(this.textMuted());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 8 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding(16);
            Column.width('100%');
            Column.backgroundColor(this.cardBackground());
            Column.borderRadius(22);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Lyrics');
            Text.fontSize(15);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.height(180);
            Scroll.width('100%');
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 8 });
            Column.alignItems(HorizontalAlign.Start);
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.lyricLines.length === 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('No lyrics loaded yet.');
                        Text.fontSize(13);
                        Text.fontColor(this.textSecondary());
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = (_item, index: number) => {
                            const line = _item;
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create(line.text);
                                Text.fontSize(this.currentLyricIndex === index ? 16 : 13);
                                Text.fontWeight(this.currentLyricIndex === index ? FontWeight.Bold : FontWeight.Regular);
                                Text.fontColor(this.currentLyricIndex === index ? '#2F6BFF' : this.textSecondary());
                                Text.textAlign(TextAlign.Start);
                                Text.width('100%');
                            }, Text);
                            Text.pop();
                        };
                        this.forEachUpdateFunction(elmtId, this.lyricLines.slice(0, 24), forEachItemGenFunction, undefined, true, false);
                    }, ForEach);
                    ForEach.pop();
                });
            }
        }, If);
        If.pop();
        Column.pop();
        Scroll.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 10 });
            Column.alignItems(HorizontalAlign.Start);
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Queue');
            Text.fontSize(15);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.musicItems().length === 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('No music tracks loaded.');
                        Text.fontSize(13);
                        Text.fontColor(this.textSecondary());
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const item = _item;
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Row.create();
                                Row.width('100%');
                                Row.padding(12);
                                Row.backgroundColor(this.cardBackground());
                                Row.borderRadius(18);
                            }, Row);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Column.create({ space: 4 });
                                Column.alignItems(HorizontalAlign.Start);
                                Column.layoutWeight(1);
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create(item.title);
                                Text.fontSize(13);
                                Text.fontWeight(FontWeight.Medium);
                                Text.fontColor(this.currentPlaybackItem() !== undefined && this.currentPlaybackItem()!.id === item.id ? '#2F6BFF' : this.textPrimary());
                                Text.maxLines(1);
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create(item.fileExt === undefined ? 'MUSIC' : item.fileExt.toUpperCase());
                                Text.fontSize(11);
                                Text.fontColor(this.textSecondary());
                            }, Text);
                            Text.pop();
                            Column.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Button.createWithLabel('Play');
                                Button.fontSize(11);
                                Button.backgroundColor(this.cardBackground());
                                Button.fontColor(this.textPrimary());
                                Button.borderRadius(12);
                                Button.onClick(() => {
                                    this.openMedia(item);
                                });
                            }, Button);
                            Button.pop();
                            Row.pop();
                        };
                        this.forEachUpdateFunction(elmtId, this.musicItems().slice(0, 6), forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                });
            }
        }, If);
        If.pop();
        Column.pop();
        Column.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 12 });
            Column.padding(22);
            Column.width('100%');
            Column.backgroundColor(this.cardBackgroundStrong());
            Column.borderRadius(28);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.formatPlaybackTime(this.playback.currentTime));
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.formatPlaybackTime(this.playback.duration));
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Slider.create({
                value: this.playback.progress,
                min: 0,
                max: 100,
                step: 1
            });
            Slider.blockColor('#2F6BFF');
            Slider.trackColor('#CBD5E1');
            Slider.selectedColor('#2F6BFF');
            Slider.onChange((value: number) => {
                this.seekCurrent(value);
            });
        }, Slider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('Prev');
            Button.backgroundColor(this.canPlayPreviousInExperience() ? this.cardBackground() : this.cardBackgroundStrong());
            Button.fontColor(this.textPrimary());
            Button.borderRadius(14);
            Button.enabled(this.canPlayPreviousInExperience());
            Button.onClick(() => {
                this.playPreviousInExperience();
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(this.playback.status === 'playing' ? 'Pause' : 'Play');
            Button.backgroundColor(this.accentBackground());
            Button.fontColor('#FFFFFF');
            Button.borderRadius(18);
            Button.padding({ left: 18, right: 18 });
            Button.onClick(() => {
                if (this.playback.status === 'playing') {
                    this.pauseCurrent();
                }
                else {
                    this.playCurrent();
                }
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('Next');
            Button.backgroundColor(this.canPlayNextInExperience() ? this.cardBackground() : this.cardBackgroundStrong());
            Button.fontColor(this.textPrimary());
            Button.borderRadius(14);
            Button.enabled(this.canPlayNextInExperience());
            Button.onClick(() => {
                this.playNextInExperience();
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('Stop');
            Button.backgroundColor(this.dangerBackground());
            Button.fontColor('#FFFFFF');
            Button.borderRadius(14);
            Button.onClick(() => {
                this.stopCurrent();
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.playback.progress.toString() + '%');
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        Column.pop();
        Scroll.pop();
    }
    private SourcesPanel(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.sourceManagementView === 'aliyun-auth') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.AliyunAuthPanel.bind(this)();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Scroll.create();
                        Scroll.scrollBar(BarState.Off);
                    }, Scroll);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 18 });
                        Column.alignItems(HorizontalAlign.Start);
                        Column.padding({ left: 28, right: 28, bottom: 28 });
                        Column.width('100%');
                    }, Column);
                    this.InfoBanner.bind(this)('媒体源说明', 'hm 分支延续 dev 分支的媒体源能力，入口改为更简单的本地目录和阿里云盘两条主链路。');
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 18 });
                        Row.width('100%');
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 12 });
                        Column.layoutWeight(1);
                        Column.alignItems(HorizontalAlign.Start);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('存储账号');
                        Text.fontSize(18);
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor(this.textPrimary());
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const storage = _item;
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Column.create({ space: 6 });
                                Column.alignItems(HorizontalAlign.Start);
                                Column.padding(16);
                                Column.width('100%');
                                Column.backgroundColor(this.cardBackground());
                                Column.borderRadius(18);
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create(storage.name);
                                Text.fontSize(15);
                                Text.fontWeight(FontWeight.Bold);
                                Text.fontColor(this.textPrimary());
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create(storage.type + ' | ' + (storage.userName === undefined ? '未登录' : storage.userName));
                                Text.fontSize(12);
                                Text.fontColor(this.textSecondary());
                            }, Text);
                            Text.pop();
                            Column.pop();
                        };
                        this.forEachUpdateFunction(elmtId, this.storages, forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 12 });
                        Column.layoutWeight(1);
                        Column.alignItems(HorizontalAlign.Start);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('文件源');
                        Text.fontSize(18);
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor(this.textPrimary());
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const source = _item;
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Column.create();
                                Column.padding(16);
                                Column.width('100%');
                                Column.backgroundColor(this.activeSourceId === source.id ? this.accentBackground() : this.cardBackground());
                                Column.borderRadius(18);
                                Column.onClick(() => {
                                    this.openSourceBrowser(source);
                                });
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Row.create({ space: 12 });
                                Row.width('100%');
                                Row.alignItems(VerticalAlign.Center);
                            }, Row);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Column.create({ space: 6 });
                                Column.alignItems(HorizontalAlign.Start);
                                Column.layoutWeight(1);
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create(source.name);
                                Text.fontSize(15);
                                Text.fontWeight(FontWeight.Bold);
                                Text.fontColor(this.textPrimary());
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create(source.storageName + ' | ' + source.path);
                                Text.fontSize(12);
                                Text.fontColor(this.textSecondary());
                                Text.maxLines(2);
                            }, Text);
                            Text.pop();
                            Column.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Button.createWithLabel('移除');
                                Button.fontSize(11);
                                Button.backgroundColor(this.dangerBackground());
                                Button.borderRadius(12);
                                Button.onClick(() => {
                                    this.removeSource(source);
                                });
                            }, Button);
                            Button.pop();
                            Row.pop();
                            Column.pop();
                        };
                        this.forEachUpdateFunction(elmtId, this.sources, forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                    Column.pop();
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.activeSourceId.length > 0) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.SourceBrowserPanel.bind(this)();
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                            });
                        }
                    }, If);
                    If.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 12 });
                        Column.alignItems(HorizontalAlign.Start);
                        Column.padding(20);
                        Column.width('100%');
                        Column.backgroundColor(this.cardBackgroundStrong());
                        Column.borderRadius(24);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('本地目录接入');
                        Text.fontSize(18);
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor(this.textPrimary());
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('当前仍使用 mock 目录选择器，但仓库层、媒体源模型和重新扫描入口已经打通，方便继续补齐真实目录授权。');
                        Text.fontSize(13);
                        Text.lineHeight(20);
                        Text.fontColor(this.textSecondary());
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 12 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('添加本地媒体目录');
                        Button.backgroundColor(this.successBackground());
                        Button.borderRadius(16);
                        Button.onClick(() => {
                            this.addLocalSource();
                        });
                    }, Button);
                    Button.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('重新扫描');
                        Button.backgroundColor(this.accentBackground());
                        Button.borderRadius(16);
                        Button.onClick(() => {
                            this.rescanSources();
                        });
                    }, Button);
                    Button.pop();
                    Row.pop();
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 12 });
                        Column.alignItems(HorizontalAlign.Start);
                        Column.padding(20);
                        Column.width('100%');
                        Column.backgroundColor(this.cardBackgroundStrong());
                        Column.borderRadius(24);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('阿里云盘');
                        Text.fontSize(18);
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor(this.textPrimary());
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.aliyunStatus.isLoggedIn
                            ? '当前已连接：' + (this.aliyunStatus.userName ?? '未命名账号') + '。进入单独页面可以重新扫码、查看状态或退出登录。'
                            : '授权流程已经改成单独页面。进入后按保存凭据、扫码确认、完成授权三步操作即可。');
                        Text.fontSize(13);
                        Text.lineHeight(20);
                        Text.fontColor(this.textSecondary());
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 12 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel(this.aliyunStatus.isLoggedIn ? '管理阿里云盘' : '连接阿里云盘');
                        Button.backgroundColor(this.accentBackground());
                        Button.borderRadius(16);
                        Button.onClick(() => {
                            this.openAliyunAuthPage();
                        });
                    }, Button);
                    Button.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.aliyunStatus.isLoggedIn) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Button.createWithLabel('打开云盘媒体源');
                                    Button.backgroundColor(this.successBackground());
                                    Button.borderRadius(16);
                                    Button.onClick(() => {
                                        this.openAliyunSourceRoot();
                                    });
                                }, Button);
                                Button.pop();
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                            });
                        }
                    }, If);
                    If.pop();
                    Row.pop();
                    Column.pop();
                    Column.pop();
                    Scroll.pop();
                });
            }
        }, If);
        If.pop();
    }
    private AliyunAuthPanel(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.scrollBar(BarState.Off);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 18 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding({ left: 28, right: 28, bottom: 28 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('返回媒体源');
            Button.backgroundColor(this.cardBackground());
            Button.fontColor(this.textPrimary());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.closeAliyunAuthPage();
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('阿里云盘授权');
            Text.fontSize(20);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('按 1-2-3 三步完成授权，流程参考 dev 分支的独立授权页。');
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        Column.pop();
        Row.pop();
        this.InfoBanner.bind(this)('操作步骤', this.aliyunStatus.isLoggedIn
            ? '当前账号已连接。你可以重新扫码、更换凭据，或者直接打开云盘媒体源。'
            : this.aliyunGuideText());
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 12 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding(20);
            Column.width('100%');
            Column.backgroundColor(this.cardBackgroundStrong());
            Column.borderRadius(24);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('1. 凭据');
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('默认可使用 hm/.env 里的 client_id 和 client_secret；如果要切换账号，也可以直接在这里覆盖。');
            Text.fontSize(13);
            Text.lineHeight(20);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ text: this.settings.aliyunClientId, placeholder: '阿里云盘 Client ID' });
            TextInput.height(44);
            TextInput.backgroundColor(this.cardBackground());
            TextInput.fontColor(this.textPrimary());
            TextInput.placeholderColor(this.textMuted());
            TextInput.borderRadius(16);
            TextInput.onChange((value: string) => {
                this.settings.aliyunClientId = value;
            });
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ text: this.settings.aliyunClientSecret, placeholder: '阿里云盘 Client Secret' });
            TextInput.height(44);
            TextInput.backgroundColor(this.cardBackground());
            TextInput.fontColor(this.textPrimary());
            TextInput.placeholderColor(this.textMuted());
            TextInput.borderRadius(16);
            TextInput.onChange((value: string) => {
                this.settings.aliyunClientSecret = value;
            });
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('仅保存凭据');
            Button.backgroundColor(this.cardBackground());
            Button.fontColor(this.textPrimary());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.saveAliyunCredentials();
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(this.aliyunQrSession.state === 'expired' || this.aliyunQrSession.state === 'error'
                ? '保存并重新获取二维码'
                : '保存并开始扫码授权');
            Button.backgroundColor(this.accentBackground());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.startAliyunAuthorization();
            });
        }, Button);
        Button.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 12 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding(20);
            Column.width('100%');
            Column.backgroundColor(this.cardBackgroundStrong());
            Column.borderRadius(24);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('2. 扫码');
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('点击上面的主按钮后，这里会显示二维码。使用阿里云盘 App 扫描，页面会自动轮询状态。');
            Text.fontSize(13);
            Text.lineHeight(20);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.aliyunQrSession.qrCodeUrl.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 8 });
                        Column.alignItems(HorizontalAlign.Start);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Image.create(this.aliyunQrSession.qrCodeUrl);
                        Image.width(240);
                        Image.height(240);
                        Image.borderRadius(18);
                    }, Image);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('当前状态：' + this.aliyunStateLabel());
                        Text.fontSize(12);
                        Text.fontColor(this.textSecondary());
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.aliyunQrSession.statusText);
                        Text.fontSize(12);
                        Text.lineHeight(18);
                        Text.fontColor(this.textSecondary());
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.InfoBanner.bind(this)('等待二维码', '先完成上一步，主按钮会自动保存凭据并开始获取二维码。');
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.aliyunQrSession.lastError !== undefined && this.aliyunQrSession.lastError.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('最近错误：' + this.aliyunQrSession.lastError);
                        Text.fontSize(12);
                        Text.fontColor('#FCA5A5');
                        Text.maxLines(3);
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('手动检查状态');
            Button.backgroundColor(this.warningBackground());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.pollAliyunQrCodeStatus(false);
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.aliyunQrSession.qrCodeUrl.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('重新获取二维码');
                        Button.backgroundColor(this.cardBackground());
                        Button.fontColor(this.textPrimary());
                        Button.borderRadius(16);
                        Button.onClick(() => {
                            this.startAliyunAuthorization();
                        });
                    }, Button);
                    Button.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 12 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding(20);
            Column.width('100%');
            Column.backgroundColor(this.cardBackgroundStrong());
            Column.borderRadius(24);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('3. 完成');
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.aliyunStatus.isLoggedIn ? '授权已完成，可以直接打开云盘媒体源继续浏览。' : '扫码确认成功后，这里会显示已连接账号。');
            Text.fontSize(13);
            Text.lineHeight(20);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.aliyunStatus.isLoggedIn ? '已连接：' + (this.aliyunStatus.userName ?? '未命名账号') : '当前尚未完成授权');
            Text.fontSize(13);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.aliyunStatus.isLoggedIn) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('打开云盘媒体源');
                        Button.backgroundColor(this.successBackground());
                        Button.borderRadius(16);
                        Button.onClick(() => {
                            this.openAliyunSourceRoot();
                        });
                    }, Button);
                    Button.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('退出登录');
                        Button.backgroundColor(this.dangerBackground());
                        Button.borderRadius(16);
                        Button.onClick(() => {
                            this.stopAliyunPolling();
                            this.applySnapshot(repository.logoutAliyun());
                            this.statusMessage = '阿里云盘授权已清除。';
                        });
                    }, Button);
                    Button.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Row.pop();
        Column.pop();
        Column.pop();
        Scroll.pop();
    }
    private SourceBrowserPanel(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 14 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding(20);
            Column.width('100%');
            Column.backgroundColor(this.cardBackgroundStrong());
            Column.borderRadius(24);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('返回文件源');
            Button.backgroundColor(this.cardBackground());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.closeSourceBrowser();
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.sourceBrowserName);
            Text.fontSize(20);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(this.sourceBrowserViewMode === 'list' ? '列表' : '宫格');
            Button.backgroundColor(this.cardBackground());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.sourceBrowserViewMode = this.sourceBrowserViewMode === 'list' ? 'grid' : 'list';
            });
        }, Button);
        Button.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.sourceBrowserStorageType === 'aliyundrive') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 12 });
                        Row.width('100%');
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        TextInput.create({ text: this.sourceBrowserSearchQuery, placeholder: '搜索云盘文件名' });
                        TextInput.layoutWeight(1);
                        TextInput.height(42);
                        TextInput.backgroundColor(this.cardBackground());
                        TextInput.fontColor(this.textPrimary());
                        TextInput.placeholderColor(this.textMuted());
                        TextInput.borderRadius(14);
                        TextInput.onChange((value: string) => {
                            this.sourceBrowserSearchQuery = value;
                        });
                    }, TextInput);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('搜索');
                        Button.backgroundColor(this.accentBackground());
                        Button.borderRadius(14);
                        Button.onClick(() => {
                            this.searchSourceBrowser();
                        });
                    }, Button);
                    Button.pop();
                    Row.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const filter = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Button.createWithLabel(filter === 'all' ? '全部' : filter === 'video' ? '视频' : filter === 'folder' ? '文件夹' : '音乐');
                    Button.fontSize(12);
                    Button.backgroundColor(this.sourceBrowserFilter === filter ? this.accentBackground() : this.cardBackground());
                    Button.fontColor(this.sourceBrowserFilter === filter ? '#FFFFFF' : this.textPrimary());
                    Button.borderRadius(14);
                    Button.onClick(() => {
                        this.sourceBrowserFilter = filter as SourceBrowserFilter;
                    });
                }, Button);
                Button.pop();
            };
            this.forEachUpdateFunction(elmtId, ['all', 'video', 'folder', 'music'], forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const item = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Button.createWithLabel(item.name);
                    Button.fontSize(12);
                    Button.backgroundColor('#00000000');
                    Button.fontColor(item.id === this.sourceBrowserCurrentFolderId ? this.accentText() : this.textSecondary());
                    Button.onClick(() => {
                        if (item.id !== this.sourceBrowserCurrentFolderId) {
                            const source: FileSourceItem = this.findSourceById(this.activeSourceId);
                            this.openSourceBrowser(source, item.id);
                        }
                    });
                }, Button);
                Button.pop();
            };
            this.forEachUpdateFunction(elmtId, this.sourceBreadcrumbs, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.sourceEntries().length.toString() + ' 项');
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.sourceEntries().length === 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.InfoBanner.bind(this)('当前目录为空', '可以切换筛选条件，或返回上一级目录继续浏览。');
                });
            }
            else if (this.sourceBrowserViewMode === 'list') {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 10 });
                        Column.width('100%');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const entry = _item;
                            this.SourceBrowserRow.bind(this)(entry);
                        };
                        this.forEachUpdateFunction(elmtId, this.sourceEntries(), forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(2, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Flex.create({ wrap: FlexWrap.Wrap, justifyContent: FlexAlign.Start, alignItems: ItemAlign.Start });
                        Flex.width('100%');
                    }, Flex);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const entry = _item;
                            this.SourceBrowserCard.bind(this)(entry);
                        };
                        this.forEachUpdateFunction(elmtId, this.sourceEntries(), forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                    Flex.pop();
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.sourceBrowserNextMarker.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('加载更多');
                        Button.backgroundColor(this.accentBackground());
                        Button.borderRadius(16);
                        Button.onClick(() => {
                            this.loadMoreSourceBrowser();
                        });
                    }, Button);
                    Button.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Column.pop();
    }
    private SourceBrowserRow(entry: SourceBrowserEntry, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.padding(16);
            Column.backgroundColor(this.cardBackground());
            Column.borderRadius(18);
            Column.onClick(() => {
                if (entry.type === 'folder') {
                    this.browseSourceFolder(entry);
                }
                else {
                    this.openBrowserEntry(entry);
                }
            });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.width('100%');
            Row.alignItems(VerticalAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(entry.name);
            Text.fontSize(15);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
            Text.maxLines(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.sourceEntryMeta(entry));
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
            Text.maxLines(2);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (entry.type !== 'folder') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('打开');
                        Text.fontSize(12);
                        Text.fontColor('#93C5FD');
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Row.pop();
        Column.pop();
    }
    private SourceBrowserCard(entry: SourceBrowserEntry, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithChild();
            Button.type(ButtonType.Normal);
            Button.width(210);
            Button.margin({ right: 14, bottom: 14 });
            Button.padding(12);
            Button.backgroundColor(this.cardBackgroundStrong());
            Button.borderRadius(22);
            Button.onClick(() => {
                if (entry.type === 'folder') {
                    this.browseSourceFolder(entry);
                }
                else {
                    this.openBrowserEntry(entry);
                }
            });
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 8 });
            Column.width(210);
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width(210);
            Column.height(140);
            Column.justifyContent(FlexAlign.Center);
            Column.backgroundColor(this.cardBackground());
            Column.borderRadius(20);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(entry.type === 'folder' ? 'FOLDER' : entry.type === 'audio' ? 'MUSIC' : 'VIDEO');
            Text.fontSize(20);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(entry.name);
            Text.fontSize(14);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
            Text.maxLines(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.sourceEntryMeta(entry));
            Text.fontSize(11);
            Text.fontColor(this.textSecondary());
            Text.maxLines(2);
        }, Text);
        Text.pop();
        Column.pop();
        Button.pop();
    }
    private sourceEntryMeta(entry: SourceBrowserEntry): string {
        let meta: string = entry.type === 'folder' ? '文件夹' : entry.path;
        if (entry.sizeLabel !== undefined && entry.sizeLabel.length > 0) {
            meta = meta + ' | ' + entry.sizeLabel;
        }
        if (entry.duration !== undefined) {
            meta = meta + ' | ' + entry.duration.toString() + ' min';
        }
        return meta;
    }
    private async openBrowserEntry(entry: SourceBrowserEntry): Promise<void> {
        if (entry.mediaId !== undefined && entry.mediaId.length > 0) {
            const item: MediaItem | undefined = this.findMediaById(entry.mediaId);
            if (item !== undefined) {
                await this.openMedia(item);
                this.statusMessage = '已打开播放会话：' + item.title;
            }
        }
        else if (entry.cloudFileId !== undefined && entry.cloudFileId.length > 0) {
            this.applySnapshot(await repository.openCloudFile(entry.cloudFileId, entry.name, this.sourceBrowserName, this.sourceBrowserCurrentFolderId, this.activeSourceId, entry.type === 'audio' ? 'audio' : 'video'));
            this.playbackExperienceOpen = true;
            await this.loadPlaybackTextData(this.mediaItemFromSourceEntry(entry));
            this.schedulePlaybackRefresh();
            this.statusMessage = '已打开云盘文件：' + entry.name;
        }
    }
    private findMediaById(mediaId: string): MediaItem | undefined {
        let index: number = 0;
        while (index < this.library.length) {
            if (this.library[index].id === mediaId) {
                return this.library[index];
            }
            index += 1;
        }
        return undefined;
    }
    private SettingsPanel(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.scrollBar(BarState.Off);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 18 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding({ left: 28, right: 28, bottom: 28 });
            Column.width('100%');
        }, Column);
        this.InfoBanner.bind(this)('主题', '支持浅色、深色和跟随系统三种显示样式，同时作用于页面色板和系统色彩模式。');
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 12 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding(20);
            Column.width('100%');
            Column.backgroundColor(this.cardBackgroundStrong());
            Column.borderRadius(24);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('外部服务');
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ text: this.settings.tmdbApiKey, placeholder: 'TMDB API Key' });
            TextInput.height(44);
            TextInput.backgroundColor(this.cardBackground());
            TextInput.fontColor(this.textPrimary());
            TextInput.placeholderColor(this.textMuted());
            TextInput.borderRadius(16);
            TextInput.onChange((value: string) => {
                this.settings.tmdbApiKey = value;
            });
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ text: this.settings.subtitleApiKey, placeholder: 'OpenSubtitles API Key' });
            TextInput.height(44);
            TextInput.backgroundColor(this.cardBackground());
            TextInput.fontColor(this.textPrimary());
            TextInput.placeholderColor(this.textMuted());
            TextInput.borderRadius(16);
            TextInput.onChange((value: string) => {
                this.settings.subtitleApiKey = value;
            });
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('跟随系统');
            Button.backgroundColor(this.settings.theme === 'system' ? this.accentBackground() : this.cardBackground());
            Button.fontColor(this.settings.theme === 'system' ? '#FFFFFF' : this.textPrimary());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.setTheme('system');
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('浅色');
            Button.backgroundColor(this.settings.theme === 'light' ? this.accentBackground() : this.cardBackground());
            Button.fontColor(this.settings.theme === 'light' ? '#FFFFFF' : this.textPrimary());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.setTheme('light');
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('深色');
            Button.backgroundColor(this.settings.theme === 'dark' ? this.accentBackground() : this.cardBackground());
            Button.fontColor(this.settings.theme === 'dark' ? '#FFFFFF' : this.textPrimary());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.setTheme('dark');
            });
        }, Button);
        Button.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('保存设置');
            Button.backgroundColor(this.accentBackground());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.applySnapshot(repository.updateSettings(ObservedObject.GetRawObject(this.settings)));
                this.statusMessage = '设置已更新。';
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('应用主题');
            Button.backgroundColor(this.successBackground());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.applyThemeMode();
            });
        }, Button);
        Button.pop();
        Row.pop();
        Column.pop();
        this.InfoBanner.bind(this)('播放', '底部 mini player 已接通，下一步会继续用 HarmonyOS AVPlayer 替换当前 mock 适配器。');
        Column.pop();
        Scroll.pop();
    }
    private PlayerDock(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 10 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding({ left: 28, right: 28, top: 14, bottom: 14 });
            Column.backgroundColor(this.playerBackground());
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.playback.title);
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
            Text.maxLines(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.playback.status + ' | ' + this.playback.sourceLabel);
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
            Text.maxLines(1);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.playback.progress.toString() + '%');
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Slider.create({
                value: this.playback.progress,
                min: 0,
                max: 100,
                step: 1
            });
            Slider.blockColor('#2F6BFF');
            Slider.trackColor('#1E293B');
            Slider.selectedColor('#60A5FA');
            Slider.onChange((value: number) => {
                this.seekCurrent(value);
            });
        }, Slider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('播放');
            Button.backgroundColor(this.accentBackground());
            Button.borderRadius(14);
            Button.onClick(() => {
                this.playCurrent();
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('暂停');
            Button.backgroundColor(this.successBackground());
            Button.borderRadius(14);
            Button.onClick(() => {
                this.pauseCurrent();
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('停止');
            Button.backgroundColor(this.dangerBackground());
            Button.borderRadius(14);
            Button.onClick(() => {
                this.stopCurrent();
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.playback.message === undefined ? '等待播放器接入' : this.playback.message);
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
            Text.maxLines(1);
        }, Text);
        Text.pop();
        Row.pop();
        this.CloudPlaybackMeta.bind(this)();
        Column.pop();
    }
    private CompactPlaybackStatus(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.padding({ left: 28, right: 28, top: 10, bottom: 10 });
            Row.backgroundColor(this.contentBackground());
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.playbackTitle());
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
            Text.maxLines(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.playback.status + ' | ' + this.playback.progress.toString() + '%');
            Text.fontSize(12);
            Text.fontColor(this.textMuted());
        }, Text);
        Text.pop();
        Row.pop();
    }
    private CloudPlaybackMeta(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 8 });
            Column.alignItems(HorizontalAlign.Start);
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.playback.playlist.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 12 });
                        Row.width('100%');
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.playback.playlistIndex > 0) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Button.createWithLabel('上一个');
                                    Button.backgroundColor(this.cardBackground());
                                    Button.fontColor(this.textPrimary());
                                    Button.borderRadius(14);
                                    Button.onClick(() => {
                                        this.playPreviousCloudItem();
                                    });
                                }, Button);
                                Button.pop();
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                            });
                        }
                    }, If);
                    If.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('队列位置 ' +
                            (this.playback.playlistIndex + 1).toString() +
                            ' / ' +
                            this.playback.playlist.length.toString());
                        Text.fontSize(11);
                        Text.fontColor(this.textSecondary());
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.playback.playlistIndex >= 0 && this.playback.playlistIndex < this.playback.playlist.length - 1) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Button.createWithLabel('下一个');
                                    Button.backgroundColor(this.cardBackground());
                                    Button.fontColor(this.textPrimary());
                                    Button.borderRadius(14);
                                    Button.onClick(() => {
                                        this.playNextCloudItem();
                                    });
                                }, Button);
                                Button.pop();
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                            });
                        }
                    }, If);
                    If.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                    }, Blank);
                    Blank.pop();
                    Row.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.playback.availableQualities.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 8 });
                        Column.alignItems(HorizontalAlign.Start);
                        Column.width('100%');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('云盘清晰度');
                        Text.fontSize(12);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor(this.textSecondary());
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 8 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const item = _item;
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Button.createWithLabel(item.label);
                                Button.fontSize(11);
                                Button.backgroundColor(this.playback.activeQualityId === item.id ? this.accentBackground() : this.cardBackground());
                                Button.fontColor(this.playback.activeQualityId === item.id ? '#FFFFFF' : this.textPrimary());
                                Button.borderRadius(12);
                                Button.onClick(() => {
                                    this.selectPlaybackQuality(item.id);
                                });
                            }, Button);
                            Button.pop();
                        };
                        this.forEachUpdateFunction(elmtId, this.playback.availableQualities, forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                    Row.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.playback.downloadUrl !== undefined && this.playback.downloadUrl.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('播放链接已就绪');
                        Text.fontSize(11);
                        Text.fontColor(this.textSecondary());
                        Text.maxLines(1);
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Column.pop();
    }
    private InfoBanner(title: string, body: string, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 10 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding(20);
            Column.width('100%');
            Column.backgroundColor(this.cardBackground());
            Column.borderRadius(24);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(title);
            Text.fontSize(17);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(body);
            Text.fontSize(13);
            Text.lineHeight(20);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        Column.pop();
    }
    private BottomStatus(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.padding({ left: 28, right: 28, top: 12, bottom: 16 });
            Row.backgroundColor(this.contentBackground());
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.statusMessage);
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('媒体库 ' + this.library.length.toString() + ' | 继续观看 ' + this.continueWatching.length.toString());
            Text.fontSize(12);
            Text.fontColor(this.textMuted());
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "Index";
    }
}
registerNamedRoute(() => new Index(undefined, {}), "", { bundleName: "com.octo.octov", moduleName: "entry", pagePath: "pages/Index", pageFullPath: "entry/src/main/ets/pages/Index", integratedHsp: "false", moduleType: "followWithHap" });
