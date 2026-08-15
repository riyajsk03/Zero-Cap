import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Radio,
  Music,
  RotateCw,
  Sparkles,
} from 'lucide-react';
import {
  playTrack,
  pauseTrack,
  nextTrack,
  prevTrack,
  seekTrackTo,
  setTrackVolume,
  getPlayerCurrentTime,
  getPlayerDuration,
} from '../services/youtube';
import { SongTrack } from '../types';

interface RadioPlayerProps {
  currentTrack: SongTrack;
  isPlaying: boolean;
  onTogglePlay: () => void;
  hasError: boolean;
  onRetry: () => void;
}

export const RadioPlayer: React.FC<RadioPlayerProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  hasError,
  onRetry,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isVolumeMuted, setIsVolumeMuted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Sync track progress
  useEffect(() => {
    const timer = setInterval(() => {
      if (isPlaying) {
        const cur = getPlayerCurrentTime();
        const dur = getPlayerDuration();
        setCurrentTime(cur);
        if (dur > 0) setDuration(dur);
      }
    }, 500);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    seekTrackTo(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    if (val === 0) {
      setIsVolumeMuted(true);
    } else {
      setIsVolumeMuted(false);
    }
    setTrackVolume(val);
  };

  const toggleVolumeMute = () => {
    if (isVolumeMuted) {
      setIsVolumeMuted(false);
      setTrackVolume(volume || 70);
    } else {
      setIsVolumeMuted(true);
      setTrackVolume(0);
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 pb-4 sm:pb-6 z-30 pointer-events-auto">
      <div 
        className="glass-panel rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6 shadow-2xl transition-all duration-300"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Left: Track Information & Retro Vinyl Art */}
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto flex-1 min-w-0">
          {/* Animated Vinyl Icon / Equalizer */}
          <div className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden group">
            {/* Visualizer bars overlay */}
            <div className="absolute inset-0 bg-indigo-500/10 flex items-end justify-center gap-1 p-2">
              <div className={`w-1 bg-indigo-400 rounded-full transition-all ${isPlaying ? 'animate-eq-1' : 'h-1.5'}`} />
              <div className={`w-1 bg-indigo-300 rounded-full transition-all ${isPlaying ? 'animate-eq-2' : 'h-2'}`} />
              <div className={`w-1 bg-purple-400 rounded-full transition-all ${isPlaying ? 'animate-eq-3' : 'h-1'}`} />
              <div className={`w-1 bg-sky-400 rounded-full transition-all ${isPlaying ? 'animate-eq-4' : 'h-2.5'}`} />
            </div>

            <Radio className="w-5 h-5 text-indigo-200 relative z-10 opacity-70 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Track Labels & Progress */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] sm:text-[10px] font-bold font-mono-code text-indigo-400 tracking-[0.2em] uppercase">
                ZERO CAP RADIO
              </span>
              <span className="text-[9px] font-mono-code text-slate-400/60 hidden md:inline">
                • TRACK {String(currentTrack.playlistIndex || 1).padStart(2, '0')} / {currentTrack.totalTracks || 12}
              </span>
            </div>

            <h3 className="text-xs sm:text-sm font-semibold tracking-tight text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {hasError ? 'Music Signal Lost' : currentTrack.title || 'midnight memories.wav'}
            </h3>

            {/* Time Bar & Scrub */}
            <div className="flex items-center gap-2 mt-1 sm:mt-1.5 w-full max-w-sm">
              <span className="text-[9px] sm:text-[10px] font-mono-code text-slate-400/80">
                {formatTime(currentTime)}
              </span>

              <div className="relative flex-1 flex items-center h-4 group cursor-pointer">
                {/* Background Rail */}
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full transition-all duration-150"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Seek track"
                />
              </div>

              <span className="text-[9px] sm:text-[10px] font-mono-code text-slate-400/80">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: Playback Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 w-full sm:w-auto">
          {hasError ? (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-full text-xs font-mono-code transition-all"
            >
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              <span>RECONNECT SIGNAL</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 sm:gap-4 mx-auto sm:mx-0">
              {/* Previous Track */}
              <button
                onClick={prevTrack}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Previous Track"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Play / Pause Main Button */}
              <button
                onClick={onTogglePlay}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-white text-slate-950 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                title={isPlaying ? 'Pause Music' : 'Play Music'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              {/* Next Track */}
              <button
                onClick={nextTrack}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Next Track"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}

          {/* Volume Control */}
          <div className="flex items-center gap-2 border-l border-white/10 pl-4 sm:pl-6">
            <button
              onClick={toggleVolumeMute}
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
              title={isVolumeMuted ? 'Unmute Player' : 'Mute Player'}
            >
              {isVolumeMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-slate-300" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isVolumeMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-20 h-1 bg-white/20 rounded-full accent-indigo-400 cursor-pointer hidden sm:block"
              title="Adjust volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
