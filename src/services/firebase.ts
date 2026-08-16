import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ChatMessage, LocationData, PresenceStats } from '../types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Must pass firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Note: ', JSON.stringify(errInfo));
  return errInfo;
}

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'messages', 'ping'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, check configuration.');
    }
    return false;
  }
}

// Subscribe to Live Worldwide Messages from Firestore
export function subscribeToLiveMessages(
  onMessagesUpdate: (messages: ChatMessage[]) => void,
  onError?: (err: unknown) => void
) {
  const path = 'messages';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(150));

  return onSnapshot(
    q,
    (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let timeStr = '';
        if (data.createdAt) {
          const jsDate = (data.createdAt as Timestamp).toDate
            ? (data.createdAt as Timestamp).toDate()
            : new Date(data.createdAt);
          timeStr = jsDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } else {
          timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }

        msgs.push({
          id: docSnap.id,
          sessionId: data.sessionId || '',
          displayName: data.displayName || 'listener.wav',
          message: data.reported ? '[message hidden after user report]' : data.message || '',
          country: data.country || 'Global',
          city: data.city || 'Night Sky',
          countryCode: data.countryCode,
          timestamp: timeStr,
          reported: !!data.reported,
          isSystem: !!data.isSystem,
        });
      });

      // Sort chronological (oldest to newest for chat view)
      msgs.reverse();
      onMessagesUpdate(msgs);
    },
    (error) => {
      console.warn('Firestore messages subscription note:', error);
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // logged via handleFirestoreError
      }
    }
  );
}

// Post a new Chat Message to Firestore
export async function sendFirestoreMessage(msg: {
  id: string;
  sessionId: string;
  displayName: string;
  message: string;
  country: string;
  city: string;
  countryCode?: string;
  isSystem?: boolean;
}): Promise<boolean> {
  const path = `messages/${msg.id}`;
  try {
    const docRef = doc(db, 'messages', msg.id);
    await setDoc(docRef, {
      sessionId: msg.sessionId.slice(0, 100),
      displayName: msg.displayName.slice(0, 30),
      message: msg.message.slice(0, 200),
      country: (msg.country || 'Global').slice(0, 100),
      city: (msg.city || 'Sanctuary').slice(0, 100),
      countryCode: (msg.countryCode || '').slice(0, 10),
      isSystem: !!msg.isSystem,
      reported: false,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Failed to send message to Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.CREATE, path);
    } catch {
      // logged
    }
    return false;
  }
}

// Report message in Firestore
export async function reportFirestoreMessage(messageId: string): Promise<boolean> {
  const path = `messages/${messageId}`;
  try {
    const docRef = doc(db, 'messages', messageId);
    await updateDoc(docRef, {
      reported: true,
    });
    return true;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } catch {
      // logged
    }
    return false;
  }
}

// Send presence heartbeat to Firestore
export async function updateFirestorePresence(session: {
  sessionId: string;
  displayName: string;
  city: string;
  country: string;
}): Promise<void> {
  const path = `presence/${session.sessionId}`;
  try {
    const docRef = doc(db, 'presence', session.sessionId);
    await setDoc(
      docRef,
      {
        sessionId: session.sessionId.slice(0, 100),
        displayName: session.displayName.slice(0, 30),
        city: (session.city || 'Sanctuary').slice(0, 100),
        country: (session.country || 'Global').slice(0, 100),
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    // Non-blocking background heartbeat
    console.debug('Presence heartbeat info:', error);
  }
}

// Subscribe to Active Presence Beacons with real-time active heartbeat filtering
export function subscribeToPresence(
  userCity: string,
  userCountry: string,
  onPresenceUpdate: (stats: PresenceStats) => void
) {
  const path = 'presence';
  let cachedDocs: Array<{ id: string; data: Record<string, any> }> = [];

  const recalculateActiveUsers = () => {
    const now = Date.now();
    // Heartbeats are sent every 25s; any session seen in last 75s is considered active
    const activeDocs = cachedDocs.filter((item) => {
      const d = item.data;
      if (!d) return false;
      let lastSeenMs = 0;
      if (d.lastSeen && typeof d.lastSeen.toDate === 'function') {
        lastSeenMs = d.lastSeen.toDate().getTime();
      } else if (d.lastSeen) {
        lastSeenMs = new Date(d.lastSeen).getTime();
      }
      return lastSeenMs > 0 && (now - lastSeenMs) <= 75000;
    });

    const totalCount = Math.max(1, activeDocs.length);
    const cityMatches = activeDocs.filter(
      (d) => d.data.city && userCity && d.data.city.toLowerCase() === userCity.toLowerCase()
    ).length;
    const countryMatches = activeDocs.filter(
      (d) => d.data.country && userCountry && d.data.country.toLowerCase() === userCountry.toLowerCase()
    ).length;

    onPresenceUpdate({
      totalLive: totalCount,
      cityLive: Math.max(1, cityMatches),
      countryLive: Math.max(1, countryMatches),
    });
  };

  // Periodic recalculation to cleanly decay inactive tabs/sessions every 8s
  const intervalTimer = setInterval(recalculateActiveUsers, 8000);

  const unsub = onSnapshot(
    collection(db, path),
    (snapshot) => {
      cachedDocs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        data: docSnap.data(),
      }));
      recalculateActiveUsers();
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // logged
      }
    }
  );

  return () => {
    clearInterval(intervalTimer);
    unsub();
  };
}

// Optional Google Auth Sign In / Out Helpers
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign In failed:', error);
    return null;
  }
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}
