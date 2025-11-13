// Diagnostic script to check students in groups
const mongoose = require('mongoose');
require('dotenv').config();

const Group = require('./models/Group');
const ManagedStudent = require('./models/ManagedStudent');

async function checkGroupStudents() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nisrine-school', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB\n');
        
        // Find all groups with "Hotel Management" or "Information Technology" in the name
        const groups = await Group.find({
            $or: [
                { name: /Hotel Management/i },
                { name: /Information Technology/i }
            ]
        }).sort({ name: 1 });
        
        console.log(`📊 Found ${groups.length} matching group(s):\n`);
        
        for (const group of groups) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`📁 Group: ${group.name}`);
            console.log(`   ID: ${group._id}`);
            console.log(`   Type: ${group.groupType || 'N/A'}`);
            console.log(`   Formation: ${group.formation || 'N/A'}`);
            console.log(`   Status: ${group.status}`);
            console.log(`   Current Students: ${group.currentStudentCount || 0}`);
            
            // Find students in this group
            const students = await ManagedStudent.find({
                group: group._id,
                status: 'active'
            });
            
            console.log(`\n   👥 Active Students in Database: ${students.length}`);
            
            if (students.length > 0) {
                students.forEach((student, index) => {
                    console.log(`      ${index + 1}. ${student.fullName}`);
                    console.log(`         Email: ${student.schoolEmail}`);
                    console.log(`         Group ID: ${student.group}`);
                    console.log(`         Formation: ${student.formation}`);
                    console.log(`         Filière: ${student.filiere}`);
                });
            } else {
                console.log(`      ⚠️  No active students found in this group`);
                
                // Check if there are students with this group ID but different status
                const allStudents = await ManagedStudent.find({ group: group._id });
                if (allStudents.length > 0) {
                    console.log(`      ℹ️  Found ${allStudents.length} student(s) with other status:`);
                    allStudents.forEach(s => {
                        console.log(`         - ${s.fullName} (Status: ${s.status})`);
                    });
                }
            }
        }
        
        console.log(`\n${'='.repeat(60)}\n`);
        
        // Also check if there are students whose group field doesn't match any group
        console.log('🔍 Checking for orphaned students...\n');
        const allActiveStudents = await ManagedStudent.find({ status: 'active' });
        const allGroupIds = groups.map(g => g._id.toString());
        
        const orphanedStudents = allActiveStudents.filter(s => {
            return s.group && !allGroupIds.includes(s.group.toString());
        });
        
        if (orphanedStudents.length > 0) {
            console.log(`⚠️  Found ${orphanedStudents.length} active student(s) with invalid group references:`);
            orphanedStudents.forEach(s => {
                console.log(`   - ${s.fullName} (Group ID: ${s.group})`);
            });
        } else {
            console.log('✅ No orphaned students found');
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

checkGroupStudents();
