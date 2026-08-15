import React, { useState } from 'react';
import { X, Sparkles, User, Check } from 'lucide-react';
import { RealtimeChatEngine } from '../services/chatStore';

interface ChangeNameModalProps {
  chatEngine: RealtimeChatEngine;
  onClose: () => void;
}

export const ChangeNameModal: React.FC<ChangeNameModalProps> = ({ chatEngine, onClose }) => {
  const current = chatEngine.getSession().displayName;
  const [name, setName] = useState(current);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = chatEngine.validateAndChangeName(name);
    if (!res.success) {
      setError(res.error || 'Invalid name');
      setSuggestions(res.suggestions || []);
    } else {
      setError(null);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  const handlePickSuggestion = (s: string) => {
    setName(s);
    setError(null);
    setSuggestions([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white glass-panel-subtle transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5">
          <span className="text-[10px] font-mono-code uppercase tracking-[0.3em] text-indigo-400">
            Anonymous Identity
          </span>
          <h3 className="text-lg font-bold font-display text-white mt-1">
            Choose Your Frequency Alias
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            No signup required. Change your public name anytime.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono-code uppercase tracking-wider text-slate-300 mb-1.5">
              Display Name
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white/5 rounded-2xl border border-white/10 focus-within:border-indigo-400">
              <User className="w-4 h-4 text-indigo-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. night.exe, chai.wav"
                maxLength={20}
                className="bg-transparent text-sm text-white font-mono-code outline-none flex-1"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-xs font-mono-code text-red-400 mt-1.5">
                {error}
              </p>
            )}
          </div>

          {/* Suggestions if alias is taken */}
          {suggestions.length > 0 && (
            <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20">
              <span className="block text-[10px] font-mono-code text-indigo-300 mb-2">
                Available suggestions:
              </span>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handlePickSuggestion(s)}
                    className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-mono-code text-indigo-200 transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl glass-panel-subtle text-xs font-mono-code text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono-code text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {success ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Updated!</span>
                </>
              ) : (
                'Save Alias'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
