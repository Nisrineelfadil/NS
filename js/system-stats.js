// System Statistics Module for Apple Glass iOS Style Monitoring

// Format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Update progress bar with animation
function updateProgressBar(elementId, percentage, size, info) {
    const fillElement = document.getElementById(elementId);
    const valueElement = document.getElementById(elementId.replace('Fill', 'Value'));
    const infoElement = document.getElementById(elementId.replace('Fill', 'Info'));
    
    if (!fillElement) return;
    
    // Update percentage data attribute
    fillElement.setAttribute('data-percentage', Math.round(percentage));
    
    // Animate width
    setTimeout(() => {
        fillElement.style.width = `${Math.min(percentage, 100)}%`;
    }, 100);
    
    // Update value display
    if (valueElement) {
        const formatted = formatBytes(size);
        const parts = formatted.split(' ');
        valueElement.querySelector('.value-number').textContent = parts[0];
        valueElement.querySelector('.value-unit').textContent = parts[1];
        valueElement.querySelector('.value-percentage').textContent = `${Math.round(percentage)}%`;
    }
    
    // Update info text
    if (infoElement) {
        infoElement.textContent = info;
    }
}

// Fetch and display system statistics
async function refreshSystemStats() {
    try {
        console.log('🔄 Refreshing system statistics...');
        
        // Show loading state
        const refreshBtn = document.querySelector('.refresh-btn i');
        if (refreshBtn) {
            refreshBtn.style.transform = 'rotate(360deg)';
        }
        
        // Fetch stats from API
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/system-stats/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch system statistics');
        }
        
        const data = await response.json();
        console.log('📊 System Stats:', data);
        
        // Update Database Usage
        updateProgressBar(
            'dbUsageFill',
            data.database.usagePercentage,
            data.database.totalSize,
            `${formatBytes(data.database.totalSize)} of ${formatBytes(data.database.softLimit)} used`
        );
        
        // Update Dropbox Storage
        if (data.dropbox) {
            updateProgressBar(
                'dropboxUsageFill',
                data.dropbox.percentage,
                data.dropbox.used,
                `${formatNumber(data.dropbox.fileCount)} backup files`
            );
        }
        
        // Update Student Data
        updateProgressBar(
            'studentDataFill',
            data.storage.students.percentage,
            data.storage.students.size,
            `${formatNumber(data.storage.students.count)} students`
        );
        
        // Update Photos & Documents
        updateProgressBar(
            'photosDataFill',
            data.storage.photos.percentage,
            data.storage.photos.size,
            `${formatNumber(data.storage.photos.count)} files`
        );
        
        // Update Grades & Records
        updateProgressBar(
            'gradesDataFill',
            data.storage.grades.percentage,
            data.storage.grades.size,
            `${formatNumber(data.storage.grades.count)} records`
        );
        
        // Update Attendance Records
        updateProgressBar(
            'attendanceDataFill',
            data.storage.attendance.percentage,
            data.storage.attendance.size,
            `${formatNumber(data.storage.attendance.count)} records`
        );
        
        // Update Archived Seasons
        updateProgressBar(
            'seasonsDataFill',
            data.storage.seasons.percentage,
            data.storage.seasons.size,
            `${formatNumber(data.storage.seasons.count)} seasons`
        );
        
        // Update Last Cleanup Date
        const lastCleanupElement = document.getElementById('lastCleanupDate');
        if (lastCleanupElement && data.lastCleanup) {
            const cleanupDate = new Date(data.lastCleanup);
            const now = new Date();
            const diffDays = Math.floor((now - cleanupDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                lastCleanupElement.textContent = 'Today';
            } else if (diffDays === 1) {
                lastCleanupElement.textContent = 'Yesterday';
            } else if (diffDays < 7) {
                lastCleanupElement.textContent = `${diffDays} days ago`;
            } else {
                lastCleanupElement.textContent = cleanupDate.toLocaleDateString();
            }
        }
        
        console.log('✅ System statistics updated successfully');
        
        // Reset refresh button animation
        setTimeout(() => {
            if (refreshBtn) {
                refreshBtn.style.transform = '';
            }
        }, 600);
        
    } catch (error) {
        console.error('❌ Error fetching system statistics:', error);
        alert('Failed to load system statistics. Please try again.');
        
        // Reset refresh button
        const refreshBtn = document.querySelector('.refresh-btn i');
        if (refreshBtn) {
            refreshBtn.style.transform = '';
        }
    }
}

// Manage Storage - placeholder function
function manageStorage() {
    alert('Storage management features coming soon!\n\nFeatures will include:\n• Archive old data\n• Clean up temporary files\n• Compress old records\n• Export data backups');
}

// View Storage History - placeholder function
async function viewStorageHistory() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/system-stats/storage-history?days=30', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch storage history');
        }
        
        const data = await response.json();
        console.log('📈 Storage History:', data);
        
        // TODO: Display chart or detailed history
        alert(`Storage History (Last ${data.days} days)\n\nTotal data points: ${data.history.length}\n\nChart visualization coming soon!`);
        
    } catch (error) {
        console.error('Error fetching storage history:', error);
        alert('Failed to load storage history');
    }
}

// Initialize system stats when Settings tab is opened
function initializeSystemStats() {
    console.log('🎯 Initializing System Statistics...');
    refreshSystemStats();
}

// Auto-refresh every 5 minutes
let statsRefreshInterval = null;

function startStatsAutoRefresh() {
    // Clear any existing interval
    if (statsRefreshInterval) {
        clearInterval(statsRefreshInterval);
    }
    
    // Refresh every 5 minutes
    statsRefreshInterval = setInterval(() => {
        console.log('🔄 Auto-refreshing system stats...');
        refreshSystemStats();
    }, 5 * 60 * 1000);
}

function stopStatsAutoRefresh() {
    if (statsRefreshInterval) {
        clearInterval(statsRefreshInterval);
        statsRefreshInterval = null;
    }
}

// Export functions for global use
window.refreshSystemStats = refreshSystemStats;
window.manageStorage = manageStorage;
window.viewStorageHistory = viewStorageHistory;
window.initializeSystemStats = initializeSystemStats;
window.startStatsAutoRefresh = startStatsAutoRefresh;
window.stopStatsAutoRefresh = stopStatsAutoRefresh;

console.log('✅ System Stats module loaded');
