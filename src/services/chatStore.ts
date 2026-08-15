import { ChatMessage, LocationData, PresenceStats, UserSession } from '../types';
import {
  subscribeToLiveMessages,
  sendFirestoreMessage,
  reportFirestoreMessage,
  updateFirestorePresence,
  subscribeToPresence,
  testFirestoreConnection,
} from './firebase';

const ADJECTIVES = [
  'night', 'chai', 'ghost', 'moon', 'afterhours', 'lofi', 'tokyo', 'neon',
  'silent', 'static', 'drift', 'rain', 'velvet', 'echo', 'mist', 'haze',
  'cyber', 'solitude', 'midnight', 'sleepy', 'star', 'cassette', 'vinyl'
];

const EXTENSIONS = ['exe', 'wav', '404', 'mp3', 'byte', 'raw', 'flac', 'zip', 'fm'];

export function generateAnonymousName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const ext = EXTENSIONS[Math.floor(Math.random() * EXTENSIONS.length)];
  return `${adj}.${ext}`;
}

export function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

const FORBIDDEN_WORDS = ['abuse', 'hate', 'spam', 'doxx', 'kill', 'threat', 'scam'];

export class RealtimeChatEngine {
  private session: UserSession;
  private messages: ChatMessage[] = [];
  private presence: PresenceStats = { totalLive: 1, cityLive: 1, countryLive: 1 };
  private listeners: (() => void)[] = [];
  private lastMessageTime = 0;
  private unsubFirestore: (() => void) | null = null;
  private unsubPresence: (() => void) | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(location: LocationData) {
    const savedSession = this.loadSavedSession();
    if (savedSession) {
      this.session = {
        ...savedSession,
        city: location.city || savedSession.city,
        country: location.country || savedSession.country,
        countryCode: location.countryCode || savedSession.countryCode,
      };
    } else {
      const name = generateAnonymousName();
      this.session = {
        sessionId: generateSessionId(),
        displayName: name,
        city: location.city,
        country: location.country,
        countryCode: location.countryCode,
        joinedAt: Date.now(),
      };
      this.saveSession();
    }

    this.initFirebaseSync();
  }

  private loadSavedSession(): UserSession | null {
    try {
      const data = localStorage.getItem('zerocap_session');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private saveSession() {
    try {
      localStorage.setItem('zerocap_session', JSON.stringify(this.session));
    } catch {
      // safe fallback
    }
  }

  private async initFirebaseSync() {
    // 1. Test connection to Firestore on startup
    testFirestoreConnection().catch(() => {});

    // 2. Send immediate initial presence beacon
    updateFirestorePresence({
      sessionId: this.session.sessionId,
      displayName: this.session.displayName,
      city: this.session.city,
      country: this.session.country,
    }).catch(() => {});

    // 3. Subscribe to real-time live messages from Firestore
    this.unsubFirestore = subscribeToLiveMessages(
      (firestoreMsgs) => {
        this.messages = firestoreMsgs;
        this.notify();
      },
      (err) => {
        console.warn('Live chat Firestore listener warning:', err);
      }
    );

    // 4. Subscribe to presence updates from Firestore
    this.unsubPresence = subscribeToPresence((newStats) => {
      this.presence = newStats;
      this.notify();
    });

    // 5. Periodic presence heartbeat every 30s
    this.heartbeatInterval = setInterval(() => {
      updateFirestorePresence({
        sessionId: this.session.sessionId,
        displayName: this.session.displayName,
        city: this.session.city,
        country: this.session.country,
      }).catch(() => {});
    }, 30000);
  }

  public getSession(): UserSession {
    return this.session;
  }

  public getPresence(): PresenceStats {
    return this.presence;
  }

  public getMessages(filter: 'WORLD' | 'COUNTRY' | 'CITY'): ChatMessage[] {
    if (filter === 'CITY') {
      return this.messages.filter(
        (m) => m.isSystem || m.city.toLowerCase() === this.session.city.toLowerCase() || m.sessionId === this.session.sessionId
      );
    }
    if (filter === 'COUNTRY') {
      return this.messages.filter(
        (m) => m.isSystem || m.country.toLowerCase() === this.session.country.toLowerCase() || m.sessionId === this.session.sessionId
      );
    }
    return this.messages;
  }

  public validateAndChangeName(newName: string): { success: boolean; error?: string; suggestions?: string[] } {
    const trimmed = newName.trim().toLowerCase();
    if (!trimmed) {
      return { success: false, error: 'Name cannot be empty' };
    }
    if (trimmed.length < 3 || trimmed.length > 20) {
      return { success: false, error: 'Name must be 3-20 characters' };
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
      return { success: false, error: 'Only letters, numbers, dot, underscore and hyphen allowed' };
    }

    this.session.displayName = newName.trim();
    this.saveSession();

    // Update presence on Firestore
    updateFirestorePresence({
      sessionId: this.session.sessionId,
      displayName: this.session.displayName,
      city: this.session.city,
      country: this.session.country,
    }).catch(() => {});

    this.notify();
    return { success: true };
  }

  public sendMessage(text: string): { success: boolean; error?: string } {
    const trimmed = text.trim();
    if (!trimmed) return { success: false, error: 'Empty message' };

    // Rate limit: 1.5 seconds
    const now = Date.now();
    if (now - this.lastMessageTime < 1500) {
      return { success: false, error: 'Slow down a bit. Take in the song...' };
    }

    // Profanity / Abuse check
    const lower = trimmed.toLowerCase();
    for (const forbidden of FORBIDDEN_WORDS) {
      if (lower.includes(forbidden)) {
        return { success: false, error: 'Please protect the vibe. Keep it respectful.' };
      }
    }

    this.lastMessageTime = now;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgId = `msg_${now}_${Math.random().toString(36).substring(2, 6)}`;

    const newMsg: ChatMessage = {
      id: msgId,
      sessionId: this.session.sessionId,
      displayName: this.session.displayName,
      message: trimmed,
      country: this.session.country,
      city: this.session.city,
      countryCode: this.session.countryCode,
      timestamp: timeStr,
    };

    // Optimistic local preview
    this.messages = [...this.messages, newMsg].slice(-80);
    this.notify();

    // Persist to Firebase Firestore
    sendFirestoreMessage(newMsg).catch((err) => {
      console.warn('Firestore send message error:', err);
    });

    return { success: true };
  }

  public reportMessage(messageId: string): boolean {
    const msg = this.messages.find((m) => m.id === messageId);
    if (msg) {
      msg.reported = true;
      msg.message = '[message hidden after user report]';
      this.notify();
      reportFirestoreMessage(messageId).catch(() => {});
      return true;
    }
    return false;
  }

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public destroy() {
    if (this.unsubFirestore) this.unsubFirestore();
    if (this.unsubPresence) this.unsubPresence();
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.listeners = [];
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }
}
