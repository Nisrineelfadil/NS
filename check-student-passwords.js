// Script to check student password hashing status
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const ManagedStudent = require('./models/ManagedStudent');

async function checkStudentPasswords() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nisrine-school');
        
        console.log('✅ Connected to MongoDB\n');
        
        // Get all active students
        const students = await ManagedStudent.find({ status: 'active' })
            .select('+plainTextPassword')
            .sort({ fullName: 1 });
        
        console.log(`📊 Checking ${students.length} active students...\n`);
        console.log('='.repeat(70));
        
        let hashedCount = 0;
        let notHashedCount = 0;
        let missingPasswordCount = 0;
        let canLoginCount = 0;
        let cannotLoginCount = 0;
        
        for (const student of students) {
            console.log(`\n👤 ${student.fullName}`);
            console.log(`   Email: ${student.schoolEmail}`);
            
            if (!student.emailPassword) {
                console.log(`   ❌ NO PASSWORD SET`);
                missingPasswordCount++;
                cannotLoginCount++;
                continue;
            }
            
            // Check if password is hashed (bcrypt hashes start with $2a$ or $2b$)
            const isHashed = student.emailPassword.startsWith('$2a$') || student.emailPassword.startsWith('$2b$');
            
            if (isHashed) {
                console.log(`   ✅ Password is hashed`);
                hashedCount++;
                
                // Try to verify with plain text password if available
                if (student.plainTextPassword) {
                    try {
                        const isValid = await bcrypt.compare(student.plainTextPassword, student.emailPassword);
                        if (isValid) {
                            console.log(`   ✅ Can login with: ${student.plainTextPassword}`);
                            canLoginCount++;
                        } else {
                            console.log(`   ⚠️  Plain text password doesn't match hash`);
                            console.log(`   ℹ️  Stored plain text: ${student.plainTextPassword}`);
                            cannotLoginCount++;
                        }
                    } catch (err) {
                        console.log(`   ❌ Error verifying password`);
                        cannotLoginCount++;
                    }
                } else {
                    console.log(`   ⚠️  No plain text password stored (cannot verify)`);
                    canLoginCount++; // Assume it works
                }
            } else {
                console.log(`   ❌ Password is NOT hashed (plain text)`);
                console.log(`   ℹ️  Password: ${student.emailPassword}`);
                notHashedCount++;
                canLoginCount++; // Plain text passwords will work but are insecure
            }
        }
        
        console.log('\n' + '='.repeat(70));
        console.log('\n📊 SUMMARY:');
        console.log('='.repeat(70));
        console.log(`Total Students: ${students.length}`);
        console.log(`✅ Hashed passwords: ${hashedCount}`);
        console.log(`⚠️  Plain text passwords: ${notHashedCount}`);
        console.log(`❌ Missing passwords: ${missingPasswordCount}`);
        console.log(`\n✅ Can login: ${canLoginCount}`);
        console.log(`❌ Cannot login: ${cannotLoginCount}`);
        
        if (notHashedCount > 0) {
            console.log('\n⚠️  WARNING: Some passwords are not hashed!');
            console.log('   This is a security risk. Run fix-student-passwords.js to fix.');
        }
        
        if (cannotLoginCount > 0) {
            console.log('\n❌ ISSUE: Some students cannot login!');
            console.log('   Possible causes:');
            console.log('   1. Password hash is corrupted');
            console.log('   2. Plain text password doesn\'t match hash');
            console.log('   3. Password is missing');
            console.log('\n   Solution: Reset their passwords via admin panel');
        }
        
        console.log('\n✅ Check complete!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
        process.exit(0);
    }
}

checkStudentPasswords();
