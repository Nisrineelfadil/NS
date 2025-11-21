const { app, BrowserWindow, Menu, Notification, Tray, nativeImage } = require('electron');
const path = require('path');

let mainWindow;
let tray = null;
let notificationCount = 0;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true
        },
        backgroundColor: '#ffffff',
        show: false,
        autoHideMenuBar: false
    });

    // Load the admin panel from Vercel (production)
    const startUrl = 'https://nisrine-school.vercel.app/admin';
    
    // For local development/testing, uncomment this:
    // const startUrl = 'http://localhost:3000/admin';
    
    console.log('Loading admin panel from:', startUrl);
    mainWindow.loadURL(startUrl);

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.maximize();
    });

    // Create application menu
    const menuTemplate = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        mainWindow.reload();
                    }
                },
                {
                    label: 'Force Reload',
                    accelerator: 'CmdOrCtrl+Shift+R',
                    click: () => {
                        mainWindow.webContents.reloadIgnoringCache();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        app.quit();
                    }
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
                    label: 'About Nisrine School Admin',
                    click: () => {
                        const { dialog } = require('electron');
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About',
                            message: 'Nisrine School Admin',
                            detail: 'Version 1.0.0\n\nAdmin Dashboard for Nisrine School\n\n© 2025 Nisrine School'
                        });
                    }
                },
                { type: 'separator' },
                {
                    label: 'Toggle Developer Tools',
                    accelerator: 'F12',
                    click: () => {
                        mainWindow.webContents.toggleDevTools();
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    // Handle window close
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Open external links in browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        require('electron').shell.openExternal(url);
        return { action: 'deny' };
    });

    // Listen for notification events from the web page
    mainWindow.webContents.on('did-finish-load', () => {
        // Inject enhanced notification handler for desktop app
        mainWindow.webContents.executeJavaScript(`
            console.log('🖥️ Desktop app mode enabled');
            
            // Enable auto-polling for notifications (since Socket.IO doesn't work on Vercel)
            if (typeof loadNotifications === 'function') {
                console.log('✅ Setting up auto-refresh for notifications every 10 seconds');
                
                // Check for new notifications every 10 seconds
                setInterval(() => {
                    console.log('🔄 Auto-checking for new notifications...');
                    loadNotifications();
                }, 10000); // 10 seconds
                
                // Also check when window becomes visible
                document.addEventListener('visibilitychange', () => {
                    if (!document.hidden) {
                        console.log('👀 Window visible - checking notifications');
                        loadNotifications();
                    }
                });
            }
            
            // Override browser notifications to use Electron's native notifications
            if (window.Notification) {
                const OriginalNotification = window.Notification;
                window.Notification = function(title, options) {
                    console.log('📢 Notification:', title);
                    // Send to Electron for native notification
                    if (window.electronAPI) {
                        window.electronAPI.showNotification(title, options?.body || '');
                    }
                    return new OriginalNotification(title, options);
                };
                window.Notification.permission = 'granted';
                window.Notification.requestPermission = () => Promise.resolve('granted');
            }
            
            console.log('✅ Desktop app enhancements loaded');
        `);
    });

    // Create system tray
    createSystemTray();
}

// Create system tray icon
function createSystemTray() {
    // Create a simple tray icon (you can replace with custom icon)
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    
    // Use default icon if custom not found
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
            label: 'Show Admin Panel',
            click: () => {
                mainWindow.show();
                mainWindow.focus();
            }
        },
        {
            label: 'Notifications: 0',
            id: 'notification-count',
            enabled: false
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                app.quit();
            }
        }
    ]);
    
    tray.setToolTip('Nisrine School Admin');
    tray.setContextMenu(contextMenu);
    
    // Click tray icon to show window
    tray.on('click', () => {
        mainWindow.show();
        mainWindow.focus();
    });
}

// Update tray notification count
function updateTrayNotificationCount(count) {
    notificationCount = count;
    if (tray) {
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Show Admin Panel',
                click: () => {
                    mainWindow.show();
                    mainWindow.focus();
                }
            },
            {
                label: `Notifications: ${count}`,
                id: 'notification-count',
                enabled: false
            },
            { type: 'separator' },
            {
                label: 'Quit',
                click: () => {
                    app.quit();
                }
            }
        ]);
        tray.setContextMenu(contextMenu);
        tray.setToolTip(`Nisrine School Admin - ${count} new notification${count !== 1 ? 's' : ''}`);
    }
}

// Show native notification
function showNativeNotification(title, body) {
    const notification = new Notification({
        title: title,
        body: body,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        sound: true, // Play system sound
        urgency: 'normal'
    });
    
    notification.show();
    
    notification.on('click', () => {
        mainWindow.show();
        mainWindow.focus();
    });
}

// App lifecycle
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle certificate errors (for self-signed certificates in development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    // Only allow in development
    if (url.startsWith('http://localhost')) {
        event.preventDefault();
        callback(true);
    } else {
        callback(false);
    }
});
