import React, { useState, useEffect } from 'react';
import './InstallPrompt.css';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Detect iOS devices
  const isIOS = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  };

  // Detect if running in standalone mode (already installed)
  const isInStandaloneMode = () => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  };

  useEffect(() => {
    // Check if app is already installed
    if (isInStandaloneMode()) {
      console.log('App is already installed - hiding install prompt');
      setShowPrompt(false);
      setShowIOSPrompt(false);
      return;
    }

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('installPromptDismissed');
    const dismissedTime = localStorage.getItem('installPromptDismissedTime');
    
    // Show prompt again after 7 days
    if (dismissed && dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        console.log('Install prompt was dismissed recently');
        return;
      } else {
        // Reset dismissal after 7 days
        localStorage.removeItem('installPromptDismissed');
        localStorage.removeItem('installPromptDismissedTime');
      }
    }

    // Handle iOS devices
    if (isIOS()) {
      console.log('iOS device detected - showing iOS install instructions');
      setShowIOSPrompt(true);
      return;
    }

    // Handle Android/Chrome devices
    const handler = (e) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if beforeinstallprompt fired after 5 seconds
    const checkTimer = setTimeout(() => {
      if (!deferredPrompt && !showPrompt && !isIOS()) {
        console.warn('⚠️ beforeinstallprompt did not fire. Possible reasons:');
        console.warn('1. App is already installed');
        console.warn('2. Not on HTTPS (required for PWA)');
        console.warn('3. Manifest or service worker issues');
        console.warn('4. Browser does not support PWA install');
        console.warn('5. User has dismissed prompt too many times');
        
        // Don't show prompt without deferredPrompt - it won't work
        // User can still install manually via browser menu
      }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(checkTimer);
    };
  }, []);

  const handleInstall = async () => {
    console.log('Install button clicked', { deferredPrompt: !!deferredPrompt });
    
    // Provide immediate visual feedback
    setIsInstalling(true);
    
    if (!deferredPrompt) {
      console.warn('No deferredPrompt available - beforeinstallprompt may not have fired');
      
      // Show user-friendly message
      alert('To install this app:\n\n1. Open Chrome menu (⋮)\n2. Tap "Add to Home screen"\n3. Tap "Add"');
      
      setIsInstalling(false);
      setShowPrompt(false);
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User response to install prompt: ${outcome}`);
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
      } else {
        console.log('❌ User dismissed the install prompt');
      }
      
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowPrompt(false);
      setIsInstalling(false);
    } catch (error) {
      console.error('Error during installation:', error);
      
      // Fallback instructions
      alert('To install this app:\n\n1. Open Chrome menu (⋮)\n2. Tap "Add to Home screen"\n3. Tap "Add"');
      
      setIsInstalling(false);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
    localStorage.setItem('installPromptDismissedTime', Date.now().toString());
  };

  // iOS Install Instructions
  if (showIOSPrompt) {
    return (
      <div className="install-prompt ios-prompt">
        <div className="install-prompt-content">
          <div className="install-prompt-icon">📱</div>
          <div className="install-prompt-text">
            <h3>Install Nisrine School App</h3>
            <p>Add to your home screen for quick access and offline use</p>
            <div className="ios-instructions">
              <ol>
                <li>Tap the <strong>Share</strong> button <span className="ios-icon">⎋</span></li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong> <span className="ios-icon">➕</span></li>
                <li>Tap <strong>"Add"</strong> to confirm</li>
              </ol>
            </div>
          </div>
          <div className="install-prompt-actions">
            <button onClick={handleDismiss} className="dismiss-btn">
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Android/Chrome Install Prompt
  if (!showPrompt) return null;

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <div className="install-prompt-icon">📱</div>
        <div className="install-prompt-text">
          <h3>Install Nisrine School App</h3>
          <p>Add to your home screen for quick access and offline use</p>
        </div>
        <div className="install-prompt-actions">
          <button 
            onClick={handleInstall} 
            className="install-btn"
            disabled={isInstalling}
          >
            {isInstalling ? 'Installing...' : 'Install'}
          </button>
          <button 
            onClick={handleDismiss} 
            className="dismiss-btn"
            disabled={isInstalling}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
