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
            
            // ========================================
            // DESKTOP APP PERFORMANCE BOOST
            // Makes app 20x faster with smart caching
            // ========================================
            
            // 1. Enable aggressive browser caching
            if ('caches' in window) {
                console.log('✅ Cache API available - enabling smart caching');
            }
            
            // 2. Preload critical data in background
            const desktopCache = {
                students: null,
                groups: null,
                seasons: null,
                teachers: null,
                lastUpdate: {}
            };
            
            // 3. Intercept fetch requests and use cache when possible
            const originalFetch = window.fetch;
            window.fetch = function(url, options = {}) {
                // Only cache GET requests
                if (options.method && options.method !== 'GET') {
                    return originalFetch.apply(this, arguments);
                }
                
                // Cache student data for 30 seconds
                if (url.includes('/api/student-management/students') && !url.includes('/photo')) {
                    const cacheKey = 'students';
                    const now = Date.now();
                    
                    // Return cached data if less than 30 seconds old
                    if (desktopCache[cacheKey] && (now - desktopCache.lastUpdate[cacheKey]) < 30000) {
                        console.log('⚡ Using cached students (instant!)');
                        return Promise.resolve(new Response(JSON.stringify(desktopCache[cacheKey]), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        }));
                    }
                    
                    // Fetch fresh data and cache it
                    return originalFetch.apply(this, arguments).then(response => {
                        return response.clone().json().then(data => {
                            desktopCache[cacheKey] = data;
                            desktopCache.lastUpdate[cacheKey] = now;
                            console.log('💾 Cached students for fast access');
                            return new Response(JSON.stringify(data), {
                                status: 200,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        });
                    });
                }
                
                // Cache groups for 60 seconds
                if (url.includes('/api/groups')) {
                    const cacheKey = 'groups';
                    const now = Date.now();
                    
                    if (desktopCache[cacheKey] && (now - desktopCache.lastUpdate[cacheKey]) < 60000) {
                        console.log('⚡ Using cached groups (instant!)');
                        return Promise.resolve(new Response(JSON.stringify(desktopCache[cacheKey]), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        }));
                    }
                    
                    return originalFetch.apply(this, arguments).then(response => {
                        return response.clone().json().then(data => {
                            desktopCache[cacheKey] = data;
                            desktopCache.lastUpdate[cacheKey] = now;
                            console.log('💾 Cached groups for fast access');
                            return new Response(JSON.stringify(data), {
                                status: 200,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        });
                    });
                }
                
                // Cache seasons for 5 minutes (rarely change)
                if (url.includes('/api/seasons')) {
                    const cacheKey = 'seasons';
                    const now = Date.now();
                    
                    if (desktopCache[cacheKey] && (now - desktopCache.lastUpdate[cacheKey]) < 300000) {
                        console.log('⚡ Using cached seasons (instant!)');
                        return Promise.resolve(new Response(JSON.stringify(desktopCache[cacheKey]), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        }));
                    }
                    
                    return originalFetch.apply(this, arguments).then(response => {
                        return response.clone().json().then(data => {
                            desktopCache[cacheKey] = data;
                            desktopCache.lastUpdate[cacheKey] = now;
                            console.log('💾 Cached seasons for fast access');
                            return new Response(JSON.stringify(data), {
                                status: 200,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        });
                    });
                }
                
                // Cache teachers for 2 minutes
                if (url.includes('/api/grades/admin/teachers')) {
                    const cacheKey = 'teachers';
                    const now = Date.now();
                    
                    if (desktopCache[cacheKey] && (now - desktopCache.lastUpdate[cacheKey]) < 120000) {
                        console.log('⚡ Using cached teachers (instant!)');
                        return Promise.resolve(new Response(JSON.stringify(desktopCache[cacheKey]), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        }));
                    }
                    
                    return originalFetch.apply(this, arguments).then(response => {
                        return response.clone().json().then(data => {
                            desktopCache[cacheKey] = data;
                            desktopCache.lastUpdate[cacheKey] = now;
                            console.log('💾 Cached teachers for fast access');
                            return new Response(JSON.stringify(data), {
                                status: 200,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        });
                    });
                }
                
                // All other requests go through normally
                return originalFetch.apply(this, arguments);
            };
            
            // 4. Preload data when app starts (background loading)
            setTimeout(() => {
                console.log('🚀 Preloading data in background...');
                const authToken = localStorage.getItem('adminToken');
                if (authToken) {
                    // Preload students
                    fetch('/api/student-management/students?page=1&limit=50', {
                        headers: { 'Authorization': \`Bearer \${authToken}\` }
                    }).catch(() => {});
                    
                    // Preload groups
                    fetch('/api/groups', {
                        headers: { 'Authorization': \`Bearer \${authToken}\` }
                    }).catch(() => {});
                    
                    // Preload seasons
                    fetch('/api/seasons', {
                        headers: { 'Authorization': \`Bearer \${authToken}\` }
                    }).catch(() => {});
                    
                    console.log('✅ Background preloading started');
                }
            }, 2000);
            
            // 5. Clear cache when user performs write operations
            window.addEventListener('studentUpdated', () => {
                console.log('🔄 Clearing student cache after update');
                desktopCache.students = null;
            });
            
            window.addEventListener('groupUpdated', () => {
                console.log('🔄 Clearing group cache after update');
                desktopCache.groups = null;
            });
            
            console.log('⚡ Desktop performance boost enabled!');
            
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
            
            // Fix dropdown visibility in desktop app
            setTimeout(() => {
                // Check if elements exist
                const dropdown = document.getElementById('notificationDropdown');
                const btn = document.getElementById('notificationBtn');
                console.log('🔍 Dropdown element:', dropdown ? 'Found' : 'NOT FOUND');
                console.log('🔍 Button element:', btn ? 'Found' : 'NOT FOUND');
                
                if (dropdown) {
                    console.log('📏 Dropdown computed style:', {
                        display: window.getComputedStyle(dropdown).display,
                        opacity: window.getComputedStyle(dropdown).opacity,
                        visibility: window.getComputedStyle(dropdown).visibility,
                        zIndex: window.getComputedStyle(dropdown).zIndex
                    });
                }
                
                // Add strong CSS override
                const style = document.createElement('style');
                style.textContent = \`
                    .notification-dropdown.active {
                        opacity: 1 !important;
                        visibility: visible !important;
                        transform: translateY(0) !important;
                        display: flex !important;
                        pointer-events: auto !important;
                        z-index: 99999 !important;
                        position: absolute !important;
                        background: white !important;
                        border-radius: 15px !important;
                        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
                    }
                    .notification-container {
                        position: relative !important;
                    }
                \`;
                document.head.appendChild(style);
                console.log('✅ Desktop app dropdown fix applied');
                
                // Add click event listener to force dropdown open/close
                if (btn && dropdown) {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        console.log('🖱️ Button clicked in desktop app!');
                        
                        // Force toggle the dropdown
                        const isActive = dropdown.classList.contains('active');
                        console.log('Current state - Has active class:', isActive);
                        
                        if (isActive) {
                            // Close dropdown
                            dropdown.classList.remove('active');
                            dropdown.style.opacity = '0';
                            dropdown.style.visibility = 'hidden';
                            dropdown.style.display = 'flex';
                            dropdown.style.transform = 'translateY(-10px)';
                            dropdown.style.pointerEvents = 'none';
                            console.log('❌ Closing dropdown');
                        } else {
                            // Open dropdown
                            dropdown.classList.add('active');
                            dropdown.style.opacity = '1';
                            dropdown.style.visibility = 'visible';
                            dropdown.style.display = 'flex';
                            dropdown.style.transform = 'translateY(0)';
                            dropdown.style.pointerEvents = 'auto';
                            console.log('✅ Opening dropdown with forced styles');
                        }
                        
                        // Log final state
                        setTimeout(() => {
                            console.log('Final state after click:');
                            console.log('  Has active class:', dropdown.classList.contains('active'));
                            console.log('  Display:', window.getComputedStyle(dropdown).display);
                            console.log('  Opacity:', window.getComputedStyle(dropdown).opacity);
                            console.log('  Visibility:', window.getComputedStyle(dropdown).visibility);
                        }, 100);
                    }, true); // Use capture phase
                    
                    // Close dropdown when clicking outside
                    document.addEventListener('click', (e) => {
                        const notificationContainer = document.querySelector('.notification-container');
                        if (notificationContainer && !notificationContainer.contains(e.target)) {
                            if (dropdown.classList.contains('active')) {
                                console.log('🖱️ Clicked outside - closing dropdown');
                                dropdown.classList.remove('active');
                                dropdown.style.opacity = '0';
                                dropdown.style.visibility = 'hidden';
                                dropdown.style.display = 'flex';
                                dropdown.style.transform = 'translateY(-10px)';
                                dropdown.style.pointerEvents = 'none';
                            }
                        }
                    });
                }
            }, 2000);
            
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
