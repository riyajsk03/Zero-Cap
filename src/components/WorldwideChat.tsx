import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Globe,
  MapPin,
  Flag,
  Send,
  User,
  Shield,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { ChatMessage, LocationData, UserSession } from '../types';
import { RealtimeChatEngine } from '../services/chatStore';
import { soundSynth } from '../services/audioSynth';

interface WorldwideChatProps {
  chatEngine: RealtimeChatEngine;
  location: LocationData;
  onOpenNameChange: () => void;
  onOpenRules: () => void;
  onOpenLocationChange?: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const WorldwideChat: React.FC<WorldwideChatProps> = ({
  chatEngine,
  location,
  onOpenNameChange,
  onOpenRules,
  onOpenLocationChange,
  isOpen,
  onToggleOpen,
}) => {
  const [filter, setFilter] = useState<'WORLD' | 'COUNTRY' | 'CITY'>('WORLD');
  const [inputText, setInputText] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<UserSession>(chatEngine.getSession());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync with chat engine
  useEffect(() => {
    const update = () => {
      setMessages([...chatEngine.getMessages(filter)]);
      setSession({ ...chatEngine.getSession() });
    };

    update();
    const unsubscribe = chatEngine.subscribe(update);
    return () => unsubscribe();
  }, [chatEngine, filter]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const res = chatEngine.sendMessage(inputText);
    if (!res.success) {
      setInputError(res.error || 'Failed to send message');
      setTimeout(() => setInputError(null), 3500);
    } else {
      soundSynth.playMessageChime();
      setInputText('');
      setInputError(null);
    }
  };

  const handleReport = (messageId: string) => {
    chatEngine.reportMessage(messageId);
  };

  return (
    <>
      {/* Floating Worldwide Chat Open Trigger (Visible when Chat is Closed) */}
      {!isOpen && (
        <div className="fixed bottom-24 sm:bottom-28 right-4 sm:right-8 z-30 pointer-events-auto animate-fade-in">
          <button
            onClick={onToggleOpen}
            className="flex items-center gap-2.5 px-4 py-2.5 sm:py-3 rounded-full glass-panel-interactive text-xs font-mono-code text-white shadow-2xl border border-white/20 hover:border-indigo-400/50 hover:scale-105 active:scale-95 transition-all group"
            title="Open Worldwide Live Chat"
          >
            <div className="relative">
              <MessageSquare className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <span className="font-bold tracking-wider text-slate-100">WORLDWIDE CHAT</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              LIVE
            </span>
          </button>
        </div>
      )}

      {/* Main Chat Container (Opens / Closes smoothly on Desktop & Mobile) */}
      <div
        className={`fixed top-20 sm:top-24 bottom-24 sm:bottom-28 right-4 sm:right-8 w-[calc(100vw-2rem)] sm:w-80 md:w-88 glass-panel rounded-3xl p-4 sm:p-5 flex flex-col z-30 pointer-events-auto transition-all duration-300 ${
          isOpen
            ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto shadow-2xl'
            : 'translate-y-[120%] sm:translate-y-12 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Header with Title, Alias badge & Universal Close Button */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold font-mono-code uppercase tracking-[0.2em] text-slate-100">
                WORLDWIDE
              </h2>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono-code border border-indigo-500/30">
                LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400/70 lowercase tracking-wide mt-0.5">
              people listening with you
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Alias change button */}
            <button
              onClick={onOpenNameChange}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono-code text-indigo-200 transition-colors"
              title="Change your anonymous alias"
            >
              <User className="w-3 h-3 text-indigo-400" />
              <span className="truncate max-w-[80px]">{session.displayName}</span>
            </button>

            {/* Universal Close / Minimize Button (Works on both mobile & desktop) */}
            <button
              onClick={onToggleOpen}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white border border-white/10 transition-colors"
              title="Close Worldwide Chat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-1 my-2 p-1 rounded-xl bg-black/40 border border-white/5 flex-shrink-0">
          <button
            onClick={() => setFilter('WORLD')}
            className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-mono-code tracking-wider uppercase transition-all ${
              filter === 'WORLD'
                ? 'bg-indigo-600/50 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            WORLD 🌎
          </button>
          <button
            onClick={() => setFilter('COUNTRY')}
            className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-mono-code tracking-wider uppercase transition-all ${
              filter === 'COUNTRY'
                ? 'bg-indigo-600/50 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {location.countryCode || 'COUNTRY'}
          </button>
          <button
            onClick={() => setFilter('CITY')}
            className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-mono-code tracking-wider uppercase transition-all truncate ${
              filter === 'CITY'
                ? 'bg-indigo-600/50 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={`Filter to ${location.city}`}
          >
            {location.city || 'CITY'} 📍
          </button>
        </div>

        {/* Quick Location info & switch */}
        {onOpenLocationChange && (
          <div className="flex items-center justify-between px-1 pb-2 text-[9px] font-mono-code text-slate-400/80 flex-shrink-0">
            <span className="flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-indigo-400" />
              <span>{location.city}, {location.countryCode}</span>
            </span>
            <button
              onClick={onOpenLocationChange}
              className="text-indigo-300 hover:text-white underline decoration-dotted transition-colors cursor-pointer"
            >
              change city
            </button>
          </div>
        )}

        {/* Live Message Stream */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1">
          {messages.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs font-mono-code">
              Quiet moments in this frequency... Say something.
            </div>
          ) : (
            messages.map((item) => {
              if (item.isSystem) {
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-center gap-2 py-1 px-3 rounded-full bg-white/[0.02] border border-white/5 text-[9px] font-mono-code text-indigo-300/60 text-center animate-fade-in"
                  >
                    <span className="w-1 h-1 rounded-full bg-indigo-400/50 animate-pulse" />
                    <span>{item.message}</span>
                  </div>
                );
              }

              const isMe = item.sessionId === session.sessionId;

              return (
                <div
                  key={item.id}
                  className={`group flex flex-col space-y-1.5 p-2 rounded-xl transition-colors ${
                    isMe ? 'bg-indigo-500/[0.06] border border-indigo-500/10' : 'hover:bg-white/[0.02]'
                  } ${item.reported ? 'opacity-30' : 'opacity-100'}`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      <span
                        className={`text-[11px] font-mono-code font-bold tracking-tight ${
                          isMe ? 'text-indigo-300' : 'text-slate-200'
                        }`}
                      >
                        {item.displayName}
                        {isMe && <span className="ml-1 text-[9px] text-indigo-400/80 font-normal">(you)</span>}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-mono-code text-indigo-300/80 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                        <span className="text-[8px]">📍</span>
                        <span>{item.city}{item.countryCode ? `, ${item.countryCode}` : (item.country ? `, ${item.country}` : '')}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[9px] font-mono-code text-slate-400 font-medium">
                        {item.timestamp}
                      </span>
                      {!isMe && !item.reported && (
                        <button
                          onClick={() => handleReport(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 text-[9px] p-0.5 transition-opacity"
                          title="Report message"
                        >
                          <Flag className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-sans font-light leading-relaxed text-slate-200 break-words pl-0.5">
                    {item.message}
                  </p>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Feedback Pill */}
        {inputError && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 mb-2 bg-red-500/20 border border-red-500/30 rounded-xl text-[10px] font-mono-code text-red-300 animate-shake">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            <span>{inputError}</span>
          </div>
        )}

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="mt-2 pt-2 border-t border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-full border border-white/10 focus-within:border-indigo-400/50 transition-colors">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Say something into the night..."
              maxLength={180}
              className="bg-transparent text-xs text-white placeholder:text-slate-500 outline-none flex-1 font-sans"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-1 rounded-full text-indigo-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between px-2 mt-2">
            <button
              type="button"
              onClick={onOpenRules}
              className="text-[9px] font-mono-code text-slate-500 hover:text-indigo-300 transition-colors"
            >
              community rules & vibe
            </button>
            <span className="text-[9px] font-mono-code text-slate-600">
              {inputText.length}/180
            </span>
          </div>
        </form>
      </div>
    </>
  );
};
