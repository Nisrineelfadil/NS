// Persistent Authentication Service
// Works like Facebook/Instagram - stays logged in even after cache clear
// Uses multiple storage mechanisms for iOS compatibility

import { openDB } from 'idb';

const DB_NAME = 'nisrine-auth-db';
const STORE_NAME = 'auth-store';
const DB_VERSION = 1;
const COOKIE_NAME = 'nisrine_auth';
const COOKIE_DAYS = 30;

// Helper: Set a cookie (works on iOS Safari)
function setCookie(name, value, days) {
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  } catch (e) {
    console.error('Cookie set error:', e);
  }
}

// Helper: Get a cookie
function getCookie(name) {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return decodeURIComponent(parts.pop().split(';').shift());
    }
  } catch (e) {
    console.error('Cookie get error:', e);
  }
  return null;
}

// Helper: Delete a cookie
function deleteCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

// Initialize IndexedDB for persistent storage
async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

// Store auth data in IndexedDB, localStorage, AND cookies (triple backup for iOS)
export async function saveAuthData(token, studentData) {
  try {
    const authData = {
      token,
      studentData,
      loginTime: Date.now(),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
    };

    // 1. Save to IndexedDB (survives cache clear on most browsers)
    try {
      const db = await initDB();
      await db.put(STORE_NAME, authData, 'auth');
    } catch (e) {
      console.warn('IndexedDB save failed:', e);
    }
    
    // 2. Save to localStorage (faster access)
    localStorage.setItem('studentToken', token);
    localStorage.setItem('studentData', JSON.stringify(studentData));
    localStorage.setItem('authExpiry', authData.expiresAt.toString());
    
    // 3. Save to cookie (most reliable on iOS Safari)
    const cookieData = JSON.stringify({
      token,
      studentId: studentData?._id || studentData?.id,
      studentName: studentData?.fullName,
      expiresAt: authData.expiresAt
    });
    setCookie(COOKIE_NAME, cookieData, COOKIE_DAYS);
    
    console.log('✅ Auth data saved persistently (IndexedDB + localStorage + cookie)');
    return true;
  } catch (error) {
    console.error('❌ Error saving auth data:', error);
    // Fallback to localStorage and cookie
    localStorage.setItem('studentToken', token);
    localStorage.setItem('studentData', JSON.stringify(studentData));
    setCookie(COOKIE_NAME, JSON.stringify({ token }), COOKIE_DAYS);
    return true;
  }
}

// Retrieve auth data (checks IndexedDB, localStorage, AND cookies)
export async function getAuthData() {
  try {
    // Try IndexedDB first
    try {
      const db = await initDB();
      const authData = await db.get(STORE_NAME, 'auth');
      
      if (authData && authData.expiresAt > Date.now()) {
        // Sync to other storage for faster access
        localStorage.setItem('studentToken', authData.token);
        localStorage.setItem('studentData', JSON.stringify(authData.studentData));
        console.log('✅ Auth loaded from IndexedDB');
        return authData;
      }
    } catch (e) {
      console.warn('IndexedDB read failed:', e);
    }
    
    // Try localStorage
    const token = localStorage.getItem('studentToken');
    const studentData = localStorage.getItem('studentData');
    const expiryStr = localStorage.getItem('authExpiry');
    
    if (token && studentData) {
      const expiry = expiryStr ? parseInt(expiryStr) : Date.now() + (30 * 24 * 60 * 60 * 1000);
      
      if (expiry > Date.now()) {
        console.log('✅ Auth loaded from localStorage');
        return {
          token,
          studentData: JSON.parse(studentData),
          expiresAt: expiry,
        };
      }
    }
    
    // Try cookie (most reliable on iOS)
    const cookieData = getCookie(COOKIE_NAME);
    if (cookieData) {
      try {
        const parsed = JSON.parse(cookieData);
        if (parsed.token && parsed.expiresAt > Date.now()) {
          console.log('✅ Auth loaded from cookie');
          // Restore to other storage
          localStorage.setItem('studentToken', parsed.token);
          return {
            token: parsed.token,
            studentData: { _id: parsed.studentId, fullName: parsed.studentName },
            expiresAt: parsed.expiresAt,
          };
        }
      } catch (e) {
        console.warn('Cookie parse error:', e);
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting auth data:', error);
    
    // Last resort - check cookie
    const cookieData = getCookie(COOKIE_NAME);
    if (cookieData) {
      try {
        const parsed = JSON.parse(cookieData);
        if (parsed.token) {
          return {
            token: parsed.token,
            studentData: { _id: parsed.studentId, fullName: parsed.studentName },
            expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000),
          };
        }
      } catch (e) {
        console.warn('Cookie fallback error:', e);
      }
    }
    
    return null;
  }
}

// Check if user is logged in
export async function isLoggedIn() {
  const authData = await getAuthData();
  return !!authData && authData.expiresAt > Date.now();
}

// Get current token
export async function getToken() {
  const authData = await getAuthData();
  return authData?.token || null;
}

// Get current student data
export async function getStudentData() {
  const authData = await getAuthData();
  return authData?.studentData || null;
}

// Clear auth data (logout)
export async function clearAuthData() {
  try {
    // Clear IndexedDB
    try {
      const db = await initDB();
      await db.delete(STORE_NAME, 'auth');
    } catch (e) {
      console.warn('IndexedDB clear failed:', e);
    }
    
    // Clear localStorage
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentData');
    localStorage.removeItem('authExpiry');
    localStorage.removeItem('loginTimestamp');
    
    // Clear cookie
    deleteCookie(COOKIE_NAME);
    
    console.log('✅ Auth data cleared (all storage)');
    return true;
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
    // Force clear everything
    localStorage.clear();
    deleteCookie(COOKIE_NAME);
    return true;
  }
}

// Extend session (called on user activity)
export async function extendSession() {
  try {
    const authData = await getAuthData();
    
    if (authData) {
      const newExpiry = Date.now() + (30 * 24 * 60 * 60 * 1000);
      authData.expiresAt = newExpiry;
      
      // Update all storage
      const db = await initDB();
      await db.put(STORE_NAME, authData, 'auth');
      localStorage.setItem('authExpiry', newExpiry.toString());
      
      const cookieData = JSON.stringify({
        token: authData.token,
        studentId: authData.studentData?._id || authData.studentData?.id,
        studentName: authData.studentData?.fullName,
        expiresAt: newExpiry
      });
      setCookie(COOKIE_NAME, cookieData, COOKIE_DAYS);
      
      console.log('✅ Session extended');
      return true;
    }
  } catch (error) {
    console.error('❌ Error extending session:', error);
  }
  return false;
}
