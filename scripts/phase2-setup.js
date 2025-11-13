/**
 * Phase 2 Setup Script
 * 
 * This script initializes the Phase 2 hierarchical group system:
 * 1. Creates default season (2025-2026)
 * 2. Creates 8 default branch groups
 * 3. Migrates existing groups to new structure
 * 4. Updates existing grades with evaluation status
 * 
 * Run with: node scripts/phase2-setup.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Season = require('../models/Season');
const BranchGroup = require('../models/BranchGroup');
const Group = require('../models/Group');
const Grade = require('../models/Grade');
const Admin = require('../models/Admin');

async function setupPhase2() {
    try {
        console.log('🚀 Starting Phase 2 Setup...\n');
        
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');
        
        // Get super admin for created by fields
        const superAdmin = await Admin.findOne({ role: 'super_admin' });
        if (!superAdmin) {
            console.error('❌ No super admin found. Please create a super admin first.');
            process.exit(1);
        }
        
        // Step 1: Create default season
        console.log('📅 Step 1: Creating default season...');
        let currentSeason = await Season.findOne({ name: '2025-2026' });
        
        if (!currentSeason) {
            currentSeason = await Season.createFromYear(
                2025,
                superAdmin._id,
                superAdmin.username
            );
            // Set as active
            currentSeason.status = 'active';
            await currentSeason.save();
            console.log(`   ✅ Created season: ${currentSeason.name}`);
        } else {
            console.log(`   ℹ️  Season already exists: ${currentSeason.name}`);
        }
        
        // Step 2: Create default branch groups
        console.log('\n🎓 Step 2: Creating default branch groups...');
        const branchGroups = await BranchGroup.createDefaults(
            superAdmin._id,
            superAdmin.username
        );
        
        if (branchGroups.length > 0) {
            console.log(`   ✅ Created ${branchGroups.length} branch groups:`);
            branchGroups.forEach(bg => {
                console.log(`      - ${bg.displayName} (${bg.formation})`);
            });
        } else {
            console.log('   ℹ️  All branch groups already exist');
        }
        
        // Step 3: Migrate existing groups
        console.log('\n📦 Step 3: Migrating existing groups...');
        const existingGroups = await Group.find({ groupType: { $exists: false } });
        
        if (existingGroups.length > 0) {
            console.log(`   Found ${existingGroups.length} groups to migrate`);
            
            for (const group of existingGroups) {
                // Determine if it's a language or branch group
                const isLanguageGroup = ['Allemand', 'Anglais', 'Français', 'Ausbildung', 'Mixed'].includes(group.formation);
                
                if (isLanguageGroup) {
                    // Migrate to language group under current season
                    group.groupType = 'language';
                    group.season = currentSeason._id;
                    group.seasonName = currentSeason.name;
                    console.log(`   ✅ Migrated "${group.name}" as language group`);
                } else {
                    // Migrate to branch group
                    const branchGroup = await BranchGroup.findOne({ formation: group.formation });
                    if (branchGroup) {
                        group.groupType = 'branch';
                        group.branchGroup = branchGroup._id;
                        group.branchGroupName = branchGroup.name;
                        console.log(`   ✅ Migrated "${group.name}" as branch group under ${branchGroup.name}`);
                    } else {
                        console.log(`   ⚠️  Warning: No branch group found for ${group.formation}, keeping as language group`);
                        group.groupType = 'language';
                        group.season = currentSeason._id;
                        group.seasonName = currentSeason.name;
                    }
                }
                
                await group.save();
            }
        } else {
            console.log('   ℹ️  No groups to migrate');
        }
        
        // Step 4: Update existing grades with evaluation status
        console.log('\n📊 Step 4: Updating existing grades...');
        const gradesToUpdate = await Grade.find({ evaluationStatus: { $exists: false } });
        
        if (gradesToUpdate.length > 0) {
            console.log(`   Found ${gradesToUpdate.length} grades to update`);
            let updated = 0;
            
            // Use updateOne to bypass validation
            for (const grade of gradesToUpdate) {
                if (grade.score !== undefined && grade.maxScore) {
                    const percentage = (grade.score / grade.maxScore) * 100;
                    
                    let evaluationStatus;
                    if (percentage >= 70) {
                        evaluationStatus = 'approved';
                    } else if (percentage >= 50) {
                        evaluationStatus = 'mid';
                    } else {
                        evaluationStatus = 'failed';
                    }
                    
                    // Generate auto comment
                    const isLanguage = ['Allemand', 'Anglais', 'Français', 'Ausbildung'].includes(grade.formation);
                    let autoComment;
                    if (percentage >= 90) {
                        autoComment = isLanguage 
                            ? `Excellent performance in ${grade.formation}! Outstanding ${grade.examType || 'exam'} results.`
                            : `Excellent work! All competencies mastered.`;
                    } else if (percentage >= 70) {
                        autoComment = isLanguage
                            ? `Good performance in ${grade.formation}. ${grade.examType || 'Exam'} passed successfully.`
                            : `Good work. Competencies achieved.`;
                    } else if (percentage >= 50) {
                        autoComment = isLanguage
                            ? `Average performance in ${grade.formation}. ${grade.examType || 'Exam'} needs improvement.`
                            : `Satisfactory. Some competencies need reinforcement.`;
                    } else {
                        autoComment = isLanguage
                            ? `Below expectations in ${grade.formation}. Additional practice required for ${grade.examType || 'exam'}.`
                            : `Needs significant improvement. Additional support recommended.`;
                    }
                    
                    // Update without validation
                    await Grade.updateOne(
                        { _id: grade._id },
                        { 
                            $set: { 
                                evaluationStatus,
                                autoComment
                            } 
                        }
                    );
                    updated++;
                }
            }
            
            console.log(`   ✅ Updated ${updated} grades with evaluation status`);
        } else {
            console.log('   ℹ️  No grades to update');
        }
        
        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('✅ Phase 2 Setup Complete!\n');
        console.log('Summary:');
        console.log(`   - Season: ${currentSeason.name} (${currentSeason.status})`);
        console.log(`   - Branch Groups: ${await BranchGroup.countDocuments()}`);
        console.log(`   - Language Groups: ${await Group.countDocuments({ groupType: 'language' })}`);
        console.log(`   - Branch Subgroups: ${await Group.countDocuments({ groupType: 'branch' })}`);
        console.log(`   - Grades with evaluation: ${await Grade.countDocuments({ evaluationStatus: { $exists: true } })}`);
        console.log('='.repeat(60) + '\n');
        
        console.log('Next steps:');
        console.log('1. Update frontend to use new hierarchical group structure');
        console.log('2. Implement A1-B2 grade entry in teacher portal');
        console.log('3. Add visual evaluation display in student portal');
        console.log('4. Test the new system thoroughly\n');
        
    } catch (error) {
        console.error('❌ Error during Phase 2 setup:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from database');
    }
}

// Run the setup
setupPhase2();
