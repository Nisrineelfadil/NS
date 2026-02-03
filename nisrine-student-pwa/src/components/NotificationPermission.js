import React, { useState, useEffect } from 'react';

const NotificationPermission = () => {
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = () => {
    if ('Notification' in window) {
      const status = Notification.permission;
      setPermissionStatus(status);
      setShowBanner(status === 'default');
    }
  };

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        setShowBanner(false);
        
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification('🔔 Notifications Enabled!', {
            body: 'You will now receive notifications for new messages, grades, and more.',
            icon: '/pwa/icon-192.png',
            badge: '/pwa/icon-192.png',
            tag: 'permission-granted',
            vibrate: [200, 100, 200],
          });
        }
      } else if (permission === 'denied') {
        setShowBanner(false);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('notificationBannerDismissed', 'true');
  };

  if (!('Notification' in window) || !showBanner) {
    return null;
  }

  if (localStorage.getItem('notificationBannerDismissed') === 'true') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '16px',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <strong style={{ fontSize: '16px', display: 'block', marginBottom: '4px' }}>
            🔔 Enable Notifications
          </strong>
          <span style={{ fontSize: '14px', opacity: 0.9 }}>
            Get notified about new messages, grades, and attendance codes
          </span>
        </div>
        <button 
          onClick={dismissBanner}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '0',
            opacity: 0.7,
          }}
        >
          ×
        </button>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={requestPermission}
          style={{
            flex: 1,
            background: 'white',
            color: '#667eea',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '10px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Enable Notifications
        </button>
        <button
          onClick={dismissBanner}
          style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Later
        </button>
      </div>
    </div>
  );
};

export default NotificationPermission;
