/**
 * YouTube IFrame Player API Wrapper
 * Loads playlist PLDQ-zY2P3ImU dynamically and controls playback
 */

export const PLAYLIST_ID = 'PLDQ-zY2P3ImU';
export const PLAYLIST_URL = 'https://youtube.com/playlist?list=PLDQ-zY2P3ImU';

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
let isInitializing = false;
let isPlayerReady = false;
let pendingPlay = false;
const readyCallbacks: (() => void)[] = [];
let currentCallbacks: PlayerStateCallback = {};
let syncInterval: ReturnType<typeof setInterval> | null = null;

export function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

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
        if (prevReady) {
          try {
            prevReady();
          } catch {
            // safe ignore
          }
        }
        readyCallbacks.forEach((cb) => {
          try {
            cb();
          } catch {
            // safe ignore
          }
        });
        readyCallbacks.length = 0;
      };

      try {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.onerror = () => {
          console.warn('YouTube iframe API script loading failed or blocked');
          readyCallbacks.forEach((cb) => cb());
          readyCallbacks.length = 0;
        };
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      } catch (err) {
        console.warn('Error injecting YouTube script:', err);
        readyCallbacks.forEach((cb) => cb());
        readyCallbacks.length = 0;
      }
    }
  });
}

export function initYouTubePlayer(
  elementId: string,
  callbacks: PlayerStateCallback
): Promise<void> {
  currentCallbacks = callbacks;

  if (ytPlayer && isPlayerReady) {
    callbacks.onReady?.();
    startSyncLoop();
    return Promise.resolve();
  }

  if (isInitializing) {
    return Promise.resolve();
  }

  isInitializing = true;

  return new Promise((resolve) => {
    loadYouTubeAPI()
      .then(() => {
        if (!window.YT || !window.YT.Player) {
          isInitializing = false;
          callbacks.onError?.('YT API not available');
          resolve();
          return;
        }

        const targetEl = document.getElementById(elementId);
        if (!targetEl) {
          isInitializing = false;
          resolve();
          return;
        }

        try {
          ytPlayer = new window.YT.Player(elementId, {
            height: '100%',
            width: '100%',
            playerVars: {
              listType: 'playlist',
              list: PLAYLIST_ID,
              autoplay: 0,
              controls: 1,
              enablejsapi: 1,
              fs: 0,
              iv_load_policy: 3,
              modestbranding: 1,
              rel: 0,
              playsinline: 1,
            },
            events: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onReady: (event: any) => {
                isPlayerReady = true;
                isInitializing = false;
                callbacks.onReady?.();
                try {
                  event.target.setVolume(85);
                  event.target.cuePlaylist({
                    listType: 'playlist',
                    list: PLAYLIST_ID,
                    index: 0,
                    startSeconds: 0,
                  });
                } catch (e) {
                  console.debug('cuePlaylist notice:', e);
                }

                if (pendingPlay) {
                  pendingPlay = false;
                  playTrack();
                }

                startSyncLoop();
                setTimeout(() => {
                  extractCurrentTrackInfo(callbacks);
                }, 400);
                resolve();
              },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onStateChange: (event: any) => {
                try {
                  callbacks.onStateChange?.(event.data);
                  extractCurrentTrackInfo(callbacks);
                  startSyncLoop();
                } catch {
                  // safe ignore
                }
              },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onError: (err: any) => {
                console.warn('YouTube Player Event Notice:', err);
                try {
                  callbacks.onError?.(err);
                } catch {
                  // safe ignore
                }
              },
            },
          });
        } catch (e) {
          isInitializing = false;
          console.warn('YT.Player initialization error:', e);
          resolve();
        }
      })
      .catch((err) => {
        isInitializing = false;
        console.warn('loadYouTubeAPI error:', err);
        resolve();
      });
  });
}

export function extractCurrentTrackInfo(callbacks: PlayerStateCallback = currentCallbacks) {
  if (!ytPlayer) return;
  try {
    const videoData = ytPlayer.getVideoData?.();
    const playlist = ytPlayer.getPlaylist?.() || [];
    const currentIndex = ytPlayer.getPlaylistIndex?.() ?? 0;
    
    if (videoData && videoData.title) {
      callbacks.onTrackChange?.({
        title: videoData.title,
        author: videoData.author || 'Victory Family Church',
        index: currentIndex + 1,
        total: Math.max(playlist.length, 1),
      });
    }
  } catch {
    // ignore cross-origin safely
  }
}

function startSyncLoop() {
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(() => {
    extractCurrentTrackInfo(currentCallbacks);
  }, 1000);
}

export function playTrack() {
  if (!ytPlayer || !isPlayerReady) {
    pendingPlay = true;
    return;
  }

  try {
    const state = typeof ytPlayer.getPlayerState === 'function' ? ytPlayer.getPlayerState() : -1;
    // 5 = CUED, -1 = UNSTARTED, 0 = ENDED, 2 = PAUSED
    if (state === 5 || state === -1 || state === 0) {
      if (typeof ytPlayer.playVideo === 'function') {
        ytPlayer.playVideo();
      }
      // If still not started, explicitly load playlist
      setTimeout(() => {
        const newState = ytPlayer.getPlayerState?.();
        if (newState === -1 || newState === 5) {
          ytPlayer.loadPlaylist?.({
            listType: 'playlist',
            list: PLAYLIST_ID,
            index: 0,
          });
        }
      }, 300);
    } else {
      ytPlayer.playVideo?.();
    }
    setTimeout(() => extractCurrentTrackInfo(currentCallbacks), 800);
  } catch (err) {
    console.warn('playTrack attempt with loadPlaylist fallback:', err);
    try {
      if (typeof ytPlayer.loadPlaylist === 'function') {
        ytPlayer.loadPlaylist({
          listType: 'playlist',
          list: PLAYLIST_ID,
          index: 0,
        });
      }
    } catch {
      // safe fallback
    }
  }
}

export function pauseTrack() {
  pendingPlay = false;
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
      setTimeout(() => extractCurrentTrackInfo(currentCallbacks), 600);
    } catch {
      // safe fallback
    }
  }
}

export function prevTrack() {
  if (ytPlayer && ytPlayer.previousVideo) {
    try {
      ytPlayer.previousVideo();
      setTimeout(() => extractCurrentTrackInfo(currentCallbacks), 600);
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
