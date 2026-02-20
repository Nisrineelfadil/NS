// ============================================
// NISRINE SCHOOL ADMIN - DESKTOP APP
// Optimized Electron Application with Local Server
// ============================================

const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Global variables
let mainWindow;
let tray = null;
const isDev = process.argv.includes('--dev');

// Production server URL (your deployed Vercel app)
const PRODUCTION_SERVER = 'https://nisrineschool.com';
const DEV_SERVER = 'http://localhost:3000';

// ============================================
// SERVER CONNECTION
// ============================================

function getServerURL() {
    return isDev ? DEV_SERVER : PRODUCTION_SERVER;
}

// ============================================
// WINDOW MANAGEMENT
// ============================================

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            enableRemoteModule: false
        },
        backgroundColor: '#ffffff',
        show: false,
        autoHideMenuBar: false,
        title: 'Nisrine School Admin'
    });

    // Show loading screen
    showLoadingScreen();
    
    // Load from production server (no local server needed!)
    setTimeout(() => {
        const serverURL = getServerURL();
        const appUrl = `${serverURL}/admin`;  // No .html extension for Vercel
        console.log('📱 Loading app from:', appUrl);
        mainWindow.loadURL(appUrl);
    }, 2000);

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.maximize();
        
        // Inject desktop app enhancements
        injectDesktopEnhancements();
    });

    // Create application menu
    createAppMenu();

    // Handle window close - logout admin before closing
    mainWindow.on('close', async (e) => {
        // Prevent immediate close
        e.preventDefault();
        
        console.log('🔒 Logging out admin before closing app...');
        
        try {
            // Execute logout script in the renderer process
            await mainWindow.webContents.executeJavaScript(`
                (async () => {
                    try {
                        // Clear admin token
                        localStorage.removeItem('adminToken');
                        localStorage.removeItem('superAdminToken');
                        
                        // Clear any session data
                        sessionStorage.clear();
                        
                        console.log('✅ Admin logged out successfully');
                        return true;
                    } catch (error) {
                        console.error('❌ Logout error:', error);
                        return false;
                    }
                })();
            `);
            
            console.log('✅ Logout completed, closing app...');
        } catch (error) {
            console.error('❌ Error during logout:', error);
        }
        
        // Now actually close the window
        mainWindow.destroy();
    });
    
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Open external links in browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Create system tray
    createSystemTray();
}

function showLoadingScreen() {
    // Create temporary loading HTML file
    const loadingHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Loading...</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    overflow: hidden;
                }
                .loader-container {
                    text-align: center;
                    color: white;
                }
                .logo {
                    width: 120px;
                    height: 120px;
                    margin: 0 auto 30px;
                    background: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 48px;
                    font-weight: bold;
                    color: #667eea;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                }
                .spinner {
                    width: 60px;
                    height: 60px;
                    border: 5px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 30px;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                h1 {
                    font-size: 32px;
                    font-weight: 700;
                    margin-bottom: 10px;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.2);
                }
                p {
                    font-size: 16px;
                    opacity: 0.9;
                    animation: pulse 2s ease-in-out infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
                .version {
                    position: absolute;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 12px;
                    opacity: 0.7;
                }
            </style>
        </head>
        <body>
            <div class="loader-container">
                <div class="logo">NS</div>
                <div class="spinner"></div>
                <h1>Nisrine School Admin</h1>
                <p>Starting application...</p>
            </div>
            <div class="version">Version 1.0.1</div>
        </body>
        </html>
    `;
    
    // Write to temporary file
    const tempPath = path.join(app.getPath('temp'), 'nisrine-loading.html');
    fs.writeFileSync(tempPath, loadingHTML);
    mainWindow.loadFile(tempPath);
}

function showErrorScreen(message) {
    const errorHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Error</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .error-container {
                    text-align: center;
                    color: white;
                    max-width: 500px;
                    padding: 40px;
                }
                .error-icon {
                    font-size: 80px;
                    margin-bottom: 20px;
                }
                h1 {
                    font-size: 28px;
                    margin-bottom: 15px;
                }
                p {
                    font-size: 16px;
                    opacity: 0.9;
                    line-height: 1.6;
                    margin-bottom: 30px;
                }
                button {
                    background: white;
                    color: #f5576c;
                    border: none;
                    padding: 15px 40px;
                    font-size: 16px;
                    font-weight: 600;
                    border-radius: 30px;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                button:hover {
                    transform: scale(1.05);
                }
            </style>
        </head>
        <body>
            <div class="error-container">
                <div class="error-icon">⚠️</div>
                <h1>Application Error</h1>
                <p>${message}</p>
                <button onclick="location.reload()">Retry</button>
            </div>
        </body>
        </html>
    `;
    
    // Write to temporary file
    const tempPath = path.join(app.getPath('temp'), 'nisrine-error.html');
    fs.writeFileSync(tempPath, errorHTML);
    mainWindow.loadFile(tempPath);
    mainWindow.show();
}

function injectDesktopEnhancements() {
    mainWindow.webContents.executeJavaScript(`
        console.log('🖥️ Desktop App Mode - Enhanced Performance');
        
        // Mark as desktop app
        window.IS_DESKTOP_APP = true;
        window.DESKTOP_VERSION = '1.0.1';
        
        // Desktop-specific optimizations
        if (typeof initDesktopOptimizations === 'function') {
            initDesktopOptimizations();
        }
        
        console.log('✅ Desktop enhancements loaded');
    `);
}

// ============================================
// MENU & TRAY
// ============================================

function createAppMenu() {
    const menuTemplate = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => mainWindow.reload()
                },
                {
                    label: 'Force Reload',
                    accelerator: 'CmdOrCtrl+Shift+R',
                    click: () => mainWindow.webContents.reloadIgnoringCache()
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => app.quit()
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'close' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About',
                            message: 'Nisrine School Admin',
                            detail: 'Version 1.0.1\n\nOptimized Desktop Application\n\n© 2025 Nisrine School'
                        });
                    }
                },
                { type: 'separator' },
                {
                    label: 'Toggle Developer Tools',
                    accelerator: 'F12',
                    click: () => mainWindow.webContents.toggleDevTools()
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}

function createSystemTray() {
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    
    let trayIcon;
    try {
        trayIcon = nativeImage.createFromPath(iconPath);
        if (trayIcon.isEmpty()) {
            trayIcon = nativeImage.createEmpty();
        }
    } catch (e) {
        trayIcon = nativeImage.createEmpty();
    }
    
    tray = new Tray(trayIcon);
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: () => {
                mainWindow.show();
                mainWindow.focus();
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => app.quit()
        }
    ]);
    
    tray.setToolTip('Nisrine School Admin');
    tray.setContextMenu(contextMenu);
    
    tray.on('click', () => {
        mainWindow.show();
        mainWindow.focus();
    });
}

// ============================================
// APP LIFECYCLE
// ============================================

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    console.log('🔒 All windows closed, ensuring logout...');
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle app quit - ensure logout happens
app.on('before-quit', async (e) => {
    console.log('🔒 App is quitting, final logout check...');
    // The logout already happened in the window close event
    // This is just a safety check
});

// Handle certificate errors for localhost
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    if (url.startsWith('http://localhost')) {
        event.preventDefault();
        callback(true);
    } else {
        callback(false);
    }
});

// ============================================
// IPC HANDLERS
// ============================================

ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
    return app.getAppPath();
});

console.log('✅ Nisrine School Admin Desktop App initialized');
