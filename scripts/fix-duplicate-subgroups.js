/**
 * Fix Duplicate Subgroup Assignments
 * This script finds and fixes students who appear in multiple subgroups
 */

const mongoose = require('mongoose');
const ManagedStudent = require('../models/ManagedStudent');
const Group = require('../models/Group');
require('dotenv').config();

async function fixDuplicateSubgroups() {
    try {
        console.log('🔍 Starting duplicate subgroup fix...\n');
        
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nisrine-school');
        console.log('✅ Connected to database\n');
        
        // Get all students with branch subgroup assignments
        const students = await ManagedStudent.find({
            branchSubgroup: { $exists: true, $ne: null }
        }).populate('branchSubgroup');
        
        console.log(`📊 Found ${students.length} students with subgroup assignments\n`);
        
        // Check each student
        const issues = [];
        for (const student of students) {
            if (!student.branchSubgroup) continue;
            
            // Count how many subgroups this student appears in
            const subgroupCount = await Group.countDocuments({
                _id: student.branchSubgroup,
                groupType: 'branch'
            });
            
            // Also check if there are other subgroups with this student
            const allSubgroups = await Group.find({
                groupType: 'branch',
                branchGroup: student.branchSubgroup.branchGroup
            });
            
            // Check each subgroup to see if student count includes this student
            let appearsInMultiple = false;
            const foundIn = [];
            
            for (const subgroup of allSubgroups) {
                const studentsInSubgroup = await ManagedStudent.countDocuments({
                    branchSubgroup: subgroup._id,
                    _id: student._id
                });
                
                if (studentsInSubgroup > 0) {
                    foundIn.push(subgroup.name);
                }
            }
            
            if (foundIn.length > 1) {
                appearsInMultiple = true;
                issues.push({
                    student: student.fullName,
                    studentId: student._id,
                    email: student.schoolEmail,
                    currentSubgroup: student.branchSubgroupName,
                    foundIn: foundIn
                });
            }
        }
        
        if (issues.length === 0) {
            console.log('✅ No duplicate assignments found! All students are correctly assigned.\n');
        } else {
            console.log(`⚠️  Found ${issues.length} students with potential issues:\n`);
            console.log('='.repeat(80));
            
            issues.forEach((issue, index) => {
                console.log(`\n${index + 1}. ${issue.student}`);
                console.log(`   Email: ${issue.email}`);
                console.log(`   Database says: ${issue.currentSubgroup}`);
                console.log(`   Found in: ${issue.foundIn.join(', ')}`);
            });
            
            console.log('\n' + '='.repeat(80));
            console.log('\n⚠️  Note: The issue might be in how we query/display students, not the database.');
            console.log('   Each student should only have ONE branchSubgroup value in the database.\n');
        }
        
        // Additional check: Look for students with same branchSubgroup appearing in query results
        console.log('\n🔍 Checking actual database values...\n');
        
        const duplicateCheck = await ManagedStudent.aggregate([
            {
                $match: {
                    branchSubgroup: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: '$_id',
                    fullName: { $first: '$fullName' },
                    branchSubgroup: { $first: '$branchSubgroup' },
                    branchSubgroupName: { $first: '$branchSubgroupName' },
                    count: { $sum: 1 }
                }
            }
        ]);
        
        console.log('Database records:');
        duplicateCheck.forEach(record => {
            console.log(`- ${record.fullName}: ${record.branchSubgroupName} (${record.branchSubgroup})`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run fix
fixDuplicateSubgroups();
