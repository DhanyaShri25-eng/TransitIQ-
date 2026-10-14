/**
 * TransitIQ — Firebase Cloud Messaging (FCM) Client Service
 *
 * Handles:
 * - Browser Notification Permission requests
 * - FCM Web Push Token Generation (via VAPID key)
 * - Parent Device Registration in Firestore ('parent_devices' collection)
 * - Foreground push notification listener with in-app banner/toast callbacks
 * - Token management and unregistering
 */

import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { firebaseChat } from './firebaseService';

const PARENT_DEVICE_LOCAL_KEY = 'transitiq_parent_fcm_device_v1';

class FcmNotificationService {
  constructor() {
    this.messaging = null;
    this.swRegistration = null;
    this.currentToken = null;
    this.messageListeners = new Set();
    this.isSupported = false;
    this.vapidKey = ''; // Optional public Web Push VAPID key
    this.activeRegistration = this.loadLocalRegistration();

    this.checkSupport();
  }

  loadLocalRegistration() {
    try {
      const saved = localStorage.getItem(PARENT_DEVICE_LOCAL_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read local parent FCM registration:', e);
    }
    return null;
  }

  saveLocalRegistration(reg) {
    this.activeRegistration = reg;
    try {
      if (reg) {
        localStorage.setItem(PARENT_DEVICE_LOCAL_KEY, JSON.stringify(reg));
      } else {
        localStorage.removeItem(PARENT_DEVICE_LOCAL_KEY);
      }
    } catch (e) {
      console.error('Failed to save parent registration locally:', e);
    }
  }

  async checkSupport() {
    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window) {
        const supported = await isSupported();
        this.isSupported = supported;
        return supported;
      }
    } catch (e) {
      console.warn('FCM isSupported check failed:', e);
    }
    this.isSupported = false;
    return false;
  }

  getPermissionState() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission; // 'default' | 'granted' | 'denied'
  }

  /**
   * Register the background service worker
   */
  async registerServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      throw new Error('Service Workers are not supported in this environment.');
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Firebase Messaging Service Worker registered:', this.swRegistration.scope);
      return this.swRegistration;
    } catch (err) {
      console.error('Service worker registration failed:', err);
      throw err;
    }
  }

  /**
   * Initialize FCM messaging with initialized Firebase app
   */
  initMessaging(firebaseApp, vapidKey = '') {
    if (!firebaseApp) return null;
    try {
      this.messaging = getMessaging(firebaseApp);
      if (vapidKey) this.vapidKey = vapidKey;

      // Listen for foreground push messages
      onMessage(this.messaging, (payload) => {
        console.log('Incoming FCM push notification (foreground):', payload);
        this.notifyListeners(payload);

        // Also trigger native desktop notification if user is browsing another tab
        if (Notification.permission === 'granted' && document.hidden) {
          const title = payload.notification?.title || payload.data?.title || 'TransitIQ Alert';
          const options = {
            body: payload.notification?.body || payload.data?.body || '',
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            data: payload.data
          };
          new Notification(title, options);
        }
      });

      return this.messaging;
    } catch (e) {
      console.warn('Failed to init FCM messaging:', e);
      return null;
    }
  }

  onForegroundMessage(callback) {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  notifyListeners(payload) {
    this.messageListeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error('Error in FCM message listener:', e);
      }
    });
  }

  /**
   * Request parent device notification permission and register FCM token
   * @param {Object} student - student object ({ student_id, full_name, parent_name, parent_mobile })
   * @param {String} optionalVapidKey - Web Push certificate VAPID key
   */
  async registerParentDevice(student, optionalVapidKey = '') {
    if (!student || !student.student_id) {
      throw new Error('Valid student profile is required for parent device registration.');
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      throw new Error('Push notifications are not supported in this browser.');
    }

    // 1. Request Browser Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error(`Notification permission was ${permission}. Please allow notifications in your browser settings.`);
    }

    // 2. Ensure Service Worker is registered
    if (!this.swRegistration) {
      await this.registerServiceWorker();
    }

    // 3. Ensure Firebase App is initialized
    let app = firebaseChat.firebaseApp;
    if (!app) {
      // Initialize with current config from db
      const dbSettings = JSON.parse(localStorage.getItem('transitiq_db_v4_hardware') || '{}')?.settings;
      if (dbSettings?.firebase_config?.projectId) {
        firebaseChat.initFirebase(dbSettings.firebase_config);
        app = firebaseChat.firebaseApp;
      }
    }

    if (!app) {
      throw new Error('Please configure and test Firebase Project in Settings before registering parent devices.');
    }

    if (!this.messaging) {
      this.initMessaging(app, optionalVapidKey);
    }

    const effectiveVapidKey = optionalVapidKey || this.vapidKey || undefined;

    // 4. Retrieve FCM Token
    let token = null;
    try {
      token = await getToken(this.messaging, {
        serviceWorkerRegistration: this.swRegistration,
        vapidKey: effectiveVapidKey
      });
    } catch (tokenErr) {
      console.warn('getToken error, attempting without VAPID key or checking config:', tokenErr);
      throw new Error(`Failed to generate FCM token: ${tokenErr.message}. Ensure your VAPID key is configured in Settings.`);
    }

    if (!token) {
      throw new Error('No FCM registration token returned from Firebase.');
    }

    this.currentToken = token;

    // 5. Build Registration Object
    const deviceName = navigator.userAgentData?.platform || navigator.platform || 'Browser Device';
    const registrationData = {
      fcm_token: token,
      student_id: student.student_id,
      student_name: student.full_name,
      parent_name: student.parent_name || 'Parent',
      parent_mobile: student.parent_mobile || '',
      device_name: `${deviceName} (${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'})`,
      user_agent: navigator.userAgent,
      registered_at: new Date().toISOString()
    };

    // 6. Save in Firestore if connected
    if (firebaseChat.isFirebaseConnected && firebaseChat.firestore) {
      try {
        const parentDevicesCol = collection(firebaseChat.firestore, 'parent_devices');
        
        // Remove any existing duplicate token for this student to keep database clean
        const existingQ = query(
          parentDevicesCol,
          where('student_id', '==', student.student_id),
          where('fcm_token', '==', token)
        );
        const existingDocs = await getDocs(existingQ);
        for (const docSnap of existingDocs.docs) {
          await deleteDoc(doc(firebaseChat.firestore, 'parent_devices', docSnap.id));
        }

        // Add fresh document
        await addDoc(parentDevicesCol, {
          ...registrationData,
          firestore_timestamp: serverTimestamp()
        });
        console.log(`Parent device successfully registered in Firestore for ${student.full_name}`);
      } catch (cloudErr) {
        console.warn('Could not sync parent device to Firestore (persisting locally):', cloudErr);
      }
    }

    // 7. Save locally for instant UI recognition
    this.saveLocalRegistration(registrationData);

    return {
      success: true,
      token,
      registration: registrationData
    };
  }

  /**
   * Fetch all registered parent devices from Firestore or local storage
   */
  async getRegisteredParentDevices(studentId = null) {
    const results = [];

    // Check local registration first
    if (this.activeRegistration) {
      if (!studentId || this.activeRegistration.student_id === studentId) {
        results.push({ ...this.activeRegistration, source: 'local_active' });
      }
    }

    // Query Firestore if connected
    if (firebaseChat.isFirebaseConnected && firebaseChat.firestore) {
      try {
        const col = collection(firebaseChat.firestore, 'parent_devices');
        const q = studentId ? query(col, where('student_id', '==', studentId)) : col;
        const snap = await getDocs(q);
        snap.forEach((d) => {
          const docData = d.data();
          if (!results.some((r) => r.fcm_token === docData.fcm_token)) {
            results.push({ id: d.id, ...docData, source: 'firestore' });
          }
        });
      } catch (err) {
        console.warn('Failed to load parent devices from Firestore:', err);
      }
    }

    return results;
  }

  /**
   * Remove a parent device registration
   */
  async unregisterDevice(token) {
    if (this.activeRegistration?.fcm_token === token) {
      this.saveLocalRegistration(null);
    }

    if (firebaseChat.isFirebaseConnected && firebaseChat.firestore) {
      try {
        const col = collection(firebaseChat.firestore, 'parent_devices');
        const q = query(col, where('fcm_token', '==', token));
        const snap = await getDocs(q);
        for (const docSnap of snap.docs) {
          await deleteDoc(doc(firebaseChat.firestore, 'parent_devices', docSnap.id));
        }
      } catch (e) {
        console.error('Error removing token from Firestore:', e);
      }
    }
  }
}

export const fcmService = new FcmNotificationService();
