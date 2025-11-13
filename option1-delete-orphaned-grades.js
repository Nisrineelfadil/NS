const mongoose = require('mongoose');
require('dotenv').config();

/**
 * OPTION 1: Delete all grades that reference deleted students
 * Use this if you want a clean slate and teachers will re-enter grades
 */

async function deleteOrphanedGrades() {
    try {
        console.log('🗑️  OPTION 1: Delete Orphaned Grades\n');
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        const ManagedStudent = require('./models/ManagedStudent');
        const Grade = require('./models/Grade');
        
        const allGrades = await Grade.find();
        const activeStudents = await ManagedStudent.find({ status: 'active' });
        const activeStudentIds = new Set(activeStudents.map(s => s._id.toString()));
        
        console.log(`📊 Total grades: ${allGrades.length}`);
        console.log(`👥 Active students: ${activeStudents.length}\n`);
        
        const orphanedGrades = [];
        
        for (const grade of allGrades) {
            if (!activeStudentIds.has(grade.student.toString())) {
                orphanedGrades.push(grade._id);
                console.log(`❌ Will delete: ${grade.formation} ${grade.examType} for ${grade.studentName}`);
            }
        }
        
        if (orphanedGrades.length === 0) {
            console.log('✅ No orphaned grades found!\n');
        } else {
            console.log(`\n⚠️  Found ${orphanedGrades.length} orphaned grades`);
            console.log('🗑️  Deleting...\n');
            
            const result = await Grade.deleteMany({ _id: { $in: orphanedGrades } });
            console.log(`✅ Deleted ${result.deletedCount} orphaned grades\n`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Done');
    }
}

deleteOrphanedGrades();
