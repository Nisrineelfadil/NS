/**
 * Season Backup Data Extractor
 * Handles extraction of all season-related data from MongoDB
 * Read-only operations - safe for production use
 */

const mongoose = require('mongoose');
const Season = require('../models/Season');
const Group = require('../models/Group');
const BranchGroup = require('../models/BranchGroup');
const ManagedStudent = require('../models/ManagedStudent');
const PaymentHistory = require('../models/PaymentHistory');
const Grade = require('../models/Grade');
const AttendanceRecord = require('../models/AttendanceRecord');
const MonthlyNote = require('../models/MonthlyNote');

class SeasonBackupExtractor {
    constructor(seasonId) {
        this.seasonId = seasonId;
        this.season = null;
        this.stats = {
            totalStudents: 0,
            totalGroups: 0,
            totalFiles: 0,
            languageGroups: 0,
            branchGroups: 0,
            extractionTime: 0
        };
    }

    /**
     * Initialize and validate season
     */
    async initialize() {
        console.log(`🔍 Initializing backup for season: ${this.seasonId}`);
        
        this.season = await Season.findById(this.seasonId).lean();
        
        if (!this.season) {
            throw new Error(`Season not found: ${this.seasonId}`);
        }

        console.log(`✅ Season found: ${this.season.name} (${this.season.startDate} - ${this.season.endDate})`);
        
        return this.season;
    }

    /**
     * Get all language groups with students for this season
     */
    async getLanguageGroups() {
        console.log('📚 Extracting language groups...');
        
        const startTime = Date.now();
        
        const groups = await Group.aggregate([
            {
                $match: {
                    season: new mongoose.Types.ObjectId(this.seasonId),
                    groupType: 'language',
                    status: { $in: ['active', 'archived'] }
                }
            },
            {
                $lookup: {
                    from: 'managedstudents',
                    localField: '_id',
                    foreignField: 'group',
                    as: 'students'
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    formation: 1,
                    maxStudents: 1,
                    currentStudentCount: 1,
                    students: {
                        $filter: {
                            input: '$students',
                            as: 'student',
                            cond: { 
                                $and: [
                                    { $ne: ['$$student.status', 'deleted'] },
                                    { $ne: ['$$student.status', 'dropped'] }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $sort: { name: 1 }
            }
        ]);

        const extractionTime = Date.now() - startTime;
        
        // Count total students
        const totalStudents = groups.reduce((sum, group) => sum + group.students.length, 0);
        
        console.log(`✅ Extracted ${groups.length} language groups with ${totalStudents} students (${extractionTime}ms)`);
        
        this.stats.languageGroups = groups.length;
        
        return groups;
    }

    /**
     * Get all branch groups with subgroups and students for this season
     */
    async getBranchGroups() {
        console.log('🏢 Extracting branch groups...');
        
        const startTime = Date.now();
        
        const branchGroups = await BranchGroup.aggregate([
            {
                $match: { status: 'active' }
            },
            {
                $lookup: {
                    from: 'groups',
                    let: { branchId: '$_id', seasonId: new mongoose.Types.ObjectId(this.seasonId) },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$branchGroup', '$$branchId'] },
                                        { $eq: ['$season', '$$seasonId'] },
                                        { $eq: ['$groupType', 'branch'] }
                                    ]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: 'managedstudents',
                                localField: '_id',
                                foreignField: 'branchSubgroup',
                                as: 'students'
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                formation: 1,
                                maxStudents: 1,
                                currentStudentCount: 1,
                                students: {
                                    $filter: {
                                        input: '$students',
                                        as: 'student',
                                        cond: { 
                                            $and: [
                                                { $ne: ['$$student.status', 'deleted'] },
                                                { $ne: ['$$student.status', 'dropped'] }
                                            ]
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $sort: { name: 1 }
                        }
                    ],
                    as: 'subgroups'
                }
            },
            {
                $sort: { name: 1 }
            }
        ]);

        const extractionTime = Date.now() - startTime;
        
        // Count total students and subgroups
        let totalStudents = 0;
        let totalSubgroups = 0;
        
        branchGroups.forEach(branch => {
            totalSubgroups += branch.subgroups.length;
            branch.subgroups.forEach(subgroup => {
                totalStudents += subgroup.students.length;
            });
        });
        
        console.log(`✅ Extracted ${branchGroups.length} branch groups with ${totalSubgroups} subgroups and ${totalStudents} students (${extractionTime}ms)`);
        
        this.stats.branchGroups = totalSubgroups;
        
        return branchGroups;
    }

    /**
     * Get complete data for a single student (season-filtered)
     */
    async getStudentCompleteData(studentId) {
        const { startDate, endDate } = this.season;
        
        // Get student basic info
        const student = await ManagedStudent.findById(studentId).lean();
        
        if (!student) {
            console.warn(`⚠️  Student not found: ${studentId}`);
            return null;
        }

        // Get payments within season
        const payments = await PaymentHistory.find({
            student: studentId,
            paymentDate: { $gte: startDate, $lte: endDate }
        }).lean();

        // Get grades within season
        const grades = await Grade.find({
            student: studentId,
            examDate: { $gte: startDate, $lte: endDate }
        }).lean();

        // Get attendance within season
        const attendance = await AttendanceRecord.find({
            studentId: studentId,
            date: { $gte: startDate, $lte: endDate }
        }).lean();

        // Get monthly notes within season
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();
        const startMonth = startDate.getMonth() + 1;
        const endMonth = endDate.getMonth() + 1;

        const journal = await MonthlyNote.find({
            $or: [
                { year: startYear, month: { $gte: startMonth } },
                { year: { $gt: startYear, $lt: endYear } },
                { year: endYear, month: { $lte: endMonth } }
            ]
        }).lean();

        return {
            student,
            payments,
            grades,
            attendance,
            journal
        };
    }

    /**
     * Get metadata for the backup
     */
    async getMetadata(languageGroups, branchGroups) {
        // Calculate statistics
        let totalStudents = 0;
        
        // Count language group students
        languageGroups.forEach(group => {
            totalStudents += group.students.length;
        });
        
        // Count branch group students
        branchGroups.forEach(branch => {
            branch.subgroups.forEach(subgroup => {
                totalStudents += subgroup.students.length;
            });
        });

        this.stats.totalStudents = totalStudents;
        this.stats.totalGroups = this.stats.languageGroups + this.stats.branchGroups;

        // Create season info
        const seasonInfo = {
            name: this.season.name,
            startDate: this.season.startDate,
            endDate: this.season.endDate,
            status: this.season.status,
            description: this.season.description || '',
            backupDate: new Date().toISOString(),
            stats: {
                totalStudents: this.stats.totalStudents,
                totalGroups: this.stats.totalGroups,
                languageGroups: this.stats.languageGroups,
                branchGroups: this.stats.branchGroups,
                totalFiles: this.stats.totalFiles
            }
        };

        // Create group index (language groups)
        const groupIndex = languageGroups.map(group => ({
            id: group._id.toString(),
            name: group.name,
            formation: group.formation,
            studentCount: group.students.length,
            maxStudents: group.maxStudents
        }));

        // Create branch index
        const branchIndex = branchGroups.map(branch => ({
            id: branch._id.toString(),
            name: branch.name,
            displayName: branch.displayName,
            formation: branch.formation,
            subgroups: branch.subgroups.map(subgroup => ({
                id: subgroup._id.toString(),
                name: subgroup.name,
                studentCount: subgroup.students.length,
                maxStudents: subgroup.maxStudents
            }))
        }));

        return {
            seasonInfo,
            groupIndex,
            branchIndex
        };
    }

    /**
     * Get extraction statistics
     */
    getStats() {
        return this.stats;
    }
}

module.exports = SeasonBackupExtractor;
