// Persistent Authentication Service
// Works like Facebook/Instagram - stays logged in even after cache clear

import { openDB } from 'idb';

const DB_NAME = 'nisrine-auth-db';
const STORE_NAME = 'auth-store';
const DB_VERSION = 1;

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

// Store auth data in both IndexedDB and localStorage (double backup)
export async function saveAuthData(token, studentData) {
  try {
    const authData = {
      token,
      studentData,
      loginTime: Date.now(),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
    };

    // Save to IndexedDB (survives cache clear)
    const db = await initDB();
    await db.put(STORE_NAME, authData, 'auth');
    
    // Also save to localStorage (faster access)
    localStorage.setItem('studentToken', token);
    localStorage.setItem('studentData', JSON.stringify(studentData));
    localStorage.setItem('authExpiry', authData.expiresAt.toString());
    
    console.log('✅ Auth data saved persistently');
    return true;
  } catch (error) {
    console.error('❌ Error saving auth data:', error);
    // Fallback to localStorage only
    localStorage.setItem('studentToken', token);
    localStorage.setItem('studentData', JSON.stringify(studentData));
    return true;
  }
}

// Retrieve auth data (checks both IndexedDB and localStorage)
export async function getAuthData() {
  try {
    // Try IndexedDB first
    const db = await initDB();
    const authData = await db.get(STORE_NAME, 'auth');
    
    if (authData && authData.expiresAt > Date.now()) {
      // Sync to localStorage for faster access
      localStorage.setItem('studentToken', authData.token);
      localStorage.setItem('studentData', JSON.stringify(authData.studentData));
      return authData;
    }
    
    // Fallback to localStorage
    const token = localStorage.getItem('studentToken');
    const studentData = localStorage.getItem('studentData');
    const expiryStr = localStorage.getItem('authExpiry');
    
    if (token && studentData) {
      const expiry = expiryStr ? parseInt(expiryStr) : Date.now() + (30 * 24 * 60 * 60 * 1000);
      
      if (expiry > Date.now()) {
        return {
          token,
          studentData: JSON.parse(studentData),
          expiresAt: expiry,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting auth data:', error);
    
    // Last resort - check localStorage
    const token = localStorage.getItem('studentToken');
    const studentData = localStorage.getItem('studentData');
    
    if (token && studentData) {
      return {
        token,
        studentData: JSON.parse(studentData),
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000),
      };
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
    const db = await initDB();
    await db.delete(STORE_NAME, 'auth');
    
    // Clear localStorage
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentData');
    localStorage.removeItem('authExpiry');
    localStorage.removeItem('loginTimestamp');
    
    console.log('✅ Auth data cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
    // Force clear localStorage
    localStorage.clear();
    return true;
  }
}

// Extend session (called on user activity)
export async function extendSession() {
  try {
    const authData = await getAuthData();
    
    if (authData) {
      authData.expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // Extend by 30 days
      
      const db = await initDB();
      await db.put(STORE_NAME, authData, 'auth');
      
      localStorage.setItem('authExpiry', authData.expiresAt.toString());
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error extending session:', error);
    return false;
  }
}

// Auto-login on app start
export async function autoLogin() {
  const authData = await getAuthData();
  
  if (authData && authData.expiresAt > Date.now()) {
    console.log('✅ Auto-login successful');
    return {
      token: authData.token,
      student: authData.studentData,
    };
  }
  
  console.log('⚠️ No valid session found');
  return null;
}
