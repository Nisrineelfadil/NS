// Firebase Admin SDK Configuration
// For sending push notifications from backend

let admin = null;
let firebaseApp = null;
let firebaseInitialized = false;
let firebaseError = null;

// Lazy load firebase-admin to prevent server crash
function getAdmin() {
  if (!admin) {
    try {
      admin = require('firebase-admin');
    } catch (error) {
      console.warn('⚠️ firebase-admin not available:', error.message);
      return null;
    }
  }
  return admin;
}

function initializeFirebaseAdmin() {
  if (firebaseInitialized) {
    return firebaseApp;
  }

  firebaseInitialized = true;

  try {
    const adminModule = getAdmin();
    if (!adminModule) {
      console.warn('⚠️ Firebase Admin module not available, push notifications disabled');
      return null;
    }

    let serviceAccount = null;

    // Try to get service account from environment variable (Vercel)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log('📦 Using Firebase service account from environment variable');
      } catch (parseError) {
        console.warn('⚠️ Error parsing FIREBASE_SERVICE_ACCOUNT env var:', parseError.message);
        firebaseError = parseError;
        return null;
      }
    } else {
      // Fallback to local file (development)
      try {
        const path = require('path');
        const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
        serviceAccount = require(serviceAccountPath);
        console.log('📦 Using Firebase service account from local file');
      } catch (fileError) {
        console.warn('⚠️ Firebase service account file not found, push notifications disabled');
        firebaseError = fileError;
        return null;
      }
    }

    if (!serviceAccount) {
      console.warn('⚠️ No Firebase service account available, push notifications disabled');
      return null;
    }

    firebaseApp = adminModule.initializeApp({
      credential: adminModule.credential.cert(serviceAccount),
      projectId: 'nisrine-school'
    });

    console.log('✅ Firebase Admin SDK initialized');
    return firebaseApp;
  } catch (error) {
    console.warn('⚠️ Error initializing Firebase Admin SDK:', error.message);
    firebaseError = error;
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

    const adminModule = getAdmin();
    if (!adminModule) {
      return null;
    }
    const response = await adminModule.messaging().send(message);
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

    const adminModule = getAdmin();
    if (!adminModule) {
      return null;
    }
    const response = await adminModule.messaging().sendEachForMulticast(message);
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
