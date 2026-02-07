// Firebase Cloud Messaging Service Worker
// Handles background notifications when app is closed (Android & iOS PWA)

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhC-YEfmhOtUISwMoD2cQ4XxNyY0iAjSo",
  authDomain: "nisrine-school.firebaseapp.com",
  projectId: "nisrine-school",
  storageBucket: "nisrine-school.firebasestorage.app",
  messagingSenderId: "375893237540",
  appId: "1:375893237540:web:5568e51e5c0f37c26d9db1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

console.log('🔥 Firebase Messaging SW initialized');

// Handle background messages (when app is closed or in background)
messaging.onBackgroundMessage((payload) => {
  console.log('📬 [FCM-SW] Background message received:', payload);

  // Extract notification data - FCM can send in different formats
  const notificationTitle = payload.notification?.title || 
                           payload.data?.title || 
                           'Nisrine School';
  
  const notificationBody = payload.notification?.body || 
                          payload.data?.body || 
                          payload.data?.message ||
                          'You have a new notification';

  const notificationOptions = {
    body: notificationBody,
    icon: payload.notification?.icon || '/pwa/icon-192.png',
    badge: '/pwa/icon-192.png',
    tag: payload.data?.tag || 'fcm-notification-' + Date.now(),
    data: {
      ...payload.data,
      url: payload.data?.url || payload.fcmOptions?.link || '/pwa/messages'
    },
    // Important for mobile visibility
    requireInteraction: false,
    renotify: true,
    silent: false,
    vibrate: [200, 100, 200],
    // Actions for richer notifications (Android)
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  console.log('📢 [FCM-SW] Showing notification:', notificationTitle);
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 [FCM-SW] Notification clicked:', event.notification.tag);
  
  const action = event.action;
  const notification = event.notification;
  
  notification.close();

  // If user clicked dismiss, just close
  if (action === 'dismiss') {
    return;
  }

  // Get the URL to open
  const urlToOpen = notification.data?.url || '/pwa/messages';

  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes('/pwa/') && 'focus' in client) {
          // Navigate to the specific URL and focus
          client.postMessage({ type: 'NOTIFICATION_CLICK', url: urlToOpen });
          return client.focus();
        }
      }
      
      // Open new window if app not open
      if (clients.openWindow) {
        const fullUrl = self.registration.scope.replace(/\/$/, '') + urlToOpen.replace('/pwa', '');
        return clients.openWindow(fullUrl);
      }
    })
  );
});

// Handle push events directly (fallback for some browsers)
self.addEventListener('push', (event) => {
  console.log('📨 [FCM-SW] Push event received');
  
  if (!event.data) {
    console.log('⚠️ [FCM-SW] Push event has no data');
    return;
  }

  try {
    const payload = event.data.json();
    console.log('📦 [FCM-SW] Push payload:', payload);
    
    // Let onBackgroundMessage handle it if it's a FCM message
    // This is a fallback for non-FCM push messages
  } catch (e) {
    console.log('⚠️ [FCM-SW] Could not parse push data:', e);
  }
});

// Service worker activation - claim clients immediately
self.addEventListener('activate', (event) => {
  console.log('✅ [FCM-SW] Service worker activated');
  event.waitUntil(clients.claim());
});

// Log installation
self.addEventListener('install', (event) => {
  console.log('📥 [FCM-SW] Service worker installed');
  self.skipWaiting();
});
