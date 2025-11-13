// Script to fix student group assignments
const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

const Group = require('./models/Group');
const ManagedStudent = require('./models/ManagedStudent');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function fixStudentGroups() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nisrine-school');
        
        console.log('✅ Connected to MongoDB\n');
        
        // Find the orphaned students
        const orphanedGroupId = '68f14158df4ee697c2baab6c';
        const students = await ManagedStudent.find({
            group: orphanedGroupId,
            status: 'active'
        }).sort({ fullName: 1 });
        
        console.log(`📊 Found ${students.length} students in old group:\n`);
        
        students.forEach((student, index) => {
            console.log(`${index + 1}. ${student.fullName}`);
            console.log(`   Email: ${student.schoolEmail}`);
            console.log(`   Formation: ${student.formation}`);
            console.log(`   Filière: ${student.filiere}\n`);
        });
        
        // Find all branch subgroups
        const branchGroups = await Group.find({
            groupType: 'branch'
        }).sort({ name: 1 });
        
        console.log(`\n📁 Available Branch Subgroups:\n`);
        branchGroups.forEach((group, index) => {
            console.log(`${index + 1}. ${group.name} (${group.formation})`);
            console.log(`   ID: ${group._id}`);
            console.log(`   Current Count: ${group.currentStudentCount || 0}\n`);
        });
        
        console.log('\n' + '='.repeat(60));
        console.log('🔧 ASSIGNMENT OPTIONS:');
        console.log('='.repeat(60));
        console.log('\n1. AUTO-ASSIGN by Filière (Recommended)');
        console.log('   - Matches students to subgroups based on their filière');
        console.log('\n2. MANUAL ASSIGNMENT');
        console.log('   - Assign each student individually');
        console.log('\n3. EXIT without changes\n');
        
        const choice = await question('Enter your choice (1, 2, or 3): ');
        
        if (choice === '1') {
            // Auto-assign by filière
            console.log('\n🤖 AUTO-ASSIGNING students...\n');
            
            let assignedCount = 0;
            
            for (const student of students) {
                // Find matching branch group
                const matchingGroup = branchGroups.find(g => 
                    g.formation === student.filiere || 
                    (Array.isArray(student.filiere) && student.filiere.includes(g.formation))
                );
                
                if (matchingGroup) {
                    // Update student's group
                    student.group = matchingGroup._id;
                    await student.save();
                    
                    // Update group's student count
                    matchingGroup.currentStudentCount = (matchingGroup.currentStudentCount || 0) + 1;
                    await matchingGroup.save();
                    
                    console.log(`✅ ${student.fullName} → ${matchingGroup.name}`);
                    assignedCount++;
                } else {
                    console.log(`⚠️  ${student.fullName} - No matching group found for filière: ${student.filiere}`);
                }
            }
            
            console.log(`\n✅ Auto-assigned ${assignedCount} out of ${students.length} students!`);
            
        } else if (choice === '2') {
            // Manual assignment
            console.log('\n📝 MANUAL ASSIGNMENT:\n');
            
            for (const student of students) {
                console.log(`\n${'='.repeat(60)}`);
                console.log(`Student: ${student.fullName}`);
                console.log(`Filière: ${student.filiere}`);
                console.log(`\nAvailable groups:`);
                
                branchGroups.forEach((group, index) => {
                    console.log(`${index + 1}. ${group.name}`);
                });
                
                const groupChoice = await question(`\nAssign to group (1-${branchGroups.length}, or 0 to skip): `);
                const groupIndex = parseInt(groupChoice) - 1;
                
                if (groupIndex >= 0 && groupIndex < branchGroups.length) {
                    const selectedGroup = branchGroups[groupIndex];
                    
                    student.group = selectedGroup._id;
                    await student.save();
                    
                    selectedGroup.currentStudentCount = (selectedGroup.currentStudentCount || 0) + 1;
                    await selectedGroup.save();
                    
                    console.log(`✅ Assigned ${student.fullName} to ${selectedGroup.name}`);
                } else {
                    console.log(`⏭️  Skipped ${student.fullName}`);
                }
            }
            
            console.log('\n✅ Manual assignment complete!');
            
        } else {
            console.log('\n👋 Exiting without changes...');
        }
        
        // Show final summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 FINAL GROUP SUMMARY:');
        console.log('='.repeat(60) + '\n');
        
        const updatedGroups = await Group.find({ groupType: 'branch' }).sort({ name: 1 });
        
        for (const group of updatedGroups) {
            const actualCount = await ManagedStudent.countDocuments({
                group: group._id,
                status: 'active'
            });
            
            console.log(`${group.name}:`);
            console.log(`   Database Count: ${actualCount}`);
            console.log(`   Group Field: ${group.currentStudentCount || 0}`);
            
            if (actualCount !== group.currentStudentCount) {
                console.log(`   ⚠️  Mismatch detected! Fixing...`);
                group.currentStudentCount = actualCount;
                await group.save();
                console.log(`   ✅ Fixed!`);
            }
            console.log('');
        }
        
        console.log('✅ All done!\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        rl.close();
        await mongoose.connection.close();
        console.log('👋 Database connection closed');
        process.exit(0);
    }
}

fixStudentGroups();
