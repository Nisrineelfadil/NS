// Firebase Configuration
// Cloud Messaging for Push Notifications

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBhC-YEfmhOtUISwMoD2cQ4XxNyY0iAjSo",
  authDomain: "nisrine-school.firebaseapp.com",
  projectId: "nisrine-school",
  storageBucket: "nisrine-school.firebasestorage.app",
  messagingSenderId: "375893237540",
  appId: "1:375893237540:web:5568e51e5c0f37c26d9db1",
  measurementId: "G-QJRG5CMVYL"
};

// VAPID Key for Web Push
const VAPID_KEY = "BNb89dMaEcPAF_IxTlhRlVCzlPoGZJqSBDBY6mTxhPgd-7fW2QBwF8HdoChMoxd1bAjt361eiN0qu_YVeYOp9ss";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (error) {
  console.warn('Firebase Messaging not supported:', error);
}

export { app, messaging, VAPID_KEY, getToken, onMessage };
