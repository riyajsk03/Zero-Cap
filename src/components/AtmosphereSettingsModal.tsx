import React from 'react';
import { X, Moon, CloudRain, Sunset, Sun, Sparkles, Wind, EyeOff, Volume2 } from 'lucide-react';
import { AtmosphereType, WeatherType } from '../types';

interface AtmosphereSettingsModalProps {
  currentType: AtmosphereType;
  currentWeather: WeatherType;
  onSelectType: (type: AtmosphereType) => void;
  onSelectWeather: (weather: WeatherType) => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
  filmGrain: boolean;
  onToggleFilmGrain: () => void;
  onClose: () => void;
}

const PRESETS: { type: AtmosphereType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    type: 'AUTO',
    label: 'Auto Realtime',
    desc: 'Adapts dynamically to your real local hour & weather',
    icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
  },
  {
    type: 'MIDNIGHT',
    label: 'Midnight Indigo',
    desc: 'Deep blue/black sky, silver stars & calm shadows',
    icon: <Moon className="w-4 h-4 text-sky-400" />,
  },
  {
    type: 'RAIN',
    label: 'Rainy Sanctuary',
    desc: 'Soft rain falling, misty horizon & cat snuggle',
    icon: <CloudRain className="w-4 h-4 text-teal-400" />,
  },
  {
    type: 'SUNSET',
    label: 'Sunset Dusk',
    desc: 'Warm magenta, violet & golden hour rim lighting',
    icon: <Sunset className="w-4 h-4 text-amber-400" />,
  },
  {
    type: 'MOONLIGHT',
    label: 'Silver Moonlight',
    desc: 'Ethereal luminous blue highlights and fireflies',
    icon: <Sparkles className="w-4 h-4 text-purple-400" />,
  },
  {
    type: 'NEON_NIGHT',
    label: 'Neon Twilight',
    desc: 'Cyan & purple cyberpunk nostalgic atmosphere',
    icon: <Sparkles className="w-4 h-4 text-pink-400" />,
  },
  {
    type: 'SOLITUDE_DAWN',
    label: '3 AM Solitude',
    desc: 'Ultra-quiet peaceful stillness for deep thinking',
    icon: <Moon className="w-4 h-4 text-indigo-300" />,
  },
  {
    type: 'MORNING',
    label: 'Morning Dew',
    desc: 'Soft golden sunlight rays & fresh morning breeze',
    icon: <Sun className="w-4 h-4 text-yellow-400" />,
  },
];

export const AtmosphereSettingsModal: React.FC<AtmosphereSettingsModalProps> = ({
  currentType,
  currentWeather,
  onSelectType,
  onSelectWeather,
  reducedMotion,
  onToggleReducedMotion,
  filmGrain,
  onToggleFilmGrain,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white glass-panel-subtle transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <span className="text-[10px] font-mono-code uppercase tracking-[0.3em] text-indigo-400">
            Environment Matrix
          </span>
          <h2 className="text-xl font-bold font-display text-white mt-1">
            Atmosphere & Atmosphere Modes
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Personalize the visual lighting, weather simulation, and cinematic motion.
          </p>
        </div>

        {/* Preset Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
          {PRESETS.map((p) => {
            const isSelected = currentType === p.type;
            return (
              <button
                key={p.type}
                onClick={() => onSelectType(p.type)}
                className={`flex items-start gap-3 p-3 rounded-2xl text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-600/30 border border-indigo-400/50 shadow-md'
                    : 'glass-panel-subtle hover:bg-white/5 border border-white/5'
                }`}
              >
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex-shrink-0 mt-0.5">
                  {p.icon}
                </div>
                <div>
                  <h4 className="text-xs font-mono-code font-bold text-slate-100 flex items-center gap-1.5">
                    {p.label}
                    {isSelected && <span className="text-[9px] text-indigo-400">●</span>}
                  </h4>
                  <p className="text-[11px] text-slate-400/80 leading-relaxed mt-0.5">
                    {p.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Weather Simulator Override */}
        <div className="mb-6 pt-4 border-t border-white/10">
          <label className="block text-xs font-mono-code uppercase tracking-wider text-slate-300 mb-2">
            Weather Force Override
          </label>
          <div className="flex items-center gap-2">
            {(['CLEAR', 'RAIN', 'WINDY'] as WeatherType[]).map((w) => (
              <button
                key={w}
                onClick={() => onSelectWeather(w)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono-code text-center transition-all ${
                  currentWeather === w
                    ? 'bg-sky-500/30 border border-sky-400 text-sky-200 font-bold'
                    : 'bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400'
                }`}
              >
                {w === 'CLEAR' ? 'Clear Moon 🌙' : w === 'RAIN' ? 'Rain Falling 🌧️' : 'Windy Breeze 🍃'}
              </button>
            ))}
          </div>
        </div>

        {/* Visual FX Toggles */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <label className="block text-xs font-mono-code uppercase tracking-wider text-slate-300 mb-2">
            Cinematic Effects
          </label>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
            <div>
              <div className="text-xs font-mono-code font-bold text-slate-200">Film Grain & Noise</div>
              <div className="text-[11px] text-slate-400">Subtle indie analog texture</div>
            </div>
            <button
              onClick={onToggleFilmGrain}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                filmGrain ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  filmGrain ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
            <div>
              <div className="text-xs font-mono-code font-bold text-slate-200">Reduced Motion</div>
              <div className="text-[11px] text-slate-400">Calm parallax & slower leaf drifting</div>
            </div>
            <button
              onClick={onToggleReducedMotion}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                reducedMotion ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  reducedMotion ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
