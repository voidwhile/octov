import type { LocalSelectionResult, PlaybackSession } from '../models/OctovModels';
export interface FilePickerAdapter {
    pickFolders(): Promise<LocalSelectionResult>;
}
export interface PlayerAdapter {
    open(source: string, title: string): Promise<PlaybackSession>;
    play(): Promise<PlaybackSession>;
    pause(): Promise<PlaybackSession>;
    stop(): Promise<PlaybackSession>;
    seek(progress: number): Promise<PlaybackSession>;
    current(): PlaybackSession;
}
function createIdleSession(): PlaybackSession {
    return {
        title: 'No media selected',
        subtitle: 'Pick a media item to start playback',
        sourceLabel: 'Mock Player',
        status: 'idle',
        progress: 0,
        currentTime: 0,
        duration: 0,
        availableQualities: [],
        playlist: [],
        playlistIndex: -1,
        message: 'HarmonyOS AVPlayer is not wired in yet.'
    };
}
class MockFilePickerAdapter implements FilePickerAdapter {
    async pickFolders(): Promise<LocalSelectionResult> {
        return {
            paths: ['/storage/Users/currentUser/Movies'],
            message: 'Using a mock local folder in the current environment.'
        };
    }
}
class MockPlayerAdapter implements PlayerAdapter {
    private session: PlaybackSession = createIdleSession();
    async open(source: string, title: string): Promise<PlaybackSession> {
        this.session = {
            mediaId: source,
            title: title,
            subtitle: source,
            sourceLabel: 'Mock Player',
            status: 'loading',
            progress: 0,
            currentTime: 0,
            duration: 100,
            availableQualities: [],
            playlist: [],
            playlistIndex: -1,
            message: 'Playback session created. Waiting for a real player adapter.'
        };
        return this.current();
    }
    async play(): Promise<PlaybackSession> {
        let nextProgress: number = this.session.progress + 8;
        if (nextProgress > 100) {
            nextProgress = 100;
        }
        let nextTime: number = this.session.currentTime + 8;
        if (nextTime > this.session.duration) {
            nextTime = this.session.duration;
        }
        this.session = {
            mediaId: this.session.mediaId,
            cloudFileId: this.session.cloudFileId,
            parentFolderId: this.session.parentFolderId,
            title: this.session.title,
            subtitle: this.session.subtitle,
            sourceLabel: this.session.sourceLabel,
            status: 'playing',
            progress: nextProgress,
            currentTime: nextTime,
            duration: this.session.duration,
            downloadUrl: this.session.downloadUrl,
            activeQualityId: this.session.activeQualityId,
            availableQualities: this.session.availableQualities,
            playlist: this.session.playlist,
            playlistIndex: this.session.playlistIndex,
            message: 'Mock playback running.'
        };
        return this.current();
    }
    async pause(): Promise<PlaybackSession> {
        this.session = {
            mediaId: this.session.mediaId,
            cloudFileId: this.session.cloudFileId,
            parentFolderId: this.session.parentFolderId,
            title: this.session.title,
            subtitle: this.session.subtitle,
            sourceLabel: this.session.sourceLabel,
            status: 'paused',
            progress: this.session.progress,
            currentTime: this.session.currentTime,
            duration: this.session.duration,
            downloadUrl: this.session.downloadUrl,
            activeQualityId: this.session.activeQualityId,
            availableQualities: this.session.availableQualities,
            playlist: this.session.playlist,
            playlistIndex: this.session.playlistIndex,
            message: 'Mock playback paused.'
        };
        return this.current();
    }
    async stop(): Promise<PlaybackSession> {
        this.session = createIdleSession();
        return this.current();
    }
    async seek(progress: number): Promise<PlaybackSession> {
        let safeProgress: number = progress;
        if (safeProgress < 0) {
            safeProgress = 0;
        }
        if (safeProgress > 100) {
            safeProgress = 100;
        }
        let duration: number = this.session.duration;
        if (duration <= 0) {
            duration = 100;
        }
        this.session = {
            mediaId: this.session.mediaId,
            cloudFileId: this.session.cloudFileId,
            parentFolderId: this.session.parentFolderId,
            title: this.session.title,
            subtitle: this.session.subtitle,
            sourceLabel: this.session.sourceLabel,
            status: this.session.status,
            progress: safeProgress,
            currentTime: Math.round(duration * safeProgress / 100),
            duration: duration,
            downloadUrl: this.session.downloadUrl,
            activeQualityId: this.session.activeQualityId,
            availableQualities: this.session.availableQualities,
            playlist: this.session.playlist,
            playlistIndex: this.session.playlistIndex,
            message: 'Mock seek completed.'
        };
        return this.current();
    }
    current(): PlaybackSession {
        return {
            mediaId: this.session.mediaId,
            cloudFileId: this.session.cloudFileId,
            parentFolderId: this.session.parentFolderId,
            title: this.session.title,
            subtitle: this.session.subtitle,
            sourceLabel: this.session.sourceLabel,
            status: this.session.status,
            progress: this.session.progress,
            currentTime: this.session.currentTime,
            duration: this.session.duration,
            downloadUrl: this.session.downloadUrl,
            activeQualityId: this.session.activeQualityId,
            availableQualities: this.session.availableQualities.slice(),
            playlist: this.session.playlist.slice(),
            playlistIndex: this.session.playlistIndex,
            message: this.session.message
        };
    }
}
export class PlatformAdapters {
    private static filePickerAdapter: FilePickerAdapter = new MockFilePickerAdapter();
    private static playerAdapter: PlayerAdapter = new MockPlayerAdapter();
    static filePicker(): FilePickerAdapter {
        return PlatformAdapters.filePickerAdapter;
    }
    static player(): PlayerAdapter {
        return PlatformAdapters.playerAdapter;
    }
}
