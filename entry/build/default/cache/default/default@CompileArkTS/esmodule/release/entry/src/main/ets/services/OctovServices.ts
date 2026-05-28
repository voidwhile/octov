import http from "@ohos:net.http";
import type { AliyunDriveStatus, AliyunQrSession, AppSettings, EpisodeItem, FileSourceItem, LocalSelectionResult, MediaItem, OctovSnapshot, PlaybackProgress, PlaybackSession, SeasonItem, StorageAccount, SubtitleSearchResult } from '../models/OctovModels';
import { MAIN_VITE_ALIYUN_CLIENT_ID, MAIN_VITE_ALIYUN_CLIENT_SECRET } from "@normalized:N&&&entry/src/main/ets/config/EnvConfig&";
import { PlatformAdapters } from "@normalized:N&&&entry/src/main/ets/services/PlatformAdapters&";
const ALIYUN_API_BASE: string = 'https://openapi.alipan.com';
const ALIYUN_SCOPES: Array<string> = ['user:base', 'file:all:read', 'file:all:write'];
export interface LocalSourceAddResult {
    snapshot: OctovSnapshot;
    result: LocalSelectionResult;
}
interface AliyunQrCodeResponse {
    qrCodeUrl: string;
    sid: string;
}
interface AliyunQrStatusResponse {
    status: string;
    authCode?: string;
}
interface AliyunTokenPayload {
    access_token: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    default_drive_id?: string;
    user_id?: string;
    user_name?: string;
    avatar?: string;
}
interface AliyunDriveInfoPayload {
    default_drive_id?: string;
    user_id?: string;
    name?: string;
    nick_name?: string;
    avatar?: string;
}
interface AliyunTokenState {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    obtainedAt: number;
    driveId: string;
    userId: string;
    userName: string;
    avatar: string;
}
interface AliyunQrCodeRequestBody {
    client_id: string;
    client_secret: string;
    scopes: Array<string>;
    width: number;
    height: number;
}
interface AliyunTokenRequestBody {
    client_id: string;
    client_secret: string;
    grant_type: string;
    code: string;
}
function createDefaultSettings(): AppSettings {
    return {
        theme: 'system',
        tmdbApiKey: '',
        subtitleApiKey: '',
        aliyunClientId: MAIN_VITE_ALIYUN_CLIENT_ID,
        aliyunClientSecret: MAIN_VITE_ALIYUN_CLIENT_SECRET
    };
}
function createDefaultAliyunStatus(c21: string, d21: string): AliyunDriveStatus {
    return {
        isLoggedIn: false,
        clientId: c21,
        clientSecretConfigured: d21.length > 0,
        userName: '',
        userId: '',
        avatar: '',
        driveId: '',
        authorizationSource: c21.length > 0 ? '.env' : 'not_configured'
    };
}
function createDefaultAliyunQrSession(): AliyunQrSession {
    return {
        sid: '',
        qrCodeUrl: '',
        state: 'idle',
        statusText: '等待开始扫码登录。'
    };
}
function createDefaultPlayback(): PlaybackSession {
    return {
        title: '未开始播放',
        subtitle: '等待选择媒体',
        sourceLabel: 'Mock Player',
        status: 'idle',
        progress: 0,
        currentTime: 0,
        duration: 0,
        message: '等待接入 HarmonyOS AVPlayer。'
    };
}
function toId(a21: string, b21: string): string {
    return a21 + '-' + b21.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
}
function cloneProgress(z20: PlaybackProgress | undefined): PlaybackProgress | undefined {
    if (z20 === undefined) {
        return undefined;
    }
    return {
        currentTime: z20.currentTime,
        totalDuration: z20.totalDuration,
        percentage: z20.percentage,
        lastPlayed: z20.lastPlayed
    };
}
function cloneEpisode(y20: EpisodeItem): EpisodeItem {
    return {
        season: y20.season,
        episode: y20.episode,
        name: y20.name,
        duration: y20.duration,
        cloudFileId: y20.cloudFileId,
        filePath: y20.filePath
    };
}
function cloneSeason(v20: SeasonItem): SeasonItem {
    const w20: Array<EpisodeItem> = [];
    let x20: number = 0;
    while (x20 < v20.episodes.length) {
        w20.push(cloneEpisode(v20.episodes[x20]));
        x20 += 1;
    }
    return {
        seasonNumber: v20.seasonNumber,
        name: v20.name,
        episodes: w20
    };
}
function cloneMediaItem(q20: MediaItem): MediaItem {
    const r20: Array<SeasonItem> = [];
    let s20: number = 0;
    while (s20 < q20.seasons.length) {
        r20.push(cloneSeason(q20.seasons[s20]));
        s20 += 1;
    }
    const t20: Array<string> = [];
    let u20: number = 0;
    while (u20 < q20.genres.length) {
        t20.push(q20.genres[u20]);
        u20 += 1;
    }
    return {
        id: q20.id,
        title: q20.title,
        originalTitle: q20.originalTitle,
        type: q20.type,
        year: q20.year,
        poster: q20.poster,
        backdrop: q20.backdrop,
        rating: q20.rating,
        genres: t20,
        overview: q20.overview,
        duration: q20.duration,
        dateAdded: q20.dateAdded,
        releaseDate: q20.releaseDate,
        filePath: q20.filePath,
        source: q20.source,
        sourceId: q20.sourceId,
        sourceName: q20.sourceName,
        cloudFileId: q20.cloudFileId,
        tmdbId: q20.tmdbId,
        progress: cloneProgress(q20.progress),
        seasons: r20,
        fileExt: q20.fileExt
    };
}
function cloneMediaList(n20: Array<MediaItem>): Array<MediaItem> {
    const o20: Array<MediaItem> = [];
    let p20: number = 0;
    while (p20 < n20.length) {
        o20.push(cloneMediaItem(n20[p20]));
        p20 += 1;
    }
    return o20;
}
function cloneStorageList(j20: Array<StorageAccount>): Array<StorageAccount> {
    const k20: Array<StorageAccount> = [];
    let l20: number = 0;
    while (l20 < j20.length) {
        const m20: StorageAccount = j20[l20];
        k20.push({
            id: m20.id,
            type: m20.type,
            name: m20.name,
            createdAt: m20.createdAt,
            userName: m20.userName
        });
        l20 += 1;
    }
    return k20;
}
function cloneSourceList(f20: Array<FileSourceItem>): Array<FileSourceItem> {
    const g20: Array<FileSourceItem> = [];
    let h20: number = 0;
    while (h20 < f20.length) {
        const i20: FileSourceItem = f20[h20];
        g20.push({
            id: i20.id,
            name: i20.name,
            storageId: i20.storageId,
            storageType: i20.storageType,
            storageName: i20.storageName,
            path: i20.path,
            createdAt: i20.createdAt
        });
        h20 += 1;
    }
    return g20;
}
function cloneSettings(e20: AppSettings): AppSettings {
    return {
        theme: e20.theme,
        tmdbApiKey: e20.tmdbApiKey,
        subtitleApiKey: e20.subtitleApiKey,
        aliyunClientId: e20.aliyunClientId,
        aliyunClientSecret: e20.aliyunClientSecret
    };
}
function cloneAliyunStatus(d20: AliyunDriveStatus): AliyunDriveStatus {
    return {
        isLoggedIn: d20.isLoggedIn,
        clientId: d20.clientId,
        clientSecretConfigured: d20.clientSecretConfigured,
        userName: d20.userName,
        userId: d20.userId,
        avatar: d20.avatar,
        driveId: d20.driveId,
        authorizationSource: d20.authorizationSource
    };
}
function cloneAliyunQrSession(c20: AliyunQrSession): AliyunQrSession {
    return {
        sid: c20.sid,
        qrCodeUrl: c20.qrCodeUrl,
        state: c20.state,
        statusText: c20.statusText,
        authCode: c20.authCode,
        lastError: c20.lastError
    };
}
function clonePlayback(b20: PlaybackSession): PlaybackSession {
    return {
        mediaId: b20.mediaId,
        title: b20.title,
        subtitle: b20.subtitle,
        sourceLabel: b20.sourceLabel,
        status: b20.status,
        progress: b20.progress,
        currentTime: b20.currentTime,
        duration: b20.duration,
        message: b20.message
    };
}
function appendProgress(w19: Array<MediaItem>, x19: Array<number>): Array<MediaItem> {
    const y19: Array<MediaItem> = [];
    let z19: number = 0;
    while (z19 < w19.length) {
        const a20: MediaItem = cloneMediaItem(w19[z19]);
        if (z19 < x19.length && a20.type !== 'music') {
            a20.progress = {
                currentTime: x19[z19] * 10,
                totalDuration: 3600,
                percentage: x19[z19],
                lastPlayed: new Date(Date.now() - z19 * 86400000).toISOString()
            };
        }
        y19.push(a20);
        z19 += 1;
    }
    return y19;
}
function compareDate(s19: MediaItem, t19: MediaItem): number {
    const u19: number = new Date(s19.dateAdded).getTime();
    const v19: number = new Date(t19.dateAdded).getTime();
    if (u19 > v19) {
        return -1;
    }
    if (u19 < v19) {
        return 1;
    }
    return 0;
}
function buildAliyunStatusText(r19: string): string {
    if (r19 === 'ScanSuccess') {
        return '扫码成功，请在阿里云盘 App 中确认授权。';
    }
    if (r19 === 'LoginSuccess') {
        return '授权成功，正在同步账号信息。';
    }
    if (r19 === 'QRCodeExpired') {
        return '二维码已过期，请重新获取。';
    }
    if (r19 === 'WaitLogin') {
        return '请使用阿里云盘 App 扫描二维码。';
    }
    return '正在等待授权结果。';
}
function createSeedLibrary(): Array<MediaItem> {
    const o19: number = Date.now();
    const p19: SeasonItem = {
        seasonNumber: 1,
        name: 'Season 1',
        episodes: [
            {
                season: 1,
                episode: 1,
                name: 'Pilot',
                duration: 82,
                filePath: '/storage/Users/Movies/The.Last.of.Us.S01E01.mkv'
            },
            {
                season: 1,
                episode: 2,
                name: 'Infected',
                duration: 53,
                filePath: '/storage/Users/Movies/The.Last.of.Us.S01E02.mkv'
            }
        ]
    };
    const q19: Array<MediaItem> = [
        {
            id: 'seed-dune-2',
            title: 'Dune: Part Two',
            originalTitle: 'Dune: Part Two',
            type: 'movie',
            year: 2024,
            poster: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
            backdrop: 'https://image.tmdb.org/t/p/original/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
            rating: 8.4,
            genres: ['Sci-Fi', 'Adventure'],
            overview: 'Desktop information architecture translated into a HarmonyOS-friendly media wall.',
            duration: 166,
            dateAdded: new Date(o19 - 2 * 86400000).toISOString(),
            releaseDate: '2024-03-01',
            source: 'aliyundrive',
            sourceId: 'source-aliyun-demo',
            sourceName: 'Aliyun Drive',
            seasons: [],
            cloudFileId: 'seed-cloud-01',
            tmdbId: 693134
        },
        {
            id: 'seed-last-of-us',
            title: 'The Last of Us',
            originalTitle: 'The Last of Us',
            type: 'tvshow',
            year: 2023,
            poster: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
            backdrop: 'https://image.tmdb.org/t/p/original/aocAMAdfl6zG0E2H1bhz7LCXuvE.jpg',
            rating: 8.7,
            genres: ['Drama', 'Adventure'],
            overview: 'TV structure is preserved so the next step can bind episode playback and subtitle workflow.',
            duration: 58,
            dateAdded: new Date(o19 - 8 * 86400000).toISOString(),
            releaseDate: '2023-01-15',
            source: 'local',
            sourceId: 'source-local-demo',
            sourceName: 'Local Media',
            seasons: [p19]
        },
        {
            id: 'seed-spiderverse',
            title: 'Spider-Man: Across the Spider-Verse',
            originalTitle: 'Spider-Man: Across the Spider-Verse',
            type: 'movie',
            year: 2023,
            poster: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
            backdrop: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
            rating: 8.4,
            genres: ['Animation', 'Action'],
            overview: 'Used as a bold poster-wall sample for foldables and 2-in-1 devices.',
            duration: 140,
            dateAdded: new Date(o19 - 5 * 86400000).toISOString(),
            releaseDate: '2023-06-02',
            source: 'aliyundrive',
            sourceId: 'source-aliyun-demo',
            sourceName: 'Aliyun Drive',
            seasons: [],
            cloudFileId: 'seed-cloud-02',
            tmdbId: 569094
        },
        {
            id: 'seed-blade-runner',
            title: 'Blade Runner 2049',
            originalTitle: 'Blade Runner 2049',
            type: 'movie',
            year: 2017,
            poster: 'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
            backdrop: 'https://image.tmdb.org/t/p/original/u4izHlsHk8jwalt5m7E2uzrGDQg.jpg',
            rating: 8.1,
            genres: ['Sci-Fi', 'Thriller'],
            overview: 'Useful for validating continue-watching cards and long-detail layouts.',
            duration: 163,
            dateAdded: new Date(o19 - 15 * 86400000).toISOString(),
            releaseDate: '2017-10-06',
            source: 'local',
            sourceId: 'source-local-demo',
            sourceName: 'Local Media',
            seasons: [],
            filePath: '/storage/Users/Movies/Blade.Runner.2049.mkv',
            tmdbId: 335984
        },
        {
            id: 'seed-world-execute',
            title: 'world.execute(me);',
            originalTitle: 'Mili',
            type: 'music',
            poster: '',
            genres: ['Electronic', 'Soundtrack'],
            overview: 'Music remains a first-class section and uses the same playback dock.',
            duration: 4,
            dateAdded: new Date(o19 - 1 * 86400000).toISOString(),
            source: 'aliyundrive',
            sourceId: 'source-aliyun-demo',
            sourceName: 'Aliyun Drive',
            seasons: [],
            cloudFileId: 'seed-cloud-music-01',
            fileExt: 'flac'
        },
        {
            id: 'seed-interstellar',
            title: 'Interstellar',
            originalTitle: 'Interstellar',
            type: 'movie',
            year: 2014,
            poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
            backdrop: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
            rating: 8.4,
            genres: ['Sci-Fi', 'Drama'],
            overview: 'A stable long-form catalog sample for home, recent, and detail pages.',
            duration: 169,
            dateAdded: new Date(o19 - 10 * 86400000).toISOString(),
            releaseDate: '2014-11-07',
            source: 'local',
            sourceId: 'source-local-demo',
            sourceName: 'Local Media',
            seasons: [],
            filePath: '/storage/Users/Movies/Interstellar.mkv',
            tmdbId: 157336
        }
    ];
    return appendProgress(q19, [32, 57, 0, 81, 0, 19]);
}
class AliyunAuthService {
    private async requestString(h19: string, i19: http.HttpRequestOptions): Promise<string> {
        const j19 = http.createHttp();
        try {
            const l19 = await j19.request(h19, i19);
            const m19: number = Number(l19.responseCode);
            const n19: string = typeof l19.result === 'string' ? l19.result : '';
            if (m19 < 200 || m19 >= 300) {
                throw new Error('Aliyun request failed: ' + m19.toString() + ' ' + n19);
            }
            return n19;
        }
        catch (k19) {
            throw new Error(String(k19));
        }
        finally {
            j19.destroy();
        }
    }
    async getQrCode(c19: string, d19: string): Promise<AliyunQrCodeResponse> {
        const e19: AliyunQrCodeRequestBody = {
            client_id: c19,
            client_secret: d19,
            scopes: ALIYUN_SCOPES,
            width: 430,
            height: 430
        };
        const f19: http.HttpRequestOptions = {
            method: http.RequestMethod.POST,
            header: {
                'Content-Type': 'application/json'
            },
            extraData: JSON.stringify(e19),
            expectDataType: http.HttpDataType.STRING
        };
        const g19: string = await this.requestString(ALIYUN_API_BASE + '/oauth/authorize/qrcode', f19);
        return JSON.parse(g19) as AliyunQrCodeResponse;
    }
    async pollQrCodeStatus(z18: string): Promise<AliyunQrStatusResponse> {
        const a19: http.HttpRequestOptions = {
            method: http.RequestMethod.GET,
            header: {
                'Content-Type': 'application/json'
            },
            expectDataType: http.HttpDataType.STRING
        };
        const b19: string = await this.requestString(ALIYUN_API_BASE + '/oauth/qrcode/' + z18 + '/status', a19);
        return JSON.parse(b19) as AliyunQrStatusResponse;
    }
    async exchangeToken(s18: string, t18: string, u18: string): Promise<AliyunTokenState> {
        const v18: AliyunTokenRequestBody = {
            client_id: s18,
            client_secret: t18,
            grant_type: 'authorization_code',
            code: u18
        };
        const w18: http.HttpRequestOptions = {
            method: http.RequestMethod.POST,
            header: {
                'Content-Type': 'application/json'
            },
            extraData: JSON.stringify(v18),
            expectDataType: http.HttpDataType.STRING
        };
        const x18: string = await this.requestString(ALIYUN_API_BASE + '/oauth/access_token', w18);
        const y18: AliyunTokenPayload = JSON.parse(x18) as AliyunTokenPayload;
        return {
            accessToken: y18.access_token,
            refreshToken: y18.refresh_token === undefined ? '' : y18.refresh_token,
            tokenType: y18.token_type === undefined ? 'Bearer' : y18.token_type,
            expiresIn: y18.expires_in === undefined ? 7200 : y18.expires_in,
            obtainedAt: Date.now(),
            driveId: y18.default_drive_id === undefined ? '' : y18.default_drive_id,
            userId: y18.user_id === undefined ? '' : y18.user_id,
            userName: y18.user_name === undefined ? '' : y18.user_name,
            avatar: y18.avatar === undefined ? '' : y18.avatar
        };
    }
    async fetchDriveInfo(p18: AliyunTokenState): Promise<AliyunDriveInfoPayload> {
        const q18: http.HttpRequestOptions = {
            method: http.RequestMethod.POST,
            header: {
                'Content-Type': 'application/json',
                'Authorization': p18.tokenType + ' ' + p18.accessToken
            },
            extraData: JSON.stringify({}),
            expectDataType: http.HttpDataType.STRING
        };
        const r18: string = await this.requestString(ALIYUN_API_BASE + '/adrive/v1.0/user/getDriveInfo', q18);
        return JSON.parse(r18) as AliyunDriveInfoPayload;
    }
}
export class OctovRepository {
    private static instance: OctovRepository | undefined = undefined;
    private bootstrapped: boolean = false;
    private settings: AppSettings = createDefaultSettings();
    private aliyunStatus: AliyunDriveStatus = createDefaultAliyunStatus(MAIN_VITE_ALIYUN_CLIENT_ID, MAIN_VITE_ALIYUN_CLIENT_SECRET);
    private aliyunQrSession: AliyunQrSession = createDefaultAliyunQrSession();
    private aliyunToken: AliyunTokenState | undefined = undefined;
    private playbackSession: PlaybackSession = createDefaultPlayback();
    private storages: Array<StorageAccount> = [];
    private sources: Array<FileSourceItem> = [];
    private mediaLibrary: Array<MediaItem> = [];
    private aliyunAuthService: AliyunAuthService = new AliyunAuthService();
    static shared(): OctovRepository {
        if (OctovRepository.instance === undefined) {
            OctovRepository.instance = new OctovRepository();
        }
        return OctovRepository.instance;
    }
    async bootstrap(): Promise<OctovSnapshot> {
        if (!this.bootstrapped) {
            this.seed();
            this.bootstrapped = true;
        }
        return this.snapshot();
    }
    getSettings(): AppSettings {
        return cloneSettings(this.settings);
    }
    getAliyunStatus(): AliyunDriveStatus {
        return cloneAliyunStatus(this.aliyunStatus);
    }
    getAliyunQrSession(): AliyunQrSession {
        return cloneAliyunQrSession(this.aliyunQrSession);
    }
    updateSettings(o18: AppSettings): OctovSnapshot {
        this.settings = cloneSettings(o18);
        this.applyAliyunCredentialsToStatus();
        return this.snapshot();
    }
    updateAliyunCredentials(m18: string, n18: string): OctovSnapshot {
        this.settings.aliyunClientId = m18;
        this.settings.aliyunClientSecret = n18;
        this.applyAliyunCredentialsToStatus();
        this.aliyunQrSession = createDefaultAliyunQrSession();
        return this.snapshot();
    }
    async requestAliyunQrCode(): Promise<OctovSnapshot> {
        if (this.settings.aliyunClientId.length === 0) {
            this.aliyunQrSession = {
                sid: '',
                qrCodeUrl: '',
                state: 'error',
                statusText: '未配置阿里云盘 client_id。',
                lastError: 'missing_client_id'
            };
            return this.snapshot();
        }
        this.aliyunQrSession = {
            sid: '',
            qrCodeUrl: '',
            state: 'loading',
            statusText: '正在获取二维码...'
        };
        try {
            const l18: AliyunQrCodeResponse = await this.aliyunAuthService.getQrCode(this.settings.aliyunClientId, this.settings.aliyunClientSecret);
            this.aliyunQrSession = {
                sid: l18.sid,
                qrCodeUrl: l18.qrCodeUrl,
                state: 'waiting',
                statusText: '请使用阿里云盘 App 扫描二维码。'
            };
        }
        catch (k18) {
            this.aliyunQrSession = {
                sid: '',
                qrCodeUrl: '',
                state: 'error',
                statusText: '获取二维码失败。',
                lastError: String(k18)
            };
        }
        return this.snapshot();
    }
    async pollAliyunQrCodeStatus(): Promise<OctovSnapshot> {
        if (this.aliyunQrSession.sid.length === 0) {
            return await this.requestAliyunQrCode();
        }
        try {
            const j18: AliyunQrStatusResponse = await this.aliyunAuthService.pollQrCodeStatus(this.aliyunQrSession.sid);
            if (j18.status === 'LoginSuccess' && j18.authCode !== undefined && j18.authCode.length > 0) {
                await this.completeAliyunAuth(j18.authCode);
                return this.snapshot();
            }
            this.aliyunQrSession.state = j18.status === 'ScanSuccess' ? 'scanned' :
                j18.status === 'QRCodeExpired' ? 'expired' : 'waiting';
            this.aliyunQrSession.statusText = buildAliyunStatusText(j18.status);
            this.aliyunQrSession.authCode = j18.authCode;
            return this.snapshot();
        }
        catch (i18) {
            this.aliyunQrSession.state = 'error';
            this.aliyunQrSession.statusText = '轮询扫码状态失败。';
            this.aliyunQrSession.lastError = String(i18);
            return this.snapshot();
        }
    }
    async completeAliyunAuth(e18: string): Promise<OctovSnapshot> {
        try {
            const g18: AliyunTokenState = await this.aliyunAuthService.exchangeToken(this.settings.aliyunClientId, this.settings.aliyunClientSecret, e18);
            const h18: AliyunDriveInfoPayload = await this.aliyunAuthService.fetchDriveInfo(g18);
            if (h18.default_drive_id !== undefined) {
                g18.driveId = h18.default_drive_id;
            }
            if (h18.user_id !== undefined) {
                g18.userId = h18.user_id;
            }
            if (h18.name !== undefined && h18.name.length > 0) {
                g18.userName = h18.name;
            }
            else if (h18.nick_name !== undefined) {
                g18.userName = h18.nick_name;
            }
            if (h18.avatar !== undefined) {
                g18.avatar = h18.avatar;
            }
            this.aliyunToken = g18;
            this.aliyunStatus.isLoggedIn = true;
            this.aliyunStatus.userName = g18.userName;
            this.aliyunStatus.userId = g18.userId;
            this.aliyunStatus.avatar = g18.avatar;
            this.aliyunStatus.driveId = g18.driveId;
            this.aliyunStatus.authorizationSource = '.env';
            this.aliyunQrSession = {
                sid: '',
                qrCodeUrl: '',
                state: 'success',
                statusText: '授权成功，已连接阿里云盘。'
            };
            return this.snapshot();
        }
        catch (f18) {
            this.aliyunToken = undefined;
            this.aliyunStatus.isLoggedIn = false;
            this.aliyunStatus.userName = '';
            this.aliyunStatus.userId = '';
            this.aliyunStatus.avatar = '';
            this.aliyunStatus.driveId = '';
            this.aliyunQrSession = {
                sid: '',
                qrCodeUrl: '',
                state: 'error',
                statusText: '完成授权失败。',
                lastError: String(f18)
            };
            return this.snapshot();
        }
    }
    logoutAliyun(): OctovSnapshot {
        this.aliyunToken = undefined;
        this.aliyunStatus.isLoggedIn = false;
        this.aliyunStatus.userName = '';
        this.aliyunStatus.userId = '';
        this.aliyunStatus.avatar = '';
        this.aliyunStatus.driveId = '';
        this.aliyunQrSession = createDefaultAliyunQrSession();
        this.applyAliyunCredentialsToStatus();
        return this.snapshot();
    }
    async rescanSources(): Promise<OctovSnapshot> {
        this.mediaLibrary = createSeedLibrary();
        return this.snapshot();
    }
    async addLocalSourceFromPicker(): Promise<LocalSourceAddResult> {
        const b18: LocalSelectionResult = await PlatformAdapters.filePicker().pickFolders();
        if (b18.paths.length > 0) {
            const c18: string = b18.paths[0];
            const d18: FileSourceItem = {
                id: toId('source-local', c18),
                name: 'Imported Local Folder',
                storageId: 'local-main',
                storageType: 'local',
                storageName: 'Local Media',
                path: c18,
                createdAt: new Date().toISOString()
            };
            this.addSourceIfNeeded(d18);
        }
        return {
            snapshot: this.snapshot(),
            result: b18
        };
    }
    async openMedia(z17: MediaItem): Promise<OctovSnapshot> {
        let a18: string = z17.id;
        if (z17.filePath !== undefined) {
            a18 = z17.filePath;
        }
        else if (z17.cloudFileId !== undefined) {
            a18 = z17.cloudFileId;
        }
        this.playbackSession = await PlatformAdapters.player().open(a18, z17.title);
        this.playbackSession.sourceLabel = z17.sourceName;
        return this.snapshot();
    }
    async playCurrentMedia(): Promise<OctovSnapshot> {
        this.playbackSession = await PlatformAdapters.player().play();
        return this.snapshot();
    }
    async pauseCurrentMedia(): Promise<OctovSnapshot> {
        this.playbackSession = await PlatformAdapters.player().pause();
        return this.snapshot();
    }
    async stopCurrentMedia(): Promise<OctovSnapshot> {
        this.playbackSession = await PlatformAdapters.player().stop();
        return this.snapshot();
    }
    async seekCurrentMedia(y17: number): Promise<OctovSnapshot> {
        this.playbackSession = await PlatformAdapters.player().seek(y17);
        return this.snapshot();
    }
    async searchSubtitles(t17: string, u17?: number, v17?: number, w17?: number): Promise<Array<SubtitleSearchResult>> {
        const x17: Array<SubtitleSearchResult> = [];
        x17.push({
            id: 'mock-subtitle-1',
            language: 'zh-CN',
            languageName: '简体中文',
            fileName: t17 + '.zh-CN.srt',
            source: 'Mock Catalog',
            downloadUrl: '',
            rating: 4.8
        });
        x17.push({
            id: 'mock-subtitle-2',
            language: 'en',
            languageName: 'English',
            fileName: t17 + '.en.srt',
            source: 'Mock Catalog',
            downloadUrl: '',
            rating: 4.2
        });
        if (v17 !== undefined && w17 !== undefined && u17 !== undefined) {
            x17.push({
                id: 'mock-subtitle-3',
                language: 'zh-TW',
                languageName: '繁体中文',
                fileName: 'tmdb-' + u17.toString() + '-s' + v17.toString() + 'e' + w17.toString() + '.ass',
                source: 'Episode Match',
                downloadUrl: '',
                rating: 4.5
            });
        }
        return x17;
    }
    private seed(): void {
        const s17: string = new Date().toISOString();
        this.storages = [
            {
                id: 'local-main',
                type: 'local',
                name: 'Local Media',
                createdAt: s17,
                userName: 'This Device'
            },
            {
                id: 'aliyun-main',
                type: 'aliyundrive',
                name: 'Aliyun Drive',
                createdAt: s17,
                userName: 'Not Authorized'
            }
        ];
        this.sources = [
            {
                id: 'source-local-demo',
                name: 'Movies Demo',
                storageId: 'local-main',
                storageType: 'local',
                storageName: 'Local Media',
                path: '/storage/Users/Movies',
                createdAt: s17
            },
            {
                id: 'source-aliyun-demo',
                name: 'Cloud Favorites',
                storageId: 'aliyun-main',
                storageType: 'aliyundrive',
                storageName: 'Aliyun Drive',
                path: 'root',
                createdAt: s17
            }
        ];
        this.mediaLibrary = createSeedLibrary();
        this.playbackSession = createDefaultPlayback();
        this.applyAliyunCredentialsToStatus();
        this.aliyunQrSession = createDefaultAliyunQrSession();
    }
    private applyAliyunCredentialsToStatus(): void {
        this.aliyunStatus.clientId = this.settings.aliyunClientId;
        this.aliyunStatus.clientSecretConfigured = this.settings.aliyunClientSecret.length > 0;
        if (!this.aliyunStatus.isLoggedIn) {
            this.aliyunStatus.authorizationSource = this.settings.aliyunClientId.length > 0 ? '.env' : 'not_configured';
        }
    }
    private addSourceIfNeeded(o17: FileSourceItem): void {
        let p17: boolean = false;
        let q17: number = 0;
        while (q17 < this.sources.length) {
            const r17: FileSourceItem = this.sources[q17];
            if (r17.path === o17.path && r17.storageType === o17.storageType) {
                p17 = true;
                break;
            }
            q17 += 1;
        }
        if (!p17) {
            this.sources.push(o17);
        }
    }
    private buildContinueWatching(k17: Array<MediaItem>): Array<MediaItem> {
        const l17: Array<MediaItem> = [];
        let m17: number = 0;
        while (m17 < k17.length) {
            const n17: MediaItem = k17[m17];
            if (n17.progress !== undefined && n17.progress.percentage > 0 && n17.progress.percentage < 95) {
                l17.push(cloneMediaItem(n17));
            }
            m17 += 1;
        }
        return l17;
    }
    private buildRecentlyAdded(i17: Array<MediaItem>): Array<MediaItem> {
        const j17: Array<MediaItem> = cloneMediaList(i17);
        j17.sort(compareDate);
        if (j17.length > 18) {
            return j17.slice(0, 18);
        }
        return j17;
    }
    private snapshot(): OctovSnapshot {
        const h17: Array<MediaItem> = cloneMediaList(this.mediaLibrary);
        return {
            library: h17,
            continueWatching: this.buildContinueWatching(h17),
            recentlyAdded: this.buildRecentlyAdded(h17),
            storages: cloneStorageList(this.storages),
            sources: cloneSourceList(this.sources),
            settings: cloneSettings(this.settings),
            aliyunStatus: cloneAliyunStatus(this.aliyunStatus),
            aliyunQrSession: cloneAliyunQrSession(this.aliyunQrSession),
            playback: clonePlayback(this.playbackSession)
        };
    }
}
