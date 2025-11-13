const AdminActivity = require('../models/AdminActivity');

// Helper function to detect platform from user agent
function detectPlatform(userAgent) {
    if (!userAgent) return 'unknown';
    
    const ua = userAgent.toLowerCase();
    
    // Check for Electron (Desktop App)
    if (ua.includes('electron')) {
        return 'desktop';
    }
    
    // Check for mobile devices
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) {
        return 'mobile';
    }
    
    // Default to web browser
    return 'web';
}

// Main activity logging function
async function logActivity({
    adminId,
    adminUsername,
    action,
    targetType = null,
    targetId = null,
    targetName = null,
    details,
    metadata = null,
    req = null
}) {
    try {
        const activityData = {
            adminId,
            adminUsername,
            action,
            targetType,
            targetId,
            targetName,
            details,
            metadata
        };

        // Add request info if available
        if (req) {
            activityData.ipAddress = req.ip || req.connection.remoteAddress;
            activityData.userAgent = req.headers['user-agent'];
            activityData.platform = detectPlatform(req.headers['user-agent']);
        }

        const activity = new AdminActivity(activityData);
        await activity.save();
        
        console.log(`📝 Activity logged: ${adminUsername} - ${action}`);
        return activity;
    } catch (error) {
        console.error('Error logging activity:', error);
        // Don't throw error - activity logging shouldn't break the main flow
        return null;
    }
}

// Express middleware to automatically log certain actions
function activityLoggerMiddleware(action, getDetails) {
    return async (req, res, next) => {
        // Store original send function
        const originalSend = res.send;
        
        // Override send function
        res.send = function(data) {
            // Only log if request was successful (2xx status)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Log activity asynchronously (don't wait)
                if (req.adminId && req.adminUsername) {
                    const details = typeof getDetails === 'function' ? getDetails(req, res) : getDetails;
                    
                    logActivity({
                        adminId: req.adminId,
                        adminUsername: req.adminUsername,
                        action,
                        details,
                        req
                    }).catch(err => console.error('Activity logging error:', err));
                }
            }
            
            // Call original send
            return originalSend.call(this, data);
        };
        
        next();
    };
}

module.exports = {
    logActivity,
    activityLoggerMiddleware,
    detectPlatform
};
