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
    settings?: AppSettings;
    aliyunStatus?: AliyunDriveStatus;
    aliyunQrSession?: AliyunQrSession;
    playback?: PlaybackSession;
    keyword?: string;
    subtitleResults?: string;
    statusMessage?: string;
    horizontalScroller?: Scroller;
    aliyunPollingTimer?: number;
    aliyunPollingInFlight?: boolean;
}
import ConfigurationConstant from "@ohos:app.ability.ConfigurationConstant";
import type common from "@ohos:app.ability.common";
import type { AliyunDriveStatus, AliyunQrSession, AppSettings, EpisodeItem, FileSourceItem, MediaItem, NavigationSection, OctovSnapshot, PlaybackSession, SeasonItem, SectionId, StorageAccount } from '../models/OctovModels';
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
    constructor(b17, c17, d17, e17 = -1, f17 = undefined, g17) {
        super(b17, d17, e17, g17);
        if (typeof f17 === "function") {
            this.paramsGenerator_ = f17;
        }
        this.__currentSection = new ObservedPropertySimplePU('home', this, "currentSection");
        this.__selectedMedia = new ObservedPropertyObjectPU(undefined, this, "selectedMedia");
        this.__library = new ObservedPropertyObjectPU([], this, "library");
        this.__continueWatching = new ObservedPropertyObjectPU([], this, "continueWatching");
        this.__recentlyAdded = new ObservedPropertyObjectPU([], this, "recentlyAdded");
        this.__storages = new ObservedPropertyObjectPU([], this, "storages");
        this.__sources = new ObservedPropertyObjectPU([], this, "sources");
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
            message: '等待接入 HarmonyOS AVPlayer。'
        }, this, "playback");
        this.__keyword = new ObservedPropertySimplePU('', this, "keyword");
        this.__subtitleResults = new ObservedPropertySimplePU('', this, "subtitleResults");
        this.__statusMessage = new ObservedPropertySimplePU('准备就绪', this, "statusMessage");
        this.horizontalScroller = new Scroller();
        this.aliyunPollingTimer = -1;
        this.aliyunPollingInFlight = false;
        this.setInitiallyProvidedValue(c17);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(a17: Index_Params) {
        if (a17.currentSection !== undefined) {
            this.currentSection = a17.currentSection;
        }
        if (a17.selectedMedia !== undefined) {
            this.selectedMedia = a17.selectedMedia;
        }
        if (a17.library !== undefined) {
            this.library = a17.library;
        }
        if (a17.continueWatching !== undefined) {
            this.continueWatching = a17.continueWatching;
        }
        if (a17.recentlyAdded !== undefined) {
            this.recentlyAdded = a17.recentlyAdded;
        }
        if (a17.storages !== undefined) {
            this.storages = a17.storages;
        }
        if (a17.sources !== undefined) {
            this.sources = a17.sources;
        }
        if (a17.settings !== undefined) {
            this.settings = a17.settings;
        }
        if (a17.aliyunStatus !== undefined) {
            this.aliyunStatus = a17.aliyunStatus;
        }
        if (a17.aliyunQrSession !== undefined) {
            this.aliyunQrSession = a17.aliyunQrSession;
        }
        if (a17.playback !== undefined) {
            this.playback = a17.playback;
        }
        if (a17.keyword !== undefined) {
            this.keyword = a17.keyword;
        }
        if (a17.subtitleResults !== undefined) {
            this.subtitleResults = a17.subtitleResults;
        }
        if (a17.statusMessage !== undefined) {
            this.statusMessage = a17.statusMessage;
        }
        if (a17.horizontalScroller !== undefined) {
            this.horizontalScroller = a17.horizontalScroller;
        }
        if (a17.aliyunPollingTimer !== undefined) {
            this.aliyunPollingTimer = a17.aliyunPollingTimer;
        }
        if (a17.aliyunPollingInFlight !== undefined) {
            this.aliyunPollingInFlight = a17.aliyunPollingInFlight;
        }
    }
    updateStateVars(z16: Index_Params) {
    }
    purgeVariableDependenciesOnElmtId(y16) {
        this.__currentSection.purgeDependencyOnElmtId(y16);
        this.__selectedMedia.purgeDependencyOnElmtId(y16);
        this.__library.purgeDependencyOnElmtId(y16);
        this.__continueWatching.purgeDependencyOnElmtId(y16);
        this.__recentlyAdded.purgeDependencyOnElmtId(y16);
        this.__storages.purgeDependencyOnElmtId(y16);
        this.__sources.purgeDependencyOnElmtId(y16);
        this.__settings.purgeDependencyOnElmtId(y16);
        this.__aliyunStatus.purgeDependencyOnElmtId(y16);
        this.__aliyunQrSession.purgeDependencyOnElmtId(y16);
        this.__playback.purgeDependencyOnElmtId(y16);
        this.__keyword.purgeDependencyOnElmtId(y16);
        this.__subtitleResults.purgeDependencyOnElmtId(y16);
        this.__statusMessage.purgeDependencyOnElmtId(y16);
    }
    aboutToBeDeleted() {
        this.__currentSection.aboutToBeDeleted();
        this.__selectedMedia.aboutToBeDeleted();
        this.__library.aboutToBeDeleted();
        this.__continueWatching.aboutToBeDeleted();
        this.__recentlyAdded.aboutToBeDeleted();
        this.__storages.aboutToBeDeleted();
        this.__sources.aboutToBeDeleted();
        this.__settings.aboutToBeDeleted();
        this.__aliyunStatus.aboutToBeDeleted();
        this.__aliyunQrSession.aboutToBeDeleted();
        this.__playback.aboutToBeDeleted();
        this.__keyword.aboutToBeDeleted();
        this.__subtitleResults.aboutToBeDeleted();
        this.__statusMessage.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __currentSection: ObservedPropertySimplePU<SectionId>;
    get currentSection() {
        return this.__currentSection.get();
    }
    set currentSection(x16: SectionId) {
        this.__currentSection.set(x16);
    }
    private __selectedMedia: ObservedPropertyObjectPU<MediaItem | undefined>;
    get selectedMedia() {
        return this.__selectedMedia.get();
    }
    set selectedMedia(w16: MediaItem | undefined) {
        this.__selectedMedia.set(w16);
    }
    private __library: ObservedPropertyObjectPU<MediaItem[]>;
    get library() {
        return this.__library.get();
    }
    set library(v16: MediaItem[]) {
        this.__library.set(v16);
    }
    private __continueWatching: ObservedPropertyObjectPU<MediaItem[]>;
    get continueWatching() {
        return this.__continueWatching.get();
    }
    set continueWatching(u16: MediaItem[]) {
        this.__continueWatching.set(u16);
    }
    private __recentlyAdded: ObservedPropertyObjectPU<MediaItem[]>;
    get recentlyAdded() {
        return this.__recentlyAdded.get();
    }
    set recentlyAdded(t16: MediaItem[]) {
        this.__recentlyAdded.set(t16);
    }
    private __storages: ObservedPropertyObjectPU<StorageAccount[]>;
    get storages() {
        return this.__storages.get();
    }
    set storages(s16: StorageAccount[]) {
        this.__storages.set(s16);
    }
    private __sources: ObservedPropertyObjectPU<FileSourceItem[]>;
    get sources() {
        return this.__sources.get();
    }
    set sources(r16: FileSourceItem[]) {
        this.__sources.set(r16);
    }
    private __settings: ObservedPropertyObjectPU<AppSettings>;
    get settings() {
        return this.__settings.get();
    }
    set settings(q16: AppSettings) {
        this.__settings.set(q16);
    }
    private __aliyunStatus: ObservedPropertyObjectPU<AliyunDriveStatus>;
    get aliyunStatus() {
        return this.__aliyunStatus.get();
    }
    set aliyunStatus(p16: AliyunDriveStatus) {
        this.__aliyunStatus.set(p16);
    }
    private __aliyunQrSession: ObservedPropertyObjectPU<AliyunQrSession>;
    get aliyunQrSession() {
        return this.__aliyunQrSession.get();
    }
    set aliyunQrSession(o16: AliyunQrSession) {
        this.__aliyunQrSession.set(o16);
    }
    private __playback: ObservedPropertyObjectPU<PlaybackSession>;
    get playback() {
        return this.__playback.get();
    }
    set playback(n16: PlaybackSession) {
        this.__playback.set(n16);
    }
    private __keyword: ObservedPropertySimplePU<string>;
    get keyword() {
        return this.__keyword.get();
    }
    set keyword(m16: string) {
        this.__keyword.set(m16);
    }
    private __subtitleResults: ObservedPropertySimplePU<string>;
    get subtitleResults() {
        return this.__subtitleResults.get();
    }
    set subtitleResults(l16: string) {
        this.__subtitleResults.set(l16);
    }
    private __statusMessage: ObservedPropertySimplePU<string>;
    get statusMessage() {
        return this.__statusMessage.get();
    }
    set statusMessage(k16: string) {
        this.__statusMessage.set(k16);
    }
    private horizontalScroller: Scroller;
    private aliyunPollingTimer: number;
    private aliyunPollingInFlight: boolean;
    aboutToAppear(): void {
        this.refreshSnapshot();
    }
    aboutToDisappear(): void {
        this.stopAliyunPolling();
    }
    private async refreshSnapshot(): Promise<void> {
        this.applySnapshot(await repository.bootstrap());
    }
    private applySnapshot(j16: OctovSnapshot): void {
        this.library = j16.library;
        this.continueWatching = j16.continueWatching;
        this.recentlyAdded = j16.recentlyAdded;
        this.storages = j16.storages;
        this.sources = j16.sources;
        this.settings = j16.settings;
        this.aliyunStatus = j16.aliyunStatus;
        this.aliyunQrSession = j16.aliyunQrSession;
        this.playback = j16.playback;
        this.applyThemeMode();
    }
    private applyThemeMode(): void {
        const h16 = this.getUIContext().getHostContext() as common.UIAbilityContext;
        if (h16 === undefined) {
            return;
        }
        try {
            if (this.settings.theme === 'dark') {
                h16.setColorMode(ConfigurationConstant.ColorMode.COLOR_MODE_DARK);
            }
            else if (this.settings.theme === 'light') {
                h16.setColorMode(ConfigurationConstant.ColorMode.COLOR_MODE_LIGHT);
            }
            else {
                h16.setColorMode(ConfigurationConstant.ColorMode.COLOR_MODE_NOT_SET);
            }
        }
        catch (i16) {
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
        const g16 = this.getUIContext().getHostContext() as common.UIAbilityContext;
        if (g16 !== undefined && g16.config.colorMode === ConfigurationConstant.ColorMode.COLOR_MODE_LIGHT) {
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
        let f16: number = 0;
        while (f16 < sections.length) {
            if (sections[f16].id === this.currentSection) {
                return sections[f16];
            }
            f16 += 1;
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
        let z15: MediaItem[] = this.library;
        if (this.currentSection === 'movies') {
            z15 = this.filterByType('movie');
        }
        else if (this.currentSection === 'tvshows') {
            z15 = this.filterByType('tvshow');
        }
        else if (this.currentSection === 'music') {
            z15 = this.filterByType('music');
        }
        else if (this.currentSection === 'recent') {
            z15 = this.recentlyAdded;
        }
        const a16: string = this.keyword.trim().toLowerCase();
        if (a16.length === 0) {
            return z15;
        }
        const b16: MediaItem[] = [];
        let c16: number = 0;
        while (c16 < z15.length) {
            const d16: MediaItem = z15[c16];
            let e16: boolean = d16.title.toLowerCase().includes(a16);
            if (!e16 && d16.originalTitle !== undefined) {
                e16 = d16.originalTitle.toLowerCase().includes(a16);
            }
            if (!e16) {
                e16 = d16.genres.join(' ').toLowerCase().includes(a16);
            }
            if (e16) {
                b16.push(d16);
            }
            c16 += 1;
        }
        return b16;
    }
    private filterByType(v15: string): MediaItem[] {
        const w15: MediaItem[] = [];
        let x15: number = 0;
        while (x15 < this.library.length) {
            const y15: MediaItem = this.library[x15];
            if (y15.type === v15) {
                w15.push(y15);
            }
            x15 += 1;
        }
        return w15;
    }
    private setTheme(u15: 'system' | 'light' | 'dark'): void {
        this.settings.theme = u15;
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
        const t15 = await repository.addLocalSourceFromPicker();
        this.applySnapshot(t15.snapshot);
        this.statusMessage = t15.result.message;
    }
    private async openMedia(s15: MediaItem): Promise<void> {
        this.applySnapshot(await repository.openMedia(s15));
        this.statusMessage = '已为 ' + s15.title + ' 打开播放会话。';
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
    private async pollAliyunQrCodeStatus(r15: boolean = false): Promise<void> {
        if (this.aliyunPollingInFlight) {
            return;
        }
        this.aliyunPollingInFlight = true;
        if (!r15) {
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
    }
    private async pauseCurrent(): Promise<void> {
        this.applySnapshot(await repository.pauseCurrentMedia());
    }
    private async stopCurrent(): Promise<void> {
        this.applySnapshot(await repository.stopCurrentMedia());
    }
    private async seekCurrent(q15: number): Promise<void> {
        this.applySnapshot(await repository.seekCurrentMedia(q15));
    }
    private async searchSubtitles(j15: MediaItem): Promise<void> {
        this.statusMessage = '正在搜索字幕：' + j15.title;
        let k15: number | undefined = undefined;
        let l15: number | undefined = undefined;
        if (j15.seasons.length > 0) {
            k15 = j15.seasons[0].seasonNumber;
            if (j15.seasons[0].episodes.length > 0) {
                l15 = j15.seasons[0].episodes[0].episode;
            }
        }
        const m15 = await repository.searchSubtitles(j15.title, j15.tmdbId, k15, l15);
        if (m15.length === 0) {
            this.subtitleResults = '没有找到可用字幕。';
        }
        else {
            let n15: string = '';
            let o15: number = 0;
            while (o15 < m15.length && o15 < 6) {
                const p15 = m15[o15].languageName + ' | ' + m15[o15].fileName + ' | ' + m15[o15].source;
                if (o15 === 0) {
                    n15 = p15;
                }
                else {
                    n15 = n15 + '\n' + p15;
                }
                o15 += 1;
            }
            this.subtitleResults = n15;
        }
        this.statusMessage = '字幕搜索完成。';
    }
    initialRender() {
        this.observeComponentCreation2((h15, i15) => {
            Row.create();
            Row.width('100%');
            Row.height('100%');
            Row.backgroundColor(this.pageBackground());
        }, Row);
        this.Sidebar.bind(this)();
        this.observeComponentCreation2((f15, g15) => {
            Column.create();
            Column.layoutWeight(1);
            Column.height('100%');
            Column.backgroundColor(this.contentBackground());
        }, Column);
        this.TopBar.bind(this)();
        this.observeComponentCreation2((d15, e15) => {
            If.create();
            if (this.selectedMedia !== undefined) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.DetailPanel.bind(this)(ObservedObject.GetRawObject(this.selectedMedia));
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.SectionPanel.bind(this)();
                });
            }
        }, If);
        If.pop();
        this.PlayerDock.bind(this)();
        this.BottomStatus.bind(this)();
        Column.pop();
        Row.pop();
    }
    private Sidebar(x13 = null) {
        this.observeComponentCreation2((b15, c15) => {
            Column.create({ space: 10 });
            Column.width(292);
            Column.height('100%');
            Column.padding({ left: 18, right: 18, top: 28, bottom: 24 });
            Column.backgroundColor(this.sidebarBackground());
        }, Column);
        this.observeComponentCreation2((z14, a15) => {
            Column.create({ space: 4 });
            Column.alignItems(HorizontalAlign.Start);
            Column.margin({ bottom: 18 });
        }, Column);
        this.observeComponentCreation2((x14, y14) => {
            Text.create('Octov HM');
            Text.fontSize(28);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((v14, w14) => {
            Text.create('HarmonyOS 功能迁移工作区');
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((i14, j14) => {
            ForEach.create();
            const k14 = l14 => {
                const m14 = l14;
                this.observeComponentCreation2((t14, u14) => {
                    Button.createWithChild();
                    Button.type(ButtonType.Normal);
                    Button.backgroundColor(this.currentSection === m14.id ? this.accentBackground() : this.cardBackground());
                    Button.borderRadius(18);
                    Button.width('100%');
                    Button.onClick(() => {
                        this.currentSection = m14.id;
                        this.selectedMedia = undefined;
                        this.subtitleResults = '';
                    });
                }, Button);
                this.observeComponentCreation2((r14, s14) => {
                    Column.create({ space: 2 });
                    Column.alignItems(HorizontalAlign.Start);
                    Column.width('100%');
                    Column.padding(16);
                }, Column);
                this.observeComponentCreation2((p14, q14) => {
                    Text.create(m14.title);
                    Text.fontSize(16);
                    Text.fontWeight(this.currentSection === m14.id ? FontWeight.Bold : FontWeight.Medium);
                    Text.fontColor(this.textPrimary());
                }, Text);
                Text.pop();
                this.observeComponentCreation2((n14, o14) => {
                    Text.create(m14.subtitle);
                    Text.fontSize(11);
                    Text.fontColor(this.currentSection === m14.id ? this.accentText() : this.textMuted());
                }, Text);
                Text.pop();
                Column.pop();
                Button.pop();
            };
            this.forEachUpdateFunction(i14, sections, k14);
        }, ForEach);
        ForEach.pop();
        this.observeComponentCreation2((g14, h14) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((e14, f14) => {
            Column.create({ space: 8 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding(16);
            Column.width('100%');
            Column.backgroundColor(this.cardBackground());
            Column.borderRadius(18);
        }, Column);
        this.observeComponentCreation2((c14, d14) => {
            Text.create('阿里云盘状态');
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((a14, b14) => {
            Text.create(this.aliyunStatus.isLoggedIn ? '已连接：' + (this.aliyunStatus.userName ?? '未命名账号') : '尚未授权');
            Text.fontSize(14);
            Text.fontColor(this.textPrimary());
            Text.maxLines(2);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((y13, z13) => {
            Text.create(this.aliyunStateLabel());
            Text.fontSize(12);
            Text.fontColor('#7DD3FC');
        }, Text);
        Text.pop();
        Column.pop();
        Column.pop();
    }
    private TopBar(h13 = null) {
        this.observeComponentCreation2((v13, w13) => {
            Row.create({ space: 16 });
            Row.padding({ left: 28, right: 28, top: 22, bottom: 18 });
        }, Row);
        this.observeComponentCreation2((t13, u13) => {
            Column.create({ space: 4 });
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((r13, s13) => {
            Text.create(this.getSectionTitle());
            Text.fontSize(30);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((p13, q13) => {
            Text.create(this.getSectionSubtitle());
            Text.fontSize(13);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((n13, o13) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((k13, l13) => {
            TextInput.create({ text: this.keyword, placeholder: '搜索片名、原名或类型' });
            TextInput.width('34%');
            TextInput.height(44);
            TextInput.backgroundColor(this.cardBackground());
            TextInput.fontColor(this.textPrimary());
            TextInput.placeholderColor(this.textMuted());
            TextInput.borderRadius(16);
            TextInput.onChange((m13: string) => {
                this.keyword = m13;
            });
        }, TextInput);
        this.observeComponentCreation2((i13, j13) => {
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
    private SectionPanel(e13 = null) {
        this.observeComponentCreation2((f13, g13) => {
            If.create();
            if (this.currentSection === 'home') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.HomePanel.bind(this)();
                });
            }
            else if (this.currentSection === 'sources') {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.SourcesPanel.bind(this)();
                });
            }
            else if (this.currentSection === 'settings') {
                this.ifElseBranchUpdateFunction(2, () => {
                    this.SettingsPanel.bind(this)();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(3, () => {
                    this.LibraryPanel.bind(this)(this.visibleMedia(), '媒体库');
                });
            }
        }, If);
        If.pop();
    }
    private HomePanel(z12 = null) {
        this.observeComponentCreation2((c13, d13) => {
            Scroll.create();
            Scroll.scrollBar(BarState.Off);
        }, Scroll);
        this.observeComponentCreation2((a13, b13) => {
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
    private RowSection(d12: string, e12: MediaItem[], f12 = null) {
        this.observeComponentCreation2((x12, y12) => {
            Column.create({ space: 14 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((v12, w12) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((t12, u12) => {
            Text.create(d12);
            Text.fontSize(20);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((r12, s12) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((p12, q12) => {
            Text.create(e12.length.toString() + ' 项');
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((n12, o12) => {
            Scroll.create(this.horizontalScroller);
            Scroll.scrollable(ScrollDirection.Horizontal);
            Scroll.scrollBar(BarState.Off);
            Scroll.width('100%');
        }, Scroll);
        this.observeComponentCreation2((l12, m12) => {
            Row.create({ space: 14 });
        }, Row);
        this.observeComponentCreation2((g12, h12) => {
            ForEach.create();
            const i12 = j12 => {
                const k12 = j12;
                this.MediaCard.bind(this)(k12, 220, 300);
            };
            this.forEachUpdateFunction(g12, e12, i12);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        Scroll.pop();
        Column.pop();
    }
    private LibraryPanel(y11: MediaItem[], z11: string, a12 = null) {
        this.observeComponentCreation2((b12, c12) => {
            Scroll.create();
            Scroll.scrollBar(BarState.Off);
        }, Scroll);
        this.LibraryGrid.bind(this)(y11, z11);
        Scroll.pop();
    }
    private LibraryGrid(e11: MediaItem[], f11: string, g11 = null) {
        this.observeComponentCreation2((w11, x11) => {
            Column.create({ space: 16 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding({ left: 28, right: 28, bottom: 28 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((u11, v11) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((s11, t11) => {
            Text.create(f11);
            Text.fontSize(20);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((q11, r11) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((o11, p11) => {
            Text.create(e11.length.toString() + ' 条');
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((m11, n11) => {
            Flex.create({ wrap: FlexWrap.Wrap, justifyContent: FlexAlign.Start, alignItems: ItemAlign.Start });
            Flex.width('100%');
        }, Flex);
        this.observeComponentCreation2((h11, i11) => {
            ForEach.create();
            const j11 = k11 => {
                const l11 = k11;
                this.MediaCard.bind(this)(l11, 228, 316);
            };
            this.forEachUpdateFunction(h11, e11, j11);
        }, ForEach);
        ForEach.pop();
        Flex.pop();
        Column.pop();
    }
    private MediaCard(y9: MediaItem, z9: number, a10: number, b10 = null) {
        this.observeComponentCreation2((c11, d11) => {
            Button.createWithChild();
            Button.type(ButtonType.Normal);
            Button.width(z9);
            Button.height(a10);
            Button.margin({ right: 16, bottom: 16 });
            Button.backgroundColor(this.cardBackgroundStrong());
            Button.borderRadius(26);
            Button.onClick(() => {
                this.selectedMedia = y9;
                this.subtitleResults = '';
            });
        }, Button);
        this.observeComponentCreation2((a11, b11) => {
            Column.create({ space: 10 });
            Column.width(z9);
            Column.padding(10);
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((y10, z10) => {
            Stack.create({ alignContent: Alignment.BottomStart });
        }, Stack);
        this.observeComponentCreation2((q10, r10) => {
            If.create();
            if (y9.poster.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((w10, x10) => {
                        Image.create(y9.poster);
                        Image.width(z9);
                        Image.height(a10 - 96);
                        Image.objectFit(ImageFit.Cover);
                        Image.borderRadius(22);
                    }, Image);
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((u10, v10) => {
                        Column.create();
                        Column.width(z9);
                        Column.height(a10 - 96);
                        Column.justifyContent(FlexAlign.Center);
                        Column.backgroundColor(this.cardBackgroundStrong());
                        Column.borderRadius(22);
                    }, Column);
                    this.observeComponentCreation2((s10, t10) => {
                        Text.create(y9.type === 'music' ? 'MUSIC' : y9.type === 'tvshow' ? 'TV' : 'MOVIE');
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
        this.observeComponentCreation2((k10, l10) => {
            If.create();
            if (y9.progress !== undefined && y9.progress.percentage > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((o10, p10) => {
                        Row.create();
                        Row.padding({ left: 10, right: 10, top: 6, bottom: 6 });
                        Row.backgroundColor('#132B6B');
                        Row.borderRadius(999);
                        Row.margin({ left: 12, bottom: 12 });
                    }, Row);
                    this.observeComponentCreation2((m10, n10) => {
                        Text.create('已观看 ' + y9.progress.percentage.toString() + '%');
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
        this.observeComponentCreation2((i10, j10) => {
            Column.create({ space: 5 });
            Column.alignItems(HorizontalAlign.Start);
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((g10, h10) => {
            Text.create(y9.title);
            Text.fontSize(15);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
            Text.maxLines(1);
            Text.textOverflow({ overflow: TextOverflow.Ellipsis });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((e10, f10) => {
            Text.create((y9.year === undefined ? '--' : y9.year.toString()) + ' | ' + y9.genres.join(' / '));
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
            Text.maxLines(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((c10, d10) => {
            Text.create(y9.sourceName);
            Text.fontSize(11);
            Text.fontColor('#7DD3FC');
            Text.maxLines(1);
        }, Text);
        Text.pop();
        Column.pop();
        Column.pop();
        Button.pop();
    }
    private DetailPanel(s6: MediaItem, t6 = null) {
        this.observeComponentCreation2((w9, x9) => {
            Scroll.create();
            Scroll.scrollBar(BarState.Off);
        }, Scroll);
        this.observeComponentCreation2((u9, v9) => {
            Column.create({ space: 18 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding(28);
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((s9, t9) => {
            Row.create({ space: 12 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((q9, r9) => {
            Button.createWithLabel('返回');
            Button.backgroundColor(this.cardBackground());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.selectedMedia = undefined;
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((o9, p9) => {
            Button.createWithLabel('搜索字幕');
            Button.backgroundColor(this.accentBackground());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.searchSubtitles(s6);
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((m9, n9) => {
            Button.createWithLabel(s6.source === 'aliyundrive' ? '打开云盘播放会话' : '打开本地播放会话');
            Button.backgroundColor(this.successBackground());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.openMedia(s6);
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((k9, l9) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        Row.pop();
        this.observeComponentCreation2((i9, j9) => {
            Row.create({ space: 22 });
            Row.alignItems(VerticalAlign.Top);
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((a9, b9) => {
            If.create();
            if (s6.poster.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((g9, h9) => {
                        Image.create(s6.poster);
                        Image.width(280);
                        Image.height(420);
                        Image.objectFit(ImageFit.Cover);
                        Image.borderRadius(28);
                    }, Image);
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((e9, f9) => {
                        Column.create();
                        Column.width(280);
                        Column.height(420);
                        Column.justifyContent(FlexAlign.Center);
                        Column.backgroundColor(this.cardBackgroundStrong());
                        Column.borderRadius(28);
                    }, Column);
                    this.observeComponentCreation2((c9, d9) => {
                        Text.create(s6.type.toUpperCase());
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
        this.observeComponentCreation2((y8, z8) => {
            Column.create({ space: 14 });
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((w8, x8) => {
            Text.create(s6.title);
            Text.fontSize(34);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((s8, t8) => {
            If.create();
            if (s6.originalTitle !== undefined) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((u8, v8) => {
                        Text.create(s6.originalTitle);
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
        this.observeComponentCreation2((q8, r8) => {
            Text.create((s6.year === undefined ? '--' : s6.year.toString()) + ' | ' + s6.genres.join(' / ') + ' | ' +
                (s6.duration === undefined ? '--' : s6.duration.toString()) + ' min');
            Text.fontSize(14);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((o8, p8) => {
            Text.create('来源：' + s6.sourceName);
            Text.fontSize(13);
            Text.fontColor('#7DD3FC');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((k8, l8) => {
            If.create();
            if (s6.rating !== undefined) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((m8, n8) => {
                        Text.create('评分 ' + s6.rating.toFixed(1));
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
        this.observeComponentCreation2((i8, j8) => {
            Text.create(s6.overview === undefined ? '暂无简介。' : s6.overview);
            Text.fontSize(14);
            Text.fontColor(this.textSecondary());
            Text.lineHeight(22);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((e8, f8) => {
            If.create();
            if (s6.progress !== undefined && s6.progress.percentage > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((g8, h8) => {
                        Text.create('观看进度 ' + s6.progress.percentage.toString() + '%');
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
        this.observeComponentCreation2((w7, x7) => {
            If.create();
            if (this.subtitleResults.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((c8, d8) => {
                        Column.create({ space: 8 });
                        Column.alignItems(HorizontalAlign.Start);
                        Column.padding(18);
                        Column.width('100%');
                        Column.backgroundColor(this.cardBackground());
                        Column.borderRadius(22);
                    }, Column);
                    this.observeComponentCreation2((a8, b8) => {
                        Text.create('字幕结果');
                        Text.fontSize(16);
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor(this.textPrimary());
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((y7, z7) => {
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
        this.observeComponentCreation2((u6, v6) => {
            If.create();
            if (s6.seasons.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((u7, v7) => {
                        Column.create({ space: 12 });
                        Column.alignItems(HorizontalAlign.Start);
                        Column.width('100%');
                    }, Column);
                    this.observeComponentCreation2((s7, t7) => {
                        Text.create('季与分集');
                        Text.fontSize(20);
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor(this.textPrimary());
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((w6, x6) => {
                        ForEach.create();
                        const y6 = z6 => {
                            const a7 = z6;
                            this.observeComponentCreation2((q7, r7) => {
                                Column.create({ space: 10 });
                                Column.alignItems(HorizontalAlign.Start);
                                Column.padding(18);
                                Column.width('100%');
                                Column.backgroundColor(this.cardBackground());
                                Column.borderRadius(22);
                            }, Column);
                            this.observeComponentCreation2((o7, p7) => {
                                Text.create(a7.name);
                                Text.fontSize(16);
                                Text.fontWeight(FontWeight.Medium);
                                Text.fontColor(this.accentText());
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((b7, c7) => {
                                ForEach.create();
                                const d7 = e7 => {
                                    const f7 = e7;
                                    this.observeComponentCreation2((m7, n7) => {
                                        Row.create();
                                        Row.width('100%');
                                        Row.padding(14);
                                        Row.backgroundColor(this.cardBackgroundStrong());
                                        Row.borderRadius(16);
                                    }, Row);
                                    this.observeComponentCreation2((k7, l7) => {
                                        Text.create('E' + f7.episode.toString() + ' | ' + f7.name);
                                        Text.fontSize(14);
                                        Text.fontColor(this.textPrimary());
                                        Text.maxLines(1);
                                    }, Text);
                                    Text.pop();
                                    this.observeComponentCreation2((i7, j7) => {
                                        Blank.create();
                                    }, Blank);
                                    Blank.pop();
                                    this.observeComponentCreation2((g7, h7) => {
                                        Text.create((f7.duration === undefined ? '--' : f7.duration.toString()) + ' min');
                                        Text.fontSize(12);
                                        Text.fontColor(this.textSecondary());
                                    }, Text);
                                    Text.pop();
                                    Row.pop();
                                };
                                this.forEachUpdateFunction(b7, a7.episodes, d7);
                            }, ForEach);
                            ForEach.pop();
                            Column.pop();
                        };
                        this.forEachUpdateFunction(w6, s6.seasons, y6);
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
    private SourcesPanel(b3 = null) {
        this.observeComponentCreation2((q6, r6) => {
            Scroll.create();
            Scroll.scrollBar(BarState.Off);
        }, Scroll);
        this.observeComponentCreation2((o6, p6) => {
            Column.create({ space: 18 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding({ left: 28, right: 28, bottom: 28 });
            Column.width('100%');
        }, Column);
        this.InfoBanner.bind(this)('媒体源说明', 'hm 分支沿用 dev 分支的媒体源模型，保留本地目录与阿里云盘两条链路，界面按 HarmonyOS 进行重排。');
        this.observeComponentCreation2((m6, n6) => {
            Row.create({ space: 18 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((k6, l6) => {
            Column.create({ space: 12 });
            Column.layoutWeight(1);
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((i6, j6) => {
            Text.create('存储账号');
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((x5, y5) => {
            ForEach.create();
            const z5 = a6 => {
                const b6 = a6;
                this.observeComponentCreation2((g6, h6) => {
                    Column.create({ space: 6 });
                    Column.alignItems(HorizontalAlign.Start);
                    Column.padding(16);
                    Column.width('100%');
                    Column.backgroundColor(this.cardBackground());
                    Column.borderRadius(18);
                }, Column);
                this.observeComponentCreation2((e6, f6) => {
                    Text.create(b6.name);
                    Text.fontSize(15);
                    Text.fontWeight(FontWeight.Bold);
                    Text.fontColor(this.textPrimary());
                }, Text);
                Text.pop();
                this.observeComponentCreation2((c6, d6) => {
                    Text.create(b6.type + ' | ' + (b6.userName === undefined ? '未命名' : b6.userName));
                    Text.fontSize(12);
                    Text.fontColor(this.textSecondary());
                }, Text);
                Text.pop();
                Column.pop();
            };
            this.forEachUpdateFunction(x5, this.storages, z5);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        this.observeComponentCreation2((v5, w5) => {
            Column.create({ space: 12 });
            Column.layoutWeight(1);
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((t5, u5) => {
            Text.create('文件源');
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((i5, j5) => {
            ForEach.create();
            const k5 = l5 => {
                const m5 = l5;
                this.observeComponentCreation2((r5, s5) => {
                    Column.create({ space: 6 });
                    Column.alignItems(HorizontalAlign.Start);
                    Column.padding(16);
                    Column.width('100%');
                    Column.backgroundColor(this.cardBackground());
                    Column.borderRadius(18);
                }, Column);
                this.observeComponentCreation2((p5, q5) => {
                    Text.create(m5.name);
                    Text.fontSize(15);
                    Text.fontWeight(FontWeight.Bold);
                    Text.fontColor(this.textPrimary());
                }, Text);
                Text.pop();
                this.observeComponentCreation2((n5, o5) => {
                    Text.create(m5.storageName + ' | ' + m5.path);
                    Text.fontSize(12);
                    Text.fontColor(this.textSecondary());
                    Text.maxLines(2);
                }, Text);
                Text.pop();
                Column.pop();
            };
            this.forEachUpdateFunction(i5, this.sources, k5);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        Row.pop();
        this.observeComponentCreation2((g5, h5) => {
            Column.create({ space: 12 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding(20);
            Column.width('100%');
            Column.backgroundColor(this.cardBackgroundStrong());
            Column.borderRadius(24);
        }, Column);
        this.observeComponentCreation2((e5, f5) => {
            Text.create('本地目录接入');
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((c5, d5) => {
            Text.create('当前仍使用 mock 目录选择器，但仓库层、媒体源模型和后续扫描入口已经接通。');
            Text.fontSize(13);
            Text.lineHeight(20);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((a5, b5) => {
            Button.createWithLabel('添加本地媒体目录');
            Button.backgroundColor(this.successBackground());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.addLocalSource();
            });
        }, Button);
        Button.pop();
        Column.pop();
        this.observeComponentCreation2((y4, z4) => {
            Column.create({ space: 12 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding(20);
            Column.width('100%');
            Column.backgroundColor(this.cardBackgroundStrong());
            Column.borderRadius(24);
        }, Column);
        this.observeComponentCreation2((w4, x4) => {
            Text.create('阿里云盘授权');
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((u4, v4) => {
            Text.create('默认从 hm/.env 读取 client_id 和 client_secret。修改 .env 后，请先执行 npm run sync-env 再重新构建。');
            Text.fontSize(13);
            Text.lineHeight(20);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((s4, t4) => {
            Column.create({ space: 8 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding(16);
            Column.width('100%');
            Column.backgroundColor(this.cardBackground());
            Column.borderRadius(16);
        }, Column);
        this.observeComponentCreation2((q4, r4) => {
            Text.create('操作步骤');
            Text.fontSize(14);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((o4, p4) => {
            Text.create(this.aliyunGuideText());
            Text.fontSize(12);
            Text.lineHeight(18);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((l4, m4) => {
            TextInput.create({ text: this.settings.aliyunClientId, placeholder: '阿里云盘 Client ID' });
            TextInput.height(44);
            TextInput.backgroundColor(this.cardBackground());
            TextInput.fontColor(this.textPrimary());
            TextInput.placeholderColor(this.textMuted());
            TextInput.borderRadius(16);
            TextInput.onChange((n4: string) => {
                this.settings.aliyunClientId = n4;
            });
        }, TextInput);
        this.observeComponentCreation2((i4, j4) => {
            TextInput.create({ text: this.settings.aliyunClientSecret, placeholder: '阿里云盘 Client Secret' });
            TextInput.height(44);
            TextInput.backgroundColor(this.cardBackground());
            TextInput.fontColor(this.textPrimary());
            TextInput.placeholderColor(this.textMuted());
            TextInput.borderRadius(16);
            TextInput.onChange((k4: string) => {
                this.settings.aliyunClientSecret = k4;
            });
        }, TextInput);
        this.observeComponentCreation2((g4, h4) => {
            Column.create({ space: 8 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding(16);
            Column.width('100%');
            Column.backgroundColor(this.cardBackground());
            Column.borderRadius(16);
        }, Column);
        this.observeComponentCreation2((e4, f4) => {
            Text.create(this.aliyunStatus.isLoggedIn ? '已连接：' + (this.aliyunStatus.userName ?? '未命名账号') : '当前尚未完成授权');
            Text.fontSize(13);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((c4, d4) => {
            Text.create('凭据来源：' + (this.aliyunStatus.authorizationSource ?? '.env / 手动输入'));
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((a4, b4) => {
            Text.create('二维码状态：' + this.aliyunStateLabel());
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((y3, z3) => {
            Text.create(this.aliyunQrSession.statusText);
            Text.fontSize(12);
            Text.lineHeight(18);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((u3, v3) => {
            If.create();
            if (this.aliyunQrSession.lastError !== undefined && this.aliyunQrSession.lastError.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((w3, x3) => {
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
        Column.pop();
        this.observeComponentCreation2((m3, n3) => {
            If.create();
            if (this.aliyunQrSession.qrCodeUrl.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((s3, t3) => {
                        Column.create({ space: 8 });
                        Column.alignItems(HorizontalAlign.Start);
                    }, Column);
                    this.observeComponentCreation2((q3, r3) => {
                        Image.create(this.aliyunQrSession.qrCodeUrl);
                        Image.width(220);
                        Image.height(220);
                        Image.borderRadius(18);
                    }, Image);
                    this.observeComponentCreation2((o3, p3) => {
                        Text.create('扫码后应用会自动轮询，无需反复手动点击检查。');
                        Text.fontSize(12);
                        Text.fontColor(this.textSecondary());
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
        this.observeComponentCreation2((k3, l3) => {
            Row.create({ space: 12 });
        }, Row);
        this.observeComponentCreation2((i3, j3) => {
            Button.createWithLabel('保存凭据');
            Button.backgroundColor(this.accentBackground());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.stopAliyunPolling();
                this.applySnapshot(repository.updateAliyunCredentials(this.settings.aliyunClientId, this.settings.aliyunClientSecret));
                this.statusMessage = '阿里云盘凭据已更新。';
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((g3, h3) => {
            Button.createWithLabel(this.aliyunQrSession.state === 'expired' || this.aliyunQrSession.state === 'error' ? '重新获取二维码' : '获取二维码');
            Button.backgroundColor(this.successBackground());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.requestAliyunQrCode();
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((e3, f3) => {
            Button.createWithLabel('手动检查');
            Button.backgroundColor(this.warningBackground());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.pollAliyunQrCodeStatus(false);
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((c3, d3) => {
            Button.createWithLabel('退出授权');
            Button.backgroundColor(this.dangerBackground());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.stopAliyunPolling();
                this.applySnapshot(repository.logoutAliyun());
                this.statusMessage = '阿里云盘授权已清除。';
            });
        }, Button);
        Button.pop();
        Row.pop();
        Column.pop();
        Column.pop();
        Scroll.pop();
    }
    private SettingsPanel(y1 = null) {
        this.observeComponentCreation2((z2, a3) => {
            Scroll.create();
            Scroll.scrollBar(BarState.Off);
        }, Scroll);
        this.observeComponentCreation2((x2, y2) => {
            Column.create({ space: 18 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding({ left: 28, right: 28, bottom: 28 });
            Column.width('100%');
        }, Column);
        this.InfoBanner.bind(this)('主题', '支持浅色、深色和跟随系统三种显示样式，同时作用于页面色板和系统色彩模式。');
        this.observeComponentCreation2((v2, w2) => {
            Column.create({ space: 12 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding(20);
            Column.width('100%');
            Column.backgroundColor(this.cardBackgroundStrong());
            Column.borderRadius(24);
        }, Column);
        this.observeComponentCreation2((t2, u2) => {
            Text.create('外部服务');
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((q2, r2) => {
            TextInput.create({ text: this.settings.tmdbApiKey, placeholder: 'TMDB API Key' });
            TextInput.height(44);
            TextInput.backgroundColor(this.cardBackground());
            TextInput.fontColor(this.textPrimary());
            TextInput.placeholderColor(this.textMuted());
            TextInput.borderRadius(16);
            TextInput.onChange((s2: string) => {
                this.settings.tmdbApiKey = s2;
            });
        }, TextInput);
        this.observeComponentCreation2((n2, o2) => {
            TextInput.create({ text: this.settings.subtitleApiKey, placeholder: 'OpenSubtitles API Key' });
            TextInput.height(44);
            TextInput.backgroundColor(this.cardBackground());
            TextInput.fontColor(this.textPrimary());
            TextInput.placeholderColor(this.textMuted());
            TextInput.borderRadius(16);
            TextInput.onChange((p2: string) => {
                this.settings.subtitleApiKey = p2;
            });
        }, TextInput);
        this.observeComponentCreation2((l2, m2) => {
            Row.create({ space: 12 });
        }, Row);
        this.observeComponentCreation2((j2, k2) => {
            Button.createWithLabel('跟随系统');
            Button.backgroundColor(this.settings.theme === 'system' ? this.accentBackground() : this.cardBackground());
            Button.fontColor(this.settings.theme === 'system' ? '#FFFFFF' : this.textPrimary());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.setTheme('system');
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((h2, i2) => {
            Button.createWithLabel('浅色');
            Button.backgroundColor(this.settings.theme === 'light' ? this.accentBackground() : this.cardBackground());
            Button.fontColor(this.settings.theme === 'light' ? '#FFFFFF' : this.textPrimary());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.setTheme('light');
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((f2, g2) => {
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
        this.observeComponentCreation2((d2, e2) => {
            Row.create({ space: 12 });
        }, Row);
        this.observeComponentCreation2((b2, c2) => {
            Button.createWithLabel('保存设置');
            Button.backgroundColor(this.accentBackground());
            Button.borderRadius(16);
            Button.onClick(() => {
                this.applySnapshot(repository.updateSettings(ObservedObject.GetRawObject(this.settings)));
                this.statusMessage = '设置已更新。';
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((z1, a2) => {
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
    private PlayerDock(w = null) {
        this.observeComponentCreation2((w1, x1) => {
            Column.create({ space: 10 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding({ left: 28, right: 28, top: 14, bottom: 14 });
            Column.backgroundColor(this.playerBackground());
        }, Column);
        this.observeComponentCreation2((u1, v1) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((s1, t1) => {
            Column.create({ space: 4 });
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((q1, r1) => {
            Text.create(this.playback.title);
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
            Text.maxLines(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((o1, p1) => {
            Text.create(this.playback.status + ' | ' + this.playback.sourceLabel);
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
            Text.maxLines(1);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((m1, n1) => {
            Text.create(this.playback.progress.toString() + '%');
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((j1, k1) => {
            Slider.create({
                value: this.playback.progress,
                min: 0,
                max: 100,
                step: 1
            });
            Slider.blockColor('#2F6BFF');
            Slider.trackColor('#1E293B');
            Slider.selectedColor('#60A5FA');
            Slider.onChange((l1: number) => {
                this.seekCurrent(l1);
            });
        }, Slider);
        this.observeComponentCreation2((h1, i1) => {
            Row.create({ space: 12 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((f1, g1) => {
            Button.createWithLabel('播放');
            Button.backgroundColor(this.accentBackground());
            Button.borderRadius(14);
            Button.onClick(() => {
                this.playCurrent();
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((d1, e1) => {
            Button.createWithLabel('暂停');
            Button.backgroundColor(this.successBackground());
            Button.borderRadius(14);
            Button.onClick(() => {
                this.pauseCurrent();
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((b1, c1) => {
            Button.createWithLabel('停止');
            Button.backgroundColor(this.dangerBackground());
            Button.borderRadius(14);
            Button.onClick(() => {
                this.stopCurrent();
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((z, a1) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((x, y) => {
            Text.create(this.playback.message === undefined ? '等待播放器接入' : this.playback.message);
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
            Text.maxLines(1);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
    }
    private InfoBanner(n: string, o: string, p = null) {
        this.observeComponentCreation2((u, v) => {
            Column.create({ space: 10 });
            Column.alignItems(HorizontalAlign.Start);
            Column.padding(20);
            Column.width('100%');
            Column.backgroundColor(this.cardBackground());
            Column.borderRadius(24);
        }, Column);
        this.observeComponentCreation2((s, t) => {
            Text.create(n);
            Text.fontSize(17);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.textPrimary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((q, r) => {
            Text.create(o);
            Text.fontSize(13);
            Text.lineHeight(20);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        Column.pop();
    }
    private BottomStatus(e = null) {
        this.observeComponentCreation2((l, m) => {
            Row.create();
            Row.width('100%');
            Row.padding({ left: 28, right: 28, top: 12, bottom: 16 });
            Row.backgroundColor(this.contentBackground());
        }, Row);
        this.observeComponentCreation2((j, k) => {
            Text.create(this.statusMessage);
            Text.fontSize(12);
            Text.fontColor(this.textSecondary());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((h, i) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((f, g) => {
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
