/**
 * Test Script for Clear Messages Endpoint
 * Run this to diagnose the exact error
 */

require('dotenv').config();
const mongoose = require('mongoose');
const StudentMessage = require('./models/StudentMessage');
const ManagedStudent = require('./models/ManagedStudent');

async function testClearMessages() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');

        // Test 1: Check if StudentMessage model works
        console.log('\n📋 Test 1: Checking StudentMessage model...');
        const messageCount = await StudentMessage.countDocuments();
        console.log(`✅ Found ${messageCount} total messages in database`);

        // Test 2: Find a student to test with
        console.log('\n📋 Test 2: Finding a test student...');
        const student = await ManagedStudent.findOne({ status: 'active' });
        if (!student) {
            console.log('❌ No active students found in database');
            process.exit(1);
        }
        console.log(`✅ Found student: ${student.fullName} (${student.schoolEmail})`);
        console.log(`   Student ID: ${student._id}`);

        // Test 3: Check messages for this student
        console.log('\n📋 Test 3: Checking messages for this student...');
        const studentMessages = await StudentMessage.find({ student: student._id });
        console.log(`✅ Found ${studentMessages.length} messages for this student`);
        
        if (studentMessages.length > 0) {
            console.log('   Sample message:', {
                id: studentMessages[0]._id,
                title: studentMessages[0].title,
                type: studentMessages[0].type
            });
        }

        // Test 4: Try deleteMany with student ID
        console.log('\n📋 Test 4: Testing deleteMany operation...');
        console.log(`   Using student ID: ${student._id}`);
        console.log(`   ID type: ${typeof student._id}`);
        console.log(`   Is ObjectId: ${student._id instanceof mongoose.Types.ObjectId}`);
        
        const result = await StudentMessage.deleteMany({ student: student._id });
        console.log(`✅ DeleteMany succeeded!`);
        console.log(`   Deleted count: ${result.deletedCount}`);

        // Test 5: Try with string ID
        console.log('\n📋 Test 5: Testing with string ID...');
        const stringId = student._id.toString();
        console.log(`   Using string ID: ${stringId}`);
        const result2 = await StudentMessage.deleteMany({ student: stringId });
        console.log(`✅ DeleteMany with string succeeded!`);
        console.log(`   Deleted count: ${result2.deletedCount}`);

        console.log('\n✅ All tests passed! The endpoint should work.');
        console.log('\n💡 If the endpoint still fails, the issue is likely:');
        console.log('   1. JWT token not being decoded correctly');
        console.log('   2. req.student.id is undefined or wrong format');
        console.log('   3. Database connection issue in the actual request');

    } catch (error) {
        console.error('\n❌ Test failed with error:');
        console.error('   Error name:', error.name);
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
        process.exit(0);
    }
}

// Run the test
console.log('🧪 Starting Clear Messages Test...\n');
testClearMessages();
