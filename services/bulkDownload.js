const archiver = require('archiver');
const { generateRegistrationPDF } = require('./pdfGenerator');

/**
 * Generate a ZIP archive containing approved student PDFs organized by year/month
 * 
 * Folder Structure:
 * 📁 Nisrine School Registrations
 *   📁 2024
 *     📁 January
 *       📄 Ahmed_Benali_CIN123.pdf
 *       📄 Sara_Alami_CIN456.pdf
 *     📁 February
 *       📄 ...
 *   📁 2025
 *     📁 January
 *       📄 ...
 */

/**
 * Create a ZIP archive with approved student PDFs organized by year/month
 * @param {Array} students - Array of approved student documents
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function createBulkDownloadZip(students, res) {
    try {
        // Create archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        // Set response headers
        const timestamp = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="Nisrine_School_Registrations_${timestamp}.zip"`);

        // Pipe archive to response
        archive.pipe(res);

        // Handle archive errors
        archive.on('error', (err) => {
            console.error('Archive error:', err);
            throw err;
        });

        // Track progress
        let processedCount = 0;
        const totalCount = students.length;

        console.log(`📦 Creating ZIP archive for ${totalCount} approved students...`);

        // Organize students by year and month
        const organizedStudents = organizeStudentsByYearMonth(students);

        // Process each year
        for (const [year, months] of Object.entries(organizedStudents)) {
            console.log(`📅 Processing year: ${year}`);

            // Process each month
            for (const [month, monthStudents] of Object.entries(months)) {
                console.log(`  📆 Processing month: ${month} (${monthStudents.length} students)`);

                // Generate PDF for each student
                for (const student of monthStudents) {
                    try {
                        // Generate PDF buffer
                        const pdfBuffer = await generateRegistrationPDF(student);

                        // Create safe filename: FullName_CIN.pdf
                        const safeName = sanitizeFilename(student.fullName);
                        const filename = `${safeName}_${student.cin}.pdf`;

                        // Add to archive with folder structure: Year/Month/Filename.pdf
                        const archivePath = `Nisrine School Registrations/${year}/${month}/${filename}`;
                        archive.append(pdfBuffer, { name: archivePath });

                        processedCount++;
                        console.log(`    ✅ [${processedCount}/${totalCount}] Added: ${filename}`);

                    } catch (pdfError) {
                        console.error(`    ❌ Error generating PDF for ${student.fullName}:`, pdfError);
                        // Continue with other students even if one fails
                    }
                }
            }
        }

        // Finalize the archive
        console.log('🎉 Finalizing ZIP archive...');
        await archive.finalize();

        console.log(`✅ ZIP archive created successfully with ${processedCount} PDFs`);

    } catch (error) {
        console.error('Error creating bulk download ZIP:', error);
        throw error;
    }
}

/**
 * Organize students by year and month based on submission date
 * @param {Array} students - Array of student documents
 * @returns {Object} Organized structure: { year: { month: [students] } }
 */
function organizeStudentsByYearMonth(students) {
    const organized = {};

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    students.forEach(student => {
        const submittedDate = new Date(student.submittedAt);
        const year = submittedDate.getFullYear().toString();
        const monthIndex = submittedDate.getMonth();
        const month = monthNames[monthIndex];

        // Initialize year if not exists
        if (!organized[year]) {
            organized[year] = {};
        }

        // Initialize month if not exists
        if (!organized[year][month]) {
            organized[year][month] = [];
        }

        // Add student to the appropriate year/month
        organized[year][month].push(student);
    });

    return organized;
}

/**
 * Sanitize filename to remove invalid characters
 * @param {String} filename - Original filename
 * @returns {String} Sanitized filename
 */
function sanitizeFilename(filename) {
    return filename
        .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .trim();
}

/**
 * Get statistics about the organized downloads
 * @param {Array} students - Array of student documents
 * @returns {Object} Statistics object
 */
function getDownloadStatistics(students) {
    const organized = organizeStudentsByYearMonth(students);
    const stats = {
        totalStudents: students.length,
        years: {},
        summary: []
    };

    for (const [year, months] of Object.entries(organized)) {
        stats.years[year] = {};
        let yearTotal = 0;

        for (const [month, monthStudents] of Object.entries(months)) {
            stats.years[year][month] = monthStudents.length;
            yearTotal += monthStudents.length;
        }

        stats.summary.push({
            year,
            total: yearTotal,
            months: Object.keys(months).length
        });
    }

    return stats;
}

module.exports = {
    createBulkDownloadZip,
    organizeStudentsByYearMonth,
    getDownloadStatistics,
    sanitizeFilename
};
