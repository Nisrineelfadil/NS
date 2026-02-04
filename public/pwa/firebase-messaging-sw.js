// Firebase Cloud Messaging Service Worker
// Handles background notifications when app is closed

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

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('📬 Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/pwa/icon-192.png',
    badge: '/pwa/icon-192.png',
    tag: 'fcm-notification-' + Date.now(),
    data: payload.data || {},
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification);
  
  event.notification.close();

  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes('/pwa/') && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if app not open
      if (clients.openWindow) {
        return clients.openWindow('/pwa/messages');
      }
    })
  );
});
