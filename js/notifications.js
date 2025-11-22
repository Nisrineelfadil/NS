// Real-time Notification System for Admin Dashboard

// Note: API_BASE_URL, translations, and currentLanguage are already declared in admin-dashboard.js
let socket = null;
let notificationSound = null;
let isSoundMuted = localStorage.getItem('notificationSoundMuted') === 'true';

// Get translation helper
function t(key) {
    if (!translations || !currentLanguage) return key;
    const keys = key.split('.');
    let value = translations[currentLanguage]?.translations;
    for (const k of keys) {
        value = value?.[k];
    }
    return value || key;
}

// Initialize notification system
function initializeNotifications() {
    console.log('🚀 Initializing notification system...');
    
    const authToken = localStorage.getItem('adminToken');
    if (!authToken) {
        console.log('❌ No auth token found, skipping notification init');
        return;
    }
    
    console.log('✅ Auth token found');

    // Check if running on Vercel (WebSockets not supported on serverless)
    const isVercel = window.location.hostname.includes('vercel.app');
    
    if (isVercel) {
        console.log('⚠️ Running on Vercel - Using polling for real-time updates');
        // Use polling instead of WebSockets for Vercel
        loadNotifications();
        setupNotificationUI();
        createNotificationSound();
        startPollingForNotifications();
        return;
    }

    console.log('✅ Running on localhost - initializing Socket.IO...');

    // Initialize Socket.IO connection (only for non-Vercel environments)
    socket = io(API_BASE_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
    });

    // Socket connection events
    socket.on('connect', () => {
        console.log('✅ Connected to notification server');
        console.log('Socket ID:', socket.id);
        console.log('Socket connected:', socket.connected);
    });

    socket.on('disconnect', () => {
        console.log('❌ Disconnected from notification server');
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
    });

    // Listen for new notifications
    socket.on('new-notification', (notification) => {
        console.log('🎉 NEW NOTIFICATION RECEIVED VIA SOCKET.IO!');
        console.log('📢 Notification data:', notification);
        handleNewNotification(notification);
    });
    
    // Test listener to verify Socket.IO is working
    socket.on('test', (data) => {
        console.log('✅ Test event received:', data);
    });

    // Load existing notifications and setup UI (for localhost with Socket.IO)
    loadNotifications();
    setupNotificationUI();
    createNotificationSound();
    
    console.log('✅ Notification system fully initialized with Socket.IO');
}

// Create notification sound (lightweight beep)
function createNotificationSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        
        notificationSound = () => {
            try {
                // Resume audio context if suspended (required by browser autoplay policies)
                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Two-tone notification sound
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.15);
                
                // Second beep
                setTimeout(() => {
                    const oscillator2 = audioContext.createOscillator();
                    const gainNode2 = audioContext.createGain();
                    
                    oscillator2.connect(gainNode2);
                    gainNode2.connect(audioContext.destination);
                    
                    oscillator2.frequency.value = 1000;
                    oscillator2.type = 'sine';
                    
                    gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                    
                    oscillator2.start(audioContext.currentTime);
                    oscillator2.stop(audioContext.currentTime + 0.15);
                }, 150);
                
                console.log('🔊 Notification sound played');
            } catch (err) {
                console.error('Error playing notification sound:', err);
            }
        };
    } catch (error) {
        console.warn('Could not create notification sound:', error);
    }
}

// Handle new notification
function handleNewNotification(notification) {
    console.log('📢 Handling new notification:', notification.type, '-', notification.title);
    
    // Add to notification list
    addNotificationToList(notification);
    
    // Update badge count
    updateNotificationBadge();
    
    // Play sound (only if not muted)
    if (notificationSound && !isSoundMuted) {
        console.log('🔊 Playing notification sound (muted:', isSoundMuted, ')');
        notificationSound();
    } else if (isSoundMuted) {
        console.log('🔇 Sound is muted, skipping notification sound');
    } else if (!notificationSound) {
        console.warn('⚠️ Notification sound function not initialized');
    }
    
    // Show browser notification if permitted
    showBrowserNotification(notification);
    
    // Animate bell icon
    animateBellIcon();
}

// Store last notification count to detect new ones
let lastNotificationCount = 0;
let lastUnreadCount = 0;

// Load notifications from server
async function loadNotifications() {
    try {
        const authToken = localStorage.getItem('adminToken');
        console.log('📥 Loading notifications...');
        
        const response = await fetch(`${API_BASE_URL}/api/notifications?limit=20`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();
        console.log('📦 Notifications data:', data);
        
        if (data.success) {
            console.log(`✅ Loaded ${data.notifications.length} notifications, ${data.unreadCount} unread`);
            
            // Check if there are NEW unread notifications
            if (lastUnreadCount > 0 && data.unreadCount > lastUnreadCount) {
                const newCount = data.unreadCount - lastUnreadCount;
                console.log(`🆕 ${newCount} new notification(s) detected!`);
                
                // Play sound for new notifications
                if (notificationSound && !isSoundMuted) {
                    console.log('🔊 Playing sound for new notification');
                    notificationSound();
                }
                
                // Animate bell icon
                animateBellIcon();
            }
            
            // Update last counts
            lastNotificationCount = data.notifications.length;
            lastUnreadCount = data.unreadCount;
            
            displayNotifications(data.notifications);
            updateBadgeCount(data.unreadCount);
        } else {
            console.error('❌ Failed to load notifications:', data);
        }
    } catch (error) {
        console.error('❌ Error loading notifications:', error);
    }
}

// Display notifications in dropdown
function displayNotifications(notifications) {
    const notificationList = document.getElementById('notificationList');
    
    if (!notificationList) {
        console.error('❌ Notification list element not found!');
        return;
    }
    
    console.log(`📋 Displaying ${notifications.length} notifications`);
    
    if (notifications.length === 0) {
        notificationList.innerHTML = `
            <div class="notification-empty">
                <i class="fas fa-bell-slash"></i>
                <p>${t('admin.notifications.no_notifications')}</p>
            </div>
        `;
        return;
    }
    
    const html = notifications.map(notification => {
        console.log('📝 Creating HTML for notification:', notification);
        return createNotificationHTML(notification);
    }).join('');
    
    console.log('✏️ Setting notification list HTML');
    notificationList.innerHTML = html;
    console.log('✅ Notifications displayed successfully');
}

// Add single notification to list
function addNotificationToList(notification) {
    const notificationList = document.getElementById('notificationList');
    const emptyState = notificationList.querySelector('.notification-empty');
    
    if (emptyState) {
        notificationList.innerHTML = '';
    }
    
    const notificationHTML = createNotificationHTML(notification);
    notificationList.insertAdjacentHTML('afterbegin', notificationHTML);
}

// Create notification HTML
function createNotificationHTML(notification) {
    const timeAgo = getTimeAgo(new Date(notification.createdAt));
    const iconClass = getNotificationIcon(notification.type, notification.metadata?.serviceType);
    const isUnread = !notification.read;
    
    // Determine the icon class based on type and service type
    let iconType = notification.type;
    if (notification.type === 'service_request' && notification.metadata?.serviceType) {
        iconType = `service_${notification.metadata.serviceType}`;
    }
    
    return `
        <div class="notification-item ${isUnread ? 'unread' : ''}" data-id="${notification._id}">
            <div class="notification-icon ${iconType}">
                <i class="${iconClass}"></i>
            </div>
            <div class="notification-content" onclick="handleNotificationClick('${notification._id}', '${notification.type}', '${notification.relatedId}')">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${timeAgo}</div>
            </div>
            <button class="notification-delete-btn" onclick="event.stopPropagation(); deleteNotification('${notification._id}')" title="Delete notification">
                <i class="fas fa-times"></i>
            </button>
            ${isUnread ? '<div class="notification-unread-dot"></div>' : ''}
        </div>
    `;
}

// Get notification icon based on type
function getNotificationIcon(type, serviceType) {
    // If it's a service request, return icon based on service type
    if (type === 'service_request' && serviceType) {
        const serviceIcons = {
            'cv': 'fas fa-file-alt',
            'applying': 'fas fa-briefcase',
            'translation': 'fas fa-language'
        };
        return serviceIcons[serviceType] || 'fas fa-briefcase';
    }
    
    const icons = {
        'registration': 'fas fa-user-graduate',
        'service_request': 'fas fa-briefcase',
        'rating': 'fas fa-star',
        'appointment': 'fas fa-calendar-check',
        'message': 'fas fa-envelope'
    };
    return icons[type] || 'fas fa-bell';
}

// Handle notification click
async function handleNotificationClick(notificationId, type, relatedId) {
    // Mark as read
    await markNotificationAsRead(notificationId);
    
    // Navigate to relevant section
    navigateToNotificationSource(type, relatedId);
    
    // Close dropdown
    closeNotificationDropdown();
}

// Mark notification as read
async function markNotificationAsRead(notificationId) {
    try {
        const authToken = localStorage.getItem('adminToken');
        await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        // Update UI
        const notificationElement = document.querySelector(`[data-id="${notificationId}"]`);
        if (notificationElement) {
            notificationElement.classList.remove('unread');
            const dot = notificationElement.querySelector('.notification-unread-dot');
            if (dot) dot.remove();
        }
        
        updateNotificationBadge();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Navigate to notification source
function navigateToNotificationSource(type, relatedId) {
    const tabMap = {
        'registration': 'registrations',
        'service_request': 'services',
        'rating': 'ratings',
        'appointment': 'appointments',
        'message': 'messages'
    };
    
    const tab = tabMap[type];
    if (tab) {
        const menuItem = document.querySelector(`[data-tab="${tab}"]`);
        if (menuItem) {
            menuItem.click();
        }
    }
}

// Update notification badge
async function updateNotificationBadge() {
    try {
        const authToken = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();
        
        if (data.success) {
            updateBadgeCount(data.unreadCount);
        }
    } catch (error) {
        console.error('Error updating badge:', error);
    }
}

// Update badge count
function updateBadgeCount(count) {
    const badge = document.getElementById('notificationBadge');
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Setup notification UI event listeners
function setupNotificationUI() {
    console.log('🎨 Setting up notification UI...');
    
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    
    console.log('Notification button:', notificationBtn ? '✅ Found' : '❌ Not found');
    console.log('Notification dropdown:', notificationDropdown ? '✅ Found' : '❌ Not found');
    
    if (!notificationBtn || !notificationDropdown) {
        console.error('❌ Required notification elements not found!');
        return;
    }
    
    // Add mute button to notification header
    addMuteButton();
    
    // Toggle dropdown
    notificationBtn.addEventListener('click', (e) => {
        console.log('🔔 Bell icon clicked!');
        e.preventDefault();
        e.stopPropagation();
        
        // Force toggle - remove then add if needed
        const isCurrentlyActive = notificationDropdown.classList.contains('active');
        
        // Close all other dropdowns first
        document.querySelectorAll('.notification-dropdown.active').forEach(dropdown => {
            if (dropdown !== notificationDropdown) {
                dropdown.classList.remove('active');
            }
        });
        
        // Toggle this dropdown and button state
        if (isCurrentlyActive) {
            notificationDropdown.classList.remove('active');
            notificationBtn.classList.remove('active');
            notificationBtn.style.transform = '';
            console.log('Dropdown is now: CLOSED');
        } else {
            notificationDropdown.classList.add('active');
            notificationBtn.classList.add('active');
            notificationBtn.style.transform = 'translateY(0)';
            console.log('Dropdown is now: OPEN');
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.notification-container')) {
            closeNotificationDropdown();
        }
    });
    
    // Mark all as read
    markAllReadBtn?.addEventListener('click', async () => {
        await markAllNotificationsAsRead();
    });
    
    // Clear all notifications
    clearAllBtn?.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear all notifications?')) {
            await clearAllNotifications();
        }
    });
}

// Close notification dropdown
function closeNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    const btn = document.getElementById('notificationBtn');
    
    dropdown?.classList.remove('active');
    btn?.classList.remove('active');
    if (btn) btn.style.transform = '';
}

// Mark all notifications as read
async function markAllNotificationsAsRead() {
    try {
        const authToken = localStorage.getItem('adminToken');
        await fetch(`${API_BASE_URL}/api/notifications/mark-all-read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        // Update UI
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
            const dot = item.querySelector('.notification-unread-dot');
            if (dot) dot.remove();
        });
        
        updateBadgeCount(0);
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
}

// Delete single notification
async function deleteNotification(notificationId) {
    try {
        const authToken = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Remove notification from UI
            const notificationElement = document.querySelector(`[data-id="${notificationId}"]`);
            if (notificationElement) {
                notificationElement.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => {
                    notificationElement.remove();
                    
                    // Check if list is empty
                    const notificationList = document.getElementById('notificationList');
                    if (notificationList.children.length === 0) {
                        notificationList.innerHTML = `
                            <div class="notification-empty">
                                <i class="fas fa-bell-slash"></i>
                                <p>${t('admin.notifications.no_notifications')}</p>
                            </div>
                        `;
                    }
                    
                    // Update badge count
                    updateNotificationBadge();
                }, 300);
            }
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
}

// Clear all notifications
async function clearAllNotifications() {
    try {
        const authToken = localStorage.getItem('adminToken');
        await fetch(`${API_BASE_URL}/api/notifications/clear-all`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        // Update UI
        const notificationList = document.getElementById('notificationList');
        notificationList.innerHTML = `
            <div class="notification-empty">
                <i class="fas fa-bell-slash"></i>
                <p>${t('admin.notifications.no_notifications')}</p>
            </div>
        `;
        
        updateBadgeCount(0);
    } catch (error) {
        console.error('Error clearing notifications:', error);
    }
}

// Animate bell icon
function animateBellIcon() {
    const bellIcon = document.querySelector('#notificationBtn i');
    if (bellIcon) {
        bellIcon.classList.add('bell-ring');
        setTimeout(() => {
            bellIcon.classList.remove('bell-ring');
        }, 1000);
    }
}

// Show browser notification
function showBrowserNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
            body: notification.message,
            icon: '/Img/logo.png',
            badge: '/Img/logo.png',
            tag: notification._id
        });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showBrowserNotification(notification);
            }
        });
    }
}

// Add mute button to notification header
function addMuteButton() {
    const notificationHeader = document.querySelector('.notification-header');
    if (!notificationHeader) return;
    
    // Check if button already exists
    if (document.getElementById('notificationMuteBtn')) return;
    
    const muteBtn = document.createElement('button');
    muteBtn.id = 'notificationMuteBtn';
    muteBtn.className = 'notification-mute-btn';
    muteBtn.innerHTML = isSoundMuted 
        ? '<i class="fas fa-volume-mute"></i>' 
        : '<i class="fas fa-volume-up"></i>';
    muteBtn.title = isSoundMuted ? t('admin.notifications.unmute') : t('admin.notifications.mute');
    
    muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSoundMute();
    });
    
    // Insert before "Mark all read" button
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    notificationHeader.insertBefore(muteBtn, markAllReadBtn);
}

// Toggle sound mute
function toggleSoundMute() {
    isSoundMuted = !isSoundMuted;
    localStorage.setItem('notificationSoundMuted', isSoundMuted.toString());
    
    const muteBtn = document.getElementById('notificationMuteBtn');
    if (muteBtn) {
        muteBtn.innerHTML = isSoundMuted 
            ? '<i class="fas fa-volume-mute"></i>' 
            : '<i class="fas fa-volume-up"></i>';
        muteBtn.title = isSoundMuted ? t('admin.notifications.unmute') : t('admin.notifications.mute');
    }
    
    // Show feedback
    const feedback = isSoundMuted ? t('admin.notifications.sound_muted') : t('admin.notifications.sound_enabled');
    console.log('🔔', feedback);
}

// Get time ago string
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        year: { seconds: 31536000, key: 'years_ago' },
        month: { seconds: 2592000, key: 'months_ago' },
        week: { seconds: 604800, key: 'weeks_ago' },
        day: { seconds: 86400, key: 'days_ago' },
        hour: { seconds: 3600, key: 'hours_ago' },
        minute: { seconds: 60, key: 'minutes_ago' }
    };
    
    for (const [unit, data] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / data.seconds);
        if (interval >= 1) {
            return `${interval} ${t('admin.notifications.' + data.key)}`;
        }
    }
    
    return t('admin.notifications.just_now');
}

// Initialize when dashboard is loaded
function startNotificationSystem() {
    console.log('🚀 Starting notification system...');
    
    const dashboard = document.getElementById('dashboard');
    const notificationList = document.getElementById('notificationList');
    
    console.log('Dashboard element:', dashboard ? '✅ Found' : '❌ Not found');
    console.log('Notification list element:', notificationList ? '✅ Found' : '❌ Not found');
    
    if (dashboard && dashboard.style.display !== 'none') {
        console.log('✅ Dashboard is visible, initializing notifications...');
        initializeNotifications();
    } else {
        console.log('⏳ Dashboard not visible yet, waiting...');
    }
}

// Try multiple initialization methods
if (document.readyState === 'loading') {
    console.log('⏳ DOM still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', startNotificationSystem);
} else {
    console.log('✅ DOM already loaded, starting immediately...');
    startNotificationSystem();
}

// Also watch for dashboard visibility changes
if (document.getElementById('dashboard')) {
    const observer = new MutationObserver((mutations) => {
        const dashboard = document.getElementById('dashboard');
        if (dashboard && dashboard.style.display !== 'none' && !socket) {
            console.log('👀 Dashboard became visible, initializing...');
            initializeNotifications();
            observer.disconnect();
        }
    });
    
    observer.observe(document.body, {
        attributes: true,
        subtree: true,
        attributeFilter: ['style']
    });
}

// ============================================
// POLLING FOR VERCEL (Serverless)
// ============================================

let lastNotificationId = null;
let pollingInterval = null;

function startPollingForNotifications() {
    console.log('🔄 Starting notification polling (every 10 seconds)');
    
    // Poll every 10 seconds (safer for Vercel serverless)
    pollingInterval = setInterval(async () => {
        try {
            const authToken = localStorage.getItem('adminToken');
            if (!authToken) return;
            
            const response = await fetch(`${API_BASE_URL}/api/notifications`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) return;
            
            const data = await response.json();
            const notifications = data.notifications || [];
            
            if (notifications.length === 0) return;
            
            // Check for new notifications
            const newestNotification = notifications[0];
            
            if (!lastNotificationId) {
                // First load - just set the ID, don't show notification
                lastNotificationId = newestNotification._id;
                return;
            }
            
            if (newestNotification._id !== lastNotificationId) {
                console.log('🎉 NEW NOTIFICATION DETECTED!');
                // New notification found!
                handleNewNotification(newestNotification);
                lastNotificationId = newestNotification._id;
                
                // Reload all notifications to update the list
                loadNotifications();
            }
            
        } catch (error) {
            console.error('❌ Polling error:', error);
        }
    }, 10000); // Poll every 10 seconds (Vercel-friendly)
}

// Stop polling when page unloads
window.addEventListener('beforeunload', () => {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
});
