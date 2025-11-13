const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const ManagedStudent = require('../models/ManagedStudent');
const Grade = require('../models/Grade');
const Group = require('../models/Group');
const StudentMessage = require('../models/StudentMessage');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Middleware to verify teacher token
const verifyTeacherToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'teacher') {
            return res.status(403).json({ message: 'Access denied. Teachers only.' });
        }
        req.teacher = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Middleware to verify student token
const verifyStudentToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'student') {
            return res.status(403).json({ message: 'Access denied. Students only.' });
        }
        req.student = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// ==================== TEACHER ROUTES ====================

// Teacher login
router.post('/teacher/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const teacher = await Teacher.findOne({ email, status: 'active' });
        if (!teacher) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const isMatch = await teacher.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const token = jwt.sign(
            { 
                id: teacher._id, 
                email: teacher.email, 
                name: teacher.fullName,
                role: 'teacher',
                formations: teacher.formations
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            teacher: {
                id: teacher._id,
                fullName: teacher.fullName,
                email: teacher.email,
                formations: teacher.formations,
                groups: teacher.groups
            }
        });
    } catch (error) {
        console.error('Teacher login error:', error);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Get teacher profile
router.get('/teacher/profile', verifyTeacherToken, async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.teacher.id)
            .populate('groups', 'name formation')
            .select('-password');
        
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        
        res.json(teacher);
    } catch (error) {
        console.error('Get teacher profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get students for teacher (by groups and formations)
router.get('/teacher/students', verifyTeacherToken, async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.teacher.id);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        
        const { formation, groupId } = req.query;
        
        // Check if the formation is a branch or language
        const branchFormations = ['Gériatrie', 'Aide soignant', 'Agent socio éducatif', 'Assistante sociale', 'Restauration', 'Cuisine', 'Informatique', 'Gestion hôtelière'];
        const isBranch = branchFormations.includes(formation);
        
        let studentQuery = { status: 'active' };
        
        // Filter by teacher's assigned groups
        if (groupId) {
            studentQuery.group = groupId;
        } else if (teacher.groups.length > 0) {
            studentQuery.group = { $in: teacher.groups };
        }
        
        // Filter by what the student actually selected
        if (formation) {
            if (isBranch) {
                // Branch teacher - show only students who selected this branch in their filiere array
                studentQuery.filiere = formation;
            } else {
                // Language teacher - show only students who selected this language in their formation array
                studentQuery.formation = formation;
            }
        }
        
        const students = await ManagedStudent.find(studentQuery)
            .populate('group', 'name formation branchFormation')
            .select('fullName schoolEmail formation filiere group groupName photoPath')
            .sort({ fullName: 1 });
        
        res.json(students);
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get groups for teacher
router.get('/teacher/groups', verifyTeacherToken, async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.teacher.id);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        
        const branchFormations = ['Gériatrie', 'Aide soignant', 'Agent socio éducatif', 'Assistante sociale', 'Restauration', 'Cuisine', 'Informatique', 'Gestion hôtelière'];
        const teacherBranches = teacher.formations.filter(f => branchFormations.includes(f));
        const teacherLanguages = teacher.formations.filter(f => !branchFormations.includes(f));
        
        let groupQuery = { status: 'active' };
        
        // Branch teachers see ALL groups (since all groups have branchFormation=Mixed)
        // Language teachers only see groups with their language
        if (teacherBranches.length > 0) {
            // Branch teacher - show all active groups (no filtering by teacher.groups)
            // They can grade students from any group who study their branch
        } else if (teacherLanguages.length > 0) {
            // Language teacher - filter by assigned groups and formation
            if (teacher.groups.length > 0) {
                groupQuery._id = { $in: teacher.groups };
            }
            groupQuery.formation = { $in: teacherLanguages };
        }
        
        const groups = await Group.find(groupQuery).sort({ name: 1 });
        
        // For branch teachers, filter to show only groups that have students studying their branch
        if (teacherBranches.length > 0) {
            const groupsWithStudents = [];
            
            for (const group of groups) {
                const studentCount = await ManagedStudent.countDocuments({
                    status: 'active',
                    group: group._id,
                    filiere: { $in: teacherBranches }
                });
                
                if (studentCount > 0) {
                    groupsWithStudents.push(group);
                }
            }
            
            return res.json(groupsWithStudents);
        }
        
        res.json(groups);
    } catch (error) {
        console.error('Get groups error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload grade (teacher)
router.post('/teacher/grades', verifyTeacherToken, async (req, res) => {
    try {
        const { 
            student: studentId, 
            studentId: altStudentId, 
            formation, 
            examType, 
            score, 
            maxScore, 
            examDate, 
            semester, 
            examNumber, 
            comments, 
            group,
            // NEW: A1-B2 Level System fields
            languageLevel,
            testType,
            testNumber
        } = req.body;
        
        console.log('📝 Grade upload request:', { formation, examType, score, maxScore, languageLevel, testType, testNumber });
        
        // Accept both 'student' and 'studentId' field names
        const actualStudentId = studentId || altStudentId;
        
        if (!actualStudentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }
        
        const student = await ManagedStudent.findById(actualStudentId).populate('group');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        const teacher = await Teacher.findById(req.teacher.id);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        
        console.log('👨‍🏫 Teacher formations:', teacher.formations);
        console.log('📚 Requested formation:', formation);
        console.log('✅ Teacher can upload?', teacher.formations.includes(formation));
        
        // Check if teacher can upload grades for this formation
        if (!teacher.formations.includes(formation)) {
            console.log('❌ Authorization failed!');
            return res.status(403).json({ message: 'You are not authorized to upload grades for this formation' });
        }
        
        // Determine if this is a language or branch formation
        const languageFormations = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];
        const branchFormations = ['Gériatrie', 'Aide soignant', 'Agent socio éducatif', 'Assistante sociale', 'Restauration', 'Cuisine', 'Informatique', 'Gestion hôtelière'];
        const isLanguage = languageFormations.includes(formation);
        const isBranch = branchFormations.includes(formation);
        
        // Validate based on formation type
        if (isLanguage) {
            // Language formations use A1-B2 level system
            if (!languageLevel || !testType) {
                return res.status(400).json({ 
                    message: 'Language level and test type are required for language formations' 
                });
            }
            if (testType === 'miniTest' && (!testNumber || testNumber < 1 || testNumber > 4)) {
                return res.status(400).json({ 
                    message: 'Mini test number must be between 1 and 4' 
                });
            }
        } else if (isBranch) {
            // Branch formations use semester system
            const examNum = examNumber || 1;
            if (examNum < 1 || examNum > 5) {
                return res.status(400).json({ 
                    message: `Invalid exam number. ${formation} supports exams 1-5` 
                });
            }
        }
        
        // Calculate academic year
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const academicYear = month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
        
        console.log('🔍 Looking for existing grade...');
        
        // Check if grade already exists
        let existingGrade;
        if (isLanguage) {
            // For languages, check by level, test type, and test number
            existingGrade = await Grade.findOne({
                student: actualStudentId,
                formation,
                examType: examType,
                languageLevel,
                testType,
                testNumber: testType === 'miniTest' ? testNumber : undefined,
                academicYear
            });
        } else {
            // For branches, check by semester and exam number
            existingGrade = await Grade.findOne({
                student: actualStudentId,
                formation,
                examType: examType,
                semester,
                examNumber: examNumber || 1,
                academicYear
            });
        }
        
        if (existingGrade) {
            console.log('📝 Updating existing grade:', existingGrade._id);
            
            // Update existing grade
            existingGrade.score = score;
            existingGrade.maxScore = maxScore || 100;
            existingGrade.examDate = examDate;
            existingGrade.comments = comments || '';
            existingGrade.uploadedBy = teacher._id;
            existingGrade.uploadedByName = teacher.fullName;
            existingGrade.uploadedByEmail = teacher.email;
            
            await existingGrade.save();
            console.log('✅ Grade updated successfully');
            
            return res.json({ message: 'Grade updated successfully', grade: existingGrade });
        }
        
        // Get group info
        const groupId = group || (student.group ? student.group._id : null);
        const groupName = student.groupName || (student.group ? student.group.name : '');
        
        if (!groupId || !groupName) {
            return res.status(400).json({ message: 'Group information is missing for this student' });
        }
        
        // Create new grade object
        const gradeData = {
            student: actualStudentId,
            studentName: student.fullName,
            studentEmail: student.schoolEmail,
            formation,
            group: groupId,
            groupName: groupName,
            examType: examType,
            score,
            maxScore: maxScore || 100,
            examDate,
            academicYear,
            comments: comments || '',
            uploadedBy: teacher._id,
            uploadedByName: teacher.fullName,
            uploadedByEmail: teacher.email
        };
        
        // Add language-specific or branch-specific fields
        if (isLanguage) {
            gradeData.languageLevel = languageLevel;
            gradeData.testType = testType;
            if (testType === 'miniTest') {
                gradeData.testNumber = testNumber;
            }
        } else {
            gradeData.semester = semester;
            gradeData.examNumber = examNumber || 1;
        }
        
        const grade = new Grade(gradeData);
        await grade.save();
        console.log('✅ Grade created successfully:', grade._id);
        
        res.status(201).json({ message: 'Grade uploaded successfully', grade });
    } catch (error) {
        console.error('❌ Upload grade error:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get grades uploaded by teacher
router.get('/teacher/grades', verifyTeacherToken, async (req, res) => {
    try {
        const { formation, groupId, semester, academicYear, examNumber, languageLevel, testType, testNumber } = req.query;
        
        let query = { uploadedBy: req.teacher.id };
        
        if (formation) query.formation = formation;
        if (groupId) query.group = groupId;
        if (semester) query.semester = semester;
        if (academicYear) query.academicYear = academicYear;
        if (examNumber) query.examNumber = parseInt(examNumber);
        
        // NEW: A1-B2 level filters
        if (languageLevel) query.languageLevel = languageLevel;
        if (testType) query.testType = testType;
        if (testNumber) query.testNumber = parseInt(testNumber);
        
        const grades = await Grade.find(query)
            .populate('student', 'fullName schoolEmail photoPath')
            .populate('group', 'name')
            .sort({ examDate: -1, studentName: 1 });
        
        res.json(grades);
    } catch (error) {
        console.error('Get teacher grades error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update grade (teacher)
router.put('/teacher/grades/:id', verifyTeacherToken, async (req, res) => {
    try {
        const { score, maxScore, examDate, comments } = req.body;
        
        const grade = await Grade.findOne({ _id: req.params.id, uploadedBy: req.teacher.id });
        if (!grade) {
            return res.status(404).json({ message: 'Grade not found or unauthorized' });
        }
        
        if (score !== undefined) grade.score = score;
        if (maxScore !== undefined) grade.maxScore = maxScore;
        if (examDate !== undefined) grade.examDate = examDate;
        if (comments !== undefined) grade.comments = comments;
        
        await grade.save();
        
        res.json({ message: 'Grade updated successfully', grade });
    } catch (error) {
        console.error('Update grade error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete grade (teacher)
router.delete('/teacher/grades/:id', verifyTeacherToken, async (req, res) => {
    try {
        const grade = await Grade.findOne({ _id: req.params.id, uploadedBy: req.teacher.id });
        if (!grade) {
            return res.status(404).json({ message: 'Grade not found or unauthorized' });
        }
        
        await grade.deleteOne();
        
        res.json({ message: 'Grade deleted successfully' });
    } catch (error) {
        console.error('Delete grade error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== STUDENT ROUTES ====================

// Student login
router.post('/student/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const student = await ManagedStudent.findOne({ schoolEmail: email, status: 'active' });
        if (!student) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const isMatch = await student.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const token = jwt.sign(
            { 
                id: student._id, 
                email: student.schoolEmail, 
                name: student.fullName,
                role: 'student'
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            student: {
                id: student._id,
                fullName: student.fullName,
                schoolEmail: student.schoolEmail,
                formation: student.formation,
                filiere: student.filiere,
                groupName: student.groupName,
                photoPath: student.photoPath
            }
        });
    } catch (error) {
        console.error('Student login error:', error);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Get student profile
router.get('/student/profile', verifyStudentToken, async (req, res) => {
    try {
        const student = await ManagedStudent.findById(req.student.id)
            .populate('group', 'name formation')
            .select('-emailPassword');
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        res.json(student);
    } catch (error) {
        console.error('Get student profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get student payment status
router.get('/student/payment-status', verifyStudentToken, async (req, res) => {
    try {
        const student = await ManagedStudent.findById(req.student.id)
            .select('fullName schoolEmail paymentDate paymentAmount paymentStatus formation filiere');
        
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        
        res.json({ 
            success: true,
            student 
        });
    } catch (error) {
        console.error('Get student payment status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get student messages
router.get('/student/messages', verifyStudentToken, async (req, res) => {
    try {
        console.log(`📬 Fetching messages for student ID: ${req.student.id}`);
        
        const messages = await StudentMessage.find({ student: req.student.id })
            .sort({ createdAt: -1 })
            .limit(50);
        
        const unreadCount = await StudentMessage.countDocuments({ 
            student: req.student.id, 
            read: false 
        });
        
        console.log(`✅ Found ${messages.length} messages (${unreadCount} unread) for student ${req.student.id}`);
        
        res.json({ 
            success: true,
            messages,
            unreadCount
        });
    } catch (error) {
        console.error('Get student messages error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Mark message as read
router.put('/student/messages/:id/read', verifyStudentToken, async (req, res) => {
    try {
        const message = await StudentMessage.findOneAndUpdate(
            { _id: req.params.id, student: req.student.id },
            { read: true },
            { new: true }
        );
        
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        res.json({ success: true, message });
    } catch (error) {
        console.error('Mark message as read error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete single message
router.delete('/student/messages/:id', verifyStudentToken, async (req, res) => {
    try {
        const message = await StudentMessage.findOneAndDelete({
            _id: req.params.id,
            student: req.student.id
        });
        
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        res.json({ 
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// TEST: Simple endpoint to verify route is accessible (NO AUTH)
router.get('/student/messages/ping', (req, res) => {
    console.log('🏓 [PING] Route is accessible!');
    res.json({ success: true, message: 'Pong! Route works!' });
});

// TEST: Verify token works
router.get('/student/messages/test', verifyStudentToken, (req, res) => {
    console.log('🧪 [TEST] Token verification successful');
    console.log('🧪 [TEST] Student:', req.student);
    res.json({ 
        success: true, 
        message: 'Token works!',
        studentId: req.student.id,
        studentEmail: req.student.email
    });
});

// TEST: Check if DELETE method works (NO AUTH)
router.delete('/student/messages/ping-delete', (req, res) => {
    console.log('🏓 [PING-DELETE] DELETE method works!');
    res.json({ success: true, message: 'DELETE works!' });
});

// Clear all messages for student
router.delete('/student/messages/clear-all', verifyStudentToken, async (req, res) => {
    console.log('🗑️ [CLEAR-ALL] ==================== START ====================');
    console.log('🗑️ [CLEAR-ALL] Request received at:', new Date().toISOString());
    console.log('🗑️ [CLEAR-ALL] req.student:', req.student);
    
    try {
        // Verify student ID exists
        if (!req.student || !req.student.id) {
            console.error('❌ [CLEAR-ALL] Student ID not found in token');
            return res.status(400).json({ error: 'Invalid student token' });
        }
        
        console.log('🗑️ [CLEAR-ALL] Student ID:', req.student.id);
        console.log('🗑️ [CLEAR-ALL] Student Email:', req.student.email);
        
        // Check if StudentMessage model is available
        if (!StudentMessage) {
            console.error('❌ [CLEAR-ALL] StudentMessage model not found');
            return res.status(500).json({ error: 'StudentMessage model not available' });
        }
        console.log('🗑️ [CLEAR-ALL] StudentMessage model: OK');
        
        // Check how many messages exist first
        const countBefore = await StudentMessage.countDocuments({ student: req.student.id });
        console.log('🗑️ [CLEAR-ALL] Messages before delete:', countBefore);
        
        console.log('🗑️ [CLEAR-ALL] Calling deleteMany...');
        const result = await StudentMessage.deleteMany({ student: req.student.id });
        console.log('✅ [CLEAR-ALL] Success! Deleted:', result.deletedCount);
        console.log('🗑️ [CLEAR-ALL] ==================== END ====================');
        
        return res.json({ 
            success: true,
            message: 'All messages cleared successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('❌ [CLEAR-ALL] ==================== ERROR ====================');
        console.error('❌ [CLEAR-ALL] Error Name:', error.name);
        console.error('❌ [CLEAR-ALL] Error Message:', error.message);
        console.error('❌ [CLEAR-ALL] Error Stack:', error.stack);
        console.error('❌ [CLEAR-ALL] ==================== ERROR END ====================');
        
        return res.status(500).json({ 
            error: 'Failed to clear messages',
            details: error.message,
            errorName: error.name
        });
    }
});

// Get student grades
router.get('/student/grades', verifyStudentToken, async (req, res) => {
    try {
        const { formation, branch, semester, academicYear, examNumber, languageLevel, testType, testNumber } = req.query;
        
        console.log('📚 Student grades request:', { 
            studentId: req.student.id, 
            formation, 
            branch, 
            semester, 
            academicYear, 
            examNumber,
            languageLevel,
            testType,
            testNumber
        });
        
        const languageFormations = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];
        let query = { student: req.student.id };
        
        // If branch is selected, only show branch grades (not language grades)
        if (branch) {
            query.formation = branch; // Branch grades are stored in formation field
            query.languageLevel = { $exists: false }; // Exclude language grades
            if (semester) query.semester = semester;
            if (academicYear) query.academicYear = academicYear;
            if (examNumber) query.examNumber = parseInt(examNumber);
        } else if (formation) {
            query.formation = formation;
            
            // Check if it's a language formation
            if (languageFormations.includes(formation)) {
                // Language grades must have languageLevel
                query.languageLevel = { $exists: true };
                // A1-B2 filters for languages
                if (languageLevel) query.languageLevel = languageLevel;
                if (testType) query.testType = testType;
                // CRITICAL FIX: Always filter by testNumber when provided, not just for miniTest
                if (testNumber) {
                    query.testNumber = parseInt(testNumber);
                    console.log('🔢 Adding testNumber filter:', parseInt(testNumber));
                }
            } else {
                // Branch grades don't have languageLevel
                query.languageLevel = { $exists: false };
                if (semester) query.semester = semester;
                if (academicYear) query.academicYear = academicYear;
                if (examNumber) query.examNumber = parseInt(examNumber);
            }
        }
        
        console.log('🔍 MongoDB query:', JSON.stringify(query, null, 2));
        console.log('🔍 Query object keys:', Object.keys(query));
        console.log('🔍 testNumber in query?', 'testNumber' in query, query.testNumber);
        
        const grades = await Grade.find(query)
            .populate('uploadedBy', 'fullName email')
            .sort({ examDate: -1, examType: 1 });
        
        console.log(`📊 Found ${grades.length} grades`);
        if (grades.length > 0) {
            console.log('📋 Grade details:');
            grades.forEach(g => {
                console.log(`  - ${g.examType}: Level=${g.languageLevel}, TestType=${g.testType}, TestNumber=${g.testNumber}, Score=${g.score}`);
            });
        } else {
            console.log('❌ No grades found with this query');
        }
        
        // Calculate statistics (only for language grades, exclude branches)
        const languageGrades = grades.filter(g => languageFormations.includes(g.formation));
        
        const stats = {
            totalGrades: grades.length,
            averageScore: 0,
            byFormation: {},
            byExamType: {}
        };
        
        if (languageGrades.length > 0) {
            const totalScore = languageGrades.reduce((sum, grade) => sum + (grade.score / grade.maxScore * 100), 0);
            stats.averageScore = (totalScore / languageGrades.length).toFixed(2);
        }
        
        // Group by formation
        grades.forEach(grade => {
            if (!stats.byFormation[grade.formation]) {
                stats.byFormation[grade.formation] = {
                    count: 0,
                    totalScore: 0,
                    average: 0
                };
            }
            stats.byFormation[grade.formation].count++;
            stats.byFormation[grade.formation].totalScore += (grade.score / grade.maxScore * 100);
        });
        
        Object.keys(stats.byFormation).forEach(formation => {
            stats.byFormation[formation].average = 
                (stats.byFormation[formation].totalScore / stats.byFormation[formation].count).toFixed(2);
        });
        
        // Group by exam type
        grades.forEach(grade => {
            if (!stats.byExamType[grade.examType]) {
                stats.byExamType[grade.examType] = {
                    count: 0,
                    totalScore: 0,
                    average: 0
                };
            }
            stats.byExamType[grade.examType].count++;
            stats.byExamType[grade.examType].totalScore += (grade.score / grade.maxScore * 100);
        });
        
        Object.keys(stats.byExamType).forEach(examType => {
            stats.byExamType[examType].average = 
                (stats.byExamType[examType].totalScore / stats.byExamType[examType].count).toFixed(2);
        });
        
        console.log(`✅ Returning ${grades.length} grades for exam ${examNumber || 'all'}`);
        
        res.json({ grades, stats });
    } catch (error) {
        console.error('Get student grades error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get student language progress (A1-B2 levels)
router.get('/student/language-progress', verifyStudentToken, async (req, res) => {
    try {
        const { formation } = req.query;
        
        if (!formation) {
            return res.status(400).json({ message: 'Formation is required' });
        }
        
        const languageFormations = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];
        if (!languageFormations.includes(formation)) {
            return res.status(400).json({ message: 'Invalid language formation' });
        }
        
        const progress = await Grade.getLanguageProgress(req.student.id, formation);
        
        res.json({ formation, progress });
    } catch (error) {
        console.error('Get language progress error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get student performance data for charts
router.get('/student/performance-data', verifyStudentToken, async (req, res) => {
    try {
        const { formation } = req.query;
        
        if (!formation) {
            return res.status(400).json({ message: 'Formation is required' });
        }
        
        const performanceData = await Grade.getPerformanceData(req.student.id, formation);
        
        res.json({ formation, data: performanceData });
    } catch (error) {
        console.error('Get performance data error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get student grades by level (A1-B2)
router.get('/student/grades-by-level', verifyStudentToken, async (req, res) => {
    try {
        const { formation, languageLevel } = req.query;
        
        if (!formation || !languageLevel) {
            return res.status(400).json({ message: 'Formation and language level are required' });
        }
        
        const grades = await Grade.find({
            student: req.student.id,
            formation,
            languageLevel
        })
        .populate('uploadedBy', 'fullName email')
        .sort({ testType: -1, testNumber: 1, examType: 1 });
        
        // Calculate level statistics
        const stats = {
            totalTests: grades.length,
            miniTestsCompleted: grades.filter(g => g.testType === 'miniTest').length,
            finalExamCompleted: grades.some(g => g.testType === 'finalExam'),
            averageScore: 0,
            byExamType: {},
            evaluationCounts: {
                approved: grades.filter(g => g.evaluationStatus === 'approved').length,
                mid: grades.filter(g => g.evaluationStatus === 'mid').length,
                failed: grades.filter(g => g.evaluationStatus === 'failed').length
            }
        };
        
        if (grades.length > 0) {
            const totalScore = grades.reduce((sum, grade) => sum + (grade.score / grade.maxScore * 100), 0);
            stats.averageScore = (totalScore / grades.length).toFixed(2);
        }
        
        // Group by exam type (Lesen, Hören, Schreiben, Sprechen)
        grades.forEach(grade => {
            if (!stats.byExamType[grade.examType]) {
                stats.byExamType[grade.examType] = {
                    count: 0,
                    totalScore: 0,
                    average: 0
                };
            }
            stats.byExamType[grade.examType].count++;
            stats.byExamType[grade.examType].totalScore += (grade.score / grade.maxScore * 100);
        });
        
        Object.keys(stats.byExamType).forEach(examType => {
            stats.byExamType[examType].average = 
                (stats.byExamType[examType].totalScore / stats.byExamType[examType].count).toFixed(2);
        });
        
        res.json({ formation, languageLevel, grades, stats });
    } catch (error) {
        console.error('Get grades by level error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== ADMIN ROUTES ====================

// Get all teachers (Super Admin only)
router.get('/admin/teachers', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Access denied. Super admin only.' });
        }
        
        const teachers = await Teacher.find()
            .populate('groups', 'name formation')
            .populate('createdBy', 'username')
            .select('-password')
            .sort({ fullName: 1 });
        
        res.json(teachers);
    } catch (error) {
        console.error('Get teachers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create teacher (Super Admin only)
router.post('/admin/teachers', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Access denied. Super admin only.' });
        }
        
        const { fullName, password, phoneNumber, formations, groups } = req.body;
        
        // Validate required fields
        if (!fullName || !password || !phoneNumber || !formations || formations.length === 0) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }
        
        // Auto-generate email from name (same logic as students)
        const emailPrefix = fullName
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '') // Remove all spaces
            .replace(/[^a-z0-9]/g, ''); // Remove special characters, keep only letters and numbers
        
        if (!emailPrefix) {
            return res.status(400).json({ message: 'Invalid name provided' });
        }
        
        const email = `${emailPrefix}@nisrineschool.com`;
        
        // Check if email already exists
        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
            return res.status(400).json({ message: 'A teacher with this name already exists (email conflict)' });
        }
        
        const teacher = new Teacher({
            fullName: fullName.trim(),
            email,
            password,
            phoneNumber,
            formations,
            groups: groups || [],
            createdBy: req.user.id,
            createdByName: req.user.username
        });
        
        await teacher.save();
        
        res.status(201).json({ 
            message: 'Teacher created successfully', 
            teacher: {
                id: teacher._id,
                fullName: teacher.fullName,
                email: teacher.email,
                phoneNumber: teacher.phoneNumber,
                formations: teacher.formations,
                groups: teacher.groups
            }
        });
    } catch (error) {
        console.error('Create teacher error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update teacher (Super Admin only)
router.put('/admin/teachers/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Access denied. Super admin only.' });
        }
        
        const { fullName, phoneNumber, formations, groups, status } = req.body;
        
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        
        if (fullName) teacher.fullName = fullName;
        if (phoneNumber) teacher.phoneNumber = phoneNumber;
        if (formations) teacher.formations = formations;
        if (groups !== undefined) teacher.groups = groups;
        if (status) teacher.status = status;
        
        await teacher.save();
        
        res.json({ message: 'Teacher updated successfully', teacher });
    } catch (error) {
        console.error('Update teacher error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset teacher password (Super Admin only)
router.put('/admin/teachers/:id/password', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Access denied. Super admin only.' });
        }
        
        const { password } = req.body;
        
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        
        teacher.password = password;
        await teacher.save();
        
        res.json({ message: 'Teacher password reset successfully' });
    } catch (error) {
        console.error('Reset teacher password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete teacher (Super Admin only)
router.delete('/admin/teachers/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Access denied. Super admin only.' });
        }
        
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        
        await teacher.deleteOne();
        
        res.json({ message: 'Teacher deleted successfully' });
    } catch (error) {
        console.error('Delete teacher error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get grades for a specific student (Admin)
router.get('/admin/students/:studentId/grades', verifyToken, async (req, res) => {
    try {
        const { formation, branch, semester, languageLevel, academicYear, examNumber, testType } = req.query;
        
        // Count how many filters are applied
        const filtersApplied = [formation, branch, semester, languageLevel, academicYear, examNumber, testType].filter(f => f).length;
        
        console.log(`📊 Admin grades request (${filtersApplied} filters):`, { 
            studentId: req.params.studentId, 
            formation: formation || '(all)',
            branch: branch || '(all)',
            semester: semester || '(all)',
            languageLevel: languageLevel || '(all)',
            academicYear: academicYear || '(all)',
            examNumber: examNumber || '(all)',
            testType: testType || '(all)'
        });
        
        let query = { student: req.params.studentId };
        
        // Handle formation vs branch (mutually exclusive)
        if (branch) {
            query.formation = branch; // Branch grades stored in formation field
        } else if (formation) {
            query.formation = formation;
        }
        
        // Handle language level (A1, A2, B1, B2) vs traditional semester
        if (languageLevel) {
            query.languageLevel = languageLevel;
        } else if (semester) {
            query.semester = semester;
        }
        
        if (academicYear) query.academicYear = academicYear;
        
        // Handle test type (Test 1, Test 2, Exam A1, etc.) vs traditional exam number
        if (testType) {
            // For language formations: testType can be "Test 1", "Test 2", "Exam A1", etc.
            if (testType.startsWith('Test ')) {
                // Mini test
                const testNumber = testType.split(' ')[1];
                query.testType = 'miniTest';
                query.testNumber = parseInt(testNumber);
            } else if (testType.startsWith('Exam ')) {
                // Final exam for a specific level
                const level = testType.split(' ')[1]; // A1, A2, B1, B2
                query.testType = 'finalExam';
                query.languageLevel = level;
            }
        } else if (examNumber) {
            // Traditional exam number (1, 2, 3, 4, 5)
            query.examNumber = parseInt(examNumber);
        }
        
        console.log('🔍 Admin MongoDB query:', query);
        
        const grades = await Grade.find(query)
            .populate('uploadedBy', 'fullName email')
            .sort({ examDate: -1, examType: 1 });
        
        console.log(`✅ Admin returning ${grades.length} grades`);
        
        res.json(grades);
    } catch (error) {
        console.error('Get student grades error:', error);
        res.status(500).json({ error: error.message, message: 'Server error' });
    }
});

// Get all grades (Admin - with filters)
router.get('/admin/grades', verifyToken, async (req, res) => {
    try {
        const { formation, groupId, semester, academicYear, studentId } = req.query;
        
        let query = {};
        
        if (formation) query.formation = formation;
        if (groupId) query.group = groupId;
        if (semester) query.semester = semester;
        if (academicYear) query.academicYear = academicYear;
        if (studentId) query.student = studentId;
        
        const grades = await Grade.find(query)
            .populate('student', 'fullName schoolEmail photoPath')
            .populate('group', 'name')
            .populate('uploadedBy', 'fullName email')
            .sort({ examDate: -1, studentName: 1 });
        
        res.json(grades);
    } catch (error) {
        console.error('Get all grades error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
