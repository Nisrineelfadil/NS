const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');
    testTeacherLogin();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

// Import Teacher model
const Teacher = require('./models/Teacher');

async function testTeacherLogin() {
    try {
        console.log('\n🔍 Checking for existing teachers...\n');
        
        const teachers = await Teacher.find();
        console.log(`Found ${teachers.length} teacher(s) in database:`);
        
        if (teachers.length === 0) {
            console.log('\n❌ No teachers found!');
            console.log('\n📝 To create a teacher:');
            console.log('1. Go to http://localhost:3000/student-management');
            console.log('2. Login as super admin');
            console.log('3. Click "Teachers" tab');
            console.log('4. Click "Add Teacher"');
            console.log('5. Fill in the form and save');
        } else {
            teachers.forEach((teacher, index) => {
                console.log(`\n${index + 1}. ${teacher.fullName}`);
                console.log(`   Email: ${teacher.email}`);
                console.log(`   Status: ${teacher.status}`);
                console.log(`   Formations: ${teacher.formations.join(', ')}`);
                console.log(`   Groups: ${teacher.groups.length} group(s)`);
            });
            
            console.log('\n✅ You can login with any of these teacher emails');
            console.log('⚠️  Make sure you remember the password you set when creating the teacher');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
