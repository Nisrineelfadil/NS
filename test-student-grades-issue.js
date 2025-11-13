const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

// Test script to diagnose student grades data issue

async function testStudentGradesIssue() {
    try {
        console.log('🔍 Testing Student Grades Data Issue\n');
        
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        const ManagedStudent = require('./models/ManagedStudent');
        const Grade = require('./models/Grade');
        
        // Get all students
        const students = await ManagedStudent.find({ status: 'active' })
            .select('fullName schoolEmail')
            .limit(5);
        
        console.log(`📋 Found ${students.length} active students:\n`);
        
        for (const student of students) {
            console.log(`\n👤 Student: ${student.fullName} (${student.schoolEmail})`);
            console.log(`   ID: ${student._id}`);
            
            // Create a test token for this student
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
            
            // Decode the token to verify
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log(`   Token decoded ID: ${decoded.id}`);
            console.log(`   Token role: ${decoded.role}`);
            
            // Query grades using the decoded ID (simulating backend behavior)
            const grades = await Grade.find({ student: decoded.id })
                .select('formation examType score maxScore languageLevel testType testNumber')
                .limit(3);
            
            console.log(`   📊 Grades found: ${grades.length}`);
            if (grades.length > 0) {
                grades.forEach(g => {
                    const percentage = (g.score / g.maxScore * 100).toFixed(1);
                    console.log(`      - ${g.formation} ${g.examType}: ${g.score}/${g.maxScore} (${percentage}%)`);
                });
            }
        }
        
        console.log('\n\n🔍 Checking for any duplicate or mismatched data...\n');
        
        // Check if any grades have incorrect student references
        const allGrades = await Grade.find()
            .populate('student', 'fullName')
            .select('student studentName formation examType')
            .limit(10);
        
        console.log('📊 Sample grades with student references:\n');
        allGrades.forEach(g => {
            const studentName = g.student ? g.student.fullName : 'MISSING';
            const storedName = g.studentName || 'N/A';
            const match = studentName === storedName ? '✅' : '❌';
            console.log(`   ${match} Grade: ${g.formation} ${g.examType}`);
            console.log(`      Student ref: ${studentName}`);
            console.log(`      Stored name: ${storedName}\n`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

testStudentGradesIssue();
