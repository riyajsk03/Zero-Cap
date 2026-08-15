import React from 'react';
import { Volume2, VolumeX, Sparkles, Shield, Compass } from 'lucide-react';
import { LocationData, PresenceStats } from '../types';

interface HeaderProps {
  location: LocationData;
  presence: PresenceStats;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenAtmosphere: () => void;
  onOpenRules: () => void;
  currentThemeName: string;
}

export const Header: React.FC<HeaderProps> = ({
  location,
  presence,
  isMuted,
  onToggleMute,
  onOpenAtmosphere,
  onOpenRules,
  currentThemeName,
}) => {
  return (
    <header className="w-full px-5 py-4 sm:px-8 sm:py-6 flex items-start justify-between z-30 pointer-events-auto">
      {/* Brand Title */}
      <div className="flex flex-col">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.04em] font-display text-white glow-title flex items-center gap-3">
          ZERO CAP
        </h1>
        <p className="text-[10px] sm:text-xs tracking-[0.35em] uppercase font-bold text-indigo-300/60 mt-1">
          Place for Gen Z
        </p>
      </div>

      {/* Stats, Clock & Quick Controls */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Live Presence Info */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse glow-green" />
            <span className="text-xs sm:text-sm font-mono-code font-bold tracking-wider text-slate-100">
              {presence.totalLive.toLocaleString()} LIVE
            </span>
          </div>
          <span className="text-[10px] uppercase font-mono-code tracking-tight text-slate-400/70 mt-0.5 hidden sm:inline">
            {presence.cityLive} in {location.city}
          </span>
        </div>

        <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />

        {/* Local Clock & Coarse Location */}
        <div className="text-right hidden sm:block">
          <span className="block text-base sm:text-lg font-mono-code font-semibold tracking-tight text-slate-200">
            {location.formattedTime}
          </span>
          <span className="block text-[10px] uppercase font-mono-code tracking-widest text-indigo-300/50 mt-0.5">
            {location.city}, {location.countryCode}
          </span>
        </div>

        {/* Atmosphere & Sound Control Actions */}
        <div className="flex items-center gap-2">
          {/* Atmosphere Preset Selector Button */}
          <button
            onClick={onOpenAtmosphere}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel-interactive text-xs font-mono-code text-indigo-200"
            title="Atmosphere & Weather Settings"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline text-[11px]">{currentThemeName}</span>
          </button>

          {/* Sound Synthesizer Mute Toggle */}
          <button
            onClick={onToggleMute}
            className="p-2 rounded-full glass-panel-interactive text-slate-300 hover:text-white"
            title={isMuted ? 'Unmute Ambient Sound' : 'Mute Ambient Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Community Rules Button */}
          <button
            onClick={onOpenRules}
            className="p-2 rounded-full glass-panel-interactive text-slate-400 hover:text-white hidden sm:flex"
            title="Community Guidelines & Vibe Rules"
          >
            <Shield className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
