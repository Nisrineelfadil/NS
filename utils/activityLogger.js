const ActivityLog = require('../models/ActivityLog');

/**
 * Log admin activity
 * @param {Object} params - Activity parameters
 * @param {String} params.adminId - Admin ID
 * @param {String} params.adminName - Admin username
 * @param {String} params.adminRole - Admin role (super_admin/employee)
 * @param {String} params.action - Action performed
 * @param {String} params.targetType - Type of target (student/employee/message/settings/system)
 * @param {String} params.targetId - ID of target (optional)
 * @param {String} params.targetName - Name of target (optional)
 * @param {String} params.details - Additional details (optional)
 * @param {String} params.ipAddress - IP address (optional)
 * @param {String} params.userAgent - User agent (optional)
 */
async function logActivity(params) {
    try {
        const activityLog = new ActivityLog({
            adminId: params.adminId,
            adminName: params.adminName,
            adminRole: params.adminRole,
            action: params.action,
            targetType: params.targetType || 'system',
            targetId: params.targetId || null,
            targetName: params.targetName || null,
            details: params.details || null,
            ipAddress: params.ipAddress || null,
            userAgent: params.userAgent || null
        });

        await activityLog.save();
        console.log(`Activity logged: ${params.adminName} - ${params.action}`);
    } catch (error) {
        console.error('Error logging activity:', error);
        // Don't throw error - logging shouldn't break the main flow
    }
}

/**
 * Get client IP address from request
 */
function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           'Unknown';
}

/**
 * Parse user agent to extract browser and OS info
 */
function parseUserAgent(userAgent) {
    const ua = userAgent || '';
    
    // Detect browser
    let browser = 'Unknown';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    else if (ua.includes('Opera')) browser = 'Opera';
    
    // Detect OS
    let os = 'Unknown';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';
    
    // Detect device
    let device = 'Desktop';
    if (ua.includes('Mobile')) device = 'Mobile';
    else if (ua.includes('Tablet')) device = 'Tablet';
    
    return { browser, os, device };
}

module.exports = {
    logActivity,
    getClientIp,
    parseUserAgent
};
