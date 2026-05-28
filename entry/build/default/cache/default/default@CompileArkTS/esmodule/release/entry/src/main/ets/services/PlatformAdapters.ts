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
class MockFilePickerAdapter implements FilePickerAdapter {
    async pickFolders(): Promise<LocalSelectionResult> {
        const n21: LocalSelectionResult = {
            paths: ['/storage/Users/currentUser/Movies'],
            message: '当前环境使用模拟目录，后续可替换为系统文件选择器。'
        };
        return n21;
    }
}
class MockPlayerAdapter implements PlayerAdapter {
    private session: PlaybackSession = {
        title: '未开始播放',
        subtitle: '等待选择媒体',
        sourceLabel: 'Mock Player',
        status: 'idle',
        progress: 0,
        currentTime: 0,
        duration: 0,
        message: '当前是播放器适配骨架，后续可接入 HarmonyOS AVPlayer。'
    };
    async open(l21: string, m21: string): Promise<PlaybackSession> {
        this.session = {
            mediaId: l21,
            title: m21,
            subtitle: l21,
            sourceLabel: 'Mock Player',
            status: 'loading',
            progress: 0,
            currentTime: 0,
            duration: 100,
            message: '播放会话已创建，等待接入真实播放器。'
        };
        return this.current();
    }
    async play(): Promise<PlaybackSession> {
        let j21: number = this.session.progress + 8;
        if (j21 > 100) {
            j21 = 100;
        }
        let k21: number = this.session.currentTime + 8;
        if (k21 > this.session.duration) {
            k21 = this.session.duration;
        }
        this.session = {
            mediaId: this.session.mediaId,
            title: this.session.title,
            subtitle: this.session.subtitle,
            sourceLabel: this.session.sourceLabel,
            status: 'playing',
            progress: j21,
            currentTime: k21,
            duration: this.session.duration,
            message: '模拟播放中，后续可直接绑定 AVPlayer.play()。'
        };
        return this.current();
    }
    async pause(): Promise<PlaybackSession> {
        this.session = {
            mediaId: this.session.mediaId,
            title: this.session.title,
            subtitle: this.session.subtitle,
            sourceLabel: this.session.sourceLabel,
            status: 'paused',
            progress: this.session.progress,
            currentTime: this.session.currentTime,
            duration: this.session.duration,
            message: '模拟暂停。'
        };
        return this.current();
    }
    async stop(): Promise<PlaybackSession> {
        this.session = {
            title: '未开始播放',
            subtitle: '等待选择媒体',
            sourceLabel: 'Mock Player',
            status: 'idle',
            progress: 0,
            currentTime: 0,
            duration: 0,
            message: '播放会话已重置。'
        };
        return this.current();
    }
    async seek(f21: number): Promise<PlaybackSession> {
        let g21: number = f21;
        if (g21 < 0) {
            g21 = 0;
        }
        if (g21 > 100) {
            g21 = 100;
        }
        let h21: number = this.session.duration;
        if (h21 <= 0) {
            h21 = 100;
        }
        const i21: number = Math.round(h21 * g21 / 100);
        this.session = {
            mediaId: this.session.mediaId,
            title: this.session.title,
            subtitle: this.session.subtitle,
            sourceLabel: this.session.sourceLabel,
            status: this.session.status,
            progress: g21,
            currentTime: i21,
            duration: h21,
            message: '模拟跳转完成。'
        };
        return this.current();
    }
    current(): PlaybackSession {
        const e21: PlaybackSession = {
            mediaId: this.session.mediaId,
            title: this.session.title,
            subtitle: this.session.subtitle,
            sourceLabel: this.session.sourceLabel,
            status: this.session.status,
            progress: this.session.progress,
            currentTime: this.session.currentTime,
            duration: this.session.duration,
            message: this.session.message
        };
        return e21;
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
