const mongoose = require('mongoose');
require('dotenv').config();

console.log('='.repeat(60));
console.log('🔍 STUDENT MANAGEMENT SYSTEM DIAGNOSTIC TEST');
console.log('='.repeat(60));

// Test 1: Check Environment Variables
console.log('\n📋 TEST 1: Environment Variables');
console.log('-'.repeat(60));
if (process.env.MONGODB_URI) {
    console.log('✅ MONGODB_URI is set');
    console.log('   Value:', process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')); // Hide password
} else {
    console.log('❌ MONGODB_URI is NOT set in .env file');
    console.log('   Please add: MONGODB_URI=mongodb://...');
}

if (process.env.JWT_SECRET) {
    console.log('✅ JWT_SECRET is set');
} else {
    console.log('⚠️  JWT_SECRET is NOT set');
}

// Test 2: MongoDB Connection
console.log('\n📋 TEST 2: MongoDB Connection');
console.log('-'.repeat(60));

async function testDatabaseConnection() {
    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB Connected Successfully!');
        console.log('   Database:', mongoose.connection.name);
        console.log('   Host:', mongoose.connection.host);
        return true;
    } catch (error) {
        console.log('❌ MongoDB Connection Failed!');
        console.log('   Error:', error.message);
        return false;
    }
}

// Test 3: Check Models
console.log('\n📋 TEST 3: Loading Models');
console.log('-'.repeat(60));

let Group, ManagedStudent, Admin;

try {
    Group = require('./models/Group');
    console.log('✅ Group model loaded');
} catch (error) {
    console.log('❌ Group model failed to load:', error.message);
}

try {
    ManagedStudent = require('./models/ManagedStudent');
    console.log('✅ ManagedStudent model loaded');
} catch (error) {
    console.log('❌ ManagedStudent model failed to load:', error.message);
}

try {
    Admin = require('./models/Admin');
    console.log('✅ Admin model loaded');
} catch (error) {
    console.log('❌ Admin model failed to load:', error.message);
}

// Test 4: Check Database Collections
async function testCollections() {
    console.log('\n📋 TEST 4: Database Collections');
    console.log('-'.repeat(60));
    
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('✅ Found', collections.length, 'collections:');
        collections.forEach(col => {
            console.log('   -', col.name);
        });
    } catch (error) {
        console.log('❌ Failed to list collections:', error.message);
    }
}

// Test 5: Check if Groups Exist
async function testGroups() {
    console.log('\n📋 TEST 5: Groups in Database');
    console.log('-'.repeat(60));
    
    try {
        const groupCount = await Group.countDocuments();
        console.log('✅ Found', groupCount, 'groups');
        
        if (groupCount > 0) {
            const groups = await Group.find().limit(5);
            console.log('   Sample groups:');
            groups.forEach(g => {
                console.log(`   - ${g.name} (ID: ${g._id})`);
            });
        } else {
            console.log('⚠️  No groups found. You need to create a group first!');
        }
    } catch (error) {
        console.log('❌ Failed to query groups:', error.message);
    }
}

// Test 6: Check if Admins Exist
async function testAdmins() {
    console.log('\n📋 TEST 6: Admins in Database');
    console.log('-'.repeat(60));
    
    try {
        const adminCount = await Admin.countDocuments();
        console.log('✅ Found', adminCount, 'admins');
        
        if (adminCount > 0) {
            const admins = await Admin.find().select('username email role');
            console.log('   Admins:');
            admins.forEach(a => {
                console.log(`   - ${a.username} (${a.email}) - Role: ${a.role}`);
            });
        } else {
            console.log('⚠️  No admins found!');
        }
    } catch (error) {
        console.log('❌ Failed to query admins:', error.message);
    }
}

// Test 7: Test Student Creation
async function testStudentCreation() {
    console.log('\n📋 TEST 7: Test Student Creation');
    console.log('-'.repeat(60));
    
    try {
        // Get first group
        const group = await Group.findOne();
        if (!group) {
            console.log('❌ Cannot test - no groups available');
            return;
        }
        
        // Get first admin
        const admin = await Admin.findOne();
        if (!admin) {
            console.log('❌ Cannot test - no admins available');
            return;
        }
        
        console.log('Creating test student...');
        const testStudent = new ManagedStudent({
            fullName: 'Test Student ' + Date.now(),
            phoneNumber: '0612345678',
            parentPhone: '0687654321',
            schoolEmail: `test${Date.now()}@nisrineschool.com`,
            emailPassword: 'TestPassword123',
            formation: ['Allemand'],
            filiere: ['Gériatrie'],
            group: group._id,
            groupName: group.name,
            paymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            paymentAmount: 500,
            reminderDaysBefore: 7,
            addedBy: admin._id,
            addedByName: admin.username
        });
        
        await testStudent.save();
        console.log('✅ Test student created successfully!');
        console.log('   ID:', testStudent._id);
        console.log('   Name:', testStudent.fullName);
        console.log('   Email:', testStudent.schoolEmail);
        
        // Clean up - delete test student
        await ManagedStudent.findByIdAndDelete(testStudent._id);
        console.log('✅ Test student deleted (cleanup)');
        
    } catch (error) {
        console.log('❌ Student creation failed!');
        console.log('   Error:', error.message);
        if (error.errors) {
            console.log('   Validation errors:');
            Object.keys(error.errors).forEach(key => {
                console.log(`   - ${key}: ${error.errors[key].message}`);
            });
        }
    }
}

// Run all tests
async function runAllTests() {
    const connected = await testDatabaseConnection();
    
    if (connected) {
        await testCollections();
        await testGroups();
        await testAdmins();
        await testStudentCreation();
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ DIAGNOSTIC COMPLETE');
        console.log('='.repeat(60));
        
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    } else {
        console.log('\n' + '='.repeat(60));
        console.log('❌ DIAGNOSTIC FAILED - Cannot connect to database');
        console.log('='.repeat(60));
        console.log('\n💡 SOLUTION:');
        console.log('1. Make sure MongoDB is running');
        console.log('2. Check your .env file has correct MONGODB_URI');
        console.log('3. If using MongoDB Atlas, check your IP whitelist');
    }
    
    process.exit(0);
}

// Start tests
runAllTests().catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
});
