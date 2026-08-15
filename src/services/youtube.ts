/**
 * YouTube IFrame Player API Wrapper
 * Loads playlist PLDQ-zY2P3ImU dynamically and controls playback
 */

export const PLAYLIST_ID = 'PLDQ-zY2P3ImU';
export const DEFAULT_VIDEO_ID = '2pdkKo-Cj5Y';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT?: any;
  }
}

export interface PlayerStateCallback {
  onReady?: () => void;
  onStateChange?: (state: number) => void;
  onTrackChange?: (trackInfo: { title: string; author: string; index: number; total: number }) => void;
  onError?: (err: unknown) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ytPlayer: any = null;
let isScriptLoading = false;
let isScriptLoaded = false;
const readyCallbacks: (() => void)[] = [];

export function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      isScriptLoaded = true;
      resolve();
      return;
    }

    readyCallbacks.push(resolve);

    if (!isScriptLoading) {
      isScriptLoading = true;
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        isScriptLoaded = true;
        if (prevReady) prevReady();
        readyCallbacks.forEach((cb) => cb());
        readyCallbacks.length = 0;
      };

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  });
}

export function initYouTubePlayer(
  elementId: string,
  callbacks: PlayerStateCallback
): Promise<void> {
  return new Promise((resolve, reject) => {
    loadYouTubeAPI()
      .then(() => {
        if (!window.YT || !window.YT.Player) {
          reject(new Error('YT API not available'));
          return;
        }

        try {
          ytPlayer = new window.YT.Player(elementId, {
            height: '100%',
            width: '100%',
            videoId: DEFAULT_VIDEO_ID,
            playerVars: {
              listType: 'playlist',
              list: PLAYLIST_ID,
              autoplay: 0,
              controls: 0,
              disablekb: 1,
              enablejsapi: 1,
              fs: 0,
              iv_load_policy: 3,
              modestbranding: 1,
              rel: 0,
              playsinline: 1,
              origin: window.location.origin,
            },
            events: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onReady: (event: any) => {
                callbacks.onReady?.();
                // Set volume to comfortable level
                event.target.setVolume(80);
                extractCurrentTrackInfo(callbacks);
                resolve();
              },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onStateChange: (event: any) => {
                callbacks.onStateChange?.(event.data);
                if (
                  event.data === window.YT.PlayerState.PLAYING ||
                  event.data === window.YT.PlayerState.BUFFERING ||
                  event.data === window.YT.PlayerState.CUED
                ) {
                  extractCurrentTrackInfo(callbacks);
                }
              },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onError: (err: any) => {
                callbacks.onError?.(err);
              },
            },
          });
        } catch (e) {
          reject(e);
        }
      })
      .catch(reject);
  });
}

function extractCurrentTrackInfo(callbacks: PlayerStateCallback) {
  if (!ytPlayer) return;
  try {
    const videoData = ytPlayer.getVideoData?.();
    const playlist = ytPlayer.getPlaylist?.() || [];
    const currentIndex = ytPlayer.getPlaylistIndex?.() ?? 0;
    
    if (videoData) {
      callbacks.onTrackChange?.({
        title: videoData.title || 'midnight memories.wav',
        author: videoData.author || 'Zero Cap Radio',
        index: currentIndex + 1,
        total: Math.max(playlist.length, 1),
      });
    }
  } catch {
    // ignore cross-origin safely
  }
}

export function playTrack() {
  if (ytPlayer && ytPlayer.playVideo) {
    try {
      ytPlayer.playVideo();
    } catch {
      // safe fallback
    }
  }
}

export function pauseTrack() {
  if (ytPlayer && ytPlayer.pauseVideo) {
    try {
      ytPlayer.pauseVideo();
    } catch {
      // safe fallback
    }
  }
}

export function nextTrack() {
  if (ytPlayer && ytPlayer.nextVideo) {
    try {
      ytPlayer.nextVideo();
    } catch {
      // safe fallback
    }
  }
}

export function prevTrack() {
  if (ytPlayer && ytPlayer.previousVideo) {
    try {
      ytPlayer.previousVideo();
    } catch {
      // safe fallback
    }
  }
}

export function seekTrackTo(seconds: number) {
  if (ytPlayer && ytPlayer.seekTo) {
    try {
      ytPlayer.seekTo(seconds, true);
    } catch {
      // safe fallback
    }
  }
}

export function setTrackVolume(volume: number) {
  if (ytPlayer && ytPlayer.setVolume) {
    try {
      ytPlayer.setVolume(Math.max(0, Math.min(100, volume)));
    } catch {
      // safe fallback
    }
  }
}

export function getPlayerCurrentTime(): number {
  if (ytPlayer && ytPlayer.getCurrentTime) {
    try {
      return ytPlayer.getCurrentTime() || 0;
    } catch {
      return 0;
    }
  }
  return 0;
}

export function getPlayerDuration(): number {
  if (ytPlayer && ytPlayer.getDuration) {
    try {
      return ytPlayer.getDuration() || 0;
    } catch {
      return 0;
    }
  }
  return 0;
}

export function getPlayerState(): number {
  if (ytPlayer && ytPlayer.getPlayerState) {
    try {
      return ytPlayer.getPlayerState();
    } catch {
      return -1;
    }
  }
  return -1;
}
