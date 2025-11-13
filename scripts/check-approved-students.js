/**
 * Check Approved Students and Transfer Status
 */

const mongoose = require('mongoose');
const Student = require('../models/Student');
const ManagedStudent = require('../models/ManagedStudent');
require('dotenv').config();

async function checkApprovedStudents() {
    try {
        console.log('🔍 Checking approved students...\n');
        
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nisrine-school');
        console.log('✅ Connected to database\n');
        
        // Find all approved students
        const approvedStudents = await Student.find({ status: 'approved' });
        console.log(`📊 Found ${approvedStudents.length} approved students:\n`);
        
        for (const student of approvedStudents) {
            console.log(`\n${student.fullName}:`);
            console.log(`   Status: ${student.status}`);
            console.log(`   Transferred: ${student.transferredToManagement ? 'YES ✅' : 'NO ❌'}`);
            console.log(`   ManagedStudent ID: ${student.managedStudentId || 'None'}`);
            
            if (student.transferredToManagement && student.managedStudentId) {
                const managed = await ManagedStudent.findById(student.managedStudentId);
                if (managed) {
                    console.log(`   ✅ Found in ManagedStudent:`);
                    console.log(`      - School Email: ${managed.schoolEmail}`);
                    console.log(`      - Status: ${managed.status}`);
                    console.log(`      - Group: ${managed.groupName || 'None'}`);
                } else {
                    console.log(`   ❌ ManagedStudent record NOT FOUND!`);
                }
            } else {
                console.log(`   ⚠️  NOT transferred to ManagedStudent yet`);
            }
        }
        
        // Check ManagedStudent for pending_assignment
        console.log('\n\n📋 Checking ManagedStudent for pending assignments...\n');
        const pendingManaged = await ManagedStudent.find({ status: 'pending_assignment' });
        console.log(`Found ${pendingManaged.length} students with pending_assignment status:\n`);
        
        for (const student of pendingManaged) {
            console.log(`   - ${student.fullName} (${student.schoolEmail})`);
            console.log(`     Group: ${student.groupName || 'None'}`);
        }
        
        if (approvedStudents.length > 0 && pendingManaged.length === 0) {
            console.log('\n\n⚠️  ISSUE DETECTED:');
            console.log('   You have approved students but none in ManagedStudent!');
            console.log('   This means the auto-transfer is NOT working.');
            console.log('\n   SOLUTION:');
            console.log('   1. Make sure you RESTARTED the server after the code changes');
            console.log('   2. Try approving a NEW registration to test');
            console.log('   3. Or run the manual transfer script\n');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

checkApprovedStudents();
