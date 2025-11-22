// ============================================
// PRELOAD SCRIPT - Security Bridge
// Exposes safe APIs to renderer process
// ============================================

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // App info
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
    
    // Desktop app flag
    isDesktopApp: true,
    platform: process.platform,
    
    // Performance hints
    performanceMode: 'desktop'
});

console.log('✅ Preload script loaded - Desktop API exposed');
