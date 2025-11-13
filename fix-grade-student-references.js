const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Fix broken student references in Grade documents
 * This script will:
 * 1. Find all grades with missing/invalid student references
 * 2. Match them to students by email or name
 * 3. Update the student ObjectId reference
 */

async function fixGradeStudentReferences() {
    try {
        console.log('🔧 Fixing Grade Student References\n');
        
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        const ManagedStudent = require('./models/ManagedStudent');
        const Grade = require('./models/Grade');
        
        // Get all grades
        const allGrades = await Grade.find();
        console.log(`📊 Total grades in database: ${allGrades.length}\n`);
        
        // Get all students
        const allStudents = await ManagedStudent.find({ status: 'active' });
        console.log(`👥 Total active students: ${allStudents.length}\n`);
        
        // Create lookup maps
        const studentsByEmail = {};
        const studentsByName = {};
        
        allStudents.forEach(student => {
            studentsByEmail[student.schoolEmail.toLowerCase()] = student;
            studentsByName[student.fullName.toLowerCase()] = student;
        });
        
        let fixedCount = 0;
        let alreadyCorrectCount = 0;
        let cannotFixCount = 0;
        
        console.log('🔍 Processing grades...\n');
        
        for (const grade of allGrades) {
            // Check if student reference is valid
            let needsFix = false;
            
            try {
                const studentExists = await ManagedStudent.findById(grade.student);
                if (!studentExists) {
                    needsFix = true;
                } else {
                    alreadyCorrectCount++;
                }
            } catch (error) {
                needsFix = true;
            }
            
            if (needsFix) {
                // Try to find the correct student
                let correctStudent = null;
                
                // First try by email
                if (grade.studentEmail) {
                    correctStudent = studentsByEmail[grade.studentEmail.toLowerCase()];
                }
                
                // If not found, try by name
                if (!correctStudent && grade.studentName) {
                    correctStudent = studentsByName[grade.studentName.toLowerCase()];
                }
                
                if (correctStudent) {
                    // Update the grade with correct student reference
                    grade.student = correctStudent._id;
                    grade.studentEmail = correctStudent.schoolEmail;
                    grade.studentName = correctStudent.fullName;
                    await grade.save();
                    
                    console.log(`✅ Fixed: ${grade.formation} ${grade.examType} for ${correctStudent.fullName}`);
                    fixedCount++;
                } else {
                    console.log(`❌ Cannot fix: ${grade.formation} ${grade.examType} for ${grade.studentName || grade.studentEmail} (student not found)`);
                    cannotFixCount++;
                }
            }
        }
        
        console.log('\n\n📊 Summary:');
        console.log(`   ✅ Already correct: ${alreadyCorrectCount}`);
        console.log(`   🔧 Fixed: ${fixedCount}`);
        console.log(`   ❌ Cannot fix: ${cannotFixCount}`);
        console.log(`   📈 Total: ${allGrades.length}`);
        
        // Verify the fix
        console.log('\n\n🔍 Verifying fix...\n');
        
        const sampleStudents = await ManagedStudent.find({ status: 'active' }).limit(3);
        
        for (const student of sampleStudents) {
            const grades = await Grade.find({ student: student._id });
            console.log(`👤 ${student.fullName}: ${grades.length} grades`);
        }
        
        console.log('\n✅ Fix complete!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

fixGradeStudentReferences();
