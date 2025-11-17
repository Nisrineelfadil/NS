/**
 * Fix Group Collection Indexes
 * 
 * This script removes the old 'name_1' unique index and ensures the correct
 * compound index 'name_1_season_1' is in place.
 * 
 * The old index prevents creating subgroups with the same name in different seasons.
 * 
 * Usage: node fix-group-indexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function fixGroupIndexes() {
    try {
        console.log('🔧 Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected!\n');

        const db = mongoose.connection.db;
        const groupsCollection = db.collection('groups');

        console.log('📋 Current indexes on groups collection:');
        console.log('─'.repeat(60));
        
        const indexes = await groupsCollection.indexes();
        indexes.forEach((index, i) => {
            console.log(`${i + 1}. ${index.name}`);
            console.log(`   Keys: ${JSON.stringify(index.key)}`);
            if (index.unique) console.log(`   Unique: true`);
            console.log('');
        });
        console.log('─'.repeat(60));

        // Check if the problematic 'name_1' index exists
        const hasOldIndex = indexes.some(idx => idx.name === 'name_1' && idx.key.name === 1 && !idx.key.season);
        
        if (hasOldIndex) {
            console.log('\n⚠️  Found problematic index: name_1');
            console.log('   This index prevents creating subgroups with the same name in different seasons.');
            console.log('\n🗑️  Dropping old index...');
            
            await groupsCollection.dropIndex('name_1');
            console.log('✅ Successfully dropped name_1 index');
        } else {
            console.log('\n✅ No problematic name_1 index found');
        }

        // Verify the correct compound index exists
        const hasCorrectIndex = indexes.some(idx => 
            idx.name === 'name_1_season_1' && 
            idx.key.name === 1 && 
            idx.key.season === 1 &&
            idx.unique === true
        );

        if (hasCorrectIndex) {
            console.log('✅ Correct compound index (name_1_season_1) exists');
        } else {
            console.log('\n⚠️  Compound index (name_1_season_1) not found');
            console.log('📝 Creating compound index...');
            
            await groupsCollection.createIndex(
                { name: 1, season: 1 }, 
                { unique: true, sparse: true, name: 'name_1_season_1' }
            );
            console.log('✅ Created compound index: name_1_season_1');
        }

        console.log('\n' + '═'.repeat(60));
        console.log('✅ INDEX FIX COMPLETE!');
        console.log('═'.repeat(60));
        
        console.log('\n📋 Final indexes:');
        const finalIndexes = await groupsCollection.indexes();
        finalIndexes.forEach((index, i) => {
            console.log(`${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
        });

        console.log('\n📝 Next Steps:');
        console.log('   1. Restart your server: npm start');
        console.log('   2. Try creating a branch subgroup again');
        console.log('   3. It should work now!\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed\n');
    }
}

// Run the fix
console.log('\n' + '═'.repeat(60));
console.log('🔧 GROUP INDEXES FIX - Removing Duplicate Key Constraint');
console.log('═'.repeat(60) + '\n');

fixGroupIndexes().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
