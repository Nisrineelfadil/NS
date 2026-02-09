// Global axios interceptor for handling deleted student accounts (410 Gone)
// Import this once in App.js to activate for ALL axios calls across the PWA

import axios from 'axios';
import { clearAuthData } from './authService';

let isRedirecting = false;

export function setupApiInterceptor() {
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error.response?.status;
      const data = error.response?.data;

      // 410 Gone = student account was deleted (season archived, not carry-over)
      if (status === 410 && data?.accountDeleted && !isRedirecting) {
        isRedirecting = true;
        console.log('⚠️ Account deleted detected — auto-logout');

        // Clear all auth data (IndexedDB + localStorage + cookies)
        await clearAuthData();

        // Store the message to show on login screen
        localStorage.setItem('accountDeletedMessage', data.message || data.error || 
          'Your account no longer exists. Your academic session has ended.');

        // Redirect to login
        window.location.href = '/pwa/login';

        // Reset flag after a delay
        setTimeout(() => { isRedirecting = false; }, 3000);
      }

      return Promise.reject(error);
    }
  );
}
