/**
 * Firebase Realtime Cloud Backend & Transport Chat Service
 * Supports live Firestore/Realtime DB synchronization with BroadcastChannel
 * fallback for multi-tab synchronization and pre-configured transport channels.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';

const CHAT_STORAGE_KEY = 'smartpassflow_firebase_chat_v1';

export const CHAT_CHANNELS = [
  { id: 'dispatch-general', name: 'Fleet Dispatch Control', icon: 'Radio', description: 'Central campus transport coordination' },
  { id: 'bus-101-shuttle', name: 'Bus 101 Shuttle (Ramesh)', icon: 'Bus', description: 'North Campus Route 1 channel' },
  { id: 'bus-102-express', name: 'Bus 102 Express (Gurpreet)', icon: 'Bus', description: 'Metro Line Route 2 channel' },
  { id: 'security-incidents', name: 'Security & RFID Alerts', icon: 'ShieldAlert', description: 'Unauthorized tap escalations' },
  { id: 'maintenance-iot', name: 'Hardware & IoT Maintenance', icon: 'Cpu', description: 'ESP32 devices & connectivity status' }
];

const INITIAL_MESSAGES = [
  {
    id: 'msg-1',
    channelId: 'dispatch-general',
    sender: 'Vikram Mehta (Chief Transport Officer)',
    role: 'Super Admin',
    text: 'Morning fleet status: Bus 101 and 102 are en route. Morning campus rush expected at Hebbal & Metro Station.',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    id: 'msg-2',
    channelId: 'dispatch-general',
    sender: 'Ramesh Kumar (Driver 101)',
    role: 'Driver',
    text: 'Boarding started at Hebbal. All 3 RFID taps verified green on the ESP32 reader so far.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: 'msg-3',
    channelId: 'security-incidents',
    sender: 'Automated IoT Gateway',
    role: 'System',
    text: 'ALERT: Unauthorized Card UID "UNKNOWN-7A12" rejected at Bus 101 front gate reader.',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString()
  },
  {
    id: 'msg-4',
    channelId: 'bus-101-shuttle',
    sender: 'Ramesh Kumar (Driver 101)',
    role: 'Driver',
    text: 'Student Vikram Singh attempted to board Bus 101, but the reader beeped red for WRONG BUS (assigned to Bus 102). Advised him to wait for Bus 102.',
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString()
  },
  {
    id: 'msg-5',
    channelId: 'bus-101-shuttle',
    sender: 'Transport Dispatch',
    role: 'Transport Administrator',
    text: 'Confirmed. Alert ALT-3001 logged on dashboard. Keep proceeding towards Mekhri Circle stop.',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  }
];

class FirebaseTransportService {
  constructor() {
    this.firebaseApp = null;
    this.firestore = null;
    this.isFirebaseConnected = false;
    this.listeners = new Set();
    this.messages = this.loadStoredMessages();

    // BroadcastChannel for instant multi-window/multi-tab sync
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      this.channel = new BroadcastChannel('smartpassflow_firebase_sync');
      this.channel.onmessage = (event) => {
        if (event.data?.type === 'NEW_CHAT_MESSAGE') {
          this.messages.push(event.data.message);
          this.notify();
        }
      };
    }
  }

  loadStoredMessages() {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Chat storage read error:', e);
    }
    return [...INITIAL_MESSAGES];
  }

  saveMessages() {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(this.messages));
    } catch (e) {
      console.error('Chat storage save error:', e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((l) => l(this.messages));
  }

  initFirebase(config) {
    if (!config || !config.apiKey || !config.projectId) {
      this.isFirebaseConnected = false;
      return { connected: false, message: 'Firebase configuration empty. Operating in high-speed local mode.' };
    }

    try {
      if (getApps().length === 0) {
        this.firebaseApp = initializeApp(config);
      } else {
        this.firebaseApp = getApps()[0];
      }
      this.firestore = getFirestore(this.firebaseApp);
      this.isFirebaseConnected = true;

      // Subscribe to live Firestore chat collection
      const q = query(collection(this.firestore, 'transport_chat'), orderBy('timestamp', 'asc'));
      onSnapshot(q, (snapshot) => {
        const cloudMsgs = [];
        snapshot.forEach((doc) => {
          cloudMsgs.push({ id: doc.id, ...doc.data() });
        });
        if (cloudMsgs.length > 0) {
          this.messages = cloudMsgs;
          this.saveMessages();
        }
      });

      return { connected: true, message: `Successfully connected to Firebase Project: ${config.projectId}` };
    } catch (err) {
      console.error('Firebase init error:', err);
      this.isFirebaseConnected = false;
      return { connected: false, message: err.message };
    }
  }

  async sendMessage({ channelId, sender, role, text }) {
    if (!text || !text.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      channelId,
      sender: sender || 'Admin Dispatch',
      role: role || 'Transport Administrator',
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    this.messages.push(newMsg);
    this.saveMessages();

    if (this.channel) {
      this.channel.postMessage({ type: 'NEW_CHAT_MESSAGE', message: newMsg });
    }

    // If live Firestore configured, also push to cloud collection
    if (this.isFirebaseConnected && this.firestore) {
      try {
        await addDoc(collection(this.firestore, 'transport_chat'), {
          channelId: newMsg.channelId,
          sender: newMsg.sender,
          role: newMsg.role,
          text: newMsg.text,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        console.warn('Error pushing chat to Firestore:', err);
      }
    }

    return newMsg;
  }

  getChannelMessages(channelId) {
    return this.messages.filter((m) => m.channelId === channelId);
  }
}

export const firebaseChat = new FirebaseTransportService();
