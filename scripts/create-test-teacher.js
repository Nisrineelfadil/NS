const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');
    createTestTeacher();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

// Import Teacher model
const Teacher = require('./models/Teacher');
const Admin = require('./models/Admin');

async function createTestTeacher() {
    try {
        // Get a super admin to set as creator
        const admin = await Admin.findOne({ role: 'super_admin' });
        
        if (!admin) {
            console.log('❌ No super admin found. Please create an admin first.');
            process.exit(1);
        }

        // Check if test teacher already exists
        const existingTeacher = await Teacher.findOne({ email: 'test@nisrineschool.com' });
        
        if (existingTeacher) {
            console.log('\n⚠️  Test teacher already exists. Updating password...');
            existingTeacher.password = 'test123';
            await existingTeacher.save();
            console.log('✅ Password updated to: test123');
        } else {
            console.log('\n📝 Creating test teacher...');
            
            const testTeacher = new Teacher({
                fullName: 'Test Teacher',
                email: 'test@nisrineschool.com',
                password: 'test123',
                phoneNumber: '0612345678',
                formations: ['Allemand', 'Anglais', 'Français'],
                groups: [],
                status: 'active',
                createdBy: admin._id,
                createdByName: admin.username
            });
            
            await testTeacher.save();
            console.log('✅ Test teacher created successfully!');
        }
        
        console.log('\n🎉 You can now login with:');
        console.log('   Email: test@nisrineschool.com');
        console.log('   Password: test123');
        console.log('\n🌐 Go to: http://localhost:3000/teacher-portal');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
