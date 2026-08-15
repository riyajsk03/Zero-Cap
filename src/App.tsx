import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { NightSceneCanvas } from './components/NightSceneCanvas';
import { RadioPlayer } from './components/RadioPlayer';
import { WorldwideChat } from './components/WorldwideChat';
import { QuoteRotator } from './components/QuoteRotator';
import { AtmosphereSettingsModal } from './components/AtmosphereSettingsModal';
import { ChangeNameModal } from './components/ChangeNameModal';
import { CommunityRulesModal } from './components/CommunityRulesModal';
import { IntroScreen } from './components/IntroScreen';

import {
  AtmosphereType,
  LocationData,
  PresenceStats,
  SongTrack,
  TimeSlot,
  WeatherType,
} from './types';
import { getCoarseLocation, getCurrentTimeSlot, getEstimatedWeather } from './services/location';
import { resolveAtmosphere } from './services/atmosphereConfig';
import {
  initYouTubePlayer,
  playTrack,
  pauseTrack,
} from './services/youtube';
import { RealtimeChatEngine } from './services/chatStore';
import { soundSynth } from './services/audioSynth';

export default function App() {
  // 1. Core State
  const [hasEntered, setHasEntered] = useState(false);
  const [location, setLocation] = useState<LocationData>(getCoarseLocation());
  const [timeSlot, setTimeSlot] = useState<TimeSlot>(getCurrentTimeSlot());
  const [weather, setWeather] = useState<WeatherType>(getEstimatedWeather());
  const [atmosphereType, setAtmosphereType] = useState<AtmosphereType>('AUTO');
  
  // Audio & Settings
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [filmGrain, setFilmGrain] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Modals
  const [isAtmosphereModalOpen, setIsAtmosphereModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // Music Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerError, setPlayerError] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SongTrack>({
    id: 'track_1',
    title: 'midnight memories.wav',
    artist: 'Zero Cap Radio',
    duration: 184,
    playlistIndex: 1,
    totalTracks: 12,
  });

  // Chat Engine Instance
  const chatEngine = useMemo(() => new RealtimeChatEngine(location), [location]);
  const [presence, setPresence] = useState<PresenceStats>(chatEngine.getPresence());

  // Derived Atmosphere Theme
  const currentAtmosphere = useMemo(() => {
    return resolveAtmosphere(atmosphereType, timeSlot, weather);
  }, [atmosphereType, timeSlot, weather]);

  // Update Clock & TimeSlot every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const loc = getCoarseLocation();
      setLocation(loc);
      setTimeSlot(getCurrentTimeSlot());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  // Sync Presence Stats
  useEffect(() => {
    const update = () => {
      setPresence({ ...chatEngine.getPresence() });
    };
    const unsub = chatEngine.subscribe(update);
    return () => unsub();
  }, [chatEngine]);

  // Initialize YouTube IFrame Player
  useEffect(() => {
    initYouTubePlayer('yt-player-container', {
      onReady: () => {
        setPlayerError(false);
      },
      onStateChange: (state) => {
        // 1: PLAYING, 2: PAUSED
        if (state === 1) {
          setIsPlaying(true);
        } else if (state === 2 || state === 0) {
          setIsPlaying(false);
        }
      },
      onTrackChange: (info) => {
        setCurrentTrack((prev) => ({
          ...prev,
          title: info.title,
          artist: info.author,
          playlistIndex: info.index,
          totalTracks: info.total,
        }));
      },
      onError: () => {
        setPlayerError(true);
      },
    }).catch(() => {
      setPlayerError(true);
    });
  }, []);

  // Enter Sanctuary Handler
  const handleEnterSanctuary = useCallback(() => {
    setHasEntered(true);
    playTrack();
    setIsPlaying(true);
    soundSynth.playSpacePulse();
  }, []);

  // Toggle Play / Pause
  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      pauseTrack();
      setIsPlaying(false);
    } else {
      playTrack();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Retry YouTube connection
  const handleRetryMusic = useCallback(() => {
    setPlayerError(false);
    playTrack();
  }, []);

  // Toggle Synthesizer Mute
  const handleToggleMute = useCallback(() => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    soundSynth.setMuted(next);
  }, [isAudioMuted]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050508] text-white flex flex-col justify-between select-none">
      {/* Hidden YouTube IFrame Container */}
      <div className="absolute top-0 left-0 w-1 h-1 opacity-0 pointer-events-none overflow-hidden">
        <div id="yt-player-container" />
      </div>

      {/* Cinematic Film Grain Overlay */}
      {filmGrain && <div className="film-grain" />}

      {/* Intro Loading Screen */}
      {!hasEntered && (
        <IntroScreen
          location={location}
          onEnter={handleEnterSanctuary}
        />
      )}

      {/* Central Generative Visual Canvas: Ancient Tree, Person with Headphones & Sleeping Cat */}
      <NightSceneCanvas
        atmosphere={currentAtmosphere}
        isPlaying={isPlaying}
        reducedMotion={reducedMotion}
      />

      {/* Top Header Navigation */}
      <Header
        location={location}
        presence={presence}
        isMuted={isAudioMuted}
        onToggleMute={handleToggleMute}
        onOpenAtmosphere={() => setIsAtmosphereModalOpen(true)}
        onOpenRules={() => setIsRulesModalOpen(true)}
        currentThemeName={currentAtmosphere.name}
      />

      {/* Midground Left: Rotating Nostalgic Perspectives */}
      <div className="absolute left-5 sm:left-8 top-1/2 -translate-y-1/2 z-20 pointer-events-none hidden lg:block">
        <QuoteRotator />
      </div>

      {/* Interactive Micro-Hint Badge */}
      <div className="absolute bottom-28 left-6 sm:left-8 z-20 pointer-events-none hidden md:flex items-center gap-2 text-[10px] font-mono-code text-slate-400/50 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
        <span>[SPACE] pulse world</span>
        <span>•</span>
        <span>[CLICK TREE] fall leaves</span>
        <span>•</span>
        <span>[CLICK CAT] wake cat</span>
      </div>

      {/* Worldwide Live Chat Sidebar */}
      <WorldwideChat
        chatEngine={chatEngine}
        location={location}
        onOpenNameChange={() => setIsNameModalOpen(true)}
        onOpenRules={() => setIsRulesModalOpen(true)}
        isOpen={isChatOpen}
        onToggleOpen={() => setIsChatOpen(!isChatOpen)}
      />

      {/* Bottom Floating Glassmorphism ZERO CAP Radio Player */}
      <div className="relative z-30 flex flex-col items-center">
        <RadioPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          hasError={playerError}
          onRetry={handleRetryMusic}
        />

        {/* Nostalgic Bottom Subtext */}
        <div className="flex items-center gap-6 text-[9px] font-mono-code uppercase tracking-[0.35em] text-slate-400/30 pb-2">
          <span>just stay a while</span>
          <span>•</span>
          <span>the cat gets it</span>
          <span>•</span>
          <span>no cap</span>
        </div>
      </div>

      {/* Atmosphere Settings Modal */}
      {isAtmosphereModalOpen && (
        <AtmosphereSettingsModal
          currentType={atmosphereType}
          currentWeather={weather}
          onSelectType={(type) => {
            setAtmosphereType(type);
          }}
          onSelectWeather={(w) => {
            setWeather(w);
          }}
          reducedMotion={reducedMotion}
          onToggleReducedMotion={() => setReducedMotion(!reducedMotion)}
          filmGrain={filmGrain}
          onToggleFilmGrain={() => setFilmGrain(!filmGrain)}
          onClose={() => setIsAtmosphereModalOpen(false)}
        />
      )}

      {/* Change Name Modal */}
      {isNameModalOpen && (
        <ChangeNameModal
          chatEngine={chatEngine}
          onClose={() => setIsNameModalOpen(false)}
        />
      )}

      {/* Community Rules Modal */}
      {isRulesModalOpen && (
        <CommunityRulesModal
          onClose={() => setIsRulesModalOpen(false)}
        />
      )}
    </div>
  );
}
