const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const ManagedStudent = require('../models/ManagedStudent');
const LoginSession = require('../models/LoginSession');

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

        // Single-purpose tokens (2FA step, account recovery step, factory-reset ticket) are never session tokens.
        // Before this check, the token returned after the password step of a 2FA login was accepted here,
        // which let a password alone open the dashboard API without the emailed code.
        if (decoded.purpose) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }

        // Optional cut-off: admin tokens issued before this date are refused (set ADMIN_TOKENS_NOT_BEFORE at
        // deployment to close every session opened before the update, e.g. with the removed master passcodes).
        const notBefore = process.env.ADMIN_TOKENS_NOT_BEFORE ? Date.parse(process.env.ADMIN_TOKENS_NOT_BEFORE) : NaN;
        if (!Number.isNaN(notBefore) && (!decoded.iat || decoded.iat * 1000 < notBefore)) {
            return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
        }

        // Temporary access (account recovery): the session must still exist, be open and not be expired.
        let temporarySession = null;
        if (decoded.tmp) {
            temporarySession = await LoginSession.findById(decoded.sid);
            if (!temporarySession || !temporarySession.isActive || temporarySession.loginMethod !== 'temporary_access' ||
                String(temporarySession.adminId) !== String(decoded.id) ||
                !temporarySession.expiresAt || temporarySession.expiresAt <= new Date()) {
                return res.status(401).json({ success: false, message: 'Temporary access has expired. Please log in again.', temporaryAccessExpired: true });
            }
        }

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
        
        // Set admin data for use in routes (role always taken from the database, never from the token)
        req.adminId = decoded.id;
        req.adminRole = admin.role;
        req.admin = {
            id: admin._id.toString(),
            username: admin.username,
            email: admin.email,
            role: admin.role
        };
        req.isTemporaryAccess = !!temporarySession;
        req.temporarySession = temporarySession;
        
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

// Middleware to verify student JWT token (for PWA)
const authenticateStudent = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'No token provided' 
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if this is a student token
        if (decoded.role !== 'student') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. Students only.' 
            });
        }
        
        // Find the student
        const student = await ManagedStudent.findById(decoded.id);
        
        if (!student) {
            return res.status(401).json({ 
                success: false, 
                message: 'Student not found'
            });
        }
        
        // Set student data for use in routes
        req.student = {
            _id: student._id,
            id: student._id.toString(),
            fullName: student.fullName,
            email: student.schoolEmail
        };
        
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid token' 
        });
    }
};

// Director (super_admin) only — the developer account is NOT included (used for the factory reset and security alerts).
const requireDirector = async (req, res, next) => {
    try {
        const admin = await Admin.findById(req.adminId);
        if (!admin || admin.role !== 'super_admin') {
            return res.status(403).json({ success: false, code: 'DIRECTOR_ONLY', message: 'Access denied. Director only.' });
        }
        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Refuse an action while the account is using temporary access (account recovery).
const denyTemporaryAccess = (req, res, next) => {
    if (req.isTemporaryAccess) {
        return res.status(403).json({
            success: false,
            temporaryAccess: true,
            message: 'This action is not available with temporary access. Log in with your normal password.'
        });
    }
    next();
};

module.exports = {
    authenticateAdmin,
    requireSuperAdmin,
    requireDirector,
    denyTemporaryAccess,
    checkActiveStatus,
    authenticateStudent
};
