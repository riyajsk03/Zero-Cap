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

// Initial realistic nostalgic global messages
const INITIAL_GLOBAL_MESSAGES: Omit<ChatMessage, 'id' | 'timestamp'>[] = [
  {
    sessionId: 'sess_init_1',
    displayName: 'milo_404',
    message: 'this song at 1:14am hits different',
    country: 'India',
    city: 'Bengaluru',
  },
  {
    sessionId: 'sess_init_2',
    displayName: 'chai.exe',
    message: 'anyone still awake? 🌙',
    country: 'India',
    city: 'Mumbai',
  },
  {
    sessionId: 'sess_init_3',
    displayName: 'ghostdriver',
    message: 'same song. different night.',
    country: 'Japan',
    city: 'Tokyo',
  },
  {
    sessionId: 'sess_init_4',
    displayName: 'afterhours',
    message: 'headphones on. world off.',
    country: 'UK',
    city: 'London',
  },
  {
    sessionId: 'sess_init_5',
    displayName: 'moonbyte',
    message: 'the wind moving the leaves is so peaceful rn',
    country: 'USA',
    city: 'New York',
  },
  {
    sessionId: 'sess_init_6',
    displayName: 'seoul_drift',
    message: '3am and nobody to talk to, but this feels like company',
    country: 'South Korea',
    city: 'Seoul',
  },
  {
    sessionId: 'sess_init_7',
    displayName: 'velvet.wav',
    message: 'the cat sleeping right there is literally my mood',
    country: 'Canada',
    city: 'Toronto',
  },
  {
    sessionId: 'sess_init_8',
    displayName: 'subtle_rain',
    message: 'just stay a while. no rush.',
    country: 'France',
    city: 'Paris',
  },
];

const AMBIENT_EVENTS = [
  'someone from Tokyo joined the frequency',
  'someone from Bengaluru sat beneath the tree',
  '+1 listener put headphones on',
  'rain started in London',
  'someone changed their alias to static.wav',
  'someone let the track play on repeat',
  'the night is getting quieter',
  'someone from Seoul looked at the stars',
  'someone clicked the sleeping cat',
  'a leaf just fell onto the grass'
];

const SIMULATED_CHATTER = [
  { name: 'nightfall.404', city: 'Tokyo', country: 'Japan', msg: 'this playlist is pure medicine' },
  { name: 'chai.wav', city: 'Bengaluru', country: 'India', msg: 'listening while coding in the dark' },
  { name: 'lofi_fox', city: 'Berlin', country: 'Germany', msg: 'you had to be here tonight' },
  { name: 'haze.mp3', city: 'London', country: 'UK', msg: 'one more song before sleep...' },
  { name: 'rainbyte', city: 'Seattle', country: 'USA', msg: 'windows open, cold breeze outside' },
  { name: 'star_drift', city: 'Sydney', country: 'Australia', msg: 'sending calm vibes from the other side of the planet' },
  { name: 'solitude.exe', city: 'Mumbai', country: 'India', msg: 'the world can wait until morning' },
  { name: 'koffee.raw', city: 'Singapore', country: 'Singapore', msg: 'how is everyone doing tonight?' },
];

const FORBIDDEN_WORDS = ['abuse', 'hate', 'spam', 'doxx', 'kill', 'threat', 'scam'];

export class RealtimeChatEngine {
  private session: UserSession;
  private messages: ChatMessage[] = [];
  private remoteMessageIds = new Set<string>();
  private presence: PresenceStats = { totalLive: 2481, cityLive: 47, countryLive: 312 };
  private listeners: (() => void)[] = [];
  private lastMessageTime = 0;
  private registeredNames = new Set<string>();
  private unsubFirestore: (() => void) | null = null;
  private unsubPresence: (() => void) | null = null;

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

    this.initInitialMessages();
    this.initFirebaseSync();
    this.startAmbientSimulation();
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

  private initInitialMessages() {
    const now = Date.now();
    this.messages = INITIAL_GLOBAL_MESSAGES.map((item, idx) => {
      const minutesAgo = (INITIAL_GLOBAL_MESSAGES.length - idx) * 3 + 1;
      const date = new Date(now - minutesAgo * 60000);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.registeredNames.add(item.displayName.toLowerCase());

      return {
        id: `msg_init_${idx}`,
        sessionId: item.sessionId,
        displayName: item.displayName,
        message: item.message,
        country: item.country,
        city: item.city,
        timestamp: timeStr,
      };
    });
    this.registeredNames.add(this.session.displayName.toLowerCase());
  }

  private async initFirebaseSync() {
    // 1. Test connection to Firestore on startup per specification
    testFirestoreConnection().catch(() => {});

    // 2. Send immediate initial presence beacon
    updateFirestorePresence({
      sessionId: this.session.sessionId,
      displayName: this.session.displayName,
      city: this.session.city,
      country: this.session.country,
    }).catch(() => {});

    // 3. Subscribe to real-time live messages from Firestore
    this.unsubFirestore = subscribeToLiveMessages((firestoreMsgs) => {
      if (firestoreMsgs.length > 0) {
        // Merge with local system/ambient messages seamlessly
        const nonRemote = this.messages.filter((m) => m.isSystem && !this.remoteMessageIds.has(m.id));
        firestoreMsgs.forEach((m) => this.remoteMessageIds.add(m.id));
        
        // Combine remote messages with recent system events
        this.messages = [...firestoreMsgs, ...nonRemote.slice(-5)].slice(-70);
        this.notify();
      }
    });

    // 4. Subscribe to presence updates
    this.unsubPresence = subscribeToPresence((newStats) => {
      this.presence = newStats;
      this.notify();
    });

    // 5. Periodic presence heartbeat every 45s
    setInterval(() => {
      updateFirestorePresence({
        sessionId: this.session.sessionId,
        displayName: this.session.displayName,
        city: this.session.city,
        country: this.session.country,
      }).catch(() => {});
    }, 45000);
  }

  private startAmbientSimulation() {
    // Subtle presence fluctuations (+/- 1 to 3 users)
    setInterval(() => {
      const delta = (Math.random() > 0.45 ? 1 : -1) * Math.floor(Math.random() * 3);
      this.presence.totalLive = Math.max(1800, this.presence.totalLive + delta);
      if (Math.random() > 0.6) {
        this.presence.cityLive = Math.max(12, this.presence.cityLive + (Math.random() > 0.5 ? 1 : -1));
      }
      this.notify();
    }, 9000);

    // Periodic ambient message or join event (every 25 - 50s if chat is calm)
    const scheduleNextEvent = () => {
      const delay = 25000 + Math.random() * 25000;
      setTimeout(() => {
        if (Math.random() > 0.4) {
          // Send ambient chat message
          const randomChat = SIMULATED_CHATTER[Math.floor(Math.random() * SIMULATED_CHATTER.length)];
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          this.messages.push({
            id: `msg_sim_${Date.now()}`,
            sessionId: `sess_sim_${Math.random()}`,
            displayName: randomChat.name,
            message: randomChat.msg,
            country: randomChat.country,
            city: randomChat.city,
            timestamp: timeStr,
          });

          // keep last 70
          if (this.messages.length > 70) {
            this.messages.shift();
          }
        } else {
          // Send system ambient event
          const randomEvent = AMBIENT_EVENTS[Math.floor(Math.random() * AMBIENT_EVENTS.length)];
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          this.messages.push({
            id: `sys_${Date.now()}`,
            sessionId: 'system',
            displayName: 'SYSTEM',
            message: randomEvent,
            country: 'WORLD',
            city: 'GLOBAL',
            timestamp: timeStr,
            isSystem: true,
          });
        }
        this.notify();
        scheduleNextEvent();
      }, delay);
    };

    scheduleNextEvent();
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

    if (this.registeredNames.has(trimmed) && trimmed !== this.session.displayName.toLowerCase()) {
      const suggestions = [
        `${trimmed}_${Math.floor(Math.random() * 89 + 10)}`,
        `${trimmed}.wav`,
        `${trimmed}404`,
      ];
      return { success: false, error: 'This alias is currently in use', suggestions };
    }

    this.registeredNames.delete(this.session.displayName.toLowerCase());
    this.registeredNames.add(trimmed);
    this.session.displayName = newName.trim();
    this.saveSession();

    // Update presence on Firestore
    updateFirestorePresence({
      sessionId: this.session.sessionId,
      displayName: this.session.displayName,
      city: this.session.city,
      country: this.session.country,
    }).catch(() => {});

    // Broadcast subtle ambient event
    const now = new Date();
    this.messages.push({
      id: `sys_name_${Date.now()}`,
      sessionId: 'system',
      displayName: 'SYSTEM',
      message: `someone changed their alias to ${this.session.displayName}`,
      country: this.session.country,
      city: this.session.city,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true,
    });

    this.notify();
    return { success: true };
  }

  public sendMessage(text: string): { success: boolean; error?: string } {
    const trimmed = text.trim();
    if (!trimmed) return { success: false, error: 'Empty message' };

    // Rate limit: 2 seconds
    const now = Date.now();
    if (now - this.lastMessageTime < 1800) {
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

    // Optimistic local update
    this.messages.push(newMsg);
    if (this.messages.length > 70) {
      this.messages.shift();
    }
    this.notify();

    // Persist to Firebase Firestore
    sendFirestoreMessage(newMsg).catch((err) => {
      console.warn('Firestore send message fallback:', err);
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
    this.listeners = [];
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }
}
