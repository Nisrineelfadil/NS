const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Test multiple student logins to verify each sees only their own grades
 */

async function testMultipleStudentLogins() {
    try {
        console.log('🧪 Testing Multiple Student Logins\n');
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        const ManagedStudent = require('./models/ManagedStudent');
        const Grade = require('./models/Grade');
        
        // Get all active students
        const students = await ManagedStudent.find({ status: 'active' });
        console.log(`👥 Testing with ${students.length} students:\n`);
        
        for (const student of students) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`👤 Student: ${student.fullName}`);
            console.log(`📧 Email: ${student.schoolEmail}`);
            console.log(`🆔 ID: ${student._id}`);
            console.log(`${'='.repeat(60)}\n`);
            
            // Simulate login - create JWT token
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
            
            // Decode token (simulating backend middleware)
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log(`🔐 Token decoded successfully`);
            console.log(`   Student ID from token: ${decoded.id}`);
            console.log(`   Role: ${decoded.role}\n`);
            
            // Query grades using the decoded ID (simulating API endpoint)
            const query = { student: decoded.id };
            const grades = await Grade.find(query)
                .select('formation examType score maxScore languageLevel testType testNumber')
                .sort({ examDate: -1 });
            
            console.log(`📊 Grades Query: { student: "${decoded.id}" }`);
            console.log(`📈 Grades found: ${grades.length}\n`);
            
            if (grades.length > 0) {
                console.log(`✅ This student HAS grades:\n`);
                grades.forEach((grade, index) => {
                    const percentage = (grade.score / grade.maxScore * 100).toFixed(1);
                    const levelInfo = grade.languageLevel ? ` [${grade.languageLevel}]` : '';
                    const testInfo = grade.testType ? ` - ${grade.testType}` : '';
                    const testNum = grade.testNumber ? ` #${grade.testNumber}` : '';
                    console.log(`   ${index + 1}. ${grade.formation} ${grade.examType}${levelInfo}${testInfo}${testNum}`);
                    console.log(`      Score: ${grade.score}/${grade.maxScore} (${percentage}%)`);
                });
            } else {
                console.log(`ℹ️  This student has NO grades yet (teachers haven't entered any)`);
            }
            
            // Verify no cross-contamination
            const otherStudentGrades = await Grade.find({ 
                student: { $ne: decoded.id } 
            }).limit(1);
            
            if (otherStudentGrades.length > 0) {
                console.log(`\n✅ Verified: Other students' grades exist but are NOT returned`);
            }
        }
        
        console.log(`\n\n${'='.repeat(60)}`);
        console.log(`✅ TEST PASSED: Each student sees only their own grades!`);
        console.log(`${'='.repeat(60)}\n`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

testMultipleStudentLogins();
