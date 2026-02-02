// Background Sync Utility for PWA Notifications
// Registers periodic background sync when supported

export const registerBackgroundSync = async () => {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Register one-time sync
      await registration.sync.register('sync-notifications');
      console.log('✅ Background sync registered');
      
      // Register periodic sync if supported (Chrome 80+, Edge 80+)
      if ('periodicSync' in registration) {
        try {
          await registration.periodicSync.register('check-notifications', {
            minInterval: 60 * 1000, // 60 seconds
          });
          console.log('✅ Periodic background sync registered (60 seconds)');
        } catch (error) {
          console.log('⚠️ Periodic sync not available:', error.message);
        }
      }
    } catch (error) {
      console.error('❌ Background sync registration failed:', error);
    }
  } else {
    console.log('⚠️ Background sync not supported');
  }
};

export const unregisterBackgroundSync = async () => {
  if ('serviceWorker' in navigator && 'periodicSync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const tags = await registration.periodicSync.getTags();
      
      for (const tag of tags) {
        await registration.periodicSync.unregister(tag);
      }
      
      console.log('✅ Background sync unregistered');
    } catch (error) {
      console.error('❌ Background sync unregister failed:', error);
    }
  }
};
