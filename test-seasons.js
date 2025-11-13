// Test script to check and create seasons for attendance export
const mongoose = require('mongoose');
require('dotenv').config();

const Season = require('./models/Season');

async function testSeasons() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nisrine-school', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Check existing seasons
        const existingSeasons = await Season.find().sort({ startDate: -1 });
        
        console.log(`\n📊 Found ${existingSeasons.length} season(s) in database:`);
        existingSeasons.forEach(season => {
            console.log(`   - ${season.name} (${season.status}) - ${season.startDate.toLocaleDateString()} to ${season.endDate.toLocaleDateString()}`);
        });
        
        // If no seasons exist, create default ones
        if (existingSeasons.length === 0) {
            console.log('\n⚠️  No seasons found. Creating default seasons...');
            
            // Create a dummy admin ID (you should replace this with a real admin ID)
            const Admin = require('./models/Admin');
            let adminUser = await Admin.findOne({ role: 'super_admin' });
            
            if (!adminUser) {
                adminUser = await Admin.findOne();
            }
            
            if (!adminUser) {
                console.log('❌ No admin user found. Please create an admin first.');
                process.exit(1);
            }
            
            // Create seasons for 2024-2025 and 2025-2026
            const seasonsToCreate = [
                {
                    name: '2024-2025',
                    startDate: new Date(2024, 8, 1), // September 1, 2024
                    endDate: new Date(2025, 7, 31), // August 31, 2025
                    status: 'archived',
                    createdBy: adminUser._id,
                    createdByName: adminUser.fullName || 'System Admin'
                },
                {
                    name: '2025-2026',
                    startDate: new Date(2025, 8, 1), // September 1, 2025
                    endDate: new Date(2026, 7, 31), // August 31, 2026
                    status: 'active',
                    createdBy: adminUser._id,
                    createdByName: adminUser.fullName || 'System Admin'
                },
                {
                    name: '2026-2027',
                    startDate: new Date(2026, 8, 1), // September 1, 2026
                    endDate: new Date(2027, 7, 31), // August 31, 2027
                    status: 'upcoming',
                    createdBy: adminUser._id,
                    createdByName: adminUser.fullName || 'System Admin'
                }
            ];
            
            for (const seasonData of seasonsToCreate) {
                const season = new Season(seasonData);
                await season.save();
                console.log(`   ✅ Created season: ${season.name} (${season.status})`);
            }
            
            console.log('\n✅ Default seasons created successfully!');
        } else {
            console.log('\n✅ Seasons already exist. No action needed.');
        }
        
        // Test the API endpoint format
        console.log('\n📋 Testing API response format:');
        const apiResponse = await Season.find()
            .sort({ startDate: -1 })
            .select('name startDate endDate status')
            .limit(10);
        
        console.log(JSON.stringify({ success: true, seasons: apiResponse }, null, 2));
        
        console.log('\n✅ Test completed successfully!');
        console.log('\n🔄 Please restart your server to see the changes.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
        process.exit(0);
    }
}

testSeasons();
