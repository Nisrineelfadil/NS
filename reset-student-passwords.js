// Script to reset passwords for students who don't have plain text passwords stored
const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

const ManagedStudent = require('./models/ManagedStudent');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

async function resetStudentPasswords() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nisrine-school');
        
        console.log('✅ Connected to MongoDB\n');
        
        // Find students without plain text passwords
        const students = await ManagedStudent.find({ 
            status: 'active',
            $or: [
                { plainTextPassword: null },
                { plainTextPassword: { $exists: false } },
                { plainTextPassword: '' }
            ]
        }).select('+plainTextPassword').sort({ fullName: 1 });
        
        if (students.length === 0) {
            console.log('✅ All students have plain text passwords stored!');
            console.log('   No action needed.');
            return;
        }
        
        console.log(`⚠️  Found ${students.length} student(s) without plain text passwords:\n`);
        
        students.forEach((student, index) => {
            console.log(`${index + 1}. ${student.fullName} (${student.schoolEmail})`);
        });
        
        console.log('\n' + '='.repeat(70));
        console.log('🔧 PASSWORD RESET OPTIONS:');
        console.log('='.repeat(70));
        console.log('\n1. AUTO-GENERATE new passwords (Recommended)');
        console.log('   - Creates random 12-character passwords');
        console.log('   - Displays passwords so you can share with students');
        console.log('\n2. SET CUSTOM passwords');
        console.log('   - You enter password for each student');
        console.log('\n3. EXIT without changes\n');
        
        const choice = await question('Enter your choice (1, 2, or 3): ');
        
        if (choice === '1') {
            // Auto-generate passwords
            console.log('\n🤖 AUTO-GENERATING passwords...\n');
            console.log('='.repeat(70));
            console.log('IMPORTANT: Save these passwords and share with students!');
            console.log('='.repeat(70) + '\n');
            
            for (const student of students) {
                const newPassword = generatePassword();
                
                // Update password (will be hashed by pre-save hook)
                student.emailPassword = newPassword;
                await student.save();
                
                console.log(`✅ ${student.fullName}`);
                console.log(`   Email: ${student.schoolEmail}`);
                console.log(`   New Password: ${newPassword}\n`);
            }
            
            console.log('='.repeat(70));
            console.log('✅ All passwords have been reset!');
            console.log('📋 Copy the passwords above and share with students.');
            console.log('='.repeat(70));
            
        } else if (choice === '2') {
            // Custom passwords
            console.log('\n📝 CUSTOM PASSWORD SETUP:\n');
            
            for (const student of students) {
                console.log(`\n${'='.repeat(70)}`);
                console.log(`Student: ${student.fullName}`);
                console.log(`Email: ${student.schoolEmail}`);
                
                const newPassword = await question('Enter new password (or press Enter to skip): ');
                
                if (newPassword && newPassword.trim() !== '') {
                    student.emailPassword = newPassword.trim();
                    await student.save();
                    console.log(`✅ Password updated to: ${newPassword.trim()}`);
                } else {
                    console.log(`⏭️  Skipped`);
                }
            }
            
            console.log('\n✅ Password setup complete!');
            
        } else {
            console.log('\n👋 Exiting without changes...');
        }
        
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

resetStudentPasswords();
