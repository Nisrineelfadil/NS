// Firebase Admin SDK Configuration
// For sending push notifications from backend

const admin = require('firebase-admin');
const path = require('path');

let firebaseApp = null;

function initializeFirebaseAdmin() {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    let serviceAccount;

    // Try to get service account from environment variable (Vercel)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log('📦 Using Firebase service account from environment variable');
      } catch (parseError) {
        console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT env var:', parseError);
        return null;
      }
    } else {
      // Fallback to local file (development)
      const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
      serviceAccount = require(serviceAccountPath);
      console.log('📦 Using Firebase service account from local file');
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'nisrine-school'
    });

    console.log('✅ Firebase Admin SDK initialized');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error);
    return null;
  }
}

// Send push notification to a single device
async function sendPushNotification(fcmToken, title, body, data = {}) {
  try {
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.warn('⚠️ Firebase Admin not initialized');
      return null;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        timestamp: Date.now().toString(),
      },
      token: fcmToken,
      webpush: {
        notification: {
          icon: '/pwa/icon-192.png',
          badge: '/pwa/icon-192.png',
          vibrate: [200, 100, 200],
        },
        fcmOptions: {
          link: data.url || '/pwa/messages'
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Push notification sent:', response);
    return response;
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    return null;
  }
}

// Send push notification to multiple devices
async function sendPushNotificationToMultiple(fcmTokens, title, body, data = {}) {
  try {
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.warn('⚠️ Firebase Admin not initialized');
      return null;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        timestamp: Date.now().toString(),
      },
      tokens: fcmTokens,
      webpush: {
        notification: {
          icon: '/pwa/icon-192.png',
          badge: '/pwa/icon-192.png',
          vibrate: [200, 100, 200],
        },
        fcmOptions: {
          link: data.url || '/pwa/messages'
        }
      }
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`✅ Push notifications sent: ${response.successCount}/${fcmTokens.length}`);
    return response;
  } catch (error) {
    console.error('❌ Error sending push notifications:', error);
    return null;
  }
}

module.exports = {
  initializeFirebaseAdmin,
  sendPushNotification,
  sendPushNotificationToMultiple
};
