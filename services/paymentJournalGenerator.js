const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates a Payment Journal PDF for a student
 * Shows all historical payment records
 * 
 * @param {Object} studentData - Student information
 * @param {Array} paymentHistory - Array of payment history records
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generatePaymentJournalPDF(studentData, paymentHistory) {
    return new Promise((resolve, reject) => {
        try {
            // Create PDF document with compression
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
                compress: true,
                autoFirstPage: true
            });

            // Use buffer for compatibility
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                const sizeInMB = pdfBuffer.length / (1024 * 1024);
                console.log(`📄 Payment Journal PDF size: ${sizeInMB.toFixed(2)} MB`);
                
                // Check size limit (1.5 MB max)
                if (sizeInMB > 1.5) {
                    console.warn('⚠️ Payment Journal PDF exceeds 1.5 MB limit');
                }
                
                resolve(pdfBuffer);
            });

            // Add school logo
            const logoPath = path.join(__dirname, '..', 'Img', 'logo.png');
            if (fs.existsSync(logoPath)) {
                try {
                    doc.image(logoPath, 50, 40, {
                        fit: [60, 60],
                        align: 'left'
                    });
                } catch (logoError) {
                    console.error('Error adding logo to PDF:', logoError);
                }
            }

            // Header - School Name
            doc.fontSize(20)
               .font('Helvetica-Bold')
               .text('Nisrine School', 120, 55, { align: 'left' });

            doc.fontSize(10)
               .font('Helvetica')
               .text('German Language Center - Fez, Morocco', 120, 78, { align: 'left' });

            // Title
            doc.moveDown(2);
            doc.fontSize(18)
               .font('Helvetica-Bold')
               .text('Journal de Paiement / Payment Journal', { align: 'center' });

            doc.moveDown(0.5);
            doc.fontSize(10)
               .font('Helvetica')
               .text(`Generated on: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });

            // Student Information Section
            doc.moveDown(2);
            const startY = doc.y;

            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text('Student Information', 50, startY);

            doc.moveDown(0.5);
            doc.fontSize(10)
               .font('Helvetica');

            const infoY = doc.y;
            doc.text(`Full Name: `, 50, infoY, { continued: true })
               .font('Helvetica-Bold')
               .text(studentData.fullName || 'N/A');

            doc.font('Helvetica')
               .text(`Language Group: `, 50, infoY + 20, { continued: true })
               .font('Helvetica-Bold')
               .text(Array.isArray(studentData.formation) ? studentData.formation.join(', ') : (studentData.formation || 'N/A'));

            if (studentData.branchSubgroupName) {
                doc.font('Helvetica')
                   .text(`Branch: `, 50, infoY + 40, { continued: true })
                   .font('Helvetica-Bold')
                   .text(studentData.branchSubgroupName);
            }

            // Payment History Table
            doc.moveDown(3);
            const tableTop = doc.y;

            // Check if there are any payments
            if (!paymentHistory || paymentHistory.length === 0) {
                doc.fontSize(11)
                   .font('Helvetica-Oblique')
                   .fillColor('#666666')
                   .text('No payment history available for this student.', 50, tableTop, { align: 'center' });
            } else {
                // Draw table header
                drawTableHeader(doc, tableTop);

                // Draw table rows
                let currentY = tableTop + 30;
                const rowHeight = 25;
                const pageHeight = doc.page.height - doc.page.margins.bottom;

                paymentHistory.forEach((payment, index) => {
                    // Check if we need a new page
                    if (currentY + rowHeight > pageHeight - 100) {
                        doc.addPage();
                        currentY = 50;
                        drawTableHeader(doc, currentY);
                        currentY += 30;
                    }

                    drawTableRow(doc, payment, currentY, index);
                    currentY += rowHeight;
                });

                // Draw table border
                const tableBottom = currentY;
                doc.rect(50, tableTop, 495, tableBottom - tableTop)
                   .stroke();
            }

            // Footer
            const footerY = doc.page.height - 60;
            doc.fontSize(9)
               .font('Helvetica-Oblique')
               .fillColor('#666666')
               .text('Generated by the admins of Nisrine School', 50, footerY, {
                   align: 'center',
                   width: 495
               });

            // Finalize PDF
            doc.end();

        } catch (error) {
            console.error('Error generating payment journal PDF:', error);
            reject(error);
        }
    });
}

/**
 * Draw table header
 */
function drawTableHeader(doc, y) {
    const headers = ['Full Name', 'Price (MAD)', 'Day of Payment', 'Date Marked as Paid'];
    const columnWidths = [140, 90, 130, 135];
    const columnX = [50, 190, 280, 410];

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#000000');

    // Draw header background
    doc.rect(50, y, 495, 25)
       .fillAndStroke('#f0f0f0', '#000000');

    // Draw header text
    headers.forEach((header, i) => {
        doc.fillColor('#000000')
           .text(header, columnX[i] + 5, y + 8, {
               width: columnWidths[i] - 10,
               align: 'left'
           });
    });

    // Draw vertical lines
    columnX.slice(1).forEach(x => {
        doc.moveTo(x, y)
           .lineTo(x, y + 25)
           .stroke();
    });
}

/**
 * Draw table row
 */
function drawTableRow(doc, payment, y, index) {
    const columnWidths = [140, 90, 130, 135];
    const columnX = [50, 190, 280, 410];

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#000000');

    // Alternate row background
    if (index % 2 === 0) {
        doc.rect(50, y, 495, 25)
           .fill('#fafafa');
    }

    // Format dates
    const paymentDate = payment.paymentDate ? 
        new Date(payment.paymentDate).toLocaleDateString('fr-FR') : 'N/A';
    const markedDate = payment.markedAsPaidDate ? 
        new Date(payment.markedAsPaidDate).toLocaleDateString('fr-FR') : 'N/A';

    // Draw cell data
    const rowData = [
        payment.studentName || 'N/A',
        payment.amount ? `${payment.amount} MAD` : 'N/A',
        paymentDate,
        markedDate
    ];

    rowData.forEach((data, i) => {
        doc.fillColor('#000000')
           .text(data, columnX[i] + 5, y + 8, {
               width: columnWidths[i] - 10,
               align: i === 1 ? 'right' : 'left',
               ellipsis: true
           });
    });

    // Draw row border
    doc.rect(50, y, 495, 25)
       .stroke();

    // Draw vertical lines
    columnX.slice(1).forEach(x => {
        doc.moveTo(x, y)
           .lineTo(x, y + 25)
           .stroke();
    });
}

module.exports = {
    generatePaymentJournalPDF
};
