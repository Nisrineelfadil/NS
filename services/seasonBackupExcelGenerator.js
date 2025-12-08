/**
 * Season Backup Excel Generator
 * Creates human-readable Excel files for grades, payments, and attendance
 */

const ExcelJS = require('exceljs');
const path = require('path');

class SeasonBackupExcelGenerator {
    /**
     * Generate Grades Excel file
     * Organized by language levels (A1-B2) or semesters for branches
     */
    async generateGradesExcel(grades, student, outputPath) {
        const workbook = new ExcelJS.Workbook();
        
        // Determine if this is language or branch student
        const isLanguageStudent = grades.some(g => 
            ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(g.level)
        );
        
        if (isLanguageStudent) {
            await this.generateLanguageGradesExcel(workbook, grades, student);
        } else {
            await this.generateBranchGradesExcel(workbook, grades, student);
        }
        
        await workbook.xlsx.writeFile(outputPath);
    }
    
    /**
     * Generate Language Grades (A1-B2 levels)
     */
    async generateLanguageGradesExcel(workbook, grades, student) {
        // Group grades by level
        const levelGroups = {
            'A1': [],
            'A2': [],
            'B1': [],
            'B2': [],
            'C1': [],
            'C2': []
        };
        
        grades.forEach(grade => {
            const level = grade.level || this.extractLevelFromGrade(grade);
            if (levelGroups[level]) {
                levelGroups[level].push(grade);
            }
        });
        
        // Create a sheet for each level
        Object.keys(levelGroups).forEach(level => {
            const levelGrades = levelGroups[level];
            
            if (levelGrades.length === 0) return; // Skip empty levels
            
            const sheet = workbook.addWorksheet(level);
            
            // Header styling
            sheet.columns = [
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Exam Type', key: 'examType', width: 20 },
                { header: 'Subject', key: 'subject', width: 20 },
                { header: 'Score', key: 'score', width: 10 },
                { header: 'Max Score', key: 'maxScore', width: 10 },
                { header: 'Percentage', key: 'percentage', width: 12 },
                { header: 'Grade', key: 'grade', width: 10 },
                { header: 'Comments', key: 'comments', width: 30 }
            ];
            
            // Style header row
            sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            sheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' }
            };
            sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
            
            // Add data rows
            levelGrades.forEach(grade => {
                const percentage = grade.maxScore ? ((grade.score / grade.maxScore) * 100).toFixed(1) : 'N/A';
                const gradeLevel = this.calculateGradeLevel(percentage);
                
                const row = sheet.addRow({
                    date: grade.examDate ? new Date(grade.examDate).toLocaleDateString() : 'N/A',
                    examType: grade.examType || 'N/A',
                    subject: grade.subject || this.getSubjectName(grade),
                    score: grade.score || 0,
                    maxScore: grade.maxScore || 'N/A',
                    percentage: percentage + '%',
                    grade: gradeLevel,
                    comments: grade.comments || ''
                });
                
                // Color code based on performance
                if (percentage >= 80) {
                    row.getCell('grade').fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF92D050' } // Green
                    };
                } else if (percentage >= 60) {
                    row.getCell('grade').fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFC000' } // Orange
                    };
                } else if (percentage !== 'N/A') {
                    row.getCell('grade').fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFF0000' } // Red
                    };
                }
            });
            
            // Add summary at the bottom
            sheet.addRow([]);
            const avgScore = levelGrades.reduce((sum, g) => sum + (g.score || 0), 0) / levelGrades.length;
            const avgMaxScore = levelGrades.reduce((sum, g) => sum + (g.maxScore || 0), 0) / levelGrades.length;
            const avgPercentage = avgMaxScore ? ((avgScore / avgMaxScore) * 100).toFixed(1) : 0;
            
            const summaryRow = sheet.addRow({
                date: 'AVERAGE',
                examType: '',
                subject: '',
                score: avgScore.toFixed(1),
                maxScore: avgMaxScore.toFixed(1),
                percentage: avgPercentage + '%',
                grade: this.calculateGradeLevel(avgPercentage),
                comments: ''
            });
            
            summaryRow.font = { bold: true };
            summaryRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9E1F2' }
            };
        });
    }
    
    /**
     * Generate Branch Grades (by semester)
     */
    async generateBranchGradesExcel(workbook, grades, student) {
        // Group grades by semester
        const semesterGroups = {};
        
        grades.forEach(grade => {
            const semester = grade.semester || this.extractSemesterFromGrade(grade);
            if (!semesterGroups[semester]) {
                semesterGroups[semester] = [];
            }
            semesterGroups[semester].push(grade);
        });
        
        // Create a sheet for each semester
        Object.keys(semesterGroups).sort().forEach(semester => {
            const semesterGrades = semesterGroups[semester];
            const sheet = workbook.addWorksheet(`Semester ${semester}`);
            
            // Header styling
            sheet.columns = [
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Course', key: 'course', width: 25 },
                { header: 'Exam Type', key: 'examType', width: 20 },
                { header: 'Score', key: 'score', width: 10 },
                { header: 'Max Score', key: 'maxScore', width: 10 },
                { header: 'Percentage', key: 'percentage', width: 12 },
                { header: 'Grade', key: 'grade', width: 10 },
                { header: 'Comments', key: 'comments', width: 30 }
            ];
            
            // Style header row
            sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            sheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF70AD47' }
            };
            sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
            
            // Add data rows
            semesterGrades.forEach(grade => {
                const percentage = grade.maxScore ? ((grade.score / grade.maxScore) * 100).toFixed(1) : 'N/A';
                const gradeLevel = this.calculateGradeLevel(percentage);
                
                sheet.addRow({
                    date: grade.examDate ? new Date(grade.examDate).toLocaleDateString() : 'N/A',
                    course: grade.course || grade.subject || 'N/A',
                    examType: grade.examType || 'N/A',
                    score: grade.score || 0,
                    maxScore: grade.maxScore || 'N/A',
                    percentage: percentage + '%',
                    grade: gradeLevel,
                    comments: grade.comments || ''
                });
            });
        });
    }
    
    /**
     * Generate Payments Excel file
     */
    async generatePaymentsExcel(payments, student, outputPath) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Payment History');
        
        // Header styling
        sheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Amount (MAD)', key: 'amount', width: 15 },
            { header: 'Payment Method', key: 'method', width: 20 },
            { header: 'Type', key: 'type', width: 20 },
            { header: 'Month', key: 'month', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Receipt Number', key: 'receiptNumber', width: 20 },
            { header: 'Notes', key: 'notes', width: 30 }
        ];
        
        // Style header row
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF44546A' }
        };
        sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        
        // Add data rows
        let totalPaid = 0;
        payments.forEach(payment => {
            totalPaid += payment.amount || 0;
            
            const row = sheet.addRow({
                date: payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A',
                amount: payment.amount || 0,
                method: payment.paymentMethod || 'N/A',
                type: payment.paymentType || 'N/A',
                month: payment.month || 'N/A',
                status: payment.status || 'Completed',
                receiptNumber: payment.receiptNumber || 'N/A',
                notes: payment.notes || ''
            });
            
            // Format amount as currency
            row.getCell('amount').numFmt = '#,##0.00 "MAD"';
        });
        
        // Add summary
        sheet.addRow([]);
        const summaryRow = sheet.addRow({
            date: 'TOTAL PAID',
            amount: totalPaid,
            method: '',
            type: '',
            month: '',
            status: '',
            receiptNumber: '',
            notes: ''
        });
        
        summaryRow.font = { bold: true };
        summaryRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' }
        };
        summaryRow.getCell('amount').numFmt = '#,##0.00 "MAD"';
        
        await workbook.xlsx.writeFile(outputPath);
    }
    
    /**
     * Generate Attendance Excel file
     */
    async generateAttendanceExcel(attendance, student, outputPath) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Attendance Records');
        
        // Header styling
        sheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Day', key: 'day', width: 12 },
            { header: 'Time', key: 'time', width: 12 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Group', key: 'group', width: 25 },
            { header: 'Teacher', key: 'teacher', width: 20 },
            { header: 'Session Type', key: 'sessionType', width: 15 },
            { header: 'Notes', key: 'notes', width: 30 }
        ];
        
        // Style header row
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF5B9BD5' }
        };
        sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        
        // Add data rows
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;
        
        attendance.forEach(record => {
            const date = record.date ? new Date(record.date) : null;
            const status = record.status || 'unknown';
            
            // Count attendance
            if (status === 'present') presentCount++;
            else if (status === 'absent') absentCount++;
            else if (status === 'late') lateCount++;
            
            const row = sheet.addRow({
                date: date ? date.toLocaleDateString() : 'N/A',
                day: date ? date.toLocaleDateString('en-US', { weekday: 'long' }) : 'N/A',
                time: record.scanTime ? new Date(record.scanTime).toLocaleTimeString() : 'N/A',
                status: status.toUpperCase(),
                group: record.groupName || 'N/A',
                teacher: record.teacherName || 'N/A',
                sessionType: record.sessionType || 'Regular',
                notes: record.notes || ''
            });
            
            // Color code status
            const statusCell = row.getCell('status');
            if (status === 'present') {
                statusCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF92D050' } // Green
                };
                statusCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            } else if (status === 'absent') {
                statusCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFF0000' } // Red
                };
                statusCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            } else if (status === 'late') {
                statusCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFC000' } // Orange
                };
                statusCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            }
        });
        
        // Add summary
        sheet.addRow([]);
        sheet.addRow({
            date: 'SUMMARY',
            day: '',
            time: '',
            status: '',
            group: '',
            teacher: '',
            sessionType: '',
            notes: ''
        }).font = { bold: true, size: 12 };
        
        sheet.addRow({
            date: 'Present',
            day: presentCount,
            time: '',
            status: '',
            group: '',
            teacher: '',
            sessionType: '',
            notes: ''
        });
        
        sheet.addRow({
            date: 'Absent',
            day: absentCount,
            time: '',
            status: '',
            group: '',
            teacher: '',
            sessionType: '',
            notes: ''
        });
        
        sheet.addRow({
            date: 'Late',
            day: lateCount,
            time: '',
            status: '',
            group: '',
            teacher: '',
            sessionType: '',
            notes: ''
        });
        
        const totalSessions = presentCount + absentCount + lateCount;
        const attendanceRate = totalSessions > 0 ? ((presentCount / totalSessions) * 100).toFixed(1) : 0;
        
        sheet.addRow({
            date: 'Attendance Rate',
            day: attendanceRate + '%',
            time: '',
            status: '',
            group: '',
            teacher: '',
            sessionType: '',
            notes: ''
        }).font = { bold: true };
        
        await workbook.xlsx.writeFile(outputPath);
    }
    
    // Helper methods
    extractLevelFromGrade(grade) {
        // Try to extract level from various fields
        if (grade.level) return grade.level;
        if (grade.groupName) {
            const match = grade.groupName.match(/[ABC][12]/);
            if (match) return match[0];
        }
        return 'Other';
    }
    
    extractSemesterFromGrade(grade) {
        if (grade.semester) return grade.semester;
        if (grade.academicYear) {
            // Extract semester from date or academic year
            const date = new Date(grade.examDate);
            const month = date.getMonth();
            return month < 6 ? '1' : '2';
        }
        return '1';
    }
    
    getSubjectName(grade) {
        // Map subject codes to names for German
        const subjectMap = {
            'lesen': 'Lesen (Reading)',
            'horen': 'Hören (Listening)',
            'schreiben': 'Schreiben (Writing)',
            'sprechen': 'Sprechen (Speaking)'
        };
        
        const subject = grade.subject?.toLowerCase() || '';
        return subjectMap[subject] || grade.subject || 'N/A';
    }
    
    calculateGradeLevel(percentage) {
        if (percentage === 'N/A') return 'N/A';
        const pct = parseFloat(percentage);
        
        if (pct >= 90) return 'A+';
        if (pct >= 85) return 'A';
        if (pct >= 80) return 'A-';
        if (pct >= 75) return 'B+';
        if (pct >= 70) return 'B';
        if (pct >= 65) return 'B-';
        if (pct >= 60) return 'C+';
        if (pct >= 55) return 'C';
        if (pct >= 50) return 'C-';
        return 'F';
    }
}

module.exports = new SeasonBackupExcelGenerator();
