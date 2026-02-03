// Background Sync Utility for PWA Notifications
// Enables notifications when app is in background or closed

// Register background sync for notifications
export async function registerBackgroundSync() {
  try {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      
      // Register one-time sync
      await registration.sync.register('sync-notifications');
      console.log('✅ Background sync registered');
      
      // Try to register periodic sync (Chrome only, every 15 minutes minimum)
      if ('periodicSync' in registration) {
        try {
          await registration.periodicSync.register('check-notifications', {
            minInterval: 15 * 60 * 1000, // 15 minutes (minimum allowed)
          });
          console.log('✅ Periodic sync registered (every 15 minutes)');
        } catch (error) {
          console.warn('⚠️ Periodic sync not supported or permission denied:', error);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error registering background sync:', error);
  }
}

// Unregister background sync (logout)
export async function unregisterBackgroundSync() {
  try {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      
      // Unregister periodic sync
      if ('periodicSync' in registration) {
        const tags = await registration.periodicSync.getTags();
        for (const tag of tags) {
          if (tag === 'check-notifications') {
            await registration.periodicSync.unregister(tag);
            console.log('✅ Periodic sync unregistered');
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error unregistering background sync:', error);
  }
}

// Trigger immediate background sync (for testing)
export async function triggerBackgroundSync() {
  try {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-notifications');
      console.log('✅ Manual background sync triggered');
    }
  } catch (error) {
    console.error('❌ Error triggering background sync:', error);
  }
}
