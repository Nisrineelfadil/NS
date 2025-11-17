const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { authenticateAdmin } = require('../middleware/authMiddleware');

// Import models
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const Teacher = require('../models/Teacher');
const ManagedStudent = require('../models/ManagedStudent');
const Group = require('../models/Group');
const Admin = require('../models/Admin');
const Season = require('../models/Season');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'nisrine-school-secret-key-2024';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Middleware to verify teacher
const verifyTeacher = async (req, res, next) => {
    try {
        const teacher = await Teacher.findById(req.user.id);
        if (!teacher || teacher.status !== 'active') {
            return res.status(403).json({ error: 'Access denied' });
        }
        req.teacher = teacher;
        next();
    } catch (error) {
        return res.status(500).json({ error: 'Server error' });
    }
};

// Middleware to verify student
const verifyStudent = async (req, res, next) => {
    try {
        const student = await ManagedStudent.findById(req.user.id);
        if (!student || student.status !== 'active') {
            return res.status(403).json({ error: 'Access denied' });
        }
        req.student = student;
        next();
    } catch (error) {
        return res.status(500).json({ error: 'Server error' });
    }
};

// Use the existing authenticateAdmin middleware from authMiddleware
// No need to redefine verifyAdmin

// ==================== TEACHER ROUTES ====================

// Generate QR Code for Attendance Session
router.post('/generate', verifyToken, verifyTeacher, async (req, res) => {
    try {
        const { groupId, formation, date, classStartTime, classEndTime, qrValidityMinutes = 30, lateThresholdMinutes = 15 } = req.body;

        // Validate required fields
        if (!groupId || !formation || !date || !classStartTime || !classEndTime) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Verify group exists and teacher has access
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Check if teacher is assigned to this group
        if (!req.teacher.groups.some(g => g.toString() === groupId)) {
            return res.status(403).json({ error: 'You are not assigned to this group' });
        }

        // Create attendance session with short 5-character code
        const sessionId = Math.random().toString(36).substring(2, 7).toUpperCase();
        const qrGeneratedAt = new Date();
        const qrExpiresAt = new Date(qrGeneratedAt.getTime() + qrValidityMinutes * 60000);

        const session = new AttendanceSession({
            sessionId,
            groupId,
            groupName: group.name,
            teacherId: req.teacher._id,
            teacherName: req.teacher.fullName,
            formation,
            date: new Date(date),
            classStartTime: new Date(classStartTime),
            classEndTime: new Date(classEndTime),
            qrGeneratedAt,
            qrExpiresAt,
            lateThresholdMinutes,
            status: 'active'
        });

        // Get all students in this group who are studying this formation
        const isBranch = ['Gériatrie', 'Aide soignant', 'Agent socio éducatif', 'Assistante sociale', 'Restauration', 'Cuisine', 'Informatique', 'Gestion hôtelière'].includes(formation);
        
        let studentQuery = {
            group: groupId,
            status: 'active'
        };

        if (isBranch) {
            studentQuery.filiere = formation;
        } else {
            studentQuery.formation = formation;
        }

        const students = await ManagedStudent.find(studentQuery);
        session.totalStudents = students.length;

        // Create attendance records for all students (default: pending)
        const attendanceRecords = students.map(student => ({
            sessionId,
            session: session._id,
            studentId: student._id,
            studentName: student.fullName,
            studentEmail: student.schoolEmail,
            groupId,
            groupName: group.name,
            teacherId: req.teacher._id,
            teacherName: req.teacher.fullName,
            formation,
            date: new Date(date),
            status: 'pending',
            qrGeneratedAt,
            qrExpiresAt,
            markedAbsentAutomatically: false
        }));

        await session.save();
        await AttendanceRecord.insertMany(attendanceRecords);

        // Generate QR code data
        const qrData = {
            sessionId,
            groupId,
            formation,
            timestamp: qrGeneratedAt.toISOString(),
            expiresAt: qrExpiresAt.toISOString()
        };

        // Generate QR code image
        const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData));

        res.json({
            success: true,
            session: {
                sessionId,
                groupName: group.name,
                formation,
                date,
                classStartTime,
                classEndTime,
                qrGeneratedAt,
                qrExpiresAt,
                totalStudents: students.length,
                qrValidityMinutes,
                lateThresholdMinutes
            },
            qrCode: qrCodeImage,
            qrData
        });

    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ error: 'Failed to generate QR code', details: error.message });
    }
});

// Cancel/Stop attendance session (for accidental generation)
router.delete('/cancel/:sessionId', verifyToken, verifyTeacher, async (req, res) => {
    try {
        const { sessionId } = req.params;

        // Find the session
        const session = await AttendanceSession.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Verify teacher owns this session
        if (session.teacherId.toString() !== req.teacher._id.toString()) {
            return res.status(403).json({ error: 'You can only cancel your own sessions' });
        }

        // Check if session is still active (not expired)
        if (session.status !== 'active') {
            return res.status(400).json({ error: 'Session is already closed or expired' });
        }

        // Mark session as cancelled
        session.status = 'cancelled';
        await session.save();

        // Delete all pending/absent attendance records for this session
        // This prevents students from being marked absent for a mistaken session
        const deleteResult = await AttendanceRecord.deleteMany({
            sessionId: sessionId,
            status: { $in: ['pending', 'absent'] },
            scanTime: null  // Only delete records where students haven't scanned yet
        });

        console.log(`🚫 Session ${sessionId} cancelled by ${req.teacher.fullName}`);
        console.log(`   Deleted ${deleteResult.deletedCount} pending/absent records`);

        res.json({
            success: true,
            message: 'Session cancelled successfully',
            deletedRecords: deleteResult.deletedCount,
            session: {
                sessionId: session.sessionId,
                groupName: session.groupName,
                formation: session.formation,
                status: session.status
            }
        });

    } catch (error) {
        console.error('Error cancelling session:', error);
        res.status(500).json({ error: 'Failed to cancel session', details: error.message });
    }
});

// Get teacher's active sessions
router.get('/teacher/sessions', verifyToken, verifyTeacher, async (req, res) => {
    try {
        const { status, date, groupId } = req.query;

        let query = { teacherId: req.teacher._id };

        if (status) {
            query.status = status;
        }

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.date = { $gte: startDate, $lte: endDate };
        }

        if (groupId) {
            query.groupId = groupId;
        }

        const sessions = await AttendanceSession.find(query)
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ success: true, sessions });

    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Failed to fetch sessions', details: error.message });
    }
});

// Get session details with attendance records
router.get('/teacher/sessions/:sessionId', verifyToken, verifyTeacher, async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await AttendanceSession.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Verify teacher owns this session
        if (session.teacherId.toString() !== req.teacher._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const records = await AttendanceRecord.find({ sessionId })
            .sort({ studentName: 1 });

        res.json({
            success: true,
            session,
            records,
            stats: {
                total: session.totalStudents,
                present: session.presentCount,
                late: session.lateCount,
                absent: session.absentCount
            }
        });

    } catch (error) {
        console.error('Error fetching session details:', error);
        res.status(500).json({ error: 'Failed to fetch session details', details: error.message });
    }
});

// ==================== STUDENT ROUTES ====================

// Scan QR Code
router.post('/scan', verifyToken, verifyStudent, async (req, res) => {
    try {
        const { sessionId, timestamp } = req.body;
        let { groupId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: 'Missing session ID' });
        }

        // Find the session
        const session = await AttendanceSession.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({ error: 'Invalid session ID - session not found' });
        }

        // Get groupId from session if not provided
        if (!groupId) {
            groupId = session.groupId.toString();
        }

        // Check if session is still valid or in late period
        const isValidForPresent = session.isValid();
        const isValidForLate = session.isInLatePeriod();
        
        if (!isValidForPresent && !isValidForLate) {
            return res.status(400).json({ error: 'Session has expired. Late period has ended.' });
        }

        // Verify student belongs to this group
        if (req.student.group.toString() !== groupId) {
            return res.status(403).json({ error: 'You are not enrolled in this group' });
        }

        // Verify student is studying this formation
        const isBranch = ['Gériatrie', 'Aide soignant', 'Agent socio éducatif', 'Assistante sociale', 'Restauration', 'Cuisine', 'Informatique', 'Gestion hôtelière'].includes(session.formation);
        
        const isEnrolled = isBranch 
            ? req.student.filiere.includes(session.formation)
            : req.student.formation.includes(session.formation);

        if (!isEnrolled) {
            return res.status(403).json({ error: `You are not enrolled in ${session.formation}` });
        }

        // Find existing attendance record
        const existingRecord = await AttendanceRecord.findOne({
            sessionId,
            studentId: req.student._id
        });

        if (!existingRecord) {
            return res.status(404).json({ error: 'Attendance record not found' });
        }

        // Check if already scanned (allow pending or absent to be updated)
        if (existingRecord.status === 'present' || existingRecord.status === 'late') {
            return res.json({
                success: true,
                message: 'Already marked',
                status: existingRecord.status,
                scanTime: existingRecord.scanTime
            });
        }

        // Determine if late or present
        const scanTime = new Date();
        const isLate = session.isLate(scanTime);
        const newStatus = isLate ? 'late' : 'present';

        // Update attendance record
        existingRecord.status = newStatus;
        existingRecord.scanTime = scanTime;
        existingRecord.deviceInfo = req.headers['user-agent'];
        existingRecord.ipAddress = req.ip;
        await existingRecord.save();

        // Update session counts
        if (newStatus === 'present') {
            session.presentCount += 1;
        } else {
            session.lateCount += 1;
        }
        session.absentCount = session.totalStudents - session.presentCount - session.lateCount;
        await session.save();

        res.json({
            success: true,
            message: `Marked as ${newStatus}`,
            status: newStatus,
            scanTime,
            session: {
                groupName: session.groupName,
                formation: session.formation,
                teacherName: session.teacherName,
                date: session.date
            }
        });

    } catch (error) {
        console.error('Error scanning QR code:', error);
        res.status(500).json({ error: 'Failed to scan QR code', details: error.message });
    }
});

// Get student's attendance history
router.get('/student/history', verifyToken, verifyStudent, async (req, res) => {
    try {
        const { formation, startDate, endDate, limit = 50 } = req.query;

        let query = { studentId: req.student._id };

        if (formation) {
            query.formation = formation;
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate);
            }
        }

        const records = await AttendanceRecord.find(query)
            .sort({ date: -1 })
            .limit(parseInt(limit));

        // Calculate statistics
        const stats = {
            total: records.length,
            present: records.filter(r => r.status === 'present').length,
            late: records.filter(r => r.status === 'late').length,
            absent: records.filter(r => r.status === 'absent').length
        };

        stats.attendanceRate = stats.total > 0 
            ? ((stats.present + stats.late) / stats.total * 100).toFixed(2)
            : 0;

        res.json({ success: true, records, stats });

    } catch (error) {
        console.error('Error fetching attendance history:', error);
        res.status(500).json({ error: 'Failed to fetch attendance history', details: error.message });
    }
});

// ==================== ADMIN ROUTES ====================

// Get available seasons for export dropdown
router.get('/admin/seasons', authenticateAdmin, async (req, res) => {
    try {
        const seasons = await Season.find()
            .sort({ startDate: -1 })
            .select('name startDate endDate status')
            .limit(10);
        
        res.json({ success: true, seasons });
    } catch (error) {
        console.error('Error fetching seasons:', error);
        res.status(500).json({ error: 'Failed to fetch seasons', details: error.message });
    }
});

// Get all attendance records with filters
router.get('/admin/records', authenticateAdmin, async (req, res) => {
    try {
        const { groupId, teacherId, studentId, formation, status, startDate, endDate, season, page = 1, limit = 50 } = req.query;

        let query = {};

        // Filter by season (default to active season)
        if (season) {
            // If season specified, filter by that season's groups
            const seasonGroups = await Group.find({ season: season }).select('_id');
            const seasonGroupIds = seasonGroups.map(g => g._id.toString());
            
            if (groupId) {
                // If specific group requested, check if it's in the season
                if (seasonGroupIds.includes(groupId)) {
                    query.groupId = groupId;
                } else {
                    // Group not in this season, return empty
                    return res.json({
                        success: true,
                        records: [],
                        pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), pages: 0 }
                    });
                }
            } else {
                // Filter by all groups in the season
                query.groupId = { $in: seasonGroupIds };
            }
        } else {
            // Default: filter by active season
            const activeSeason = await Season.findOne({ status: 'active' });
            if (activeSeason) {
                const activeSeasonGroups = await Group.find({ season: activeSeason._id }).select('_id');
                const activeSeasonGroupIds = activeSeasonGroups.map(g => g._id.toString());
                
                if (groupId) {
                    if (activeSeasonGroupIds.includes(groupId)) {
                        query.groupId = groupId;
                    } else {
                        return res.json({
                            success: true,
                            records: [],
                            pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), pages: 0 }
                        });
                    }
                } else {
                    query.groupId = { $in: activeSeasonGroupIds };
                }
            } else if (groupId) {
                query.groupId = groupId;
            }
        }

        if (teacherId) query.teacherId = teacherId;
        if (studentId) query.studentId = studentId;
        if (formation) query.formation = formation;
        if (status) query.status = status;

        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate);
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [records, total] = await Promise.all([
            AttendanceRecord.find(query)
                .sort({ date: -1, studentName: 1 })
                .skip(skip)
                .limit(parseInt(limit)),
            AttendanceRecord.countDocuments(query)
        ]);

        res.json({
            success: true,
            records,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error fetching attendance records:', error);
        res.status(500).json({ error: 'Failed to fetch attendance records', details: error.message });
    }
});

// Get attendance statistics
router.get('/admin/stats', authenticateAdmin, async (req, res) => {
    try {
        const { groupId, teacherId, studentId, formation, startDate, endDate, season } = req.query;

        let query = {};

        // Filter by season (default to active season)
        if (season) {
            const seasonGroups = await Group.find({ season: season }).select('_id');
            const seasonGroupIds = seasonGroups.map(g => g._id.toString());
            
            if (groupId) {
                if (seasonGroupIds.includes(groupId)) {
                    query.groupId = groupId;
                } else {
                    return res.json({ success: true, stats: { total: 0, present: 0, late: 0, absent: 0 } });
                }
            } else {
                query.groupId = { $in: seasonGroupIds };
            }
        } else {
            const activeSeason = await Season.findOne({ status: 'active' });
            if (activeSeason) {
                const activeSeasonGroups = await Group.find({ season: activeSeason._id }).select('_id');
                const activeSeasonGroupIds = activeSeasonGroups.map(g => g._id.toString());
                
                if (groupId) {
                    if (activeSeasonGroupIds.includes(groupId)) {
                        query.groupId = groupId;
                    } else {
                        return res.json({ success: true, stats: { total: 0, present: 0, late: 0, absent: 0 } });
                    }
                } else {
                    query.groupId = { $in: activeSeasonGroupIds };
                }
            } else if (groupId) {
                query.groupId = groupId;
            }
        }

        if (teacherId) query.teacherId = teacherId;
        if (studentId) query.studentId = studentId;
        if (formation) query.formation = formation;

        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate);
            }
        }

        const records = await AttendanceRecord.find(query);

        const stats = {
            total: records.length,
            present: records.filter(r => r.status === 'present').length,
            late: records.filter(r => r.status === 'late').length,
            absent: records.filter(r => r.status === 'absent').length
        };

        stats.attendanceRate = stats.total > 0 
            ? ((stats.present + stats.late) / stats.total * 100).toFixed(2)
            : 0;

        // Group by student for individual stats
        const studentStats = {};
        records.forEach(record => {
            const studentId = record.studentId.toString();
            if (!studentStats[studentId]) {
                studentStats[studentId] = {
                    studentId,
                    studentName: record.studentName,
                    studentEmail: record.studentEmail,
                    total: 0,
                    present: 0,
                    late: 0,
                    absent: 0
                };
            }
            studentStats[studentId].total++;
            studentStats[studentId][record.status]++;
        });

        // Calculate attendance rate for each student
        Object.values(studentStats).forEach(student => {
            student.attendanceRate = ((student.present + student.late) / student.total * 100).toFixed(2);
        });

        res.json({
            success: true,
            overall: stats,
            byStudent: Object.values(studentStats).sort((a, b) => b.attendanceRate - a.attendanceRate)
        });

    } catch (error) {
        console.error('Error fetching attendance stats:', error);
        res.status(500).json({ error: 'Failed to fetch attendance stats', details: error.message });
    }
});

// Get all sessions
router.get('/admin/sessions', authenticateAdmin, async (req, res) => {
    try {
        const { status, groupId, teacherId, startDate, endDate, page = 1, limit = 50 } = req.query;

        let query = {};

        if (status) query.status = status;
        if (groupId) query.groupId = groupId;
        if (teacherId) query.teacherId = teacherId;

        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate);
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [sessions, total] = await Promise.all([
            AttendanceSession.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            AttendanceSession.countDocuments(query)
        ]);

        res.json({
            success: true,
            sessions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Failed to fetch sessions', details: error.message });
    }
});

// ==================== AUTOMATED ABSENCE MARKING ====================

// Mark absent students for expired sessions (called by cron job)
router.post('/auto-mark-absent', async (req, res) => {
    try {
        // Find all active sessions that have expired
        const now = new Date();
        const expiredSessions = await AttendanceSession.find({
            status: 'active',
            qrExpiresAt: { $lt: now }
        });

        let totalMarked = 0;

        for (const session of expiredSessions) {
            // Mark all absent records as automatically marked
            const result = await AttendanceRecord.updateMany(
                {
                    sessionId: session.sessionId,
                    status: 'absent',
                    markedAbsentAutomatically: false
                },
                {
                    $set: { markedAbsentAutomatically: true }
                }
            );

            totalMarked += result.modifiedCount;

            // Update session status
            session.status = 'expired';
            await session.save();
        }

        res.json({
            success: true,
            message: `Marked ${totalMarked} students as absent across ${expiredSessions.length} sessions`,
            sessionsProcessed: expiredSessions.length,
            studentsMarked: totalMarked
        });

    } catch (error) {
        console.error('Error auto-marking absent:', error);
        res.status(500).json({ error: 'Failed to auto-mark absent', details: error.message });
    }
});

// Clear all presence records (with optional filters) - Admin only - DELETE
router.delete('/admin/clear-presences', authenticateAdmin, async (req, res) => {
    try {
        const { groupId, formation, startDate, endDate, status } = req.query;

        // Build query for presence records only
        let query = { status: status || 'present' };

        if (groupId) {
            query.groupId = groupId;
        }

        if (formation) {
            query.formation = formation;
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate);
            }
        }

        // Delete all matching presence records
        const result = await AttendanceRecord.deleteMany(query);

        console.log(`🗑️ Admin deleted ${result.deletedCount} presence record(s)`);
        console.log(`   Filters: ${JSON.stringify(query)}`);

        res.json({
            success: true,
            message: `${result.deletedCount} presence record(s) permanently deleted`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('Error clearing presences:', error);
        res.status(500).json({ success: false, message: 'Failed to clear presences', error: error.message });
    }
});

// Clear all absence records (with optional filters) - Admin only - DELETE
router.delete('/admin/clear-absences', authenticateAdmin, async (req, res) => {
    try {
        const { groupId, formation, startDate, endDate, status } = req.query;

        // Build query for absence records only
        let query = { status: status || 'absent' };

        if (groupId) {
            query.groupId = groupId;
        }

        if (formation) {
            query.formation = formation;
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate);
            }
        }

        // Delete all matching absence records
        const result = await AttendanceRecord.deleteMany(query);

        console.log(`🗑️ Admin deleted ${result.deletedCount} absence record(s)`);
        console.log(`   Filters: ${JSON.stringify(query)}`);

        res.json({
            success: true,
            message: `${result.deletedCount} absence record(s) permanently deleted`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('Error clearing absences:', error);
        res.status(500).json({ success: false, message: 'Failed to clear absences', error: error.message });
    }
});

// Clear all presences (Admin only)
router.post('/clear-presences', authenticateAdmin, async (req, res) => {
    try {
        console.log('🗑️ Admin clearing all presence records...');
        
        // Update all attendance records to set presence-related fields to 0
        const result = await AttendanceRecord.updateMany(
            {},
            {
                $set: {
                    presenceCount: 0,
                    status: 'absent' // Reset status since no presences
                }
            }
        );
        
        console.log(`✅ Cleared presence records for ${result.modifiedCount} attendance records`);
        
        res.json({
            success: true,
            message: `All presence records cleared successfully (${result.modifiedCount} records updated)`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error clearing presences:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to clear presence records', 
            error: error.message 
        });
    }
});

// Clear all absences (Admin only)
router.post('/clear-absences', authenticateAdmin, async (req, res) => {
    try {
        console.log('🗑️ Admin clearing all absence records...');
        
        // Update all attendance records to set absence-related fields to 0
        const result = await AttendanceRecord.updateMany(
            {},
            {
                $set: {
                    absenceCount: 0,
                    status: 'present' // Reset status since no absences
                }
            }
        );
        
        console.log(`✅ Cleared absence records for ${result.modifiedCount} attendance records`);
        
        res.json({
            success: true,
            message: `All absence records cleared successfully (${result.modifiedCount} records updated)`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error clearing absences:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to clear absence records', 
            error: error.message 
        });
    }
});

// Export monthly attendance to PDF or Excel (Admin only)
router.get('/export/monthly', authenticateAdmin, async (req, res) => {
    try {
        const { groupId, season, month, format = 'pdf' } = req.query;
        
        // Validation
        if (!groupId || !season || !month) {
            return res.status(400).json({ 
                error: 'Missing required parameters',
                message: 'Please provide groupId, season, and month'
            });
        }
        
        console.log(`📊 Admin exporting ${format.toUpperCase()} attendance for group: ${groupId}, season: ${season}, month: ${month}`);
        
        // Get group details
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        
        console.log(`📋 Group Details: ${group.name} (Type: ${group.groupType}, Formation: ${group.formation})`);
        
        // Parse month and year from format "2025-10" (YYYY-MM)
        const [year, monthNum] = month.split('-').map(Number);
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                           'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        const monthName = monthNames[monthNum - 1];
        
        // Calculate date range for the month
        const startDate = new Date(year, monthNum - 1, 1); // First day of month
        const endDate = new Date(year, monthNum, 0, 23, 59, 59); // Last day of month
        
        // Get attendance records for this month
        const attendanceRecords = await AttendanceRecord.find({
            groupId: groupId,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1, studentName: 1 });
        
        // Get unique students from attendance records
        const uniqueStudentIds = [...new Set(attendanceRecords.map(r => r.studentId.toString()))];
        let totalStudents = uniqueStudentIds.length;
        
        // If no attendance records, get total students in the group as fallback
        if (totalStudents === 0) {
            // Try to find students in this group
            const studentsInGroup = await ManagedStudent.find({
                group: groupId,
                status: 'active'
            });
            
            console.log(`📊 Group ${group.name} (${groupId}): Found ${studentsInGroup.length} active students`);
            
            totalStudents = studentsInGroup.length;
            
            // If still 0, try with string comparison (in case of ObjectId vs string mismatch)
            if (totalStudents === 0) {
                const allStudents = await ManagedStudent.find({ status: 'active' });
                const matchingStudents = allStudents.filter(s => s.group && s.group.toString() === groupId.toString());
                totalStudents = matchingStudents.length;
                console.log(`📊 Fallback search: Found ${totalStudents} students with matching group ID`);
            }
        }
        
        // Helper function to get day name in French
        const getDayName = (date) => {
            const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S']; // Dimanche, Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi
            return days[date.getDay()];
        };
        
        // Helper function to check if day should be included
        const shouldIncludeDay = (date, groupType) => {
            const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
            
            // Always exclude Sunday
            if (dayOfWeek === 0) return false;
            
            // For language groups: Monday-Friday only (exclude Saturday)
            if (groupType === 'language' && dayOfWeek === 6) return false;
            
            // For branch groups: Monday-Saturday (Sunday already excluded)
            return true;
        };
        
        // Build calendar days for the month
        const calendarDays = [];
        const daysInMonth = new Date(year, monthNum, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, monthNum - 1, day);
            
            if (shouldIncludeDay(date, group.groupType)) {
                calendarDays.push({
                    day: day,
                    dayName: getDayName(date),
                    date: date,
                    weekNumber: Math.ceil(day / 7)
                });
            }
        }
        
        // Get all students for this group (language or branch)
        const fieldName = group.groupType === 'language' ? 'group' : 'branchSubgroup';
        const students = await ManagedStudent.find({
            [fieldName]: groupId,
            status: 'active'
        }).sort({ fullName: 1 });
        
        totalStudents = students.length;
        
        // Build attendance matrix: student -> day -> status
        const attendanceMatrix = {};
        students.forEach(student => {
            attendanceMatrix[student._id.toString()] = {};
        });
        
        // Fill in attendance data
        attendanceRecords.forEach(record => {
            const studentId = record.studentId.toString();
            const recordDate = new Date(record.date);
            const dayKey = recordDate.getDate();
            
            if (attendanceMatrix[studentId]) {
                attendanceMatrix[studentId][dayKey] = {
                    status: record.status,
                    time: record.scanTime,
                    notes: record.notes
                };
            }
        });
        
        // Calculate statistics
        const totalRecords = attendanceRecords.length;
        const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
        const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
        const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
        const attendanceRate = totalRecords > 0 
            ? ((presentCount + lateCount) / totalRecords * 100).toFixed(1)
            : 0;
        
        if (format === 'pdf') {
            // Generate PDF
            const PDFDocument = require('pdfkit');
            const fs = require('fs');
            const path = require('path');
            
            // Use landscape if more than 7 students, portrait otherwise
            const useLandscape = students.length > 7;
            const doc = new PDFDocument({ 
                size: 'A4',
                layout: useLandscape ? 'landscape' : 'portrait',
                margin: 50,
                bufferPages: true
            });
            
            // Set response headers for PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 
                `attachment; filename=Rapport-Presence-${group.name}-${monthName}-${year}.pdf`);
            
            doc.pipe(res);
            
            // Add school logo centered at top
            const logoPath = path.join(__dirname, '../Img/logo.png');
            let currentY = 40;
            
            if (fs.existsSync(logoPath)) {
                // Center the logo (A4 width = 595, logo width = 80)
                const logoWidth = 80;
                const logoX = (595 - logoWidth) / 2;
                doc.image(logoPath, logoX, currentY, { width: logoWidth });
                currentY += logoWidth + 15; // Logo height + spacing
            } else {
                currentY += 20;
            }
            
            // School name centered below logo
            doc.fontSize(24).font('Helvetica-Bold').fillColor('#000000')
               .text('Nisrine School', 50, currentY, { align: 'center', width: 495 });
            currentY += 35;
            
            // Report title in orange/golden color
            doc.fontSize(18).font('Helvetica-Bold').fillColor('#FF9500')
               .text(`Rapport de Présence – ${monthName} ${year}`, 50, currentY, { align: 'center', width: 495 });
            currentY += 35;
            
            // Group, Season, and Export date
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000')
               .text(`Groupe: ${group.name}`, 50, currentY, { align: 'center', width: 495 });
            currentY += 20;
            
            doc.fontSize(12).font('Helvetica')
               .text(`Saison: ${season}`, 50, currentY, { align: 'center', width: 495 });
            currentY += 20;
            
            doc.fontSize(11).fillColor('#666666')
               .text(`Date d'exportation: ${new Date().toLocaleDateString('fr-FR')}`, 50, currentY, { align: 'center', width: 495 });
            currentY += 25;
            
            // Draw line separator
            doc.strokeColor('#000000').lineWidth(1);
            doc.moveTo(67, currentY).lineTo(528, currentY).stroke();
            currentY += 20;
            
            // Summary Section
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000')
               .text('Résumé', 67, currentY);
            currentY += 25;
            
            doc.fontSize(11).font('Helvetica').fillColor('#000000');
            doc.text(`Total Étudiants: ${totalStudents}`, 67, currentY);
            currentY += 20;
            doc.text(`Présents: ${presentCount} | Retards: ${lateCount} | Absents: ${absentCount}`, 67, currentY);
            currentY += 20;
            doc.text(`Taux de Présence: ${attendanceRate}%`, 67, currentY);
            currentY += 30;
            
            // Draw line separator
            doc.strokeColor('#000000').lineWidth(1);
            doc.moveTo(67, currentY).lineTo(528, currentY).stroke();
            currentY += 20;
            
            // Calendar-style Attendance Table (Days as ROWS, Students as COLUMNS)
            let tableY = currentY;
            
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000')
               .text('Feuille de Présence Mensuelle', 67, tableY);
            
            tableY += 30;
            
            // Table configuration - VERTICAL layout (days as rows)
            const pageWidth = useLandscape ? 842 : 595; // A4 landscape = 842, portrait = 595
            const startX = 50;
            const dayColWidth = 40; // Width for day number + name column
            const studentColWidth = useLandscape ? 50 : 60; // Narrower columns in landscape for more students
            const maxStudentsPerPage = Math.floor((pageWidth - startX - dayColWidth - 50) / studentColWidth);
            
            // Split students into pages if needed
            const studentPages = [];
            for (let i = 0; i < students.length; i += maxStudentsPerPage) {
                studentPages.push(students.slice(i, i + maxStudentsPerPage));
            }
            
            // Draw table for each page of students
            studentPages.forEach((pageStudents, pageIndex) => {
                if (pageIndex > 0) {
                    doc.addPage();
                    tableY = 50;
                }
                
                // Helper function to draw header row
                const drawHeaderRow = () => {
                    doc.fontSize(8).font('Helvetica-Bold');
                    
                    // Day/Date header cell
                    doc.rect(startX, tableY, dayColWidth, 30).fillAndStroke('#4B5563', '#374151');
                    doc.fillColor('#FFFFFF').text('Date', startX + 2, tableY + 10, { 
                        width: dayColWidth - 4, 
                        align: 'center' 
                    });
                    
                    // Student name headers
                    pageStudents.forEach((student, index) => {
                        const studentX = startX + dayColWidth + (index * studentColWidth);
                        doc.rect(studentX, tableY, studentColWidth, 30).fillAndStroke('#FFCC00', '#FF9500');
                        doc.fillColor('#000000').fontSize(7).text(student.fullName, studentX + 2, tableY + 5, { 
                            width: studentColWidth - 4, 
                            align: 'center',
                            ellipsis: true
                        });
                    });
                    
                    tableY += 30;
                };
                
                // Draw initial header
                drawHeaderRow();
                
                // Draw day rows (days as rows, students as columns)
                let currentWeek = null;
                calendarDays.forEach((dayInfo, dayIndex) => {
                    const rowHeight = 18;
                    
                    // Check if we need a new page (leave room for header + at least 5 rows)
                    if (tableY + rowHeight > 750) {
                        doc.addPage();
                        tableY = 50;
                        
                        // Repeat header on new page
                        drawHeaderRow();
                        currentWeek = null;
                    }
                    
                    // Draw week separator line
                    if (currentWeek !== null && dayInfo.weekNumber !== currentWeek) {
                        doc.strokeColor('#FF9500').lineWidth(2);
                        doc.moveTo(startX, tableY).lineTo(startX + dayColWidth + (pageStudents.length * studentColWidth), tableY).stroke();
                        tableY += 2;
                    }
                    currentWeek = dayInfo.weekNumber;
                    
                    // Alternate row colors
                    if (dayIndex % 2 === 0) {
                        doc.rect(startX, tableY, dayColWidth + (pageStudents.length * studentColWidth), rowHeight).fill('#F9FAFB');
                    }
                    
                    // Day cell
                    doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000');
                    doc.text(`${dayInfo.day} ${dayInfo.dayName}`, startX + 2, tableY + 5, { 
                        width: dayColWidth - 4, 
                        align: 'center' 
                    });
                    
                    // Draw cell border for day
                    doc.strokeColor('#E5E7EB').lineWidth(0.5);
                    doc.rect(startX, tableY, dayColWidth, rowHeight).stroke();
                    
                    // Student attendance cells for this day
                    pageStudents.forEach((student, studentIndex) => {
                        const studentX = startX + dayColWidth + (studentIndex * studentColWidth);
                        const studentId = student._id.toString();
                        const attendance = attendanceMatrix[studentId][dayInfo.day];
                        
                        // Draw cell border
                        doc.strokeColor('#E5E7EB').lineWidth(0.5);
                        doc.rect(studentX, tableY, studentColWidth, rowHeight).stroke();
                        
                        // Fill cell with status indicator
                        if (attendance) {
                            let statusSymbol = '';
                            let statusColor = '#000000';
                            
                            if (attendance.status === 'present') {
                                statusSymbol = 'P';
                                statusColor = '#10b981';
                            } else if (attendance.status === 'late') {
                                statusSymbol = 'R';
                                statusColor = '#f59e0b';
                            } else if (attendance.status === 'absent') {
                                statusSymbol = 'A';
                                statusColor = '#ef4444';
                            }
                            
                            doc.fontSize(9).font('Helvetica-Bold').fillColor(statusColor);
                            doc.text(statusSymbol, studentX + 2, tableY + 4, { 
                                width: studentColWidth - 4, 
                                align: 'center' 
                            });
                        }
                    });
                    
                    tableY += rowHeight;
                });
            });
            
            // Footer
            const pageCount = doc.bufferedPageRange().count;
            for (let i = 0; i < pageCount; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).fillColor('#6b7280');
                doc.text(
                    `Généré par Nisrine School Attendance System © ${year}`,
                    50,
                    doc.page.height - 50,
                    { align: 'center' }
                );
                doc.text(
                    `Page ${i + 1} sur ${pageCount}`,
                    50,
                    doc.page.height - 35,
                    { align: 'center' }
                );
            }
            
            doc.end();
            console.log(`✅ PDF exported successfully for ${group.name} - ${monthName} ${year}`);
            
        } else if (format === 'excel') {
            // Generate Excel
            const ExcelJS = require('exceljs');
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Nisrine School';
            workbook.created = new Date();
            
            // Main sheet with attendance details
            const sheet = workbook.addWorksheet(`${monthName} ${year}`, {
                views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
            });
            
            // Calculate last column letter for merging (based on number of students)
            const lastColIndex = Math.min(students.length, 25); // Limit to A-Z
            const lastCol = String.fromCharCode(65 + lastColIndex);
            
            // Add title rows
            sheet.mergeCells(`A1:${lastCol}1`);
            const titleRow = sheet.getCell('A1');
            titleRow.value = `Rapport de Présence – ${monthName} ${year}`;
            titleRow.font = { bold: true, size: 16, color: { argb: 'FF1f2937' } };
            titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
            titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCC00' } };
            sheet.getRow(1).height = 30;
            
            // Info rows
            sheet.mergeCells(`A2:${lastCol}2`);
            sheet.getCell('A2').value = `Groupe: ${group.name} | Saison: ${season}`;
            sheet.getCell('A2').font = { bold: true, size: 12 };
            sheet.getCell('A2').alignment = { horizontal: 'center' };
            
            sheet.mergeCells(`A3:${lastCol}3`);
            sheet.getCell('A3').value = `Date d'exportation: ${new Date().toLocaleDateString('fr-FR')}`;
            sheet.getCell('A3').alignment = { horizontal: 'center' };
            
            // Summary section
            sheet.addRow([]);
            const summaryRow1 = sheet.addRow(['Résumé']);
            summaryRow1.font = { bold: true, size: 14 };
            summaryRow1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
            
            sheet.addRow(['Total Étudiants:', totalStudents]);
            sheet.addRow(['Présents:', presentCount]);
            sheet.addRow(['Retards:', lateCount]);
            sheet.addRow(['Absents:', absentCount]);
            sheet.addRow(['Taux de Présence:', `${attendanceRate}%`]);
            
            // Empty row before table
            sheet.addRow([]);
            
            // Calendar-style table header (Days as ROWS, Students as COLUMNS)
            const headerRowData = ['Date'];
            students.forEach(student => {
                headerRowData.push(student.fullName);
            });
            
            const headerRow = sheet.addRow(headerRowData);
            headerRow.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCC00' } };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            headerRow.height = 30;
            
            // Set column widths
            sheet.getColumn(1).width = 10; // Date column
            for (let i = 2; i <= students.length + 1; i++) {
                sheet.getColumn(i).width = 15; // Student columns
            }
            
            // Add day rows with attendance data
            let lastWeek = null;
            calendarDays.forEach((dayInfo, dayIndex) => {
                // Add week separator row
                if (lastWeek !== null && dayInfo.weekNumber !== lastWeek) {
                    const separatorRow = sheet.addRow([]);
                    separatorRow.height = 3;
                    separatorRow.eachCell((cell) => {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF9500' } };
                    });
                }
                lastWeek = dayInfo.weekNumber;
                
                const rowData = [`${dayInfo.day} ${dayInfo.dayName}`];
                
                // Add attendance for each student
                students.forEach(student => {
                    const studentId = student._id.toString();
                    const attendance = attendanceMatrix[studentId][dayInfo.day];
                    let cellValue = '';
                    
                    if (attendance) {
                        if (attendance.status === 'present') cellValue = 'P';
                        else if (attendance.status === 'late') cellValue = 'R';
                        else if (attendance.status === 'absent') cellValue = 'A';
                    }
                    
                    rowData.push(cellValue);
                });
                
                const row = sheet.addRow(rowData);
                row.alignment = { vertical: 'middle', horizontal: 'center' };
                row.height = 18;
                
                // Alternate row colors
                if (dayIndex % 2 === 0) {
                    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
                }
                
                // Style date cell
                row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
                row.getCell(1).font = { bold: true, size: 10 };
                
                // Color attendance cells
                students.forEach((student, studentIndex) => {
                    const colIndex = studentIndex + 2;
                    const cell = row.getCell(colIndex);
                    const studentId = student._id.toString();
                    const attendance = attendanceMatrix[studentId][dayInfo.day];
                    
                    // Color based on status
                    if (attendance) {
                        cell.font = { bold: true, size: 10 };
                        if (attendance.status === 'present') {
                            cell.font = { ...cell.font, color: { argb: 'FF10b981' } };
                        } else if (attendance.status === 'late') {
                            cell.font = { ...cell.font, color: { argb: 'FFf59e0b' } };
                        } else if (attendance.status === 'absent') {
                            cell.font = { ...cell.font, color: { argb: 'FFef4444' } };
                        }
                    }
                });
            });
            
            // Add borders to all cells
            sheet.eachRow((row, rowNumber) => {
                if (rowNumber >= 12) { // Start from table headers
                    row.eachCell((cell) => {
                        cell.border = {
                            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
                        };
                    });
                }
            });
            
            // Set response headers for Excel
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 
                `attachment; filename=Rapport-Presence-${group.name}-${monthName}-${year}.xlsx`);
            
            // Write to response
            await workbook.xlsx.write(res);
            res.end();
            
            console.log(`✅ Excel exported successfully for ${group.name} - ${monthName} ${year}`);
        } else {
            return res.status(400).json({ error: 'Invalid format. Use "pdf" or "excel"' });
        }
        
    } catch (error) {
        console.error('Error exporting monthly attendance:', error);
        res.status(500).json({ 
            error: 'Failed to export attendance', 
            message: error.message 
        });
    }
});

// Export group attendance to Excel (Admin only) - Legacy endpoint
router.get('/export/group/:groupId', authenticateAdmin, async (req, res) => {
    try {
        const { groupId } = req.params;
        
        console.log(`📊 Admin exporting attendance for group: ${groupId}`);
        
        // Get group details
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        
        // Get all students in the group
        const students = await ManagedStudent.find({ 
            group: groupId,
            status: 'active'
        }).sort({ fullName: 1 });
        
        // Get attendance records for these students
        const studentIds = students.map(s => s._id);
        const attendanceRecords = await AttendanceRecord.find({
            student: { $in: studentIds }
        }).populate('student').sort({ date: -1 });
        
        // Create Excel file using ExcelJS
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Attendance');
        
        // Add headers
        worksheet.columns = [
            { header: 'Student Name', key: 'name', width: 25 },
            { header: 'Total Present', key: 'present', width: 15 },
            { header: 'Total Late', key: 'late', width: 15 },
            { header: 'Total Absent', key: 'absent', width: 15 },
            { header: 'Attendance Rate', key: 'rate', width: 15 }
        ];
        
        // Add student data
        students.forEach(student => {
            const studentRecords = attendanceRecords.filter(r => 
                r.student && r.student._id.toString() === student._id.toString()
            );
            
            const presentCount = studentRecords.filter(r => r.status === 'present').length;
            const lateCount = studentRecords.filter(r => r.status === 'late').length;
            const absentCount = studentRecords.filter(r => r.status === 'absent').length;
            const totalSessions = presentCount + lateCount + absentCount;
            const attendanceRate = totalSessions > 0 
                ? ((presentCount + lateCount) / totalSessions * 100).toFixed(2) + '%'
                : 'N/A';
            
            worksheet.addRow({
                name: student.fullName,
                present: presentCount,
                late: lateCount,
                absent: absentCount,
                rate: attendanceRate
            });
        });
        
        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFCC00' }
        };
        
        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Attendance-${group.name}-${new Date().toISOString().split('T')[0]}.xlsx`
        );
        
        // Write to response
        await workbook.xlsx.write(res);
        res.end();
        
        console.log(`✅ Exported attendance for ${students.length} students in group ${group.name}`);
    } catch (error) {
        console.error('Error exporting attendance:', error);
        res.status(500).json({ 
            error: 'Failed to export attendance', 
            message: error.message 
        });
    }
});

module.exports = router;
