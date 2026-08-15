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
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const WorldwideChat: React.FC<WorldwideChatProps> = ({
  chatEngine,
  location,
  onOpenNameChange,
  onOpenRules,
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

  const handleReport = (messageId: string, authorName: string) => {
    const ok = window.confirm(`Report message from ${authorName} for violating vibe rules?`);
    if (ok) {
      chatEngine.reportMessage(messageId);
    }
  };

  return (
    <>
      {/* Mobile Chat Toggle Button */}
      <div className="fixed bottom-24 right-4 sm:hidden z-30 pointer-events-auto">
        <button
          onClick={onToggleOpen}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full glass-panel-interactive text-xs font-mono-code text-white shadow-xl"
        >
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span>CHAT {isOpen ? '▼' : '▲'}</span>
        </button>
      </div>

      {/* Main Chat Container */}
      <div
        className={`fixed top-20 sm:top-24 bottom-24 sm:bottom-28 right-4 sm:right-8 w-[calc(100vw-2rem)] sm:w-80 md:w-88 glass-panel rounded-3xl p-4 sm:p-5 flex flex-col z-30 pointer-events-auto transition-all duration-300 ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-[120%] sm:translate-y-0 sm:opacity-100 pointer-events-none sm:pointer-events-auto'
        }`}
      >
        {/* Header with Title & Alias badge */}
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

            {/* Mobile close button */}
            <button
              onClick={onToggleOpen}
              className="p-1 rounded-full text-slate-400 hover:text-white sm:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-1 my-3 p-1 rounded-xl bg-black/40 border border-white/5 flex-shrink-0">
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
            COUNTRY
          </button>
          <button
            onClick={() => setFilter('CITY')}
            className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-mono-code tracking-wider uppercase transition-all ${
              filter === 'CITY'
                ? 'bg-indigo-600/50 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CITY 📍
          </button>
        </div>

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
                  className={`group flex flex-col space-y-1 ${
                    item.reported ? 'opacity-30' : 'opacity-90'
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className={`text-[11px] font-mono-code font-bold tracking-tight ${
                          isMe ? 'text-indigo-300' : 'text-slate-200'
                        }`}
                      >
                        {item.displayName}
                      </span>
                      <span className="text-[9px] font-mono-code text-slate-400/50 uppercase">
                        · {item.city}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[8px] font-mono-code text-slate-500">
                        {item.timestamp}
                      </span>
                      {!isMe && !item.reported && (
                        <button
                          onClick={() => handleReport(item.id, item.displayName)}
                          className="text-slate-500 hover:text-red-400 text-[9px]"
                          title="Report message"
                        >
                          <Flag className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-sans font-light leading-relaxed text-slate-300 break-words">
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
