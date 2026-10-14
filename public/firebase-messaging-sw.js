/**
 * TransitIQ — Firebase Cloud Messaging Service Worker
 * Handles background push notifications when the browser or app tab is minimized or in the background.
 */

/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase in the Service Worker for transitiq-c2d78
firebase.initializeApp({
  apiKey: "AIzaSyDummyKey_WillBeReplacedWithRealIfConfigured",
  projectId: "transitiq-c2d78",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background push message:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'TransitIQ – Bus Boarding Alert';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Your child has boarded their assigned college bus.',
    icon: payload.notification?.icon || '/favicon.svg',
    badge: '/favicon.svg',
    tag: payload.data?.event_id || 'transitiq-boarding',
    data: payload.data || {},
    requireInteraction: true,
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Focus or open TransitIQ when parent clicks the push notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
