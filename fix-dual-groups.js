// Script to properly assign students to BOTH language groups AND branch subgroups
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

async function fixDualGroups() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nisrine-school');
        
        console.log('✅ Connected to MongoDB\n');
        
        // Get all students
        const students = await ManagedStudent.find({ status: 'active' }).sort({ fullName: 1 });
        
        console.log(`📊 Found ${students.length} active students\n`);
        
        // Get all groups
        const languageGroups = await Group.find({ groupType: 'language' }).sort({ name: 1 });
        const branchGroups = await Group.find({ groupType: 'branch' }).sort({ name: 1 });
        
        console.log(`📚 Language Groups: ${languageGroups.length}`);
        languageGroups.forEach((g, i) => console.log(`   ${i + 1}. ${g.name} (${g.formation})`));
        
        console.log(`\n🎓 Branch Subgroups: ${branchGroups.length}`);
        branchGroups.forEach((g, i) => console.log(`   ${i + 1}. ${g.name} (${g.formation})`));
        
        console.log('\n' + '='.repeat(70));
        console.log('🔧 FIXING DUAL GROUP ASSIGNMENTS');
        console.log('='.repeat(70));
        
        console.log('\nCurrent situation:');
        console.log('❌ Students are assigned to branch subgroups in the "group" field');
        console.log('✅ They should be:');
        console.log('   - "group" field → Language group (for language classes)');
        console.log('   - "branchSubgroup" field → Branch subgroup (for branch classes)\n');
        
        const proceed = await question('Do you want to fix this? (yes/no): ');
        
        if (proceed.toLowerCase() !== 'yes') {
            console.log('\n👋 Exiting without changes...');
            return;
        }
        
        console.log('\n🤖 AUTO-FIXING student assignments...\n');
        
        let fixedCount = 0;
        
        for (const student of students) {
            console.log(`\n${'='.repeat(70)}`);
            console.log(`Student: ${student.fullName}`);
            console.log(`Formation (language): ${student.formation}`);
            console.log(`Filière (branch): ${student.filiere}`);
            
            // Current assignment
            const currentGroup = await Group.findById(student.group);
            console.log(`Current "group": ${currentGroup ? currentGroup.name : 'None'}`);
            console.log(`Current "branchSubgroup": ${student.branchSubgroup || 'None'}`);
            
            // Check if current group is a branch group
            if (currentGroup && currentGroup.groupType === 'branch') {
                console.log(`\n⚠️  Student is assigned to branch group in "group" field - FIXING...`);
                
                // Move to branchSubgroup field
                student.branchSubgroup = student.group;
                student.branchSubgroupName = currentGroup.name;
                
                // Find matching language group based on student's formation
                const languageFormation = Array.isArray(student.formation) ? student.formation[0] : student.formation;
                const matchingLanguageGroup = languageGroups.find(g => g.formation === languageFormation);
                
                if (matchingLanguageGroup) {
                    student.group = matchingLanguageGroup._id;
                    student.groupName = matchingLanguageGroup.name;
                    console.log(`✅ Assigned to language group: ${matchingLanguageGroup.name}`);
                } else {
                    student.group = null;
                    student.groupName = 'Pending Assignment';
                    console.log(`⚠️  No matching language group found for ${languageFormation}`);
                }
                
                console.log(`✅ Branch subgroup: ${currentGroup.name}`);
                
                await student.save();
                fixedCount++;
            } else {
                console.log(`✅ Already correctly assigned`);
            }
        }
        
        console.log(`\n${'='.repeat(70)}`);
        console.log(`✅ Fixed ${fixedCount} student(s)`);
        console.log('='.repeat(70));
        
        // Update group counts
        console.log('\n🔄 Updating group student counts...\n');
        
        for (const group of [...languageGroups, ...branchGroups]) {
            const fieldName = group.groupType === 'language' ? 'group' : 'branchSubgroup';
            const count = await ManagedStudent.countDocuments({
                [fieldName]: group._id,
                status: 'active'
            });
            
            group.currentStudentCount = count;
            await group.save();
            
            console.log(`✅ ${group.name}: ${count} students`);
        }
        
        console.log('\n✅ All done!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        rl.close();
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
        process.exit(0);
    }
}

fixDualGroups();
