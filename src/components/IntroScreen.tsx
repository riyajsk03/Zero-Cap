import React, { useEffect, useState } from 'react';
import { Headphones, Sparkles, Radio } from 'lucide-react';
import { LocationData } from '../types';

interface IntroScreenProps {
  location: LocationData;
  onEnter: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ location, onEnter }) => {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setReady(true);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15 + 10);
      });
    }, 180);

    return () => clearInterval(timer);
  }, []);

  const totalBlocks = 18;
  const filledBlocks = Math.floor((progress / 100) * totalBlocks);
  const progressBlocks = '█'.repeat(filledBlocks) + '░'.repeat(totalBlocks - filledBlocks);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#050508] text-white select-none">
      {/* Background radial glow */}
      <div className="absolute w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full text-center space-y-6">
        {/* Brand */}
        <div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-[-0.05em] font-display glow-title text-white">
            ZERO CAP
          </h1>
          <p className="text-xs sm:text-sm tracking-[0.4em] uppercase font-bold text-indigo-300/70 mt-1">
            Place for Gen Z
          </p>
        </div>

        {/* Tagline */}
        <p className="font-serif-italic text-lg text-slate-300/80">
          "Same song. Different city. Just stay a while."
        </p>

        {/* Terminal Loading Simulation */}
        <div className="w-full glass-panel rounded-2xl p-5 font-mono-code text-xs space-y-2 border border-white/10 text-left">
          <div className="flex items-center justify-between text-indigo-300">
            <span>CONNECTING TO THE NIGHT...</span>
            <span>{progress}%</span>
          </div>

          <div className="text-slate-400">
            FINDING YOUR FREQUENCY • FM 98.7
          </div>

          <div className="text-indigo-400 tracking-wider text-sm overflow-hidden text-center py-1">
            {progressBlocks}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-slate-400 uppercase">
            <span>{location.city}, {location.countryCode}</span>
            <span>{location.formattedTime}</span>
          </div>
        </div>

        {/* Enter Sanctuary Button */}
        <div className="pt-2 w-full">
          <button
            onClick={onEnter}
            disabled={!ready}
            className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-3 font-mono-code text-sm font-bold tracking-wider uppercase transition-all duration-300 shadow-xl ${
              ready
                ? 'bg-white text-slate-950 hover:bg-indigo-50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                : 'bg-white/10 text-slate-500 cursor-wait'
            }`}
          >
            <Headphones className="w-5 h-5 animate-pulse" />
            <span>{ready ? 'ENTER THE NIGHT / TAP TO START' : 'TUNING SIGNAL...'}</span>
          </button>
        </div>

        {/* Small hint */}
        <p className="text-[11px] font-mono-code text-slate-500">
          Best experienced with headphones on in a dark room.
        </p>
      </div>
    </div>
  );
};
