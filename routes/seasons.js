const express = require('express');
const router = express.Router();
const Season = require('../models/Season');
const Group = require('../models/Group');
const { authenticateAdmin, requireSuperAdmin } = require('../middleware/authMiddleware');

// Get all seasons
router.get('/', authenticateAdmin, async (req, res) => {
    try {
        const seasons = await Season.find()
            .sort({ startDate: -1 })
            .select('-__v');
        
        // Add group count for each season
        const seasonsWithCounts = await Promise.all(
            seasons.map(async (season) => {
                const groupCount = await Group.countDocuments({
                    season: season._id,
                    status: 'active'
                });
                
                return {
                    ...season.toObject(),
                    groupCount
                };
            })
        );
        
        res.json(seasonsWithCounts);
    } catch (error) {
        console.error('Error fetching seasons:', error);
        res.status(500).json({ error: 'Failed to fetch seasons' });
    }
});

// Get current active season (Public endpoint - no auth required for students)
router.get('/current', async (req, res) => {
    try {
        const currentSeason = await Season.getCurrentSeason();
        
        if (!currentSeason) {
            return res.status(404).json({ error: 'No active season found' });
        }
        
        res.json(currentSeason);
    } catch (error) {
        console.error('Error fetching current season:', error);
        res.status(500).json({ error: 'Failed to fetch current season' });
    }
});

// Get season by ID
router.get('/:id', authenticateAdmin, async (req, res) => {
    try {
        const season = await Season.findById(req.params.id);
        
        if (!season) {
            return res.status(404).json({ error: 'Season not found' });
        }
        
        // Get groups for this season
        const groups = await Group.find({
            season: season._id,
            status: 'active'
        }).sort({ name: 1 });
        
        res.json({
            ...season.toObject(),
            groups
        });
    } catch (error) {
        console.error('Error fetching season:', error);
        res.status(500).json({ error: 'Failed to fetch season' });
    }
});

// Create new season (Super Admin only)
router.post('/', authenticateAdmin, requireSuperAdmin, async (req, res) => {
    try {
        const { name, startDate, endDate, description, status } = req.body;
        
        // Validate required fields
        if (!name || !startDate || !endDate) {
            return res.status(400).json({ 
                error: 'Name, start date, and end date are required' 
            });
        }
        
        // Check if season already exists
        const existing = await Season.findOne({ name });
        if (existing) {
            return res.status(400).json({ 
                error: 'Season with this name already exists' 
            });
        }
        
        const Admin = require('../models/Admin');
        const admin = await Admin.findById(req.adminId);
        
        const season = new Season({
            name,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            description: description || '',
            status: status || 'upcoming',
            createdBy: req.adminId,
            createdByName: admin ? admin.username : 'System'
        });
        
        await season.save();
        
        res.status(201).json({
            message: 'Season created successfully',
            season
        });
    } catch (error) {
        console.error('Error creating season:', error);
        res.status(500).json({ error: 'Failed to create season' });
    }
});

// Update season (All Admins)
router.put('/:id', authenticateAdmin, async (req, res) => {
    try {
        const { name, startDate, endDate, description, status } = req.body;
        
        const season = await Season.findById(req.params.id);
        if (!season) {
            return res.status(404).json({ error: 'Season not found' });
        }
        
        // Update fields
        if (name) season.name = name;
        if (startDate) season.startDate = new Date(startDate);
        if (endDate) season.endDate = new Date(endDate);
        if (description !== undefined) season.description = description;
        if (status) season.status = status;
        
        await season.save();
        
        res.json({
            message: 'Season updated successfully',
            season
        });
    } catch (error) {
        console.error('Error updating season:', error);
        res.status(500).json({ error: 'Failed to update season' });
    }
});

// Delete season (Super Admin only)
router.delete('/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
    try {
        const season = await Season.findById(req.params.id);
        if (!season) {
            return res.status(404).json({ error: 'Season not found' });
        }
        
        // Check if season has groups
        const groupCount = await Group.countDocuments({ season: season._id });
        if (groupCount > 0) {
            return res.status(400).json({ 
                error: `Cannot delete season with ${groupCount} groups. Archive it instead.` 
            });
        }
        
        await season.deleteOne();
        
        res.json({ message: 'Season deleted successfully' });
    } catch (error) {
        console.error('Error deleting season:', error);
        res.status(500).json({ error: 'Failed to delete season' });
    }
});

// Archive season with exports (Super Admin only)
router.post('/:id/archive', authenticateAdmin, requireSuperAdmin, async (req, res) => {
    try {
        const season = await Season.findById(req.params.id);
        if (!season) {
            return res.status(404).json({ error: 'Season not found' });
        }
        
        const { generateExports, uploadToCloud } = req.body;
        let exportPath = null;
        
        // Generate exports if requested
        if (generateExports) {
            const Student = require('../models/Student');
            const ExcelJS = require('exceljs');
            const PDFDocument = require('pdfkit');
            const fs = require('fs').promises;
            const path = require('path');
            
            // Create exports directory
            const exportsDir = path.join(__dirname, '../exports/seasons', season.name);
            await fs.mkdir(exportsDir, { recursive: true });
            await fs.mkdir(path.join(exportsDir, 'PDFs'), { recursive: true });
            
            // Get all students for this season
            const groups = await Group.find({ season: season._id });
            const groupIds = groups.map(g => g._id);
            const students = await Student.find({ 
                group: { $in: groupIds },
                status: 'active'
            }).populate('group');
            
            // Generate Excel file
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Students');
            
            // Add headers
            worksheet.columns = [
                { header: 'Full Name', key: 'fullName', width: 25 },
                { header: 'ID Card Number', key: 'idCardNumber', width: 15 },
                { header: 'Email', key: 'schoolEmail', width: 30 },
                { header: 'Phone', key: 'phone', width: 15 },
                { header: 'Group', key: 'group', width: 15 },
                { header: 'Formation', key: 'formation', width: 15 },
                { header: 'Language', key: 'language', width: 12 },
                { header: 'Payment Status', key: 'paymentStatus', width: 15 },
                { header: 'Registration Date', key: 'registrationDate', width: 15 }
            ];
            
            // Add student data
            students.forEach(student => {
                worksheet.addRow({
                    fullName: student.fullName,
                    idCardNumber: student.idCardNumber,
                    schoolEmail: student.schoolEmail,
                    phone: student.phone,
                    group: student.group?.name || 'N/A',
                    formation: student.formation || 'N/A',
                    language: student.language || 'N/A',
                    paymentStatus: student.paymentStatus,
                    registrationDate: student.registrationDate ? new Date(student.registrationDate).toLocaleDateString() : 'N/A'
                });
            });
            
            // Style the header row
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFCC00' }
            };
            
            // Save Excel file
            const excelPath = path.join(exportsDir, `${season.name}-Students.xlsx`);
            await workbook.xlsx.writeFile(excelPath);
            
            // Generate PDF registration forms for each student
            for (const student of students) {
                const pdfPath = path.join(exportsDir, 'PDFs', `${student.fullName}-${student.idCardNumber}.pdf`);
                const doc = new PDFDocument();
                const stream = require('fs').createWriteStream(pdfPath);
                
                doc.pipe(stream);
                
                // PDF Header
                doc.fontSize(20).text('Fiche d\'inscription', { align: 'center' });
                doc.moveDown();
                doc.fontSize(16).text(`Saison: ${season.name}`, { align: 'center' });
                doc.moveDown(2);
                
                // Student Information
                doc.fontSize(12);
                doc.text(`Nom complet: ${student.fullName}`);
                doc.text(`Numéro de carte d'identité: ${student.idCardNumber}`);
                doc.text(`Email: ${student.schoolEmail}`);
                doc.text(`Téléphone: ${student.phone || 'N/A'}`);
                doc.text(`Groupe: ${student.group?.name || 'N/A'}`);
                doc.text(`Formation: ${student.formation || 'N/A'}`);
                doc.text(`Langue: ${student.language || 'N/A'}`);
                doc.text(`Statut de paiement: ${student.paymentStatus}`);
                doc.text(`Date d'inscription: ${student.registrationDate ? new Date(student.registrationDate).toLocaleDateString() : 'N/A'}`);
                
                doc.end();
                
                await new Promise(resolve => stream.on('finish', resolve));
            }
            
            exportPath = exportsDir;
            
            // TODO: Upload to cloud storage if requested
            if (uploadToCloud) {
                // Implement cloud upload here (Google Drive, Dropbox, etc.)
                // This would require additional setup and credentials
            }
        }
        
        // Mark season as archived
        season.status = 'archived';
        await season.save();
        
        res.json({
            message: 'Season archived successfully',
            season,
            exportPath,
            studentsExported: generateExports
        });
    } catch (error) {
        console.error('Error archiving season:', error);
        res.status(500).json({ error: 'Failed to archive season: ' + error.message });
    }
});

// Activate season (Super Admin only)
router.post('/:id/activate', authenticateAdmin, requireSuperAdmin, async (req, res) => {
    try {
        const season = await Season.findById(req.params.id);
        if (!season) {
            return res.status(404).json({ error: 'Season not found' });
        }
        
        // Deactivate other seasons
        await Season.updateMany(
            { _id: { $ne: season._id } },
            { status: 'archived' }
        );
        
        season.status = 'active';
        await season.save();
        
        res.json({
            message: 'Season activated successfully',
            season
        });
    } catch (error) {
        console.error('Error activating season:', error);
        res.status(500).json({ error: 'Failed to activate season' });
    }
});

module.exports = router;
