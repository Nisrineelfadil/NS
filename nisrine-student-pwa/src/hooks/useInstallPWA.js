import { useState, useEffect } from 'react';

/**
 * Custom hook to handle PWA installation
 * Returns install handler and platform detection
 */
export const useInstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState('unknown');

  useEffect(() => {
    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
      setIsInstalled(isStandalone);
      return isStandalone;
    };

    if (checkInstalled()) {
      console.log('App is already installed');
      return;
    }

    // Listen for beforeinstallprompt event
    const handler = (e) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check after 3 seconds if event fired
    const checkTimer = setTimeout(() => {
      if (!deferredPrompt && platform !== 'unknown') {
        console.log('beforeinstallprompt did not fire, but PWA may still be installable via browser menu');
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(checkTimer);
    };
  }, [deferredPrompt, platform]);

  /**
   * Handle iOS installation
   */
  const handleIOSInstall = () => {
    const message = 
      'To install this app on your iPhone/iPad:\n\n' +
      '1. Tap the Share button (⎋) at the bottom\n' +
      '2. Scroll down and tap "Add to Home Screen" (➕)\n' +
      '3. Tap "Add" to confirm\n\n' +
      'The app will appear on your home screen!';
    
    alert(message);
  };

  /**
   * Handle Android installation
   */
  const handleAndroidInstall = async () => {
    console.log('Android install clicked', { deferredPrompt: !!deferredPrompt });

    // If we have the deferred prompt, use it
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log(`User response: ${outcome}`);
        
        if (outcome === 'accepted') {
          console.log('✅ User accepted the install prompt');
          setIsInstalled(true);
        }
        
        setDeferredPrompt(null);
        setIsInstallable(false);
      } catch (error) {
        console.error('Error during installation:', error);
        showManualAndroidInstructions();
      }
    } else {
      // Fallback to manual instructions
      showManualAndroidInstructions();
    }
  };

  /**
   * Show manual Android installation instructions
   */
  const showManualAndroidInstructions = () => {
    const message = 
      'To install this app on Android:\n\n' +
      '1. Tap the menu (⋮) in the top-right corner\n' +
      '2. Tap "Add to Home screen" or "Install app"\n' +
      '3. Tap "Add" or "Install" to confirm\n\n' +
      'The app will appear on your home screen!';
    
    alert(message);
  };

  /**
   * Main install handler - detects platform and calls appropriate method
   */
  const handleInstall = async () => {
    console.log('Install triggered', { platform, isInstalled, deferredPrompt: !!deferredPrompt });

    // Already installed
    if (isInstalled) {
      alert('App is already installed! You can find it on your home screen.');
      return;
    }

    // iOS
    if (platform === 'ios') {
      handleIOSInstall();
      return;
    }

    // Android
    if (platform === 'android') {
      await handleAndroidInstall();
      return;
    }

    // Desktop or unknown
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('✅ User accepted the install prompt');
          setIsInstalled(true);
        }
        
        setDeferredPrompt(null);
        setIsInstallable(false);
      } catch (error) {
        console.error('Error during installation:', error);
        alert('Please use your browser menu to install this app.');
      }
    } else {
      alert('To install this app, please use your browser menu and select "Install" or "Add to Home screen".');
    }
  };

  return {
    handleInstall,
    isInstallable,
    isInstalled,
    platform,
    canInstall: !isInstalled && (isInstallable || platform === 'ios' || platform === 'android'),
  };
};

export default useInstallPWA;
