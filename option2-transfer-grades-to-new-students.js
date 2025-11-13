const mongoose = require('mongoose');
require('dotenv').config();

/**
 * OPTION 2: Transfer old grades to new students by matching name/email
 * Use this if you want to preserve the grades and link them to recreated students
 */

async function transferGradesToNewStudents() {
    try {
        console.log('🔄 OPTION 2: Transfer Grades to New Students\n');
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        const ManagedStudent = require('./models/ManagedStudent');
        const Grade = require('./models/Grade');
        
        const allGrades = await Grade.find();
        const activeStudents = await ManagedStudent.find({ status: 'active' });
        
        console.log(`📊 Total grades: ${allGrades.length}`);
        console.log(`👥 Active students: ${activeStudents.length}\n`);
        
        // Create lookup maps
        const studentsByEmail = {};
        const studentsByName = {};
        
        activeStudents.forEach(student => {
            studentsByEmail[student.schoolEmail.toLowerCase()] = student;
            studentsByName[student.fullName.toLowerCase()] = student;
        });
        
        let transferredCount = 0;
        let cannotTransferCount = 0;
        let alreadyCorrectCount = 0;
        
        for (const grade of allGrades) {
            // Check if student reference is valid
            const studentExists = activeStudents.find(s => s._id.toString() === grade.student.toString());
            
            if (studentExists) {
                alreadyCorrectCount++;
                continue;
            }
            
            // Try to find the new student by email or name
            let newStudent = null;
            
            if (grade.studentEmail) {
                newStudent = studentsByEmail[grade.studentEmail.toLowerCase()];
            }
            
            if (!newStudent && grade.studentName) {
                newStudent = studentsByName[grade.studentName.toLowerCase()];
            }
            
            if (newStudent) {
                console.log(`🔄 Transferring: ${grade.formation} ${grade.examType}`);
                console.log(`   From: ${grade.studentName} (old ID: ${grade.student.toString().substring(0, 8)}...)`);
                console.log(`   To: ${newStudent.fullName} (new ID: ${newStudent._id.toString().substring(0, 8)}...)\n`);
                
                // Update without triggering validation
                await Grade.updateOne(
                    { _id: grade._id },
                    { 
                        $set: { 
                            student: newStudent._id,
                            studentEmail: newStudent.schoolEmail,
                            studentName: newStudent.fullName
                        }
                    }
                );
                
                transferredCount++;
            } else {
                console.log(`❌ Cannot transfer: ${grade.formation} ${grade.examType} for ${grade.studentName} (no matching student found)\n`);
                cannotTransferCount++;
            }
        }
        
        console.log('\n📊 Summary:');
        console.log(`   ✅ Already correct: ${alreadyCorrectCount}`);
        console.log(`   🔄 Transferred: ${transferredCount}`);
        console.log(`   ❌ Cannot transfer: ${cannotTransferCount}`);
        console.log(`   📈 Total: ${allGrades.length}\n`);
        
        // Verify
        console.log('🔍 Verifying...\n');
        const sampleStudents = await ManagedStudent.find({ status: 'active' }).limit(3);
        
        for (const student of sampleStudents) {
            const grades = await Grade.find({ student: student._id });
            console.log(`👤 ${student.fullName}: ${grades.length} grades`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Done');
    }
}

transferGradesToNewStudents();
