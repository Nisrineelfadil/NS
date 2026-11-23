const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Models
const Season = require('../models/Season');
const ManagedStudent = require('../models/ManagedStudent');
const Grade = require('../models/Grade');
const Group = require('../models/Group');
const BranchGroup = require('../models/BranchGroup');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const CashTransaction = require('../models/CashTransaction');
const PaymentHistory = require('../models/PaymentHistory');
const PaymentReminder = require('../models/PaymentReminder');
const StudentMessage = require('../models/StudentMessage');
const MonthlyNote = require('../models/MonthlyNote');

// Services
const megaService = require('../services/megaService');

const MEGA_ARCHIVE_FOLDER = '/Nisrine Archives';
const crypto = require('crypto');
const { audit } = require('../services/audit');

// SEA-01: one archive at a time per season (a double click or two tabs cannot run it twice). Stored in the
// database so it works on serverless hosting; a lock older than 30 minutes is considered abandoned.
async function acquireArchiveLock(seasonId) {
    const locks = mongoose.connection.db.collection('operationlocks');
    const id = `season-archive:${seasonId}`;
    await locks.deleteOne({ _id: id, at: { $lt: new Date(Date.now() - 30 * 60000) } });
    try { await locks.insertOne({ _id: id, at: new Date() }); return true; } catch (e) { if (e.code === 11000) return false; throw e; }
}
async function releaseArchiveLock(seasonId) {
    try { await mongoose.connection.db.collection('operationlocks').deleteOne({ _id: `season-archive:${seasonId}` }); } catch (e) { console.error('lock release', e.message); }
}

// Auth middleware (SEC-02). The former verifyToken accepted ANY signed token — student app and teacher portal
// tokens included. Archive routes now require an active staff account (Director, developer or secretary),
// and every operation that changes or deletes data requires the Director (super_admin or dev), matching the
// rule already applied to season archive/activate/delete in routes/seasons.js.
const { authenticateAdmin, requireSuperAdmin, checkActiveStatus } = require('../middleware/authMiddleware');
const verifyToken = [authenticateAdmin, checkActiveStatus, (req, res, next) => { req.user = { id: req.adminId, role: req.admin.role, username: req.admin.username, name: req.admin.username, email: req.admin.email }; next(); }];
const directorOnly = [...verifyToken, requireSuperAdmin];

// ============================================
// GET /api/season-archive/list
// List all archived seasons from Mega
// ============================================
router.get('/list', verifyToken, async (req, res) => {
    try {
        const result = await megaService.listFiles(MEGA_ARCHIVE_FOLDER);
        
        if (!result.success) {
            // Folder doesn't exist yet - no archives
            return res.json({ archives: [] });
        }

        const archives = result.files
            .filter(f => !f.isFolder && f.name.endsWith('.json'))
            .map(f => ({
                name: f.name.replace('.json', ''),
                fileName: f.name,
                size: f.size,
                sizeFormatted: formatBytes(f.size),
                modified: f.modified
            }))
            .sort((a, b) => b.name.localeCompare(a.name));

        res.json({ archives });
    } catch (error) {
        console.error('Erreur liste archives:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// ============================================
// GET /api/season-archive/:seasonId/prepare
// Preview: get all students and stats for the season before archiving
// ============================================
router.get('/:seasonId/prepare', directorOnly, async (req, res) => {
    try {
        const season = await Season.findById(req.params.seasonId);
        if (!season) {
            return res.status(404).json({ message: 'Saison introuvable' });
        }

        // Get all language groups for this season
        const languageGroups = await Group.find({
            season: season._id,
            groupType: 'language',
            status: 'active'
        });
        const languageGroupIds = languageGroups.map(g => g._id);

        // Get all branch subgroups for this season
        const branchSubgroups = await Group.find({
            season: season._id,
            groupType: 'branch',
            status: 'active'
        });

        // Get all students in this season's groups
        const students = await ManagedStudent.find({
            group: { $in: languageGroupIds },
            status: 'active'
        }).select('fullName schoolEmail formation filiere group groupName branchSubgroup branchSubgroupName paymentDate paymentAmount paymentStatus enrolledAt createdAt').sort({ fullName: 1 });

        const studentIds = students.map(s => s._id);

        // Count related data
        const gradesCount = await Grade.countDocuments({ student: { $in: studentIds } });
        const attendanceSessionsCount = await AttendanceSession.countDocuments({
            groupId: { $in: languageGroupIds }
        });
        const attendanceRecordsCount = await AttendanceRecord.countDocuments({
            groupId: { $in: languageGroupIds }
        });
        const messagesCount = await StudentMessage.countDocuments({ student: { $in: studentIds } });
        const paymentHistoryCount = await PaymentHistory.countDocuments({ student: { $in: studentIds } });
        const paymentRemindersCount = await PaymentReminder.countDocuments({ student: { $in: studentIds } });

        // Cash transactions within the season date range
        const cashTransactionsCount = await CashTransaction.countDocuments({
            date: { $gte: season.startDate, $lte: season.endDate }
        });

        res.json({
            season: {
                _id: season._id,
                name: season.name,
                startDate: season.startDate,
                endDate: season.endDate,
                status: season.status
            },
            students: students.map(s => ({
                _id: s._id,
                fullName: s.fullName,
                schoolEmail: s.schoolEmail,
                formation: s.formation,
                filiere: s.filiere,
                groupName: s.groupName,
                branchSubgroupName: s.branchSubgroupName,
                enrolledAt: s.enrolledAt || s.createdAt
            })),
            stats: {
                totalStudents: students.length,
                totalGrades: gradesCount,
                totalLanguageGroups: languageGroups.length,
                totalBranchSubgroups: branchSubgroups.length,
                totalAttendanceSessions: attendanceSessionsCount,
                totalAttendanceRecords: attendanceRecordsCount,
                totalMessages: messagesCount,
                totalPaymentHistory: paymentHistoryCount,
                totalPaymentReminders: paymentRemindersCount,
                totalCashTransactions: cashTransactionsCount
            }
        });
    } catch (error) {
        console.error('Erreur préparation archive:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// ============================================
// POST /api/season-archive/:seasonId/archive
// Main archive: collect data, upload to Mega, purge from MongoDB
// Body: { carryOverStudentIds: [string] }
// ============================================
router.post('/:seasonId/archive', directorOnly, async (req, res) => {
    let locked = false;
    try {
        const { carryOverStudentIds = [], seasonName, expectedStudentCount } = req.body;
        
        const season = await Season.findById(req.params.seasonId);
        if (!season) {
            return res.status(404).json({ message: 'Saison introuvable' });
        }

        if (season.status === 'archived') {
            return res.status(400).json({ message: 'Cette saison est déjà archivée' });
        }

        // SEA-01: the archive must target the season the Director prepared on screen
        if (seasonName !== season.name) {
            return res.status(400).json({ message: 'La saison à archiver ne correspond pas à celle affichée. Rechargez la page et recommencez.' });
        }
        if (!Array.isArray(carryOverStudentIds)) {
            return res.status(400).json({ message: 'Liste des étudiants conservés invalide.' });
        }
        locked = await acquireArchiveLock(season._id);
        if (!locked) {
            return res.status(409).json({ message: 'Un archivage de cette saison est déjà en cours.' });
        }

        console.log(`📦 Début de l'archivage de la saison ${season.name}...`);
        console.log(`   Étudiants à conserver: ${carryOverStudentIds.length}`);

        // ---- STEP 1: Collect ALL season data ----

        // Language groups
        const languageGroups = await Group.find({
            season: season._id,
            groupType: 'language'
        }).lean();
        const languageGroupIds = languageGroups.map(g => g._id);

        // Branch subgroups
        const branchSubgroups = await Group.find({
            season: season._id,
            groupType: 'branch'
        }).lean();

        // BranchGroup parent documents (for reference in archive)
        const branchGroupIds = [...new Set(branchSubgroups.map(s => s.branchGroup?.toString()).filter(Boolean))];
        const branchGroupDocs = await BranchGroup.find({
            _id: { $in: branchGroupIds }
        }).lean();

        // All students in this season
        const allStudents = await ManagedStudent.find({
            group: { $in: languageGroupIds }
        }).select('+plainTextPassword').lean();
        const allStudentIds = allStudents.map(s => s._id);

        // SEA-01: the selection must be exactly the students shown when the archive was prepared
        const seasonIdSet = new Set(allStudentIds.map(id => id.toString()));
        const unknown = carryOverStudentIds.filter(id => !seasonIdSet.has(String(id)));
        if (unknown.length) {
            return res.status(400).json({ message: `${unknown.length} étudiant(s) sélectionné(s) n'appartiennent pas à cette saison. Rechargez la page et recommencez.` });
        }
        // same list as the preparation screen: active students of the season's active language groups
        const shownGroupIds = new Set(languageGroups.filter(g => g.status === 'active').map(g => g._id.toString()));
        const shownCount = allStudents.filter(s => s.status === 'active' && s.group && shownGroupIds.has(s.group.toString())).length;
        if (expectedStudentCount !== undefined && Number(expectedStudentCount) !== shownCount) {
            return res.status(409).json({ message: `Les étudiants de la saison ont changé depuis la préparation (${expectedStudentCount} affichés, ${shownCount} maintenant). Rouvrez la fenêtre d'archivage.` });
        }

        // Grades
        const grades = await Grade.find({
            student: { $in: allStudentIds }
        }).lean();

        // Attendance
        const attendanceSessions = await AttendanceSession.find({
            groupId: { $in: languageGroupIds }
        }).lean();
        const attendanceSessionIds = attendanceSessions.map(s => s._id);
        const attendanceRecords = await AttendanceRecord.find({
            session: { $in: attendanceSessionIds }
        }).lean();

        // Cash transactions within season date range
        const cashTransactions = await CashTransaction.find({
            date: { $gte: season.startDate, $lte: season.endDate }
        }).lean();

        // Payment history for season students
        const paymentHistory = await PaymentHistory.find({
            student: { $in: allStudentIds }
        }).lean();

        // Payment reminders for season students
        const paymentReminders = await PaymentReminder.find({
            student: { $in: allStudentIds }
        }).lean();

        // Student messages
        const studentMessages = await StudentMessage.find({
            student: { $in: allStudentIds }
        }).lean();

        // Monthly notes within season date range
        const startYear = season.startDate.getFullYear();
        const endYear = season.endDate.getFullYear();
        const monthlyNotes = await MonthlyNote.find({
            year: { $gte: startYear, $lte: endYear }
        }).lean();

        // ---- STEP 2: Build archive JSON ----

        const archiveData = {
            archiveVersion: '1.0',
            archivedAt: new Date().toISOString(),
            archivedBy: req.user.name || req.user.email || 'Admin',
            seasonInfo: {
                name: season.name,
                startDate: season.startDate,
                endDate: season.endDate,
                description: season.description
            },
            stats: {
                totalStudents: allStudents.length,
                carryOverStudents: carryOverStudentIds.length,
                archivedStudents: allStudents.length - carryOverStudentIds.length,
                totalGrades: grades.length,
                totalLanguageGroups: languageGroups.length,
                totalBranchSubgroups: branchSubgroups.length,
                totalAttendanceSessions: attendanceSessions.length,
                totalAttendanceRecords: attendanceRecords.length,
                totalCashTransactions: cashTransactions.length,
                totalPaymentHistory: paymentHistory.length,
                totalMessages: studentMessages.length,
                totalMonthlyNotes: monthlyNotes.length
            },
            students: allStudents.map(s => ({
                ...s,
                wasCarryOver: carryOverStudentIds.includes(s._id.toString())
            })),
            grades,
            languageGroups,
            branchGroups: branchGroupDocs,
            branchSubgroups,
            attendanceSessions,
            attendanceRecords,
            cashTransactions,
            paymentHistory,
            paymentReminders,
            studentMessages,
            monthlyNotes
        };

        const archiveJSON = JSON.stringify(archiveData);
        const archiveBuffer = Buffer.from(archiveJSON, 'utf-8');

        console.log(`📦 Archive JSON: ${formatBytes(archiveBuffer.length)}`);

        // ---- STEP 3: Upload to Mega ----

        const megaPath = `${MEGA_ARCHIVE_FOLDER}/${season.name}.json`;
        
        try {
            await megaService.ensureFolderExists(MEGA_ARCHIVE_FOLDER);
        } catch (e) {
            // Folder might already exist
        }

        const uploadResult = await megaService.uploadServiceFile(archiveBuffer, megaPath);
        if (!uploadResult.success) {
            return res.status(500).json({ 
                message: 'Échec du téléversement vers Mega', 
                error: uploadResult.message 
            });
        }

        // SEA-01: read the stored archive back and compare it before deleting anything
        const sha = b => crypto.createHash('sha256').update(b).digest('hex');
        let stored = null;
        try { stored = (await megaService.downloadServiceFile(megaPath)).fileBuffer; } catch (e) { stored = null; }
        if (!stored || stored.length !== archiveBuffer.length || sha(stored) !== sha(archiveBuffer)) {
            return res.status(500).json({ message: `L'archive n'a pas pu être vérifiée sur Mega. Aucune donnée n'a été supprimée. Réessayez plus tard.` });
        }
        console.log(`✅ Archive téléversée vers Mega et vérifiée: ${megaPath}`);

        // ---- STEP 4: Purge from MongoDB ----

        const carryOverSet = new Set(carryOverStudentIds.map(id => id.toString()));
        const nonCarryOverStudentIds = allStudentIds.filter(id => !carryOverSet.has(id.toString()));
        const carryOverStudentObjIds = allStudentIds.filter(id => carryOverSet.has(id.toString()));

        // Delete grades for NON-carry-over students only
        const gradesDeleted = await Grade.deleteMany({
            student: { $in: nonCarryOverStudentIds }
        });
        console.log(`   Grades supprimées: ${gradesDeleted.deletedCount}`);

        // Delete ALL attendance for this season (sessions are tied to old groups)
        const attendanceRecordsDeleted = await AttendanceRecord.deleteMany({
            session: { $in: attendanceSessionIds }
        });
        const attendanceSessionsDeleted = await AttendanceSession.deleteMany({
            groupId: { $in: languageGroupIds }
        });
        console.log(`   Sessions présence supprimées: ${attendanceSessionsDeleted.deletedCount}`);
        console.log(`   Enregistrements présence supprimés: ${attendanceRecordsDeleted.deletedCount}`);

        // Delete messages for NON-carry-over students
        const messagesDeleted = await StudentMessage.deleteMany({
            student: { $in: nonCarryOverStudentIds }
        });
        console.log(`   Messages supprimés: ${messagesDeleted.deletedCount}`);

        // Delete payment history for NON-carry-over students
        const payHistoryDeleted = await PaymentHistory.deleteMany({
            student: { $in: nonCarryOverStudentIds }
        });
        console.log(`   Historique paiements supprimé: ${payHistoryDeleted.deletedCount}`);

        // Delete payment reminders for NON-carry-over students
        const payRemindersDeleted = await PaymentReminder.deleteMany({
            student: { $in: nonCarryOverStudentIds }
        });
        console.log(`   Rappels paiements supprimés: ${payRemindersDeleted.deletedCount}`);

        // Cash transactions and monthly notes are general financial records
        // They are archived to JSON for reference but NOT deleted from the database
        console.log(`   Transactions caisse: conservées (${cashTransactions.length} archivées en JSON)`);
        console.log(`   Notes mensuelles: conservées (${monthlyNotes.length} archivées en JSON)`);

        // Delete ALL groups (language + branch subgroups) for this season
        const groupsDeleted = await Group.deleteMany({
            season: season._id
        });
        console.log(`   Groupes supprimés: ${groupsDeleted.deletedCount}`);

        // Clear group/branchSubgroup for carry-over students (old groups no longer exist)
        if (carryOverStudentObjIds.length > 0) {
            // Reset groups for all carry-over students
            await ManagedStudent.updateMany(
                { _id: { $in: carryOverStudentObjIds } },
                {
                    $set: {
                        group: null,
                        groupName: 'En attente d\'affectation',
                        branchSubgroup: null,
                        branchSubgroupName: null
                    }
                }
            );
            
            // Reset annuel (P.Annuel) carry-over students to pending for the new season
            const annuelResetResult = await ManagedStudent.updateMany(
                { _id: { $in: carryOverStudentObjIds }, paymentPlan: 'annuel' },
                {
                    $set: {
                        paymentStatus: 'pending',
                        paymentReminderSent: false,
                        lastReminderDate: null
                    }
                }
            );
            if (annuelResetResult.modifiedCount > 0) {
                console.log(`   Étudiants annuels réinitialisés (paiement → pending): ${annuelResetResult.modifiedCount}`);
            }
            
            console.log(`   Étudiants conservés (groupes réinitialisés): ${carryOverStudentObjIds.length}`);
        }

        // Delete NON-carry-over student records
        const studentsDeleted = await ManagedStudent.deleteMany({
            _id: { $in: nonCarryOverStudentIds }
        });
        console.log(`   Étudiants supprimés: ${studentsDeleted.deletedCount}`);

        // Mark season as archived
        season.status = 'archived';
        await season.save();

        console.log(`✅ Archivage de la saison ${season.name} terminé avec succès!`);
        await audit(req, {
            action: 'season.archived', module: 'seasons',
            target: { type: 'season', id: season._id, label: season.name },
            before: { students: allStudents.length, carryOver: carryOverStudentObjIds.length },
            after: { archivedStudents: studentsDeleted.deletedCount, grades: gradesDeleted.deletedCount, groups: groupsDeleted.deletedCount, attendanceRecords: attendanceRecordsDeleted.deletedCount, paymentHistory: payHistoryDeleted.deletedCount },
            details: `Archive ${megaPath} (${formatBytes(archiveBuffer.length)}), verified before deletion`
        });

        res.json({
            success: true,
            message: `Saison ${season.name} archivée avec succès`,
            archiveSize: formatBytes(archiveBuffer.length),
            megaPath,
            purged: {
                students: studentsDeleted.deletedCount,
                grades: gradesDeleted.deletedCount,
                groups: groupsDeleted.deletedCount,
                attendanceSessions: attendanceSessionsDeleted.deletedCount,
                attendanceRecords: attendanceRecordsDeleted.deletedCount,
                messages: messagesDeleted.deletedCount,
                paymentHistory: payHistoryDeleted.deletedCount,
                paymentReminders: payRemindersDeleted.deletedCount
            },
            preserved: {
                cashTransactions: cashTransactions.length,
                monthlyNotes: monthlyNotes.length
            },
            carryOver: {
                students: carryOverStudentObjIds.length
            }
        });

    } catch (error) {
        console.error('❌ Erreur archivage:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'archivage', error: error.message });
    } finally {
        if (locked) await releaseArchiveLock(req.params.seasonId);
    }
});

// ============================================
// GET /api/season-archive/:seasonName/view
// Download and serve archived season JSON from Mega
// ============================================
router.get('/:seasonName/view', verifyToken, async (req, res) => {
    try {
        const { seasonName } = req.params;
        const megaPath = `${MEGA_ARCHIVE_FOLDER}/${seasonName}.json`;

        console.log(`📥 Chargement de l'archive: ${megaPath}`);

        const result = await megaService.downloadServiceFile(megaPath);
        const archiveData = JSON.parse(result.fileBuffer.toString('utf-8'));

        res.json(archiveData);
    } catch (error) {
        console.error('Erreur chargement archive:', error);
        res.status(500).json({ message: 'Impossible de charger l\'archive', error: error.message });
    }
});

// ============================================
// GET /api/season-archive/:seasonName/download
// Download archive as a file
// ============================================
router.get('/:seasonName/download', verifyToken, async (req, res) => {
    try {
        const { seasonName } = req.params;
        const megaPath = `${MEGA_ARCHIVE_FOLDER}/${seasonName}.json`;

        const result = await megaService.downloadServiceFile(megaPath);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${seasonName}.json"`);
        res.send(result.fileBuffer);
    } catch (error) {
        console.error('Erreur téléchargement archive:', error);
        res.status(500).json({ message: 'Impossible de télécharger l\'archive', error: error.message });
    }
});

// ============================================
// POST /api/season-archive/:seasonName/recover-cash
// Recover deleted cash transactions & monthly notes from archive
// ============================================
router.post('/:seasonName/recover-cash', directorOnly, async (req, res) => {
    try {
        const { seasonName } = req.params;
        const megaPath = `${MEGA_ARCHIVE_FOLDER}/${seasonName}.json`;

        console.log(`🔧 Récupération des données financières depuis: ${megaPath}`);

        const result = await megaService.downloadServiceFile(megaPath);
        const archiveData = JSON.parse(result.fileBuffer.toString('utf-8'));

        let cashRestored = 0;
        let notesRestored = 0;

        // Restore cash transactions
        if (archiveData.cashTransactions && archiveData.cashTransactions.length > 0) {
            for (const tx of archiveData.cashTransactions) {
                // Check if already exists (avoid duplicates)
                const exists = await CashTransaction.findById(tx._id);
                if (!exists) {
                    await CashTransaction.create(tx);
                    cashRestored++;
                }
            }
            console.log(`   ✅ Transactions caisse restaurées: ${cashRestored}/${archiveData.cashTransactions.length}`);
        }

        // Restore monthly notes
        if (archiveData.monthlyNotes && archiveData.monthlyNotes.length > 0) {
            for (const note of archiveData.monthlyNotes) {
                const exists = await MonthlyNote.findById(note._id);
                if (!exists) {
                    await MonthlyNote.create(note);
                    notesRestored++;
                }
            }
            console.log(`   ✅ Notes mensuelles restaurées: ${notesRestored}/${archiveData.monthlyNotes.length}`);
        }

        res.json({
            success: true,
            message: 'Données financières restaurées',
            restored: {
                cashTransactions: cashRestored,
                monthlyNotes: notesRestored
            }
        });
    } catch (error) {
        console.error('❌ Erreur récupération:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération', error: error.message });
    }
});

// ============================================
// DELETE /api/season-archive/:seasonName
// Delete an archived season JSON from Mega.nz
// ============================================
router.delete('/:seasonName', directorOnly, async (req, res) => {
    try {
        const { seasonName } = req.params;
        const megaPath = `${MEGA_ARCHIVE_FOLDER}/${seasonName}.json`;

        console.log(`🗑️ Suppression de l'archive: ${megaPath}`);

        const result = await megaService.deleteFile(megaPath);

        if (!result.success) {
            return res.status(500).json({ message: 'Impossible de supprimer l\'archive', error: result.message });
        }

        console.log(`✅ Archive supprimée: ${seasonName}`);
        res.json({ success: true, message: `Archive "${seasonName}" supprimée avec succès` });
    } catch (error) {
        console.error('❌ Erreur suppression archive:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression', error: error.message });
    }
});

// Helper
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Octets';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = router;
