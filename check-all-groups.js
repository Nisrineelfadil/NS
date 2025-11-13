// Diagnostic script to check ALL groups and their students
const mongoose = require('mongoose');
require('dotenv').config();

const Group = require('./models/Group');
const ManagedStudent = require('./models/ManagedStudent');

async function checkAllGroups() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nisrine-school');
        
        console.log('✅ Connected to MongoDB\n');
        
        // Find ALL groups
        const allGroups = await Group.find().sort({ name: 1 });
        
        console.log(`📊 Found ${allGroups.length} total group(s):\n`);
        
        for (const group of allGroups) {
            console.log(`\n${'='.repeat(70)}`);
            console.log(`📁 Group: ${group.name}`);
            console.log(`   ID: ${group._id}`);
            console.log(`   Type: ${group.groupType || 'language'}`);
            console.log(`   Formation: ${group.formation || 'N/A'}`);
            console.log(`   Branch Formation: ${group.branchFormation || 'N/A'}`);
            console.log(`   Status: ${group.status}`);
            console.log(`   Max Students: ${group.maxStudents || 'N/A'}`);
            console.log(`   Current Count (field): ${group.currentStudentCount || 0}`);
            
            // Find students in this group
            const students = await ManagedStudent.find({
                group: group._id,
                status: 'active'
            });
            
            console.log(`   Actual Count (database): ${students.length}`);
            
            if (students.length > 0) {
                console.log(`\n   👥 Students:`);
                students.forEach((student, index) => {
                    console.log(`      ${index + 1}. ${student.fullName}`);
                    console.log(`         Email: ${student.schoolEmail}`);
                    console.log(`         Formation: ${student.formation}`);
                    console.log(`         Filière: ${student.filiere}`);
                });
            } else {
                console.log(`\n   ⚠️  No active students found in database`);
            }
            
            // Check for mismatch
            if (students.length !== group.currentStudentCount) {
                console.log(`\n   ⚠️  MISMATCH: Field shows ${group.currentStudentCount}, but database has ${students.length}`);
            }
        }
        
        console.log(`\n${'='.repeat(70)}\n`);
        
        // Find ALL active students and show their group assignments
        console.log('👥 ALL ACTIVE STUDENTS:\n');
        const allStudents = await ManagedStudent.find({ status: 'active' }).sort({ fullName: 1 });
        
        console.log(`Total: ${allStudents.length} students\n`);
        
        const groupedStudents = {};
        
        for (const student of allStudents) {
            const groupId = student.group ? student.group.toString() : 'NO_GROUP';
            
            if (!groupedStudents[groupId]) {
                groupedStudents[groupId] = [];
            }
            groupedStudents[groupId].push(student);
        }
        
        for (const [groupId, students] of Object.entries(groupedStudents)) {
            const group = allGroups.find(g => g._id.toString() === groupId);
            const groupName = group ? group.name : `Unknown Group (${groupId})`;
            
            console.log(`\n📁 ${groupName}:`);
            students.forEach((s, i) => {
                console.log(`   ${i + 1}. ${s.fullName} (Formation: ${s.formation}, Filière: ${s.filiere})`);
            });
        }
        
        console.log('\n✅ Diagnostic complete!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
        process.exit(0);
    }
}

checkAllGroups();
