// App version - increment this when you need to force cache clear
export const APP_VERSION = '1.1.0';

// Check if app version has changed and clear cache if needed
export const checkVersion = () => {
  const storedVersion = localStorage.getItem('appVersion');
  
  if (storedVersion !== APP_VERSION) {
    console.log(`🔄 App version changed from ${storedVersion || 'unknown'} to ${APP_VERSION}`);
    console.log('🧹 Clearing cache...');
    
    // Clear all localStorage except theme and language preferences
    const theme = localStorage.getItem('appTheme');
    const language = localStorage.getItem('appLanguage');
    
    localStorage.clear();
    
    // Restore preferences
    if (theme) localStorage.setItem('appTheme', theme);
    if (language) localStorage.setItem('appLanguage', language);
    
    // Store new version
    localStorage.setItem('appVersion', APP_VERSION);
    
    console.log('✅ Cache cleared successfully');
    return true;
  }
  
  return false;
};
