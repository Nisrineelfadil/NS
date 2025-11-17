const express = require('express');
const router = express.Router();
const BranchGroup = require('../models/BranchGroup');
const Group = require('../models/Group');
const { authenticateAdmin, requireSuperAdmin } = require('../middleware/authMiddleware');

// Get all branch groups
router.get('/', authenticateAdmin, async (req, res) => {
    try {
        const branchGroups = await BranchGroup.find()
            .sort({ name: 1 })
            .select('-__v');
        
        // Add subgroup count for each branch group (filtered by season if provided)
        const branchGroupsWithCounts = await Promise.all(
            branchGroups.map(async (bg) => {
                const query = {
                    branchGroup: bg._id,
                    status: 'active'
                };
                
                // Filter by season if provided
                if (req.query.season) {
                    query.season = req.query.season;
                }
                
                const subgroupCount = await Group.countDocuments(query);
                
                return {
                    ...bg.toObject(),
                    subgroupCount
                };
            })
        );
        
        res.json(branchGroupsWithCounts);
    } catch (error) {
        console.error('Error fetching branch groups:', error);
        res.status(500).json({ error: 'Failed to fetch branch groups' });
    }
});

// Get branch group by ID
router.get('/:id', authenticateAdmin, async (req, res) => {
    try {
        const branchGroup = await BranchGroup.findById(req.params.id);
        
        if (!branchGroup) {
            return res.status(404).json({ error: 'Branch group not found' });
        }
        
        // Build query for subgroups
        const query = {
            branchGroup: branchGroup._id,
            status: 'active'
        };
        
        // Filter by season if provided
        if (req.query.season) {
            query.season = req.query.season;
        }
        
        // Get subgroups for this branch group
        const subgroups = await Group.find(query).sort({ name: 1 });
        
        res.json({
            ...branchGroup.toObject(),
            subgroups
        });
    } catch (error) {
        console.error('Error fetching branch group:', error);
        res.status(500).json({ error: 'Failed to fetch branch group' });
    }
});

// Get branch group by formation
router.get('/formation/:formation', authenticateAdmin, async (req, res) => {
    try {
        const branchGroup = await BranchGroup.findOne({ 
            formation: req.params.formation,
            status: 'active'
        });
        
        if (!branchGroup) {
            return res.status(404).json({ error: 'Branch group not found for this formation' });
        }
        
        res.json(branchGroup);
    } catch (error) {
        console.error('Error fetching branch group by formation:', error);
        res.status(500).json({ error: 'Failed to fetch branch group' });
    }
});

// Create new branch group (Super Admin only)
router.post('/', authenticateAdmin, requireSuperAdmin, async (req, res) => {
    try {
        const { name, formation, displayName, description, icon, color } = req.body;
        
        // Validate required fields
        if (!name || !formation || !displayName) {
            return res.status(400).json({ 
                error: 'Name, formation, and display name are required' 
            });
        }
        
        // Check if branch group already exists
        const existing = await BranchGroup.findOne({ name });
        if (existing) {
            return res.status(400).json({ 
                error: 'Branch group with this name already exists' 
            });
        }
        
        const Admin = require('../models/Admin');
        const admin = await Admin.findById(req.adminId);
        
        const branchGroup = new BranchGroup({
            name,
            type: 'custom',
            formation,
            displayName,
            description: description || '',
            icon: icon || '🎓',
            color: color || '#667eea',
            createdBy: req.adminId,
            createdByName: admin ? admin.username : 'System'
        });
        
        await branchGroup.save();
        
        res.status(201).json({
            message: 'Branch group created successfully',
            branchGroup
        });
    } catch (error) {
        console.error('Error creating branch group:', error);
        res.status(500).json({ error: 'Failed to create branch group' });
    }
});

// Update branch group (Super Admin only)
router.put('/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
    try {
        const { displayName, description, icon, color, status } = req.body;
        
        const branchGroup = await BranchGroup.findById(req.params.id);
        if (!branchGroup) {
            return res.status(404).json({ error: 'Branch group not found' });
        }
        
        // Don't allow changing name or formation for default groups
        if (branchGroup.type === 'default') {
            if (req.body.name || req.body.formation) {
                return res.status(400).json({ 
                    error: 'Cannot change name or formation of default branch groups' 
                });
            }
        }
        
        // Update fields
        if (displayName) branchGroup.displayName = displayName;
        if (description !== undefined) branchGroup.description = description;
        if (icon) branchGroup.icon = icon;
        if (color) branchGroup.color = color;
        if (status) branchGroup.status = status;
        
        await branchGroup.save();
        
        res.json({
            message: 'Branch group updated successfully',
            branchGroup
        });
    } catch (error) {
        console.error('Error updating branch group:', error);
        res.status(500).json({ error: 'Failed to update branch group' });
    }
});

// Delete branch group (Super Admin only)
router.delete('/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
    try {
        const branchGroup = await BranchGroup.findById(req.params.id);
        if (!branchGroup) {
            return res.status(404).json({ error: 'Branch group not found' });
        }
        
        // Don't allow deleting default branch groups
        if (branchGroup.type === 'default') {
            return res.status(400).json({ 
                error: 'Cannot delete default branch groups. Deactivate it instead.' 
            });
        }
        
        // Check if branch group has subgroups
        const subgroupCount = await Group.countDocuments({ branchGroup: branchGroup._id });
        if (subgroupCount > 0) {
            return res.status(400).json({ 
                error: `Cannot delete branch group with ${subgroupCount} subgroups. Deactivate it instead.` 
            });
        }
        
        await branchGroup.deleteOne();
        
        res.json({ message: 'Branch group deleted successfully' });
    } catch (error) {
        console.error('Error deleting branch group:', error);
        res.status(500).json({ error: 'Failed to delete branch group' });
    }
});

// Get hierarchical structure (all seasons and branch groups with their groups)
router.get('/hierarchy/all', authenticateAdmin, async (req, res) => {
    try {
        const hierarchy = await Group.getHierarchical();
        res.json(hierarchy);
    } catch (error) {
        console.error('Error fetching hierarchy:', error);
        res.status(500).json({ error: 'Failed to fetch hierarchy' });
    }
});

// ==================== SUBGROUP MANAGEMENT ====================

// Get subgroups for a branch group
router.get('/:id/subgroups', authenticateAdmin, async (req, res) => {
    try {
        console.log('🔍 GET /:id/subgroups called');
        console.log('   Branch Group ID:', req.params.id);
        console.log('   Season ID:', req.query.season);
        
        const ManagedStudent = require('../models/ManagedStudent');
        
        // Verify the branch group exists
        const branchGroup = await BranchGroup.findById(req.params.id);
        if (!branchGroup) {
            console.log('❌ Branch group not found:', req.params.id);
            return res.status(404).json({ error: 'Branch group not found' });
        }
        
        console.log('✅ Branch group found:', branchGroup.displayName);
        
        // Build query with season filter if provided
        const query = {
            branchGroup: req.params.id,
            groupType: 'branch',
            status: 'active'
        };
        
        // Filter by season if provided
        if (req.query.season) {
            query.season = req.query.season;
            console.log('   Filtering by season:', req.query.season);
        }
        
        const subgroups = await Group.find(query).sort({ name: 1 });
        
        console.log(`📊 Found ${subgroups.length} subgroups`);
        
        // Add student count for each subgroup
        const subgroupsWithCounts = await Promise.all(
            subgroups.map(async (sg) => {
                const studentCount = await ManagedStudent.countDocuments({
                    branchSubgroup: sg._id,
                    status: 'active'
                });
                
                return {
                    ...sg.toObject(),
                    studentCount
                };
            })
        );
        
        res.json(subgroupsWithCounts);
    } catch (error) {
        console.error('Error fetching subgroups:', error);
        res.status(500).json({ error: 'Failed to fetch subgroups' });
    }
});

// Create subgroup for a branch group
router.post('/:id/subgroups', authenticateAdmin, async (req, res) => {
    try {
        console.log('📝 Creating subgroup - Request body:', req.body);
        const { name, maxStudents, season, seasonName } = req.body;
        
        // Validate season is provided
        if (!season || !seasonName) {
            console.log('❌ Validation failed: Missing season data');
            return res.status(400).json({ error: 'Season ID and name are required' });
        }
        
        console.log('✅ Season validation passed:', { season, seasonName });
        
        const branchGroup = await BranchGroup.findById(req.params.id);
        if (!branchGroup) {
            console.log('❌ Branch group not found:', req.params.id);
            return res.status(404).json({ error: 'Branch group not found' });
        }
        
        console.log('✅ Branch group found:', branchGroup.displayName);
        
        const Admin = require('../models/Admin');
        const admin = await Admin.findById(req.adminId);
        
        // Auto-generate name if not provided
        let subgroupName = name;
        if (!subgroupName) {
            // Get existing subgroups count for this season
            const existingCount = await Group.countDocuments({
                branchGroup: branchGroup._id,
                groupType: 'branch',
                season: season
            });
            subgroupName = `${branchGroup.displayName} GROUP ${existingCount + 1}`;
            console.log('🔢 Auto-generated name:', subgroupName);
        }
        
        console.log('📦 Creating subgroup with data:', {
            name: subgroupName,
            groupType: 'branch',
            branchGroup: branchGroup._id,
            formation: branchGroup.formation,
            season,
            seasonName
        });
        
        const subgroup = new Group({
            name: subgroupName,
            groupType: 'branch',
            branchGroup: branchGroup._id,
            branchGroupName: branchGroup.displayName,
            formation: branchGroup.formation,
            season: season,
            seasonName: seasonName,
            maxStudents: maxStudents || 30,
            currentStudentCount: 0,
            status: 'active',
            createdBy: req.adminId,
            createdByName: admin ? admin.username : 'System'
        });
        
        console.log('💾 Saving subgroup...');
        await subgroup.save();
        console.log('✅ Subgroup saved successfully:', subgroup._id);
        
        res.status(201).json({
            message: 'Subgroup created successfully',
            subgroup
        });
    } catch (error) {
        console.error('❌ Error creating subgroup:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ 
            error: 'Failed to create subgroup',
            details: error.message 
        });
    }
});

// Update subgroup
router.put('/:branchId/subgroups/:subgroupId', authenticateAdmin, async (req, res) => {
    try {
        const { name, maxStudents, status } = req.body;
        
        const subgroup = await Group.findById(req.params.subgroupId);
        if (!subgroup) {
            return res.status(404).json({ error: 'Subgroup not found' });
        }
        
        if (name) subgroup.name = name;
        if (maxStudents) subgroup.maxStudents = maxStudents;
        if (status) subgroup.status = status;
        
        await subgroup.save();
        
        res.json({
            message: 'Subgroup updated successfully',
            subgroup
        });
    } catch (error) {
        console.error('Error updating subgroup:', error);
        res.status(500).json({ error: 'Failed to update subgroup' });
    }
});

// Delete subgroup
router.delete('/:branchId/subgroups/:subgroupId', authenticateAdmin, async (req, res) => {
    try {
        const ManagedStudent = require('../models/ManagedStudent');
        
        const subgroup = await Group.findById(req.params.subgroupId);
        if (!subgroup) {
            return res.status(404).json({ error: 'Subgroup not found' });
        }
        
        // Check if subgroup has students and unassign them
        const studentCount = await ManagedStudent.countDocuments({
            branchSubgroup: subgroup._id
        });
        
        if (studentCount > 0) {
            console.log(`⚠️ Deleting subgroup with ${studentCount} students. Unassigning them...`);
            
            // Unassign all students from this subgroup
            await ManagedStudent.updateMany(
                { branchSubgroup: subgroup._id },
                { 
                    $unset: { 
                        branchSubgroup: 1,
                        branchSubgroupName: 1
                    }
                }
            );
            
            console.log(`✅ Unassigned ${studentCount} students from subgroup`);
        }
        
        await subgroup.deleteOne();
        
        res.json({ 
            message: 'Subgroup deleted successfully',
            studentsUnassigned: studentCount
        });
    } catch (error) {
        console.error('Error deleting subgroup:', error);
        res.status(500).json({ error: 'Failed to delete subgroup' });
    }
});

// Auto-assign student to subgroup (creates first subgroup if needed)
router.post('/:id/assign-student', authenticateAdmin, async (req, res) => {
    try {
        const { studentId, subgroupId } = req.body;
        
        const branchGroup = await BranchGroup.findById(req.params.id);
        if (!branchGroup) {
            return res.status(404).json({ error: 'Branch group not found' });
        }
        
        const ManagedStudent = require('../models/ManagedStudent');
        
        // Get student with populated group to check season
        const student = await ManagedStudent.findById(studentId).populate('group');
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // Validate student has a language group with season
        if (!student.group || !student.group.season) {
            return res.status(400).json({ error: 'Student must be assigned to a language group first' });
        }
        
        // Check if student is already assigned to a subgroup in this branch
        if (student.branchSubgroup) {
            const currentSubgroup = await Group.findById(student.branchSubgroup);
            if (currentSubgroup && currentSubgroup.branchGroup.toString() === branchGroup._id.toString()) {
                return res.status(400).json({ 
                    error: `Student is already assigned to ${currentSubgroup.name}. Please unassign them first.`,
                    currentSubgroup: currentSubgroup.name
                });
            }
        }
        
        let targetSubgroup;
        
        // Get student's season from their language group
        const studentSeason = student.group.season;
        const studentSeasonName = student.group.seasonName;
        
        // If subgroupId provided, use it
        if (subgroupId) {
            targetSubgroup = await Group.findById(subgroupId);
            if (!targetSubgroup) {
                return res.status(404).json({ error: 'Subgroup not found' });
            }
            // Verify subgroup is in the same season
            if (targetSubgroup.season.toString() !== studentSeason.toString()) {
                return res.status(400).json({ error: 'Subgroup must be in the same season as the student' });
            }
        } else {
            // Auto-create first subgroup if none exist for this season
            const existingSubgroups = await Group.find({
                branchGroup: branchGroup._id,
                groupType: 'branch',
                season: studentSeason,
                status: 'active'
            });
            
            if (existingSubgroups.length === 0) {
                // Create first subgroup for this season
                const Admin = require('../models/Admin');
                const admin = await Admin.findById(req.adminId);
                
                targetSubgroup = new Group({
                    name: `${branchGroup.displayName} GROUP 1`,
                    groupType: 'branch',
                    branchGroup: branchGroup._id,
                    branchGroupName: branchGroup.displayName,
                    formation: branchGroup.formation,
                    season: studentSeason,
                    seasonName: studentSeasonName,
                    maxStudents: 30,
                    currentStudentCount: 0,
                    status: 'active',
                    createdBy: req.adminId,
                    createdByName: admin ? admin.username : 'System'
                });
                
                await targetSubgroup.save();
            } else {
                // Use first available subgroup in the same season
                targetSubgroup = existingSubgroups[0];
            }
        }
        
        // Assign student to subgroup
        student.branchSubgroup = targetSubgroup._id;
        student.branchSubgroupName = targetSubgroup.name;
        await student.save();
        
        // Update subgroup student count
        const studentCount = await ManagedStudent.countDocuments({
            branchSubgroup: targetSubgroup._id,
            status: 'active'
        });
        targetSubgroup.currentStudentCount = studentCount;
        await targetSubgroup.save();
        
        res.json({
            message: 'Student assigned to subgroup successfully',
            subgroup: targetSubgroup,
            student
        });
    } catch (error) {
        console.error('Error assigning student:', error);
        res.status(500).json({ error: 'Failed to assign student' });
    }
});

// Get pending assignments (students with filiere but no branch subgroup)
router.get('/pending-assignments/list', authenticateAdmin, async (req, res) => {
    try {
        const ManagedStudent = require('../models/ManagedStudent');
        
        // Base query for pending students
        const query = {
            filiere: { $exists: true, $ne: [] },
            $or: [
                { branchSubgroup: { $exists: false } },
                { branchSubgroup: null }
            ],
            status: 'active'
        };
        
        // Populate group to access season information
        let pendingStudents = await ManagedStudent.find(query)
            .populate('group', 'name season seasonName');
        
        // Filter by season if provided (filter after populate since season is in group)
        if (req.query.season) {
            pendingStudents = pendingStudents.filter(student => 
                student.group && 
                student.group.season && 
                student.group.season.toString() === req.query.season
            );
        }
        
        res.json(pendingStudents);
    } catch (error) {
        console.error('Error fetching pending assignments:', error);
        res.status(500).json({ error: 'Failed to fetch pending assignments' });
    }
});

module.exports = router;
