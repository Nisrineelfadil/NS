const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Middleware to verify JWT token and check active status
const authenticateAdmin = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'No token provided' 
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if account is still active (real-time check)
        const admin = await Admin.findById(decoded.id);
        
        if (!admin) {
            return res.status(401).json({ 
                success: false, 
                message: 'Account not found',
                accountDeactivated: true
            });
        }
        
        if (!admin.isActive) {
            return res.status(403).json({ 
                success: false, 
                message: 'Account is deactivated. Contact super admin.',
                accountDeactivated: true
            });
        }
        
        // Set admin data for use in routes
        req.adminId = decoded.id;
        req.adminRole = decoded.role;
        req.admin = {
            id: admin._id.toString(),
            username: admin.username,
            email: admin.email,
            role: admin.role
        };
        
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid token' 
        });
    }
};

// Middleware to check if admin is super admin or dev
const requireSuperAdmin = async (req, res, next) => {
    try {
        const admin = await Admin.findById(req.adminId);
        
        // Dev role has all super_admin privileges
        if (!admin || (admin.role !== 'super_admin' && admin.role !== 'dev')) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. Super admin only.' 
            });
        }
        
        next();
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Middleware to check if admin account is active
const checkActiveStatus = async (req, res, next) => {
    try {
        const admin = await Admin.findById(req.adminId);
        
        if (!admin || !admin.isActive) {
            return res.status(403).json({ 
                success: false, 
                message: 'Account is deactivated. Contact super admin.' 
            });
        }
        
        next();
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

module.exports = { 
    authenticateAdmin, 
    requireSuperAdmin,
    checkActiveStatus
};
