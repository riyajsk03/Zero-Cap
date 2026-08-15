import React from 'react';
import { Volume2, VolumeX, Sparkles, Shield, Instagram, MessageSquare } from 'lucide-react';
import { LocationData, PresenceStats } from '../types';

interface HeaderProps {
  location: LocationData;
  presence: PresenceStats;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenRules: () => void;
  currentThemeName: string;
  isChatOpen: boolean;
  onToggleChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  location,
  presence,
  isMuted,
  onToggleMute,
  onOpenRules,
  currentThemeName,
  isChatOpen,
  onToggleChat,
}) => {
  return (
    <header className="w-full px-5 py-4 sm:px-8 sm:py-6 flex items-start justify-between z-30 pointer-events-auto">
      {/* Brand Title & Left-Corner Instagram Link */}
      <div className="flex flex-col items-start">
        {/* Top-Left Instagram Link */}
        <a
          href="https://www.instagram.com/xx__spidey___?igsh=MW14dnJheWoxMXVyYQ=="
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1 mb-1.5 rounded-full bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20 hover:from-pink-500/30 hover:via-purple-500/30 hover:to-indigo-500/30 border border-pink-500/30 text-[11px] font-mono-code text-pink-200 hover:text-white transition-all shadow-sm group"
          title="Connect with xx__spidey___ on Instagram"
        >
          <Instagram className="w-3.5 h-3.5 text-pink-400 group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide">@xx__spidey___</span>
        </a>

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

        {/* Automated System Atmosphere, Chat & Sound Controls */}
        <div className="flex items-center gap-2">
          {/* Worldwide Chat Toggle Button in Header */}
          <button
            onClick={onToggleChat}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono-code transition-all shadow-sm ${
              isChatOpen
                ? 'bg-indigo-600/80 text-white border border-indigo-400/50'
                : 'glass-panel-interactive text-indigo-200 hover:text-white'
            }`}
            title={isChatOpen ? 'Close Worldwide Chat' : 'Open Worldwide Chat'}
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline text-[11px] font-medium">
              {isChatOpen ? 'Hide Chat' : 'Live Chat'}
            </span>
          </button>

          {/* System Atmosphere Dynamic Read-only Badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono-code text-indigo-200/90 shadow-sm cursor-default"
            title="Atmosphere is automatically synchronized to your local time, weather & place."
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-300">
              <span className="hidden sm:inline text-indigo-300/60 mr-1">AUTO:</span>
              {currentThemeName}
            </span>
          </div>

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
