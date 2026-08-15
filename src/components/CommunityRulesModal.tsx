import React from 'react';
import { X, ShieldCheck, HeartHandshake } from 'lucide-react';

interface CommunityRulesModalProps {
  onClose: () => void;
}

const RULES = [
  'No abuse or harassment of any kind.',
  'No hate speech or intolerance.',
  'No threats or violent language.',
  'No spamming or automated bot posting.',
  'No sexual harassment or inappropriate content.',
  'No doxxing or exposing private identity.',
  'No sharing real phone numbers or exact addresses.',
  'Respect everyone listening under the tree.',
  'Protect the calm, nighttime sanctuary vibe.',
];

export const CommunityRulesModal: React.FC<CommunityRulesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white glass-panel-subtle transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono-code uppercase tracking-[0.3em] text-indigo-400">
              Sanctuary Etiquette
            </span>
            <h3 className="text-xl font-bold font-display text-white">
              Community Rules & Vibe
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          ZERO CAP is a peaceful refuge for anyone discovering this frequency late at night.
          Treat this space with tenderness and care.
        </p>

        {/* Rules Checklist */}
        <div className="space-y-2 mb-6 bg-black/30 p-4 rounded-2xl border border-white/5">
          {RULES.map((rule, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
              <span className="text-indigo-400 font-mono-code mt-0.5">•</span>
              <span className="leading-snug">{rule}</span>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono-code text-amber-200/90 flex items-center gap-2 mb-5">
          <HeartHandshake className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>Repeated violations can result in a permanent chat ban. Protect the vibe.</span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono-code text-xs font-bold transition-all shadow-lg"
        >
          I Understand & Protect The Vibe
        </button>
      </div>
    </div>
  );
};
