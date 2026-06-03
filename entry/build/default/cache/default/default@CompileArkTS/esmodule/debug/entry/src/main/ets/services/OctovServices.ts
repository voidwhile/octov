import http from "@ohos:net.http";
import preferences from "@ohos:data.preferences";
import type common from "@ohos:app.ability.common";
import fileIo from "@ohos:file.fs";
import type { AliyunDriveStatus, AliyunQrSession, AppSettings, EpisodeItem, FileSourceItem, LocalSelectionResult, MediaItem, OctovSnapshot, PlaybackProgress, PlaybackQualityItem, PlaybackQueueItem, PlaybackSession, SeasonItem, SourceBrowserEntry, SourceBrowserSnapshot, SourceBreadcrumbItem, StorageBrowserSnapshot, StorageAccount, SubtitleCue, SubtitleSearchResult } from '../models/OctovModels';
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
interface AliyunFileListItem {
    file_id: string;
    parent_file_id?: string;
    name: string;
    type: string;
    category?: string;
    size?: number | null;
    updated_at?: string;
    thumbnail?: string;
    video_media_metadata?: AliyunVideoMediaMetadata | null;
}
interface AliyunFileListResponse {
    items?: Array<AliyunFileListItem>;
    next_marker?: string;
}
interface AliyunSearchResponse {
    items?: Array<AliyunFileListItem>;
    next_marker?: string;
}
interface AliyunVideoMediaMetadata {
    duration?: number;
}
interface AliyunVideoPreviewTask {
    template_id?: string;
    status?: string;
    url?: string;
}
interface AliyunVideoPreviewPayload {
    live_transcoding_task_list?: Array<AliyunVideoPreviewTask>;
    meta?: AliyunVideoMediaMetadata | null;
}
interface AliyunVideoPreviewPlayInfoResponse {
    video_preview_play_info?: AliyunVideoPreviewPayload;
}
interface AliyunDownloadUrlResponse {
    url?: string;
    expiration?: string;
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
    refresh_token?: string;
}
interface PersistedAliyunSession {
    token?: AliyunTokenState;
}
interface PersistedAppState {
    storages?: Array<StorageAccount>;
    sources?: Array<FileSourceItem>;
    mediaLibrary?: Array<MediaItem>;
}
interface ScannedFileRecord {
    id: string;
    name: string;
    source: 'local' | 'aliyundrive';
    sourceId: string;
    sourceName: string;
    parentKey: string;
    parentName: string;
    dateAdded: string;
    fileExt: string;
    kind: 'video' | 'audio';
    cloudFileId?: string;
    filePath?: string;
    duration?: number;
}
interface ParsedMediaName {
    title: string;
    year?: number;
    season?: number;
    episode?: number;
}
interface OpenSubtitleItemAttributes {
    language?: string;
    release?: string;
    ratings?: number;
    feature_details?: OpenSubtitleFeatureDetails;
    files?: Array<OpenSubtitleFileRef>;
}
interface OpenSubtitleFeatureDetails {
    title?: string;
}
interface OpenSubtitleFileRef {
    file_id?: number;
}
interface OpenSubtitleSearchItem {
    id: string;
    attributes?: OpenSubtitleItemAttributes;
}
interface OpenSubtitleSearchPayload {
    data?: Array<OpenSubtitleSearchItem>;
}
interface OpenSubtitleDownloadPayload {
    link?: string;
}
const VIDEO_EXTENSIONS: Array<string> = [
    'mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv',
    'rmvb', 'ts', 'm4v', 'webm', 'mpg', 'mpeg', 'm2ts'
];
const AUDIO_EXTENSIONS: Array<string> = [
    'mp3', 'flac', 'wav', 'aac', 'm4a', 'ogg', 'opus', 'wma', 'ape', 'alac', 'aiff'
];
const SUBTITLE_EXTENSIONS: Array<string> = ['srt', 'vtt', 'ass', 'ssa'];
const OPEN_SUBTITLE_BASE: string = 'https://api.opensubtitles.com/api/v1';
const ZXKI_SUBTITLE_BASE: string = 'https://api.zxki.cn/api/spzm';
const NETEASE_SEARCH_URL: string = 'http://music.163.com/api/search/get/web';
const NETEASE_LYRIC_URL: string = 'http://music.163.com/api/song/lyric';
function formatFileSize(bytes?: number | null): string {
    if (bytes === undefined || bytes === null || bytes < 0) {
        return '';
    }
    const units: Array<string> = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value: number = bytes;
    let index: number = 0;
    while (value >= 1024 && index < units.length - 1) {
        value = value / 1024;
        index += 1;
    }
    return value.toFixed(1) + ' ' + units[index];
}
function getFileExtension(name: string): string {
    const normalized: Array<string> = name.split('.');
    if (normalized.length <= 1) {
        return '';
    }
    return normalized[normalized.length - 1].toLowerCase();
}
function isVideoFile(name: string): boolean {
    return VIDEO_EXTENSIONS.indexOf(getFileExtension(name)) >= 0;
}
function isAudioFile(name: string): boolean {
    return AUDIO_EXTENSIONS.indexOf(getFileExtension(name)) >= 0;
}
function isSubtitleFile(name: string): boolean {
    return SUBTITLE_EXTENSIONS.indexOf(getFileExtension(name)) >= 0;
}
function parseSrtContent(content: string): Array<SubtitleCue> {
    const cues: Array<SubtitleCue> = [];
    const blocks: Array<string> = content.trim().split(/\n\s*\n/);
    let blockIndex: number = 0;
    while (blockIndex < blocks.length) {
        const lines: Array<string> = blocks[blockIndex].trim().split('\n');
        if (lines.length >= 3) {
            const timeMatch: RegExpMatchArray | null = lines[1].match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
            if (timeMatch !== null) {
                const startTime: number = parseInt(timeMatch[1], 10) * 3600 +
                    parseInt(timeMatch[2], 10) * 60 +
                    parseInt(timeMatch[3], 10) +
                    parseInt(timeMatch[4], 10) / 1000;
                const endTime: number = parseInt(timeMatch[5], 10) * 3600 +
                    parseInt(timeMatch[6], 10) * 60 +
                    parseInt(timeMatch[7], 10) +
                    parseInt(timeMatch[8], 10) / 1000;
                const text: string = lines
                    .slice(2)
                    .join('\n')
                    .replace(/<[^>]+>/g, '')
                    .trim();
                if (text.length > 0) {
                    cues.push({
                        startTime: startTime,
                        endTime: endTime,
                        text: text
                    });
                }
            }
        }
        blockIndex += 1;
    }
    return cues;
}
function parseVttContent(content: string): Array<SubtitleCue> {
    return parseSrtContent(content.replace(/^WEBVTT.*?\n\n/s, ''));
}
function parseAssContent(content: string): Array<SubtitleCue> {
    const cues: Array<SubtitleCue> = [];
    const lines: Array<string> = content.split('\n');
    let index: number = 0;
    while (index < lines.length) {
        const line: string = lines[index];
        if (line.trim().startsWith('Dialogue:')) {
            const parts: Array<string> = line.split(',');
            if (parts.length >= 10) {
                const parseTime = (value: string): number => {
                    const sections: Array<string> = value.split(':');
                    const secondParts: Array<string> = sections[2].split('.');
                    return parseInt(sections[0], 10) * 3600 +
                        parseInt(sections[1], 10) * 60 +
                        parseInt(secondParts[0], 10) +
                        parseInt(secondParts[1], 10) / 100;
                };
                try {
                    cues.push({
                        startTime: parseTime(parts[1].trim()),
                        endTime: parseTime(parts[2].trim()),
                        text: parts.slice(9).join(',').replace(/\{[^}]+\}/g, '').replace(/\\N/g, '\n').trim()
                    });
                }
                catch (_error) {
                }
            }
        }
        index += 1;
    }
    return cues;
}
function parseSubtitleContent(content: string): Array<SubtitleCue> {
    if (content.includes('WEBVTT')) {
        return parseVttContent(content);
    }
    if (content.includes('[Events]') && content.includes('Dialogue:')) {
        return parseAssContent(content);
    }
    return parseSrtContent(content);
}
function parseEpisodeInfo(name: string): ParsedMediaName | undefined {
    const matchers: Array<RegExp> = [
        /S(\d{1,2})E(\d{1,3})/i,
        /Season\s*(\d+).*?E(\d{1,3})/i,
        /第\s*(\d+)\s*季/,
        /第\s*(\d+)\s*季.*?第\s*(\d+)\s*[集话期]/,
        /第\s*(\d+)\s*[集话期]/,
        /\bEP?\s*(\d{1,3})\b/i,
        /\[(\d{2,3})\]/,
        /(?:^|[\s._-])E(\d{1,3})(?:$|[\s._-])/i
    ];
    let index: number = 0;
    while (index < matchers.length) {
        const match: RegExpMatchArray | null = name.match(matchers[index]);
        if (match !== null) {
            if (matchers[index].source === /第\s*(\d+)\s*季/.source) {
                return {
                    title: '',
                    season: parseInt(match[1], 10)
                };
            }
            if (match.length >= 3 && match[2] !== undefined) {
                return {
                    title: '',
                    season: parseInt(match[1], 10),
                    episode: parseInt(match[2], 10)
                };
            }
            return {
                title: '',
                season: 1,
                episode: parseInt(match[1], 10)
            };
        }
        index += 1;
    }
    return undefined;
}
function cleanMediaTitle(name: string): string {
    let cleaned: string = name.replace(/\.[^.]+$/, '');
    cleaned = cleaned
        .replace(/S\d{1,2}E\d{1,3}/gi, ' ')
        .replace(/Season\s*\d+.*?E\d{1,3}/gi, ' ')
        .replace(/\bEP?\s*\d{1,3}\b/gi, ' ')
        .replace(/(?:^|[\s._-])E\d{1,3}(?:$|[\s._-])/gi, ' ')
        .replace(/第\s*\d+\s*季/g, ' ')
        .replace(/第\s*\d+\s*[集话期]/g, ' ')
        .replace(/\[\d{2,3}\]/g, ' ')
        .replace(/[\[\(【（][^\]\)】）]*[\]\)】）]/g, ' ')
        .replace(/[\._\-]/g, ' ')
        .replace(/\b(1080p|720p|2160p|4k|uhd|x264|x265|hevc|h264|h265|aac|dts|hdr|webrip|webdl|bluray|remux)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return cleaned.length === 0 ? name.replace(/\.[^.]+$/, '') : cleaned;
}
function parseMediaName(name: string, fallbackFolder?: string): ParsedMediaName {
    const episodeInfo: ParsedMediaName | undefined = parseEpisodeInfo(name);
    const folderInfo: ParsedMediaName | undefined = fallbackFolder === undefined ? undefined : parseEpisodeInfo(fallbackFolder);
    const yearMatch: RegExpMatchArray | null = name.match(/(?:^|[\s.\-_((（【])((19|20)\d{2})(?=$|[\s.\-_)）】])/);
    const titleSource: string = cleanMediaTitle(name);
    let title: string = titleSource;
    if (title.length === 0 && fallbackFolder !== undefined) {
        title = cleanMediaTitle(fallbackFolder);
    }
    if (title.length === 0) {
        title = name.replace(/\.[^.]+$/, '');
    }
    return {
        title: title,
        year: yearMatch === null ? undefined : parseInt(yearMatch[1], 10),
        season: episodeInfo !== undefined && episodeInfo.season !== undefined
            ? episodeInfo.season
            : folderInfo === undefined
                ? undefined
                : folderInfo.season,
        episode: episodeInfo === undefined ? undefined : episodeInfo.episode
    };
}
function normalizeMediaKey(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-');
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
function createDefaultAliyunStatus(clientId: string, clientSecret: string): AliyunDriveStatus {
    return {
        isLoggedIn: false,
        clientId: clientId,
        clientSecretConfigured: clientSecret.length > 0,
        userName: '',
        userId: '',
        avatar: '',
        driveId: '',
        authorizationSource: clientId.length > 0 ? '.env' : 'not_configured'
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
        subtitle: '请选择媒体内容',
        sourceLabel: '播放器',
        status: 'idle',
        progress: 0,
        currentTime: 0,
        duration: 0,
        availableQualities: [],
        playlist: [],
        playlistIndex: -1,
        message: '等待播放器就绪。'
    };
}
function toId(prefix: string, value: string): string {
    return prefix + '-' + value.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
}
function cloneProgress(progress: PlaybackProgress | undefined): PlaybackProgress | undefined {
    if (progress === undefined) {
        return undefined;
    }
    return {
        currentTime: progress.currentTime,
        totalDuration: progress.totalDuration,
        percentage: progress.percentage,
        lastPlayed: progress.lastPlayed
    };
}
function cloneEpisode(item: EpisodeItem): EpisodeItem {
    return {
        season: item.season,
        episode: item.episode,
        name: item.name,
        duration: item.duration,
        cloudFileId: item.cloudFileId,
        filePath: item.filePath
    };
}
function cloneSeason(item: SeasonItem): SeasonItem {
    const episodes: Array<EpisodeItem> = [];
    let index: number = 0;
    while (index < item.episodes.length) {
        episodes.push(cloneEpisode(item.episodes[index]));
        index += 1;
    }
    return {
        seasonNumber: item.seasonNumber,
        name: item.name,
        episodes: episodes
    };
}
function cloneMediaItem(item: MediaItem): MediaItem {
    const seasons: Array<SeasonItem> = [];
    let seasonIndex: number = 0;
    while (seasonIndex < item.seasons.length) {
        seasons.push(cloneSeason(item.seasons[seasonIndex]));
        seasonIndex += 1;
    }
    const genres: Array<string> = [];
    let genreIndex: number = 0;
    while (genreIndex < item.genres.length) {
        genres.push(item.genres[genreIndex]);
        genreIndex += 1;
    }
    return {
        id: item.id,
        title: item.title,
        originalTitle: item.originalTitle,
        type: item.type,
        year: item.year,
        poster: item.poster,
        backdrop: item.backdrop,
        rating: item.rating,
        genres: genres,
        overview: item.overview,
        duration: item.duration,
        dateAdded: item.dateAdded,
        releaseDate: item.releaseDate,
        filePath: item.filePath,
        source: item.source,
        sourceId: item.sourceId,
        sourceName: item.sourceName,
        cloudFileId: item.cloudFileId,
        tmdbId: item.tmdbId,
        progress: cloneProgress(item.progress),
        seasons: seasons,
        fileExt: item.fileExt
    };
}
function cloneMediaList(items: Array<MediaItem>): Array<MediaItem> {
    const list: Array<MediaItem> = [];
    let index: number = 0;
    while (index < items.length) {
        list.push(cloneMediaItem(items[index]));
        index += 1;
    }
    return list;
}
function cloneStorageList(items: Array<StorageAccount>): Array<StorageAccount> {
    const list: Array<StorageAccount> = [];
    let index: number = 0;
    while (index < items.length) {
        const item: StorageAccount = items[index];
        list.push({
            id: item.id,
            type: item.type,
            name: item.name,
            createdAt: item.createdAt,
            userName: item.userName
        });
        index += 1;
    }
    return list;
}
function cloneSourceList(items: Array<FileSourceItem>): Array<FileSourceItem> {
    const list: Array<FileSourceItem> = [];
    let index: number = 0;
    while (index < items.length) {
        const item: FileSourceItem = items[index];
        list.push({
            id: item.id,
            name: item.name,
            storageId: item.storageId,
            storageType: item.storageType,
            storageName: item.storageName,
            path: item.path,
            createdAt: item.createdAt
        });
        index += 1;
    }
    return list;
}
function cloneSettings(item: AppSettings): AppSettings {
    return {
        theme: item.theme,
        tmdbApiKey: item.tmdbApiKey,
        subtitleApiKey: item.subtitleApiKey,
        aliyunClientId: item.aliyunClientId,
        aliyunClientSecret: item.aliyunClientSecret
    };
}
function cloneAliyunStatus(item: AliyunDriveStatus): AliyunDriveStatus {
    return {
        isLoggedIn: item.isLoggedIn,
        clientId: item.clientId,
        clientSecretConfigured: item.clientSecretConfigured,
        userName: item.userName,
        userId: item.userId,
        avatar: item.avatar,
        driveId: item.driveId,
        authorizationSource: item.authorizationSource
    };
}
function cloneAliyunQrSession(item: AliyunQrSession): AliyunQrSession {
    return {
        sid: item.sid,
        qrCodeUrl: item.qrCodeUrl,
        state: item.state,
        statusText: item.statusText,
        authCode: item.authCode,
        lastError: item.lastError
    };
}
function clonePlayback(item: PlaybackSession): PlaybackSession {
    const qualities: Array<PlaybackQualityItem> = [];
    let qualityIndex: number = 0;
    while (qualityIndex < item.availableQualities.length) {
        qualities.push({
            id: item.availableQualities[qualityIndex].id,
            label: item.availableQualities[qualityIndex].label,
            url: item.availableQualities[qualityIndex].url,
            format: item.availableQualities[qualityIndex].format
        });
        qualityIndex += 1;
    }
    const playlist: Array<PlaybackQueueItem> = [];
    let playlistIndex: number = 0;
    while (playlistIndex < item.playlist.length) {
        playlist.push({
            id: item.playlist[playlistIndex].id,
            title: item.playlist[playlistIndex].title
        });
        playlistIndex += 1;
    }
    return {
        mediaId: item.mediaId,
        cloudFileId: item.cloudFileId,
        parentFolderId: item.parentFolderId,
        title: item.title,
        subtitle: item.subtitle,
        sourceLabel: item.sourceLabel,
        status: item.status,
        progress: item.progress,
        currentTime: item.currentTime,
        duration: item.duration,
        downloadUrl: item.downloadUrl,
        activeQualityId: item.activeQualityId,
        availableQualities: qualities,
        playlist: playlist,
        playlistIndex: item.playlistIndex,
        message: item.message
    };
}
function compareDate(left: MediaItem, right: MediaItem): number {
    const leftValue: number = new Date(left.dateAdded).getTime();
    const rightValue: number = new Date(right.dateAdded).getTime();
    if (leftValue > rightValue) {
        return -1;
    }
    if (leftValue < rightValue) {
        return 1;
    }
    return 0;
}
function buildAliyunStatusText(state: string): string {
    if (state === 'ScanSuccess') {
        return '扫码成功，请在阿里云盘 App 中确认授权。';
    }
    if (state === 'LoginSuccess') {
        return '授权成功，正在同步账号信息。';
    }
    if (state === 'QRCodeExpired') {
        return '二维码已过期，请重新获取。';
    }
    if (state === 'WaitLogin') {
        return '请使用阿里云盘 App 扫描二维码。';
    }
    return '正在等待授权结果。';
}
class AliyunAuthService {
    private async requestString(url: string, options: http.HttpRequestOptions): Promise<string> {
        const request = http.createHttp();
        try {
            const response = await request.request(url, options);
            const statusCode: number = Number(response.responseCode);
            const bodyText: string = typeof response.result === 'string' ? response.result : '';
            if (statusCode < 200 || statusCode >= 300) {
                throw new Error('Aliyun request failed: ' + statusCode.toString() + ' ' + bodyText);
            }
            return bodyText;
        }
        catch (error) {
            throw new Error(String(error));
        }
        finally {
            request.destroy();
        }
    }
    async getQrCode(clientId: string, clientSecret: string): Promise<AliyunQrCodeResponse> {
        const body: AliyunQrCodeRequestBody = {
            client_id: clientId,
            client_secret: clientSecret,
            scopes: ALIYUN_SCOPES,
            width: 430,
            height: 430
        };
        const options: http.HttpRequestOptions = {
            method: http.RequestMethod.POST,
            header: {
                'Content-Type': 'application/json'
            },
            extraData: JSON.stringify(body),
            expectDataType: http.HttpDataType.STRING
        };
        const resultText: string = await this.requestString(ALIYUN_API_BASE + '/oauth/authorize/qrcode', options);
        return JSON.parse(resultText) as AliyunQrCodeResponse;
    }
    async pollQrCodeStatus(sid: string): Promise<AliyunQrStatusResponse> {
        const options: http.HttpRequestOptions = {
            method: http.RequestMethod.GET,
            header: {
                'Content-Type': 'application/json'
            },
            expectDataType: http.HttpDataType.STRING
        };
        const resultText: string = await this.requestString(ALIYUN_API_BASE + '/oauth/qrcode/' + sid + '/status', options);
        return JSON.parse(resultText) as AliyunQrStatusResponse;
    }
    async exchangeToken(clientId: string, clientSecret: string, authCode: string): Promise<AliyunTokenState> {
        const body: AliyunTokenRequestBody = {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'authorization_code',
            code: authCode
        };
        const options: http.HttpRequestOptions = {
            method: http.RequestMethod.POST,
            header: {
                'Content-Type': 'application/json'
            },
            extraData: JSON.stringify(body),
            expectDataType: http.HttpDataType.STRING
        };
        const resultText: string = await this.requestString(ALIYUN_API_BASE + '/oauth/access_token', options);
        const payload: AliyunTokenPayload = JSON.parse(resultText) as AliyunTokenPayload;
        return this.buildTokenState(payload);
    }
    async refreshAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<AliyunTokenState> {
        const body: AliyunTokenRequestBody = {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'refresh_token',
            code: '',
            refresh_token: refreshToken
        };
        const options: http.HttpRequestOptions = {
            method: http.RequestMethod.POST,
            header: {
                'Content-Type': 'application/json'
            },
            extraData: JSON.stringify(body),
            expectDataType: http.HttpDataType.STRING
        };
        const resultText: string = await this.requestString(ALIYUN_API_BASE + '/oauth/access_token', options);
        const payload: AliyunTokenPayload = JSON.parse(resultText) as AliyunTokenPayload;
        return this.buildTokenState(payload);
    }
    async fetchDriveInfo(token: AliyunTokenState): Promise<AliyunDriveInfoPayload> {
        const options: http.HttpRequestOptions = {
            method: http.RequestMethod.POST,
            header: {
                'Content-Type': 'application/json',
                'Authorization': token.tokenType + ' ' + token.accessToken
            },
            extraData: JSON.stringify({}),
            expectDataType: http.HttpDataType.STRING
        };
        const resultText: string = await this.requestString(ALIYUN_API_BASE + '/adrive/v1.0/user/getDriveInfo', options);
        return JSON.parse(resultText) as AliyunDriveInfoPayload;
    }
    async listFiles(token: AliyunTokenState, parentFileId: string, marker?: string): Promise<AliyunFileListResponse> {
        const options: http.HttpRequestOptions = {
            method: http.RequestMethod.POST,
            header: {
                'Content-Type': 'application/json',
                'Authorization': token.tokenType + ' ' + token.accessToken
            },
            extraData: JSON.stringify({
                drive_id: token.driveId,
                parent_file_id: parentFileId,
                limit: 100,
                order_by: 'updated_at',
                order_direction: 'DESC',
                marker: marker === undefined ? '' : marker
            }),
            expectDataType: http.HttpDataType.STRING
        };
        const resultText: string = await this.requestString(ALIYUN_API_BASE + '/adrive/v1.0/openFile/list', options);
        return JSON.parse(resultText) as AliyunFileListResponse;
    }
    async searchFiles(token: AliyunTokenState, query: string, marker?: string): Promise<AliyunSearchResponse> {
        const options: http.HttpRequestOptions = {
            method: http.RequestMethod.POST,
            header: {
                'Content-Type': 'application/json',
                'Authorization': token.tokenType + ' ' + token.accessToken
            },
            extraData: JSON.stringify({
                drive_id: token.driveId,
                query: query,
                limit: 50,
                marker: marker === undefined ? '' : marker
            }),
            expectDataType: http.HttpDataType.STRING
        };
        const resultText: string = await this.requestString(ALIYUN_API_BASE + '/adrive/v1.0/openFile/search', options);
        return JSON.parse(resultText) as AliyunSearchResponse;
    }
    async getVideoPlayInfo(token: AliyunTokenState, fileId: string): Promise<AliyunVideoPreviewPlayInfoResponse> {
        const options: http.HttpRequestOptions = {
            method: http.RequestMethod.POST,
            header: {
                'Content-Type': 'application/json',
                'Authorization': token.tokenType + ' ' + token.accessToken
            },
            extraData: JSON.stringify({
                drive_id: token.driveId,
                file_id: fileId,
                category: 'live_transcoding',
                get_subtitle_info: true
            }),
            expectDataType: http.HttpDataType.STRING
        };
        const resultText: string = await this.requestString(ALIYUN_API_BASE + '/adrive/v1.0/openFile/getVideoPreviewPlayInfo', options);
        return JSON.parse(resultText) as AliyunVideoPreviewPlayInfoResponse;
    }
    async getDownloadUrl(token: AliyunTokenState, fileId: string): Promise<AliyunDownloadUrlResponse> {
        const options: http.HttpRequestOptions = {
            method: http.RequestMethod.POST,
            header: {
                'Content-Type': 'application/json',
                'Authorization': token.tokenType + ' ' + token.accessToken
            },
            extraData: JSON.stringify({
                drive_id: token.driveId,
                file_id: fileId,
                expire_sec: 900
            }),
            expectDataType: http.HttpDataType.STRING
        };
        const resultText: string = await this.requestString(ALIYUN_API_BASE + '/adrive/v1.0/openFile/getDownloadUrl', options);
        return JSON.parse(resultText) as AliyunDownloadUrlResponse;
    }
    async updatePlayCursor(token: AliyunTokenState, fileId: string, playCursor: number): Promise<void> {
        const options: http.HttpRequestOptions = {
            method: http.RequestMethod.POST,
            header: {
                'Content-Type': 'application/json',
                'Authorization': token.tokenType + ' ' + token.accessToken
            },
            extraData: JSON.stringify({
                drive_id: token.driveId,
                file_id: fileId,
                play_cursor: playCursor.toString()
            }),
            expectDataType: http.HttpDataType.STRING
        };
        await this.requestString(ALIYUN_API_BASE + '/adrive/v1.0/openFile/video/updateRecord', options);
    }
    private buildTokenState(payload: AliyunTokenPayload): AliyunTokenState {
        return {
            accessToken: payload.access_token,
            refreshToken: payload.refresh_token === undefined ? '' : payload.refresh_token,
            tokenType: payload.token_type === undefined ? 'Bearer' : payload.token_type,
            expiresIn: payload.expires_in === undefined ? 7200 : payload.expires_in,
            obtainedAt: Date.now(),
            driveId: payload.default_drive_id === undefined ? '' : payload.default_drive_id,
            userId: payload.user_id === undefined ? '' : payload.user_id,
            userName: payload.user_name === undefined ? '' : payload.user_name,
            avatar: payload.avatar === undefined ? '' : payload.avatar
        };
    }
}
export class OctovRepository {
    private static instance: OctovRepository | undefined = undefined;
    private static readonly preferenceName: string = 'octov.preferences';
    private static readonly aliyunSessionKey: string = 'aliyun.session';
    private static readonly appStateKey: string = 'app.state';
    private bootstrapped: boolean = false;
    private settings: AppSettings = createDefaultSettings();
    private aliyunStatus: AliyunDriveStatus = createDefaultAliyunStatus(MAIN_VITE_ALIYUN_CLIENT_ID, MAIN_VITE_ALIYUN_CLIENT_SECRET);
    private aliyunQrSession: AliyunQrSession = createDefaultAliyunQrSession();
    private aliyunToken: AliyunTokenState | undefined = undefined;
    private playbackSession: PlaybackSession = createDefaultPlayback();
    private storages: Array<StorageAccount> = [];
    private sources: Array<FileSourceItem> = [];
    private mediaLibrary: Array<MediaItem> = [];
    private currentPlaybackMediaId: string = '';
    private aliyunAuthService: AliyunAuthService = new AliyunAuthService();
    private lastAliyunBrowseError: string = '';
    private remoteFolderNameCache: Map<string, string> = new Map();
    private remoteFolderParentCache: Map<string, string> = new Map();
    private abilityContext: common.UIAbilityContext | undefined = undefined;
    private preferenceStore: preferences.Preferences | undefined = undefined;
    static shared(): OctovRepository {
        if (OctovRepository.instance === undefined) {
            OctovRepository.instance = new OctovRepository();
        }
        return OctovRepository.instance;
    }
    setAbilityContext(context: common.UIAbilityContext): void {
        this.abilityContext = context;
    }
    async bootstrap(): Promise<OctovSnapshot> {
        if (!this.bootstrapped) {
            this.seed();
            await this.restorePersistedAppState();
            await this.restorePersistedAliyunSession();
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
    private async getPreferenceStore(): Promise<preferences.Preferences | undefined> {
        if (this.abilityContext === undefined) {
            return undefined;
        }
        if (this.preferenceStore !== undefined) {
            return this.preferenceStore;
        }
        try {
            this.preferenceStore = await preferences.getPreferences(this.abilityContext, {
                name: OctovRepository.preferenceName
            });
            return this.preferenceStore;
        }
        catch (_error) {
            return undefined;
        }
    }
    private async persistAliyunSession(): Promise<void> {
        const store: preferences.Preferences | undefined = await this.getPreferenceStore();
        if (store === undefined) {
            return;
        }
        const payload: PersistedAliyunSession = {
            token: this.aliyunToken === undefined ? undefined : this.aliyunToken
        };
        try {
            await store.put(OctovRepository.aliyunSessionKey, JSON.stringify(payload));
            await store.flush();
        }
        catch (_error) {
        }
    }
    private async persistAppState(): Promise<void> {
        const store: preferences.Preferences | undefined = await this.getPreferenceStore();
        if (store === undefined) {
            return;
        }
        const payload: PersistedAppState = {
            storages: cloneStorageList(this.storages),
            sources: cloneSourceList(this.sources),
            mediaLibrary: cloneMediaList(this.mediaLibrary)
        };
        try {
            await store.put(OctovRepository.appStateKey, JSON.stringify(payload));
            await store.flush();
        }
        catch (_error) {
        }
    }
    private async clearPersistedAliyunSession(): Promise<void> {
        const store: preferences.Preferences | undefined = await this.getPreferenceStore();
        if (store === undefined) {
            return;
        }
        try {
            await store.delete(OctovRepository.aliyunSessionKey);
            await store.flush();
        }
        catch (_error) {
        }
    }
    private async restorePersistedAliyunSession(): Promise<void> {
        const store: preferences.Preferences | undefined = await this.getPreferenceStore();
        if (store === undefined) {
            return;
        }
        let rawValue: preferences.ValueType = '';
        try {
            rawValue = await store.get(OctovRepository.aliyunSessionKey, '');
        }
        catch (_error) {
            return;
        }
        const sessionText: string = typeof rawValue === 'string' ? rawValue : '';
        if (sessionText.length === 0) {
            return;
        }
        try {
            const payload: PersistedAliyunSession = JSON.parse(sessionText) as PersistedAliyunSession;
            if (payload.token === undefined || payload.token.refreshToken.length === 0) {
                await this.clearPersistedAliyunSession();
                return;
            }
            this.aliyunToken = payload.token;
            await this.ensureAliyunTokenReady();
        }
        catch (_error) {
            this.aliyunToken = undefined;
            await this.clearPersistedAliyunSession();
        }
    }
    private async restorePersistedAppState(): Promise<void> {
        const store: preferences.Preferences | undefined = await this.getPreferenceStore();
        if (store === undefined) {
            return;
        }
        let rawValue: preferences.ValueType = '';
        try {
            rawValue = await store.get(OctovRepository.appStateKey, '');
        }
        catch (_error) {
            return;
        }
        const stateText: string = typeof rawValue === 'string' ? rawValue : '';
        if (stateText.length === 0) {
            return;
        }
        try {
            const payload: PersistedAppState = JSON.parse(stateText) as PersistedAppState;
            this.storages = Array.isArray(payload.storages) ? cloneStorageList(payload.storages) : [];
            this.sources = Array.isArray(payload.sources) ? cloneSourceList(payload.sources) : [];
            this.mediaLibrary = Array.isArray(payload.mediaLibrary) ? cloneMediaList(payload.mediaLibrary) : [];
        }
        catch (_error) {
            this.storages = [];
            this.sources = [];
            this.mediaLibrary = [];
        }
    }
    private isAliyunTokenExpiringSoon(token: AliyunTokenState): boolean {
        const expiresAt: number = token.obtainedAt + token.expiresIn * 1000;
        return Date.now() >= expiresAt - 5 * 60 * 1000;
    }
    private applyAliyunTokenState(tokenState: AliyunTokenState): void {
        this.aliyunToken = tokenState;
        this.aliyunStatus.isLoggedIn = true;
        this.aliyunStatus.userName = tokenState.userName;
        this.aliyunStatus.userId = tokenState.userId;
        this.aliyunStatus.avatar = tokenState.avatar;
        this.aliyunStatus.driveId = tokenState.driveId;
        this.aliyunStatus.authorizationSource = '.env';
        this.upsertAliyunStorage(tokenState.userName);
    }
    private async ensureAliyunTokenReady(): Promise<AliyunTokenState | undefined> {
        if (this.aliyunToken === undefined) {
            return undefined;
        }
        if (!this.isAliyunTokenExpiringSoon(this.aliyunToken)) {
            this.applyAliyunTokenState(this.aliyunToken);
            return this.aliyunToken;
        }
        if (this.aliyunToken.refreshToken.length === 0) {
            this.logoutAliyun();
            await this.clearPersistedAliyunSession();
            return undefined;
        }
        try {
            const refreshedToken: AliyunTokenState = await this.aliyunAuthService.refreshAccessToken(this.settings.aliyunClientId, this.settings.aliyunClientSecret, this.aliyunToken.refreshToken);
            if (refreshedToken.userName.length === 0) {
                refreshedToken.userName = this.aliyunToken.userName;
            }
            if (refreshedToken.userId.length === 0) {
                refreshedToken.userId = this.aliyunToken.userId;
            }
            if (refreshedToken.avatar.length === 0) {
                refreshedToken.avatar = this.aliyunToken.avatar;
            }
            if (refreshedToken.driveId.length === 0) {
                refreshedToken.driveId = this.aliyunToken.driveId;
            }
            if (refreshedToken.driveId.length === 0 || refreshedToken.userName.length === 0) {
                const driveInfo: AliyunDriveInfoPayload = await this.aliyunAuthService.fetchDriveInfo(refreshedToken);
                if (driveInfo.default_drive_id !== undefined && driveInfo.default_drive_id.length > 0) {
                    refreshedToken.driveId = driveInfo.default_drive_id;
                }
                if (driveInfo.user_id !== undefined && driveInfo.user_id.length > 0) {
                    refreshedToken.userId = driveInfo.user_id;
                }
                if (driveInfo.name !== undefined && driveInfo.name.length > 0) {
                    refreshedToken.userName = driveInfo.name;
                }
                else if (driveInfo.nick_name !== undefined && driveInfo.nick_name.length > 0) {
                    refreshedToken.userName = driveInfo.nick_name;
                }
                if (driveInfo.avatar !== undefined && driveInfo.avatar.length > 0) {
                    refreshedToken.avatar = driveInfo.avatar;
                }
            }
            this.applyAliyunTokenState(refreshedToken);
            await this.persistAliyunSession();
            await this.persistAppState();
            return refreshedToken;
        }
        catch (_error) {
            this.logoutAliyun();
            await this.clearPersistedAliyunSession();
            return undefined;
        }
    }
    updateSettings(next: AppSettings): OctovSnapshot {
        this.settings = cloneSettings(next);
        this.applyAliyunCredentialsToStatus();
        return this.snapshot();
    }
    updateAliyunCredentials(clientId: string, clientSecret: string): OctovSnapshot {
        this.settings.aliyunClientId = clientId;
        this.settings.aliyunClientSecret = clientSecret;
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
            const payload: AliyunQrCodeResponse = await this.aliyunAuthService.getQrCode(this.settings.aliyunClientId, this.settings.aliyunClientSecret);
            this.aliyunQrSession = {
                sid: payload.sid,
                qrCodeUrl: payload.qrCodeUrl,
                state: 'waiting',
                statusText: '请使用阿里云盘 App 扫描二维码。'
            };
        }
        catch (error) {
            this.aliyunQrSession = {
                sid: '',
                qrCodeUrl: '',
                state: 'error',
                statusText: '获取二维码失败。',
                lastError: String(error)
            };
        }
        return this.snapshot();
    }
    async pollAliyunQrCodeStatus(): Promise<OctovSnapshot> {
        if (this.aliyunQrSession.sid.length === 0) {
            return await this.requestAliyunQrCode();
        }
        try {
            const payload: AliyunQrStatusResponse = await this.aliyunAuthService.pollQrCodeStatus(this.aliyunQrSession.sid);
            if (payload.status === 'LoginSuccess' && payload.authCode !== undefined && payload.authCode.length > 0) {
                await this.completeAliyunAuth(payload.authCode);
                return this.snapshot();
            }
            this.aliyunQrSession.state = payload.status === 'ScanSuccess' ? 'scanned' :
                payload.status === 'QRCodeExpired' ? 'expired' : 'waiting';
            this.aliyunQrSession.statusText = buildAliyunStatusText(payload.status);
            this.aliyunQrSession.authCode = payload.authCode;
            return this.snapshot();
        }
        catch (error) {
            this.aliyunQrSession.state = 'error';
            this.aliyunQrSession.statusText = '轮询扫码状态失败。';
            this.aliyunQrSession.lastError = String(error);
            return this.snapshot();
        }
    }
    async completeAliyunAuth(authCode: string): Promise<OctovSnapshot> {
        try {
            const tokenState: AliyunTokenState = await this.aliyunAuthService.exchangeToken(this.settings.aliyunClientId, this.settings.aliyunClientSecret, authCode);
            const driveInfo: AliyunDriveInfoPayload = await this.aliyunAuthService.fetchDriveInfo(tokenState);
            if (driveInfo.default_drive_id !== undefined) {
                tokenState.driveId = driveInfo.default_drive_id;
            }
            if (driveInfo.user_id !== undefined) {
                tokenState.userId = driveInfo.user_id;
            }
            if (driveInfo.name !== undefined && driveInfo.name.length > 0) {
                tokenState.userName = driveInfo.name;
            }
            else if (driveInfo.nick_name !== undefined) {
                tokenState.userName = driveInfo.nick_name;
            }
            if (driveInfo.avatar !== undefined) {
                tokenState.avatar = driveInfo.avatar;
            }
            this.applyAliyunTokenState(tokenState);
            await this.persistAliyunSession();
            await this.persistAppState();
            this.aliyunQrSession = {
                sid: '',
                qrCodeUrl: '',
                state: 'success',
                statusText: '授权成功，已连接阿里云盘。'
            };
            return this.snapshot();
        }
        catch (error) {
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
                lastError: String(error)
            };
            await this.clearPersistedAliyunSession();
            await this.persistAppState();
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
        this.updateStorageUserName('aliyun-main', '');
        this.applyAliyunCredentialsToStatus();
        void this.clearPersistedAliyunSession();
        void this.persistAppState();
        return this.snapshot();
    }
    async rescanSources(): Promise<OctovSnapshot> {
        const nextLibrary: Array<MediaItem> = [];
        let index: number = 0;
        while (index < this.sources.length) {
            const source: FileSourceItem = this.sources[index];
            let sourceItems: Array<MediaItem> = [];
            if (source.storageType === 'aliyundrive') {
                sourceItems = await this.scanAliyunSource(source);
            }
            else {
                sourceItems = this.scanLocalSource(source);
            }
            let itemIndex: number = 0;
            while (itemIndex < sourceItems.length) {
                nextLibrary.push(sourceItems[itemIndex]);
                itemIndex += 1;
            }
            index += 1;
        }
        this.mediaLibrary = nextLibrary;
        await this.persistAppState();
        return this.snapshot();
    }
    async addLocalSourceFromPicker(): Promise<LocalSourceAddResult> {
        const result: LocalSelectionResult = await PlatformAdapters.filePicker().pickFolders();
        if (result.paths.length > 0) {
            const firstPath: string = result.paths[0];
            const storageName: string = this.extractLocalPathName(firstPath);
            const storageId: string = toId('storage-local', firstPath);
            this.upsertStorage({
                id: storageId,
                type: 'local',
                name: storageName,
                createdAt: new Date().toISOString(),
                userName: ''
            });
            const source: FileSourceItem = {
                id: toId('source-local', firstPath),
                name: '本地目录',
                storageId: storageId,
                storageType: 'local',
                storageName: '本地目录',
                path: firstPath,
                createdAt: new Date().toISOString()
            };
            source.name = storageName;
            source.storageName = storageName;
            this.addSourceIfNeeded(source);
        }
        const snapshot: OctovSnapshot = await this.rescanSources();
        return {
            snapshot: snapshot,
            result: result
        };
    }
    async openMedia(item: MediaItem): Promise<OctovSnapshot> {
        if (item.type === 'tvshow' && item.seasons.length > 0 && item.seasons[0].episodes.length > 0) {
            const firstEpisode: EpisodeItem = item.seasons[0].episodes[0];
            if (item.source === 'aliyundrive' && firstEpisode.cloudFileId !== undefined) {
                return await this.openCloudFile(firstEpisode.cloudFileId, item.title + ' - ' + firstEpisode.name, item.sourceName, undefined, item.id, 'video');
            }
            if (firstEpisode.filePath !== undefined) {
                this.currentPlaybackMediaId = item.id;
                this.playbackSession = await PlatformAdapters.player().open(firstEpisode.filePath, item.title + ' - ' + firstEpisode.name, 'video');
                this.playbackSession.availableQualities = [];
                this.playbackSession.playlist = [];
                this.playbackSession.playlistIndex = -1;
                this.playbackSession.sourceLabel = item.sourceName;
                this.playbackSession.mediaId = item.id;
                this.syncPlaybackToLibrary();
                return this.snapshot();
            }
        }
        if (item.source === 'aliyundrive' && item.cloudFileId !== undefined) {
            return await this.openCloudFile(item.cloudFileId, item.title, item.sourceName, undefined, item.sourceId, item.type === 'music' ? 'audio' : 'video');
        }
        let source: string = item.id;
        if (item.filePath !== undefined) {
            source = item.filePath;
        }
        else if (item.cloudFileId !== undefined) {
            source = item.cloudFileId;
        }
        this.currentPlaybackMediaId = item.id;
        this.playbackSession = await PlatformAdapters.player().open(source, item.title, item.type === 'music' ? 'audio' : 'video');
        this.playbackSession.availableQualities = [];
        this.playbackSession.playlist = [];
        this.playbackSession.playlistIndex = -1;
        if (item.progress !== undefined && item.progress.percentage > 0 && item.progress.percentage < 95) {
            this.playbackSession = await PlatformAdapters.player().seek(item.progress.percentage);
            this.playbackSession.message = '恢复到上次播放进度。';
        }
        this.playbackSession.sourceLabel = item.sourceName;
        this.playbackSession.mediaId = item.id;
        this.syncPlaybackToLibrary();
        return this.snapshot();
    }
    async openCloudFile(cloudFileId: string, title: string, sourceName: string, parentFolderId?: string, sourceId?: string, mediaKind: 'video' | 'audio' = 'video'): Promise<OctovSnapshot> {
        this.currentPlaybackMediaId = '';
        let playbackSource: string = cloudFileId;
        let playbackMessage: string = '已为云盘文件创建播放会话。';
        let qualities: Array<PlaybackQualityItem> = [];
        let activeQualityId: string = '';
        let playlist: Array<PlaybackQueueItem> = [];
        let playlistIndex: number = -1;
        const readyToken: AliyunTokenState | undefined = await this.ensureAliyunTokenReady();
        if (readyToken !== undefined && parentFolderId !== undefined && parentFolderId.length > 0) {
            try {
                const downloadPayload: AliyunDownloadUrlResponse = await this.aliyunAuthService.getDownloadUrl(readyToken, cloudFileId);
                if (downloadPayload.url !== undefined && downloadPayload.url.length > 0) {
                    playbackSource = downloadPayload.url;
                }
            }
            catch (_error) {
            }
            try {
                const playInfoPayload: AliyunVideoPreviewPlayInfoResponse = await this.aliyunAuthService.getVideoPlayInfo(readyToken, cloudFileId);
                qualities = this.mapAliyunPlaybackQualities(playInfoPayload);
                if (qualities.length > 0) {
                    activeQualityId = qualities[0].id;
                    if (playbackSource === cloudFileId) {
                        playbackSource = qualities[0].url;
                    }
                }
            }
            catch (_error) {
            }
            try {
                const listPayload: AliyunFileListResponse = await this.aliyunAuthService.listFiles(readyToken, parentFolderId);
                playlist = this.buildCloudPlaybackQueue(listPayload.items === undefined ? [] : listPayload.items);
                playlistIndex = this.findPlaybackQueueIndex(playlist, cloudFileId);
            }
            catch (_error) {
            }
        }
        this.playbackSession = await PlatformAdapters.player().open(playbackSource, title, mediaKind);
        this.playbackSession.mediaId = sourceId === undefined || sourceId.length === 0 ? cloudFileId : sourceId + ':' + cloudFileId;
        this.playbackSession.cloudFileId = cloudFileId;
        this.playbackSession.parentFolderId = parentFolderId;
        this.playbackSession.sourceLabel = sourceName;
        this.playbackSession.subtitle = sourceName;
        this.playbackSession.downloadUrl = playbackSource === cloudFileId ? '' : playbackSource;
        this.playbackSession.availableQualities = qualities;
        this.playbackSession.activeQualityId = activeQualityId;
        this.playbackSession.playlist = playlist;
        this.playbackSession.playlistIndex = playlistIndex;
        if (qualities.length > 0) {
            playbackMessage = '云盘播放信息已就绪，可选清晰度 ' + qualities.length.toString() + ' 个。';
        }
        else if (playbackSource !== cloudFileId) {
            playbackMessage = '云盘原始下载链接已就绪。';
        }
        this.playbackSession.message = playbackMessage;
        return this.snapshot();
    }
    async playPreviousCloudItem(): Promise<OctovSnapshot> {
        if (this.playbackSession.playlistIndex <= 0) {
            return this.snapshot();
        }
        const target: PlaybackQueueItem = this.playbackSession.playlist[this.playbackSession.playlistIndex - 1];
        return await this.openCloudFile(target.id, target.title, this.playbackSession.sourceLabel, this.playbackSession.parentFolderId);
    }
    async playNextCloudItem(): Promise<OctovSnapshot> {
        if (this.playbackSession.playlistIndex < 0 ||
            this.playbackSession.playlistIndex >= this.playbackSession.playlist.length - 1) {
            return this.snapshot();
        }
        const target: PlaybackQueueItem = this.playbackSession.playlist[this.playbackSession.playlistIndex + 1];
        return await this.openCloudFile(target.id, target.title, this.playbackSession.sourceLabel, this.playbackSession.parentFolderId);
    }
    async selectPlaybackQuality(qualityId: string): Promise<OctovSnapshot> {
        let index: number = 0;
        let selected: PlaybackQualityItem | undefined = undefined;
        while (index < this.playbackSession.availableQualities.length) {
            if (this.playbackSession.availableQualities[index].id === qualityId) {
                selected = this.playbackSession.availableQualities[index];
                break;
            }
            index += 1;
        }
        if (selected === undefined) {
            return this.snapshot();
        }
        const previousProgress: number = this.playbackSession.progress;
        const previousStatus: string = this.playbackSession.status;
        const previousSession: PlaybackSession = clonePlayback(this.playbackSession);
        this.playbackSession = await PlatformAdapters.player().open(selected.url, previousSession.title, 'video');
        if (previousProgress > 0) {
            this.playbackSession = await PlatformAdapters.player().seek(previousProgress);
        }
        if (previousStatus === 'playing') {
            this.playbackSession = await PlatformAdapters.player().play();
        }
        this.playbackSession.mediaId = previousSession.mediaId;
        this.playbackSession.cloudFileId = previousSession.cloudFileId;
        this.playbackSession.parentFolderId = previousSession.parentFolderId;
        this.playbackSession.title = previousSession.title;
        this.playbackSession.subtitle = previousSession.subtitle;
        this.playbackSession.sourceLabel = previousSession.sourceLabel;
        this.playbackSession.downloadUrl = selected.url;
        this.playbackSession.availableQualities = previousSession.availableQualities;
        this.playbackSession.activeQualityId = qualityId;
        this.playbackSession.playlist = previousSession.playlist;
        this.playbackSession.playlistIndex = previousSession.playlistIndex;
        this.playbackSession.message = '已切换到 ' + selected.label + ' 清晰度。';
        return this.snapshot();
    }
    async browseSource(sourceId: string, folderId?: string): Promise<SourceBrowserSnapshot> {
        this.lastAliyunBrowseError = '';
        const source: FileSourceItem | undefined = this.findSourceById(sourceId);
        if (source === undefined) {
            return {
                sourceId: sourceId,
                sourceName: 'Unknown Source',
                storageType: 'local',
                currentFolderId: '',
                breadcrumbs: [],
                entries: []
            };
        }
        if (source.storageType === 'aliyundrive') {
            return await this.browseAliyunSource(source, folderId);
        }
        return this.browseLocalSource(source, folderId);
    }
    async loadMoreSource(sourceId: string, folderId: string, marker: string): Promise<SourceBrowserSnapshot> {
        const source: FileSourceItem | undefined = this.findSourceById(sourceId);
        if (source === undefined) {
            return {
                sourceId: sourceId,
                sourceName: 'Unknown Source',
                storageType: 'local',
                currentFolderId: folderId,
                breadcrumbs: [],
                entries: [],
                nextMarker: ''
            };
        }
        const readyToken: AliyunTokenState | undefined = source.storageType === 'aliyundrive' ? await this.ensureAliyunTokenReady() : undefined;
        if (source.storageType === 'aliyundrive' && readyToken !== undefined) {
            try {
                const payload: AliyunFileListResponse = await this.aliyunAuthService.listFiles(readyToken, folderId, marker);
                return this.buildAliyunRemoteSnapshot(source, folderId, payload.items === undefined ? [] : payload.items, payload.next_marker);
            }
            catch (error) {
                this.lastAliyunBrowseError = String(error);
            }
        }
        return await this.browseSource(sourceId, folderId);
    }
    async searchSource(sourceId: string, query: string, marker?: string): Promise<SourceBrowserSnapshot> {
        const source: FileSourceItem | undefined = this.findSourceById(sourceId);
        if (source === undefined) {
            return {
                sourceId: sourceId,
                sourceName: 'Unknown Source',
                storageType: 'local',
                currentFolderId: '',
                breadcrumbs: [],
                entries: [],
                nextMarker: ''
            };
        }
        const readyToken: AliyunTokenState | undefined = source.storageType === 'aliyundrive' ? await this.ensureAliyunTokenReady() : undefined;
        if (source.storageType === 'aliyundrive' && readyToken !== undefined) {
            try {
                const payload: AliyunSearchResponse = await this.aliyunAuthService.searchFiles(readyToken, query, marker);
                return {
                    sourceId: source.id,
                    sourceName: source.name,
                    storageType: source.storageType,
                    currentFolderId: source.path,
                    breadcrumbs: [
                        { id: source.path, name: source.name },
                        { id: 'search', name: '搜索结果' }
                    ],
                    entries: this.mapAliyunEntries(source, source.path, payload.items === undefined ? [] : payload.items),
                    nextMarker: payload.next_marker === undefined ? '' : payload.next_marker
                };
            }
            catch (error) {
                this.lastAliyunBrowseError = String(error);
            }
        }
        const localSnapshot: SourceBrowserSnapshot = this.browseLocalSource(source, source.path);
        const filtered: Array<SourceBrowserEntry> = [];
        let index: number = 0;
        const normalizedQuery: string = query.toLowerCase();
        while (index < localSnapshot.entries.length) {
            const entry: SourceBrowserEntry = localSnapshot.entries[index];
            if (entry.name.toLowerCase().includes(normalizedQuery)) {
                filtered.push(entry);
            }
            index += 1;
        }
        return {
            sourceId: localSnapshot.sourceId,
            sourceName: localSnapshot.sourceName,
            storageType: localSnapshot.storageType,
            currentFolderId: localSnapshot.currentFolderId,
            breadcrumbs: [
                { id: source.path, name: source.name },
                { id: 'search', name: '搜索结果' }
            ],
            entries: filtered,
            nextMarker: ''
        };
    }
    removeSource(sourceId: string): OctovSnapshot {
        const nextSources: Array<FileSourceItem> = [];
        let index: number = 0;
        while (index < this.sources.length) {
            const source: FileSourceItem = this.sources[index];
            if (source.id !== sourceId) {
                nextSources.push(source);
            }
            index += 1;
        }
        this.sources = nextSources;
        const nextLibrary: Array<MediaItem> = [];
        let itemIndex: number = 0;
        while (itemIndex < this.mediaLibrary.length) {
            const item: MediaItem = this.mediaLibrary[itemIndex];
            if (item.sourceId !== sourceId) {
                nextLibrary.push(item);
            }
            itemIndex += 1;
        }
        this.mediaLibrary = nextLibrary;
        void this.persistAppState();
        return this.snapshot();
    }
    addAliyunStorageFromAuthorizedSession(storageName?: string): OctovSnapshot {
        this.upsertAliyunStorage(storageName);
        void this.persistAppState();
        return this.snapshot();
    }
    deleteStorage(storageId: string): OctovSnapshot {
        const nextStorages: Array<StorageAccount> = [];
        let index: number = 0;
        while (index < this.storages.length) {
            if (this.storages[index].id !== storageId) {
                nextStorages.push(this.storages[index]);
            }
            index += 1;
        }
        this.storages = nextStorages;
        const removedSourceIds: Array<string> = [];
        const nextSources: Array<FileSourceItem> = [];
        let sourceIndex: number = 0;
        while (sourceIndex < this.sources.length) {
            if (this.sources[sourceIndex].storageId !== storageId) {
                nextSources.push(this.sources[sourceIndex]);
            }
            else {
                removedSourceIds.push(this.sources[sourceIndex].id);
            }
            sourceIndex += 1;
        }
        this.sources = nextSources;
        const nextLibrary: Array<MediaItem> = [];
        let itemIndex: number = 0;
        while (itemIndex < this.mediaLibrary.length) {
            if (removedSourceIds.indexOf(this.mediaLibrary[itemIndex].sourceId) < 0) {
                nextLibrary.push(this.mediaLibrary[itemIndex]);
            }
            itemIndex += 1;
        }
        this.mediaLibrary = nextLibrary;
        void this.persistAppState();
        return this.snapshot();
    }
    async addAliyunFolderSource(storageId: string, folderId: string, folderName: string): Promise<OctovSnapshot> {
        const storage: StorageAccount | undefined = this.findStorageById(storageId);
        if (storage === undefined) {
            return this.snapshot();
        }
        const source: FileSourceItem = {
            id: toId('source-aliyun', storageId + '-' + folderId),
            name: folderName,
            storageId: storage.id,
            storageType: 'aliyundrive',
            storageName: storage.name,
            path: folderId,
            createdAt: new Date().toISOString()
        };
        this.addSourceIfNeeded(source);
        return await this.rescanSources();
    }
    async browseStorage(storageId: string, folderId?: string): Promise<StorageBrowserSnapshot> {
        this.lastAliyunBrowseError = '';
        const storage: StorageAccount | undefined = this.findStorageById(storageId);
        if (storage === undefined) {
            return {
                storageId: storageId,
                storageName: 'Unknown Storage',
                storageType: 'local',
                currentFolderId: '',
                breadcrumbs: [],
                entries: [],
                nextMarker: ''
            };
        }
        if (storage.type !== 'aliyundrive') {
            return {
                storageId: storage.id,
                storageName: storage.name,
                storageType: storage.type,
                currentFolderId: '',
                breadcrumbs: [
                    { id: storage.id, name: storage.name }
                ],
                entries: [],
                nextMarker: ''
            };
        }
        return await this.browseAliyunStorage(storage, folderId);
    }
    async playCurrentMedia(): Promise<OctovSnapshot> {
        this.playbackSession = await PlatformAdapters.player().play();
        this.syncPlaybackToLibrary();
        await this.syncCloudPlaybackCursor();
        return this.snapshot();
    }
    async pauseCurrentMedia(): Promise<OctovSnapshot> {
        this.playbackSession = await PlatformAdapters.player().pause();
        this.syncPlaybackToLibrary();
        await this.syncCloudPlaybackCursor();
        return this.snapshot();
    }
    async stopCurrentMedia(): Promise<OctovSnapshot> {
        await this.syncCloudPlaybackCursor();
        this.playbackSession = await PlatformAdapters.player().stop();
        this.syncPlaybackToLibrary();
        this.currentPlaybackMediaId = '';
        return this.snapshot();
    }
    async seekCurrentMedia(progress: number): Promise<OctovSnapshot> {
        this.playbackSession = await PlatformAdapters.player().seek(progress);
        this.syncPlaybackToLibrary();
        await this.syncCloudPlaybackCursor();
        return this.snapshot();
    }
    async refreshPlayback(): Promise<OctovSnapshot> {
        this.playbackSession = PlatformAdapters.player().current();
        this.syncPlaybackToLibrary();
        return this.snapshot();
    }
    async attachPlaybackSurface(surfaceId: string): Promise<OctovSnapshot> {
        this.playbackSession = await PlatformAdapters.player().attachSurface(surfaceId);
        return this.snapshot();
    }
    async searchSubtitles(query: string, tmdbId?: number, season?: number, episode?: number): Promise<Array<SubtitleSearchResult>> {
        const results: Array<SubtitleSearchResult> = [];
        const zxkiResults: Array<SubtitleSearchResult> = await this.searchZxkiSubtitles(query);
        const openSubtitlesResults: Array<SubtitleSearchResult> = await this.searchOpenSubtitles(query, tmdbId, season, episode);
        let index: number = 0;
        while (index < zxkiResults.length) {
            results.push(zxkiResults[index]);
            index += 1;
        }
        index = 0;
        while (index < openSubtitlesResults.length) {
            results.push(openSubtitlesResults[index]);
            index += 1;
        }
        return results.slice(0, 40);
    }
    async loadPlaybackSubtitles(item: MediaItem): Promise<Array<SubtitleCue>> {
        const localContent: string = await this.loadLocalSubtitleContent(item);
        if (localContent.length > 0) {
            return parseSubtitleContent(localContent);
        }
        const results: Array<SubtitleSearchResult> = await this.searchSubtitles(item.title, item.tmdbId, item.seasons.length > 0 ? item.seasons[0].seasonNumber : undefined, item.seasons.length > 0 && item.seasons[0].episodes.length > 0 ? item.seasons[0].episodes[0].episode : undefined);
        if (results.length === 0) {
            return [];
        }
        const remoteContent: string = await this.downloadSubtitleContent(results[0].id);
        if (remoteContent.length === 0) {
            return [];
        }
        return parseSubtitleContent(remoteContent);
    }
    async loadPlaybackLyrics(item: MediaItem): Promise<string> {
        if (item.filePath !== undefined && item.filePath.length > 0) {
            const localLyrics: string = await this.loadLocalLyricContent(item.filePath);
            if (localLyrics.length > 0) {
                return localLyrics;
            }
        }
        return await this.fetchOnlineLyrics(item.title);
    }
    private async requestText(url: string, method: http.RequestMethod = http.RequestMethod.GET, headers?: Record<string, string>, body?: string): Promise<string> {
        const request = http.createHttp();
        try {
            const options: http.HttpRequestOptions = {
                method: method,
                header: headers,
                expectDataType: http.HttpDataType.STRING
            };
            if (body !== undefined) {
                options.extraData = body;
            }
            const response = await request.request(url, options);
            const statusCode: number = Number(response.responseCode);
            const resultText: string = typeof response.result === 'string' ? response.result : '';
            if (statusCode < 200 || statusCode >= 300) {
                throw new Error('HTTP ' + statusCode.toString() + ': ' + resultText);
            }
            return resultText;
        }
        finally {
            request.destroy();
        }
    }
    private subtitleLanguageName(language: string): string {
        if (language === 'zh-CN') {
            return '简体中文';
        }
        if (language === 'zh-TW') {
            return '繁体中文';
        }
        if (language === 'en') {
            return 'English';
        }
        return language;
    }
    private async searchOpenSubtitles(query: string, tmdbId?: number, season?: number, episode?: number): Promise<Array<SubtitleSearchResult>> {
        if (this.settings.subtitleApiKey.trim().length === 0) {
            return [];
        }
        try {
            let url: string = OPEN_SUBTITLE_BASE + '/subtitles?languages=zh-CN,zh-TW,en';
            if (tmdbId !== undefined) {
                url = url + '&tmdb_id=' + tmdbId.toString();
            }
            else {
                url = url + '&query=' + encodeURIComponent(query);
            }
            if (season !== undefined) {
                url = url + '&season_number=' + season.toString();
            }
            if (episode !== undefined) {
                url = url + '&episode_number=' + episode.toString();
            }
            const payload: OpenSubtitleSearchPayload = JSON.parse(await this.requestText(url, http.RequestMethod.GET, {
                'Api-Key': this.settings.subtitleApiKey.trim(),
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'OctovHM/1.0'
            })) as OpenSubtitleSearchPayload;
            const result: Array<SubtitleSearchResult> = [];
            let index: number = 0;
            const items = payload.data === undefined ? [] : payload.data;
            while (index < items.length && result.length < 20) {
                const item = items[index];
                const attributes: OpenSubtitleItemAttributes | undefined = item.attributes;
                if (attributes !== undefined && attributes.files !== undefined && attributes.files.length > 0) {
                    const fileId = attributes.files[0].file_id;
                    if (fileId !== undefined) {
                        result.push({
                            id: fileId.toString(),
                            language: attributes.language === undefined ? 'unknown' : attributes.language,
                            languageName: this.subtitleLanguageName(attributes.language === undefined ? 'unknown' : attributes.language),
                            fileName: attributes.release === undefined || attributes.release.length === 0
                                ? (attributes.feature_details !== undefined && attributes.feature_details.title !== undefined ? attributes.feature_details.title : 'subtitle')
                                : attributes.release,
                            source: 'OpenSubtitles',
                            downloadUrl: '',
                            rating: attributes.ratings
                        });
                    }
                }
                index += 1;
            }
            return result;
        }
        catch (_error) {
            return [];
        }
    }
    private async searchZxkiSubtitles(query: string): Promise<Array<SubtitleSearchResult>> {
        try {
            const payloadText: string = await this.requestText(ZXKI_SUBTITLE_BASE + '?query=' + encodeURIComponent(query), http.RequestMethod.GET, {
                'User-Agent': 'OctovHM/1.0'
            });
            const payload = JSON.parse(payloadText) as Record<string, Object | string | number | boolean | Array<Record<string, string>>>;
            const data = payload.data;
            if (!Array.isArray(data)) {
                return [];
            }
            const result: Array<SubtitleSearchResult> = [];
            let index: number = 0;
            while (index < data.length && index < 20) {
                const row = data[index] as Record<string, string>;
                const downloadUrl: string = row.url === undefined ? '' : row.url;
                if (downloadUrl.length > 0) {
                    const fileNameParts: Array<string> = downloadUrl.split('/');
                    result.push({
                        id: downloadUrl,
                        language: 'zh-CN',
                        languageName: '简体中文',
                        fileName: fileNameParts[fileNameParts.length - 1],
                        source: 'ZXKI',
                        downloadUrl: downloadUrl
                    });
                }
                index += 1;
            }
            return result;
        }
        catch (_error) {
            return [];
        }
    }
    private async downloadSubtitleContent(fileId: string): Promise<string> {
        try {
            if (fileId.startsWith('http')) {
                return await this.requestText(fileId, http.RequestMethod.GET, {
                    'User-Agent': 'OctovHM/1.0'
                });
            }
            if (this.settings.subtitleApiKey.trim().length === 0) {
                return '';
            }
            const downloadPayload: OpenSubtitleDownloadPayload = JSON.parse(await this.requestText(OPEN_SUBTITLE_BASE + '/download', http.RequestMethod.POST, {
                'Api-Key': this.settings.subtitleApiKey.trim(),
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'OctovHM/1.0'
            }, JSON.stringify({ file_id: parseInt(fileId, 10) }))) as OpenSubtitleDownloadPayload;
            if (downloadPayload.link === undefined || downloadPayload.link.length === 0) {
                return '';
            }
            return await this.requestText(downloadPayload.link, http.RequestMethod.GET, {
                'Api-Key': this.settings.subtitleApiKey.trim(),
                'User-Agent': 'OctovHM/1.0'
            });
        }
        catch (_error) {
            return '';
        }
    }
    private localFileSystemPath(path: string): string {
        if (path.startsWith('file://')) {
            return path.replace(/^file:\/\/\/?/, '/');
        }
        return path;
    }
    private async loadLocalSubtitleContent(item: MediaItem): Promise<string> {
        let targetPath: string = '';
        if (item.filePath !== undefined && item.filePath.length > 0) {
            targetPath = item.filePath;
        }
        else if (item.type === 'tvshow' && item.seasons.length > 0 && item.seasons[0].episodes.length > 0) {
            targetPath = item.seasons[0].episodes[0].filePath === undefined ? '' : item.seasons[0].episodes[0].filePath as string;
        }
        if (targetPath.length === 0) {
            return '';
        }
        const basePath: string = targetPath.replace(/\.[^.]+$/, '');
        let index: number = 0;
        while (index < SUBTITLE_EXTENSIONS.length) {
            const candidate: string = basePath + '.' + SUBTITLE_EXTENSIONS[index];
            try {
                if (fileIo.accessSync(this.localFileSystemPath(candidate))) {
                    return fileIo.readTextSync(this.localFileSystemPath(candidate));
                }
            }
            catch (_error) {
            }
            index += 1;
        }
        return '';
    }
    private async loadLocalLyricContent(filePath: string): Promise<string> {
        const basePath: string = filePath.replace(/\.[^.]+$/, '');
        const candidates: Array<string> = [basePath + '.lrc', basePath + '.txt'];
        let index: number = 0;
        while (index < candidates.length) {
            try {
                if (fileIo.accessSync(this.localFileSystemPath(candidates[index]))) {
                    return fileIo.readTextSync(this.localFileSystemPath(candidates[index]));
                }
            }
            catch (_error) {
            }
            index += 1;
        }
        return '';
    }
    private async fetchOnlineLyrics(title: string): Promise<string> {
        try {
            const searchPayload = JSON.parse(await this.requestText(NETEASE_SEARCH_URL + '?s=' + encodeURIComponent(title) + '&type=1&limit=1', http.RequestMethod.GET, {
                'User-Agent': 'Mozilla/5.0'
            })) as Record<string, Object>;
            const result = searchPayload.result as Record<string, Array<Record<string, number>>> | undefined;
            const songs = result === undefined ? undefined : result.songs;
            if (songs === undefined || songs.length === 0 || songs[0].id === undefined) {
                return '';
            }
            const lyricPayload = JSON.parse(await this.requestText(NETEASE_LYRIC_URL + '?id=' + songs[0].id.toString() + '&lv=1&kv=1&tv=-1', http.RequestMethod.GET, {
                'User-Agent': 'Mozilla/5.0'
            })) as Record<string, Record<string, string>>;
            const lyricNode = lyricPayload.lrc;
            if (lyricNode === undefined || lyricNode.lyric === undefined) {
                return '';
            }
            return lyricNode.lyric;
        }
        catch (_error) {
            return '';
        }
    }
    private seed(): void {
        const now: string = new Date().toISOString();
        this.storages = [
            {
                id: 'local-main',
                type: 'local',
                name: '本地目录',
                createdAt: now,
                userName: '可用'
            },
            {
                id: 'aliyun-main',
                type: 'aliyundrive',
                name: '阿里云盘',
                createdAt: now,
                userName: ''
            }
        ];
        this.storages = [];
        this.sources = [];
        this.mediaLibrary = [];
        this.remoteFolderNameCache.clear();
        this.remoteFolderParentCache.clear();
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
    private addSourceIfNeeded(source: FileSourceItem): void {
        let exists: boolean = false;
        let index: number = 0;
        while (index < this.sources.length) {
            const current: FileSourceItem = this.sources[index];
            if (current.path === source.path && current.storageType === source.storageType) {
                exists = true;
                break;
            }
            index += 1;
        }
        if (!exists) {
            this.sources.push(source);
        }
    }
    private upsertStorage(storage: StorageAccount): void {
        let index: number = 0;
        while (index < this.storages.length) {
            if (this.storages[index].id === storage.id) {
                this.storages[index] = {
                    id: storage.id,
                    type: storage.type,
                    name: storage.name,
                    createdAt: this.storages[index].createdAt,
                    userName: storage.userName
                };
                return;
            }
            index += 1;
        }
        this.storages.push(storage);
    }
    private extractLocalPathName(path: string): string {
        const normalized: Array<string> = path.replace(/\\/g, '/').split('/');
        let index: number = normalized.length - 1;
        while (index >= 0) {
            const part: string = normalized[index].trim();
            if (part.length > 0) {
                return part;
            }
            index -= 1;
        }
        return 'Local Storage';
    }
    private updateStorageUserName(storageId: string, userName: string): void {
        let index: number = 0;
        while (index < this.storages.length) {
            if (this.storages[index].id === storageId) {
                this.storages[index].userName = userName;
                return;
            }
            index += 1;
        }
    }
    private upsertAliyunStorage(userName?: string): void {
        const displayName: string = userName !== undefined && userName.length > 0 ? userName + ' 的阿里云盘' : '我的阿里云盘';
        this.upsertStorage({
            id: 'aliyun-main',
            type: 'aliyundrive',
            name: displayName,
            createdAt: new Date().toISOString(),
            userName: userName === undefined ? '' : userName
        });
    }
    private findStorageById(storageId: string): StorageAccount | undefined {
        let index: number = 0;
        while (index < this.storages.length) {
            if (this.storages[index].id === storageId) {
                return this.storages[index];
            }
            index += 1;
        }
        return undefined;
    }
    private ensureAliyunRootSource(): void {
        const rootSource: FileSourceItem = {
            id: 'source-aliyun-root',
            name: '我的阿里云盘',
            storageId: 'aliyun-main',
            storageType: 'aliyundrive',
            storageName: 'Aliyun Drive',
            path: 'root',
            createdAt: new Date().toISOString()
        };
        let replaced: boolean = false;
        let index: number = 0;
        while (index < this.sources.length) {
            const source: FileSourceItem = this.sources[index];
            if (source.storageType === 'aliyundrive') {
                this.sources[index] = {
                    id: source.id,
                    name: rootSource.name,
                    storageId: rootSource.storageId,
                    storageType: rootSource.storageType,
                    storageName: rootSource.storageName,
                    path: rootSource.path,
                    createdAt: source.createdAt
                };
                replaced = true;
            }
            index += 1;
        }
        if (!replaced) {
            this.sources.push(rootSource);
        }
    }
    private removeAliyunSources(): void {
        const nextSources: Array<FileSourceItem> = [];
        let index: number = 0;
        while (index < this.sources.length) {
            if (this.sources[index].storageType !== 'aliyundrive') {
                nextSources.push(this.sources[index]);
            }
            index += 1;
        }
        this.sources = nextSources;
    }
    private scanLocalSource(source: FileSourceItem): Array<MediaItem> {
        const records: Array<ScannedFileRecord> = this.buildMockLocalFiles(source);
        return this.buildMediaItemsFromRecords(source, records);
    }
    private buildMockLocalFiles(source: FileSourceItem): Array<ScannedFileRecord> {
        const records: Array<ScannedFileRecord> = [];
        const now: string = new Date().toISOString();
        const baseTitle: string = cleanMediaTitle(source.name).replace(/\s+/g, '.');
        const normalizedPath: string = this.normalizeLocalPath(source.path);
        const pushRecord = (relativePath: string, kind: 'video' | 'audio', duration?: number): void => {
            const fullPath: string = normalizedPath + '/' + relativePath;
            const parts: Array<string> = relativePath.split('/');
            const fileName: string = parts[parts.length - 1];
            const parentName: string = parts.length > 1 ? parts[parts.length - 2] : source.name;
            records.push({
                id: 'local-scan-' + fullPath,
                name: fileName,
                source: 'local',
                sourceId: source.id,
                sourceName: source.name,
                parentKey: normalizedPath + '/' + parentName,
                parentName: parentName,
                dateAdded: now,
                fileExt: getFileExtension(fileName),
                kind: kind,
                filePath: fullPath,
                duration: duration
            });
        };
        pushRecord('Movies/' + baseTitle + '.2024.1080p.mkv', 'video', 126);
        pushRecord('Movies/' + baseTitle + '.Bonus.2023.mp4', 'video', 103);
        pushRecord('Shows/Season 1/' + baseTitle + '.S01E01.mkv', 'video', 45);
        pushRecord('Shows/Season 1/' + baseTitle + '.S01E02.mkv', 'video', 47);
        pushRecord('Shows/Season 1/' + baseTitle + '.S01E03.mkv', 'video', 44);
        pushRecord('Music/' + baseTitle + '.Theme.flac', 'audio', 4);
        pushRecord('Music/' + baseTitle + '.Live.mp3', 'audio', 5);
        return records;
    }
    private async scanAliyunSource(source: FileSourceItem): Promise<Array<MediaItem>> {
        const readyToken: AliyunTokenState | undefined = await this.ensureAliyunTokenReady();
        if (readyToken === undefined) {
            return [];
        }
        const records: Array<ScannedFileRecord> = [];
        await this.collectAliyunFiles(readyToken, source, source.path, source.name, records);
        return this.buildMediaItemsFromRecords(source, records);
    }
    private async collectAliyunFiles(token: AliyunTokenState, source: FileSourceItem, folderId: string, folderName: string, records: Array<ScannedFileRecord>): Promise<void> {
        try {
            const payload: AliyunFileListResponse = await this.aliyunAuthService.listFiles(token, folderId);
            const items: Array<AliyunFileListItem> = payload.items === undefined ? [] : payload.items;
            let index: number = 0;
            while (index < items.length) {
                const item: AliyunFileListItem = items[index];
                this.cacheRemoteFolder(item, folderId);
                if (item.type === 'folder') {
                    await this.collectAliyunFiles(token, source, item.file_id, item.name, records);
                }
                else if (item.category === 'video' || item.category === 'audio' || isVideoFile(item.name) || isAudioFile(item.name)) {
                    records.push({
                        id: 'cloud-scan-' + item.file_id,
                        name: item.name,
                        source: 'aliyundrive',
                        sourceId: source.id,
                        sourceName: source.name,
                        parentKey: folderId,
                        parentName: folderName,
                        dateAdded: item.updated_at === undefined ? new Date().toISOString() : item.updated_at,
                        fileExt: getFileExtension(item.name),
                        kind: item.category === 'audio' || isAudioFile(item.name) ? 'audio' : 'video',
                        cloudFileId: item.file_id,
                        duration: item.video_media_metadata === undefined || item.video_media_metadata === null || item.video_media_metadata.duration === undefined
                            ? undefined
                            : Math.round(item.video_media_metadata.duration / 60)
                    });
                }
                index += 1;
            }
        }
        catch (_error) {
        }
    }
    private buildMediaItemsFromRecords(source: FileSourceItem, records: Array<ScannedFileRecord>): Array<MediaItem> {
        const result: Array<MediaItem> = [];
        const tvMap: Map<string, MediaItem> = new Map();
        const folderEpisodeCount: Map<string, number> = new Map();
        let prepareIndex: number = 0;
        while (prepareIndex < records.length) {
            const record: ScannedFileRecord = records[prepareIndex];
            if (record.kind === 'video') {
                const parsed: ParsedMediaName = parseMediaName(record.name, record.parentName);
                if (parsed.episode !== undefined) {
                    const currentCount: number | undefined = folderEpisodeCount.get(record.parentKey);
                    folderEpisodeCount.set(record.parentKey, currentCount === undefined ? 1 : currentCount + 1);
                }
            }
            prepareIndex += 1;
        }
        let index: number = 0;
        while (index < records.length) {
            const record: ScannedFileRecord = records[index];
            const parsed: ParsedMediaName = parseMediaName(record.name, record.parentName);
            if (record.kind === 'audio') {
                result.push(this.buildMusicItemFromRecord(source, record, parsed));
            }
            else if (parsed.episode !== undefined && (folderEpisodeCount.get(record.parentKey) ?? 0) >= 2) {
                const tvKey: string = source.id + ':' + record.parentKey + ':' + normalizeMediaKey(parsed.title);
                let tvItem: MediaItem | undefined = tvMap.get(tvKey);
                if (tvItem === undefined) {
                    tvItem = this.createTVShowFromRecord(source, record, parsed);
                    tvMap.set(tvKey, tvItem);
                }
                this.appendEpisodeToTVShow(tvItem, record, parsed);
            }
            else {
                result.push(this.buildMovieItemFromRecord(source, record, parsed));
            }
            index += 1;
        }
        tvMap.forEach((value: MediaItem) => {
            this.sortTVShowSeasons(value);
            result.push(value);
        });
        result.sort(compareDate);
        return result;
    }
    private buildMusicItemFromRecord(source: FileSourceItem, record: ScannedFileRecord, parsed: ParsedMediaName): MediaItem {
        return {
            id: record.id,
            title: parsed.title,
            type: 'music',
            poster: '',
            genres: [],
            duration: record.duration,
            dateAdded: record.dateAdded,
            filePath: record.filePath,
            source: source.storageType,
            sourceId: source.id,
            sourceName: source.name,
            cloudFileId: record.cloudFileId,
            seasons: [],
            fileExt: record.fileExt
        };
    }
    private buildMovieItemFromRecord(source: FileSourceItem, record: ScannedFileRecord, parsed: ParsedMediaName): MediaItem {
        return {
            id: record.id,
            title: parsed.title,
            type: 'movie',
            year: parsed.year,
            poster: '',
            genres: [],
            duration: record.duration,
            dateAdded: record.dateAdded,
            filePath: record.filePath,
            source: source.storageType,
            sourceId: source.id,
            sourceName: source.name,
            cloudFileId: record.cloudFileId,
            seasons: [],
            fileExt: record.fileExt
        };
    }
    private createTVShowFromRecord(source: FileSourceItem, record: ScannedFileRecord, parsed: ParsedMediaName): MediaItem {
        return {
            id: 'tv-' + source.id + '-' + normalizeMediaKey(record.parentKey + '-' + parsed.title),
            title: parsed.title,
            type: 'tvshow',
            year: parsed.year,
            poster: '',
            genres: [],
            duration: record.duration,
            dateAdded: record.dateAdded,
            source: source.storageType,
            sourceId: source.id,
            sourceName: source.name,
            seasons: []
        };
    }
    private appendEpisodeToTVShow(item: MediaItem, record: ScannedFileRecord, parsed: ParsedMediaName): void {
        const seasonNumber: number = parsed.season === undefined ? 1 : parsed.season;
        const episodeNumber: number = parsed.episode === undefined ? 0 : parsed.episode;
        let season: SeasonItem | undefined = undefined;
        let index: number = 0;
        while (index < item.seasons.length) {
            if (item.seasons[index].seasonNumber === seasonNumber) {
                season = item.seasons[index];
                break;
            }
            index += 1;
        }
        if (season === undefined) {
            season = {
                seasonNumber: seasonNumber,
                name: 'Season ' + seasonNumber.toString(),
                episodes: []
            };
            item.seasons.push(season);
        }
        season.episodes.push({
            season: seasonNumber,
            episode: episodeNumber,
            name: record.name.replace(/\.[^.]+$/, ''),
            duration: record.duration,
            cloudFileId: record.cloudFileId,
            filePath: record.filePath
        });
    }
    private sortTVShowSeasons(item: MediaItem): void {
        item.seasons.sort((left: SeasonItem, right: SeasonItem) => left.seasonNumber - right.seasonNumber);
        let index: number = 0;
        while (index < item.seasons.length) {
            item.seasons[index].episodes.sort((left: EpisodeItem, right: EpisodeItem) => left.episode - right.episode);
            index += 1;
        }
    }
    private buildContinueWatching(items: Array<MediaItem>): Array<MediaItem> {
        const list: Array<MediaItem> = [];
        let index: number = 0;
        while (index < items.length) {
            const item: MediaItem = items[index];
            if (item.progress !== undefined && item.progress.percentage > 0 && item.progress.percentage < 95) {
                list.push(cloneMediaItem(item));
            }
            index += 1;
        }
        list.sort((left: MediaItem, right: MediaItem) => {
            const leftTime: number = left.progress === undefined ? 0 : new Date(left.progress.lastPlayed).getTime();
            const rightTime: number = right.progress === undefined ? 0 : new Date(right.progress.lastPlayed).getTime();
            if (leftTime > rightTime) {
                return -1;
            }
            if (leftTime < rightTime) {
                return 1;
            }
            return 0;
        });
        return list;
    }
    private buildRecentlyAdded(items: Array<MediaItem>): Array<MediaItem> {
        const list: Array<MediaItem> = cloneMediaList(items);
        list.sort(compareDate);
        if (list.length > 18) {
            return list.slice(0, 18);
        }
        return list;
    }
    private snapshot(): OctovSnapshot {
        const library: Array<MediaItem> = cloneMediaList(this.mediaLibrary);
        return {
            library: library,
            continueWatching: this.buildContinueWatching(library),
            recentlyAdded: this.buildRecentlyAdded(library),
            storages: cloneStorageList(this.storages),
            sources: cloneSourceList(this.sources),
            settings: cloneSettings(this.settings),
            aliyunStatus: cloneAliyunStatus(this.aliyunStatus),
            aliyunQrSession: cloneAliyunQrSession(this.aliyunQrSession),
            playback: clonePlayback(this.playbackSession)
        };
    }
    private syncPlaybackToLibrary(): void {
        if (this.currentPlaybackMediaId.length === 0) {
            return;
        }
        const item: MediaItem | undefined = this.findMediaItemById(this.currentPlaybackMediaId);
        if (item === undefined || this.playbackSession.duration <= 0) {
            return;
        }
        item.progress = {
            currentTime: this.playbackSession.currentTime,
            totalDuration: this.playbackSession.duration,
            percentage: this.playbackSession.progress,
            lastPlayed: new Date().toISOString()
        };
        if (this.playbackSession.status === 'idle' && this.playbackSession.progress === 0) {
            this.currentPlaybackMediaId = '';
        }
        void this.persistAppState();
    }
    private async syncCloudPlaybackCursor(): Promise<void> {
        if (this.playbackSession.cloudFileId === undefined ||
            this.playbackSession.cloudFileId.length === 0 ||
            this.playbackSession.currentTime <= 0) {
            return;
        }
        const readyToken: AliyunTokenState | undefined = await this.ensureAliyunTokenReady();
        if (readyToken === undefined) {
            return;
        }
        try {
            await this.aliyunAuthService.updatePlayCursor(readyToken, this.playbackSession.cloudFileId, Math.floor(this.playbackSession.currentTime));
        }
        catch (_error) {
        }
    }
    private findMediaItemById(mediaId: string): MediaItem | undefined {
        let index: number = 0;
        while (index < this.mediaLibrary.length) {
            if (this.mediaLibrary[index].id === mediaId) {
                return this.mediaLibrary[index];
            }
            index += 1;
        }
        return undefined;
    }
    private findSourceById(sourceId: string): FileSourceItem | undefined {
        let index: number = 0;
        while (index < this.sources.length) {
            if (this.sources[index].id === sourceId) {
                return this.sources[index];
            }
            index += 1;
        }
        return undefined;
    }
    private browseLocalSource(source: FileSourceItem, folderId?: string): SourceBrowserSnapshot {
        const currentFolderId: string = folderId === undefined || folderId.length === 0 ? source.path : folderId;
        const entries: Array<SourceBrowserEntry> = [];
        const folderEntries: Map<string, SourceBrowserEntry> = new Map();
        let index: number = 0;
        while (index < this.mediaLibrary.length) {
            const item: MediaItem = this.mediaLibrary[index];
            if (item.sourceId === source.id) {
                this.appendLocalEntriesForItem(source, item, currentFolderId, folderEntries, entries);
            }
            index += 1;
        }
        const merged: Array<SourceBrowserEntry> = [];
        folderEntries.forEach((value: SourceBrowserEntry) => {
            merged.push(value);
        });
        let mergedIndex: number = 0;
        while (mergedIndex < entries.length) {
            merged.push(entries[mergedIndex]);
            mergedIndex += 1;
        }
        merged.sort((left: SourceBrowserEntry, right: SourceBrowserEntry) => {
            if (left.type === 'folder' && right.type !== 'folder') {
                return -1;
            }
            if (left.type !== 'folder' && right.type === 'folder') {
                return 1;
            }
            return left.name.localeCompare(right.name);
        });
        return {
            sourceId: source.id,
            sourceName: source.name,
            storageType: source.storageType,
            currentFolderId: currentFolderId,
            breadcrumbs: this.buildLocalBreadcrumbs(source, currentFolderId),
            entries: merged,
            nextMarker: ''
        };
    }
    private async browseAliyunStorage(storage: StorageAccount, folderId?: string): Promise<StorageBrowserSnapshot> {
        const remoteFolderId: string = folderId === undefined || folderId.length === 0 ? 'root' : folderId;
        const readyToken: AliyunTokenState | undefined = await this.ensureAliyunTokenReady();
        if (readyToken !== undefined) {
            try {
                const payload: AliyunFileListResponse = await this.aliyunAuthService.listFiles(readyToken, remoteFolderId);
                const entries: Array<SourceBrowserEntry> = [];
                const remoteItems: Array<AliyunFileListItem> = payload.items === undefined ? [] : payload.items;
                let index: number = 0;
                while (index < remoteItems.length) {
                    const item: AliyunFileListItem = remoteItems[index];
                    if (item.type === 'folder') {
                        this.cacheRemoteFolder(item, remoteFolderId);
                        entries.push({
                            id: item.file_id,
                            name: item.name,
                            type: 'folder',
                            storageType: 'aliyundrive',
                            sourceId: storage.id,
                            parentId: remoteFolderId,
                            path: item.file_id,
                            updatedAt: item.updated_at === undefined ? new Date().toISOString() : item.updated_at,
                            cloudFileId: item.file_id,
                            thumbnail: item.thumbnail
                        });
                    }
                    index += 1;
                }
                return {
                    storageId: storage.id,
                    storageName: storage.name,
                    storageType: storage.type,
                    currentFolderId: remoteFolderId,
                    breadcrumbs: this.buildAliyunBreadcrumbs('root', storage.name, remoteFolderId),
                    entries: entries,
                    nextMarker: payload.next_marker === undefined ? '' : payload.next_marker
                };
            }
            catch (error) {
                this.lastAliyunBrowseError = String(error);
            }
        }
        return {
            storageId: storage.id,
            storageName: storage.name,
            storageType: storage.type,
            currentFolderId: remoteFolderId,
            breadcrumbs: [
                { id: 'root', name: storage.name }
            ],
            entries: [],
            nextMarker: ''
        };
    }
    private async browseAliyunSource(source: FileSourceItem, folderId?: string): Promise<SourceBrowserSnapshot> {
        const remoteFolderId: string = folderId === undefined || folderId.length === 0 ? source.path : folderId;
        const readyToken: AliyunTokenState | undefined = await this.ensureAliyunTokenReady();
        if (readyToken !== undefined) {
            try {
                const payload: AliyunFileListResponse = await this.aliyunAuthService.listFiles(readyToken, remoteFolderId);
                return this.buildAliyunRemoteSnapshot(source, remoteFolderId, payload.items === undefined ? [] : payload.items, payload.next_marker);
            }
            catch (error) {
                this.lastAliyunBrowseError = String(error);
            }
        }
        return {
            sourceId: source.id,
            sourceName: source.name,
            storageType: source.storageType,
            currentFolderId: remoteFolderId,
            breadcrumbs: [
                { id: source.path, name: source.name }
            ],
            entries: [],
            nextMarker: ''
        };
    }
    getLastAliyunBrowseError(): string {
        return this.lastAliyunBrowseError;
    }
    private mapAliyunEntries(source: FileSourceItem, folderId: string, remoteItems: Array<AliyunFileListItem>): Array<SourceBrowserEntry> {
        const entries: Array<SourceBrowserEntry> = [];
        let index: number = 0;
        while (index < remoteItems.length) {
            const item: AliyunFileListItem = remoteItems[index];
            const videoMetadata: AliyunVideoMediaMetadata | null | undefined = item.video_media_metadata;
            this.cacheRemoteFolder(item, folderId);
            entries.push({
                id: item.file_id,
                name: item.name,
                type: item.type === 'folder' ? 'folder' : item.category === 'video' ? 'video' : item.category === 'audio' ? 'audio' : 'other',
                storageType: 'aliyundrive',
                sourceId: source.id,
                parentId: folderId,
                path: item.file_id,
                updatedAt: item.updated_at === undefined ? new Date().toISOString() : item.updated_at,
                duration: videoMetadata === undefined || videoMetadata === null ? undefined : videoMetadata.duration,
                sizeLabel: item.size === undefined ? undefined : formatFileSize(item.size),
                cloudFileId: item.file_id,
                thumbnail: item.thumbnail
            });
            index += 1;
        }
        return entries;
    }
    private mapAliyunPlaybackQualities(payload: AliyunVideoPreviewPlayInfoResponse): Array<PlaybackQualityItem> {
        const result: Array<PlaybackQualityItem> = [];
        const tasks: Array<AliyunVideoPreviewTask> = payload.video_preview_play_info === undefined || payload.video_preview_play_info.live_transcoding_task_list === undefined
            ? []
            : payload.video_preview_play_info.live_transcoding_task_list;
        let index: number = 0;
        while (index < tasks.length) {
            const task: AliyunVideoPreviewTask = tasks[index];
            if (task.template_id !== undefined &&
                task.status === 'finished' &&
                task.url !== undefined &&
                task.url.length > 0) {
                result.push({
                    id: task.template_id,
                    label: this.qualityLabel(task.template_id),
                    url: task.url,
                    format: 'hls'
                });
            }
            index += 1;
        }
        result.sort((left: PlaybackQualityItem, right: PlaybackQualityItem) => left.label.localeCompare(right.label));
        return result;
    }
    private qualityLabel(templateId: string): string {
        if (templateId === 'LD') {
            return '360P';
        }
        if (templateId === 'SD') {
            return '540P';
        }
        if (templateId === 'HD') {
            return '720P';
        }
        if (templateId === 'FHD') {
            return '1080P';
        }
        if (templateId === 'QHD') {
            return '2K';
        }
        if (templateId === '4K') {
            return '4K';
        }
        return templateId;
    }
    private buildCloudPlaybackQueue(remoteItems: Array<AliyunFileListItem>): Array<PlaybackQueueItem> {
        const result: Array<PlaybackQueueItem> = [];
        let index: number = 0;
        while (index < remoteItems.length) {
            const item: AliyunFileListItem = remoteItems[index];
            if (item.type !== 'folder' && item.category === 'video') {
                result.push({
                    id: item.file_id,
                    title: item.name
                });
            }
            index += 1;
        }
        result.sort((left: PlaybackQueueItem, right: PlaybackQueueItem) => left.title.localeCompare(right.title));
        return result;
    }
    private findPlaybackQueueIndex(items: Array<PlaybackQueueItem>, cloudFileId: string): number {
        let index: number = 0;
        while (index < items.length) {
            if (items[index].id === cloudFileId) {
                return index;
            }
            index += 1;
        }
        return -1;
    }
    private buildAliyunRemoteSnapshot(source: FileSourceItem, folderId: string, remoteItems: Array<AliyunFileListItem>, nextMarker?: string): SourceBrowserSnapshot {
        const entries: Array<SourceBrowserEntry> = this.mapAliyunEntries(source, folderId, remoteItems);
        return {
            sourceId: source.id,
            sourceName: source.name,
            storageType: source.storageType,
            currentFolderId: folderId,
            breadcrumbs: this.buildAliyunBreadcrumbs(source.path, source.name, folderId),
            entries: entries,
            nextMarker: nextMarker === undefined ? '' : nextMarker
        };
    }
    private appendLocalEntriesForItem(source: FileSourceItem, item: MediaItem, currentFolderId: string, folderEntries: Map<string, SourceBrowserEntry>, fileEntries: Array<SourceBrowserEntry>): void {
        if (item.filePath !== undefined && item.filePath.length > 0) {
            this.appendLocalPathEntry(source, item, item.filePath, item.title, item.duration, currentFolderId, folderEntries, fileEntries);
        }
        let seasonIndex: number = 0;
        while (seasonIndex < item.seasons.length) {
            const season: SeasonItem = item.seasons[seasonIndex];
            let episodeIndex: number = 0;
            while (episodeIndex < season.episodes.length) {
                const episode: EpisodeItem = season.episodes[episodeIndex];
                if (episode.filePath !== undefined && episode.filePath.length > 0) {
                    this.appendLocalPathEntry(source, item, episode.filePath, episode.name, episode.duration, currentFolderId, folderEntries, fileEntries);
                }
                episodeIndex += 1;
            }
            seasonIndex += 1;
        }
        if (item.filePath === undefined &&
            item.seasons.length === 0 &&
            this.normalizeLocalPath(currentFolderId) === this.normalizeLocalPath(source.path)) {
            fileEntries.push({
                id: 'local-entry-' + item.id,
                name: item.title,
                type: item.type === 'music' ? 'audio' : 'video',
                storageType: source.storageType,
                sourceId: source.id,
                parentId: currentFolderId,
                path: source.path,
                updatedAt: item.dateAdded,
                duration: item.duration,
                mediaId: item.id,
                filePath: item.filePath,
                thumbnail: item.poster,
                sizeLabel: item.fileExt === undefined ? '' : item.fileExt.toUpperCase()
            });
        }
    }
    private appendLocalPathEntry(source: FileSourceItem, item: MediaItem, filePath: string, displayName: string, duration: number | undefined, currentFolderId: string, folderEntries: Map<string, SourceBrowserEntry>, fileEntries: Array<SourceBrowserEntry>): void {
        const rootPath: string = this.normalizeLocalPath(source.path);
        const currentPath: string = this.normalizeLocalPath(currentFolderId);
        const normalizedFilePath: string = this.normalizeLocalPath(filePath);
        if (!normalizedFilePath.startsWith(rootPath)) {
            return;
        }
        const relativeFilePath: string = this.trimLeadingSlash(normalizedFilePath.slice(rootPath.length));
        if (relativeFilePath.length === 0) {
            return;
        }
        const fileSegments: Array<string> = relativeFilePath.split('/').filter((segment: string) => segment.length > 0);
        if (fileSegments.length === 0) {
            return;
        }
        const currentRelativePath: string = currentPath === rootPath ? '' : this.trimLeadingSlash(currentPath.slice(rootPath.length));
        const currentSegments: Array<string> = currentRelativePath.length === 0 ? [] : currentRelativePath.split('/').filter((segment: string) => segment.length > 0);
        if (fileSegments.length < currentSegments.length) {
            return;
        }
        let segmentIndex: number = 0;
        while (segmentIndex < currentSegments.length) {
            if (fileSegments[segmentIndex] !== currentSegments[segmentIndex]) {
                return;
            }
            segmentIndex += 1;
        }
        const remaining: Array<string> = fileSegments.slice(currentSegments.length);
        if (remaining.length === 0) {
            return;
        }
        if (remaining.length === 1) {
            fileEntries.push({
                id: 'local-entry-' + item.id + '-' + normalizedFilePath,
                name: displayName.length > 0 ? displayName : remaining[0],
                type: item.type === 'music' ? 'audio' : 'video',
                storageType: source.storageType,
                sourceId: source.id,
                parentId: currentPath,
                path: normalizedFilePath,
                updatedAt: item.dateAdded,
                duration: duration,
                mediaId: item.id,
                filePath: filePath,
                thumbnail: item.poster,
                sizeLabel: item.fileExt === undefined ? '' : item.fileExt.toUpperCase()
            });
            return;
        }
        const nextFolderName: string = remaining[0];
        const nextFolderPath: string = currentPath === rootPath ? rootPath + '/' + nextFolderName : currentPath + '/' + nextFolderName;
        if (!folderEntries.has(nextFolderPath)) {
            folderEntries.set(nextFolderPath, {
                id: 'local-folder-' + nextFolderPath,
                name: nextFolderName,
                type: 'folder',
                storageType: source.storageType,
                sourceId: source.id,
                parentId: currentPath,
                path: nextFolderPath,
                updatedAt: item.dateAdded,
                thumbnail: item.poster
            });
        }
    }
    private buildLocalBreadcrumbs(source: FileSourceItem, currentFolderId: string): Array<SourceBreadcrumbItem> {
        const breadcrumbs: Array<SourceBreadcrumbItem> = [
            { id: source.path, name: source.name }
        ];
        const rootPath: string = this.normalizeLocalPath(source.path);
        const currentPath: string = this.normalizeLocalPath(currentFolderId);
        if (currentPath === rootPath) {
            return breadcrumbs;
        }
        const relativePath: string = this.trimLeadingSlash(currentPath.slice(rootPath.length));
        if (relativePath.length === 0) {
            return breadcrumbs;
        }
        const segments: Array<string> = relativePath.split('/').filter((segment: string) => segment.length > 0);
        let partialPath: string = rootPath;
        let index: number = 0;
        while (index < segments.length) {
            partialPath = partialPath + '/' + segments[index];
            breadcrumbs.push({
                id: partialPath,
                name: segments[index]
            });
            index += 1;
        }
        return breadcrumbs;
    }
    private normalizeLocalPath(path: string): string {
        return path.replace(/\\/g, '/').replace(/\/+$/g, '');
    }
    private trimLeadingSlash(path: string): string {
        return path.replace(/^\/+/, '');
    }
    private cacheRemoteFolder(item: AliyunFileListItem, parentFolderId: string): void {
        this.remoteFolderNameCache.set(item.file_id, item.name);
        this.remoteFolderParentCache.set(item.file_id, parentFolderId);
    }
    private buildAliyunBreadcrumbs(rootId: string, rootName: string, folderId: string): Array<SourceBreadcrumbItem> {
        const breadcrumbs: Array<SourceBreadcrumbItem> = [{ id: rootId, name: rootName }];
        if (folderId === rootId) {
            return breadcrumbs;
        }
        const trail: Array<SourceBreadcrumbItem> = [];
        let cursor: string = folderId;
        let guard: number = 0;
        while (cursor.length > 0 && cursor !== rootId && guard < 32) {
            trail.unshift({
                id: cursor,
                name: this.remoteFolderNameCache.get(cursor) ?? '当前目录'
            });
            const parentId: string | undefined = this.remoteFolderParentCache.get(cursor);
            if (parentId === undefined || parentId === cursor) {
                break;
            }
            cursor = parentId;
            guard += 1;
        }
        let index: number = 0;
        while (index < trail.length) {
            breadcrumbs.push(trail[index]);
            index += 1;
        }
        if (trail.length === 0 || trail[trail.length - 1].id !== folderId) {
            breadcrumbs.push({ id: folderId, name: this.remoteFolderNameCache.get(folderId) ?? '当前目录' });
        }
        return breadcrumbs;
    }
}
