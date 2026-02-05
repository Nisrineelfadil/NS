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

    // Ensure all data values are strings (FCM requirement)
    const stringData = {};
    for (const [key, value] of Object.entries(data)) {
      stringData[key] = String(value);
    }
    stringData.timestamp = Date.now().toString();

    const message = {
      // Common notification payload (works across all platforms)
      notification: {
        title,
        body,
      },
      // Data payload (for custom handling)
      data: stringData,
      // Target device
      token: fcmToken,
      
      // Android-specific configuration (for Chrome on Android)
      android: {
        priority: 'high',
        notification: {
          icon: 'ic_notification',
          color: '#FF6B9D',
          sound: 'default',
          channelId: 'nisrine_notifications',
          defaultVibrateTimings: true,
          defaultSound: true,
          visibility: 'public',
          clickAction: 'OPEN_PWA'
        }
      },
      
      // iOS/APNs-specific configuration (for Safari on iOS)
      apns: {
        headers: {
          'apns-priority': '10',
          'apns-push-type': 'alert'
        },
        payload: {
          aps: {
            alert: {
              title,
              body
            },
            badge: 1,
            sound: 'default',
            'mutable-content': 1,
            'content-available': 1
          }
        }
      },
      
      // Web push configuration (for desktop browsers and Android Chrome)
      webpush: {
        headers: {
          'Urgency': 'high',
          'TTL': '86400'
        },
        notification: {
          icon: '/pwa/icon-192.png',
          badge: '/pwa/icon-192.png',
          vibrate: [200, 100, 200],
          requireInteraction: false,
          renotify: true,
          tag: 'nisrine-notification'
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
    // Handle invalid tokens
    if (error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-registration-token') {
      console.warn('⚠️ Invalid FCM token, should be removed:', fcmToken.substring(0, 20) + '...');
      return { error: 'invalid_token', token: fcmToken };
    }
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

    if (!fcmTokens || fcmTokens.length === 0) {
      console.log('⚠️ No FCM tokens provided');
      return { successCount: 0, failureCount: 0 };
    }

    // Ensure all data values are strings (FCM requirement)
    const stringData = {};
    for (const [key, value] of Object.entries(data)) {
      stringData[key] = String(value);
    }
    stringData.timestamp = Date.now().toString();

    const message = {
      // Common notification payload
      notification: {
        title,
        body,
      },
      data: stringData,
      tokens: fcmTokens,
      
      // Android-specific configuration
      android: {
        priority: 'high',
        notification: {
          icon: 'ic_notification',
          color: '#FF6B9D',
          sound: 'default',
          channelId: 'nisrine_notifications',
          defaultVibrateTimings: true,
          defaultSound: true,
          visibility: 'public',
          clickAction: 'OPEN_PWA'
        }
      },
      
      // iOS/APNs-specific configuration
      apns: {
        headers: {
          'apns-priority': '10',
          'apns-push-type': 'alert'
        },
        payload: {
          aps: {
            alert: {
              title,
              body
            },
            badge: 1,
            sound: 'default',
            'mutable-content': 1,
            'content-available': 1
          }
        }
      },
      
      // Web push configuration
      webpush: {
        headers: {
          'Urgency': 'high',
          'TTL': '86400'
        },
        notification: {
          icon: '/pwa/icon-192.png',
          badge: '/pwa/icon-192.png',
          vibrate: [200, 100, 200],
          requireInteraction: false,
          renotify: true,
          tag: 'nisrine-notification'
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
    
    // Log failed tokens for cleanup
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.warn(`⚠️ Failed to send to token ${idx}:`, resp.error?.code);
        }
      });
    }
    
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
