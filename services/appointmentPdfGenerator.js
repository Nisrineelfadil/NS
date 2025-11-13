const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates a Daily Appointments PDF
 * Shows all appointments scheduled for a specific date
 * 
 * @param {Array} appointments - Array of appointment records for the day
 * @param {Date} date - The date for the appointments
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generateDailyAppointmentsPDF(appointments, date) {
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
                console.log(`📄 Daily Appointments PDF size: ${sizeInMB.toFixed(2)} MB`);
                
                // Check size limit (1.2 MB max)
                if (sizeInMB > 1.2) {
                    console.warn('⚠️ Daily Appointments PDF exceeds 1.2 MB limit');
                }
                
                resolve(pdfBuffer);
            });

            // Add school logo - centered and bigger
            const logoPath = path.join(__dirname, '..', 'Img', 'logo.png');
            const pageWidth = doc.page.width;
            const logoSize = 100; // Increased from 70 to 100
            const logoX = (pageWidth - logoSize) / 2;
            
            if (fs.existsSync(logoPath)) {
                try {
                    doc.image(logoPath, logoX, 40, {
                        fit: [logoSize, logoSize],
                        align: 'center'
                    });
                } catch (logoError) {
                    console.error('Error adding logo to PDF:', logoError);
                }
            }

            // Header - School Name (centered, below logo)
            const schoolNameY = 40 + logoSize + 15; // Logo Y + logo size + spacing
            
            // "Nisrine" in black
            doc.fontSize(22)
               .font('Helvetica-Bold')
               .fillColor('#000000');
            
            const nisrineText = 'Nisrine ';
            const nisrineWidth = doc.widthOfString(nisrineText);
            const schoolText = 'School';
            const schoolWidth = doc.widthOfString(schoolText);
            const totalWidth = nisrineWidth + schoolWidth;
            const startX = (pageWidth - totalWidth) / 2;
            
            doc.text(nisrineText, startX, schoolNameY, { continued: true, lineBreak: false });
            
            // "School" in red
            doc.fillColor('#e74c3c')
               .text(schoolText, { lineBreak: false });

            // Subtitle - centered (in French)
            doc.fontSize(10)
               .font('Helvetica')
               .fillColor('#666666')
               .text('Centre de Langue Allemande - Fès, Maroc', 50, schoolNameY + 30, { 
                   align: 'center',
                   width: pageWidth - 100
               });

            // Title (in French)
            doc.moveDown(2);
            doc.fontSize(18)
               .font('Helvetica-Bold')
               .fillColor('#000000')
               .text('Rendez-vous', { align: 'center' });

            // Date in French
            doc.moveDown(0.5);
            const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            // Capitalize first letter
            const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
            
            doc.fontSize(12)
               .font('Helvetica')
               .fillColor('#333333')
               .text(capitalizedDate, { align: 'center' });

            // Summary (in French)
            doc.moveDown(1);
            doc.fontSize(10)
               .font('Helvetica-Oblique')
               .fillColor('#666666')
               .text(`Total des rendez-vous : ${appointments.length}`, { align: 'center' });

            // Appointments Table
            doc.moveDown(2);
            const tableTop = doc.y;

            // Check if there are any appointments
            if (!appointments || appointments.length === 0) {
                doc.fontSize(11)
                   .font('Helvetica-Oblique')
                   .fillColor('#666666')
                   .text('Aucun rendez-vous prévu pour ce jour.', 50, tableTop, { align: 'center' });
            } else {
                // Draw table header
                drawTableHeader(doc, tableTop);

                // Draw table rows
                let currentY = tableTop + 30;
                const rowHeight = 35; // Increased for better readability
                const pageHeight = doc.page.height - doc.page.margins.bottom;

                appointments.forEach((appointment, index) => {
                    // Check if we need a new page
                    if (currentY + rowHeight > pageHeight - 100) {
                        doc.addPage();
                        currentY = 50;
                        drawTableHeader(doc, currentY);
                        currentY += 30;
                    }

                    drawTableRow(doc, appointment, currentY, index);
                    currentY += rowHeight;
                });

                // Draw table border
                const tableBottom = currentY;
                doc.rect(50, tableTop, 495, tableBottom - tableTop)
                   .stroke();
            }
            
            // Add footer after content
            doc.moveDown(3);
            const footerDate = new Date().toLocaleDateString('fr-FR');
            const footerTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            
            doc.fontSize(9)
               .font('Helvetica-Oblique')
               .fillColor('#666666')
               .text(`Généré le : ${footerDate} à ${footerTime}`, {
                   align: 'center'
               });

            doc.fontSize(8)
               .text('Nisrine School - Système de Gestion des Rendez-vous', {
                   align: 'center'
               });

            // Finalize PDF
            doc.end();

        } catch (error) {
            console.error('Error generating daily appointments PDF:', error);
            reject(error);
        }
    });
}

/**
 * Draw table header
 */
function drawTableHeader(doc, y) {
    const headers = ['Nom', 'Numéro de Téléphone', 'Objet / Notes'];
    const columnWidths = [140, 120, 235];
    const columnX = [50, 190, 310];

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#000000');

    // Draw header background
    doc.rect(50, y, 495, 25)
       .fillAndStroke('#e8f4f8', '#000000');

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
 * Draw table row with priority color coding
 */
function drawTableRow(doc, appointment, y, index) {
    const columnWidths = [140, 120, 235];
    const columnX = [50, 190, 310];

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#000000');

    // Priority color coding
    let bgColor = '#ffffff';
    if (appointment.priority === 'high') {
        bgColor = '#ffe6e6'; // Light red
    } else if (appointment.priority === 'medium') {
        bgColor = '#fff9e6'; // Light yellow
    } else if (index % 2 === 0) {
        bgColor = '#fafafa'; // Alternate row
    }

    // Draw row background
    doc.rect(50, y, 495, 35)
       .fill(bgColor);

    // Draw cell data
    doc.fillColor('#000000')
       .font('Helvetica-Bold')
       .text(appointment.fullName || 'N/A', columnX[0] + 5, y + 8, {
           width: columnWidths[0] - 10,
           align: 'left',
           ellipsis: true
       });

    doc.font('Helvetica')
       .text(appointment.phoneNumber || 'N/A', columnX[1] + 5, y + 8, {
           width: columnWidths[1] - 10,
           align: 'left',
           ellipsis: true
       });

    // Purpose text with wrapping
    const purposeText = appointment.purpose || 'N/A';
    doc.text(purposeText, columnX[2] + 5, y + 5, {
        width: columnWidths[2] - 10,
        align: 'left',
        ellipsis: true,
        height: 25
    });

    // Draw row border
    doc.rect(50, y, 495, 35)
       .stroke();

    // Draw vertical lines
    columnX.slice(1).forEach(x => {
        doc.moveTo(x, y)
           .lineTo(x, y + 35)
           .stroke();
    });

    // Priority indicator (small colored dot)
    if (appointment.priority === 'high') {
        doc.circle(columnX[0] + columnWidths[0] - 15, y + 17, 4)
           .fillAndStroke('#ff0000', '#ff0000');
    } else if (appointment.priority === 'medium') {
        doc.circle(columnX[0] + columnWidths[0] - 15, y + 17, 4)
           .fillAndStroke('#ffa500', '#ffa500');
    }
}

module.exports = {
    generateDailyAppointmentsPDF
};
