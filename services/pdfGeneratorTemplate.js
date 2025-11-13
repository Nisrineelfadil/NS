const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

/**
 * Generates a registration PDF using the school's template form
 * @param {Object} studentData - Student registration data
 * @param {string} outputPath - Path where PDF will be saved
 * @returns {Promise<string>} - Path to generated PDF
 */
async function generateRegistrationPDF(studentData, outputPath) {
    try {
        // Load the template PDF
        const templatePath = path.join(__dirname, '..', 'Formular', 'Form.pdf');
        const templateBytes = fs.readFileSync(templatePath);
        
        // Load the PDF
        const pdfDoc = await PDFDocument.load(templateBytes);
        
        // Get the first page
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        
        // Load a standard font
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        const fontSize = 10;
        const textColor = rgb(0, 0, 0);
        
        // Get page dimensions
        const { width, height } = firstPage.getSize();
        
        // Fill in the form fields (adjust coordinates based on your PDF)
        // You'll need to adjust these X, Y coordinates to match your form exactly
        
        // Name field
        firstPage.drawText(studentData.fullName || '', {
            x: 150,
            y: height - 162,
            size: fontSize,
            font: font,
            color: textColor,
        });
        
        // Date of Birth
        const dob = studentData.dateOfBirth ? new Date(studentData.dateOfBirth).toLocaleDateString('fr-FR') : '';
        firstPage.drawText(dob, {
            x: 210,
            y: height - 185,
            size: fontSize,
            font: font,
            color: textColor,
        });
        
        // CIN
        firstPage.drawText(studentData.cin || '', {
            x: 210,
            y: height - 209,
            size: fontSize,
            font: font,
            color: textColor,
        });
        
        // City
        firstPage.drawText(studentData.city || '', {
            x: 180,
            y: height - 232,
            size: fontSize,
            font: font,
            color: textColor,
        });
        
        // GSM (Phone)
        firstPage.drawText(studentData.phoneNumber || '', {
            x: 210,
            y: height - 255,
            size: fontSize,
            font: font,
            color: textColor,
        });
        
        // Email
        firstPage.drawText(studentData.email || '', {
            x: 210,
            y: height - 279,
            size: fontSize,
            font: font,
            color: textColor,
        });
        
        // Parents
        firstPage.drawText(studentData.parentName || '', {
            x: 210,
            y: height - 302,
            size: fontSize,
            font: font,
            color: textColor,
        });
        
        // Parent Phone
        firstPage.drawText(studentData.parentPhone || '', {
            x: 210,
            y: height - 325,
            size: fontSize,
            font: font,
            color: textColor,
        });
        
        // Study Level
        firstPage.drawText(studentData.studyLevel || '', {
            x: 210,
            y: height - 348,
            size: fontSize,
            font: font,
            color: textColor,
        });
        
        // Mark the selected Formation with X
        const formationPositions = {
            'Allemand': { x: 282, y: height - 321 },
            'Anglais': { x: 362, y: height - 321 },
            'Français': { x: 432, y: height - 321 },
            'Ausbildung': { x: 512, y: height - 321 }
        };
        
        if (studentData.formationChoisie && formationPositions[studentData.formationChoisie]) {
            const pos = formationPositions[studentData.formationChoisie];
            firstPage.drawText('X', {
                x: pos.x,
                y: pos.y,
                size: 14,
                font: fontBold,
                color: textColor,
            });
        }
        
        // Mark the selected Filière with X
        const filierePositions = {
            'Gériatrie': { x: 282, y: height - 414 },
            'Aide soignant': { x: 362, y: height - 414 },
            'Agent socio éducatif': { x: 442, y: height - 414 },
            'Assistante sociale': { x: 522, y: height - 414 },
            'Restauration': { x: 282, y: height - 434 },
            'Cuisine': { x: 362, y: height - 434 },
            'Informatique': { x: 442, y: height - 434 }
        };
        
        if (studentData.filiere && filierePositions[studentData.filiere]) {
            const pos = filierePositions[studentData.filiere];
            firstPage.drawText('X', {
                x: pos.x,
                y: pos.y,
                size: 14,
                font: fontBold,
                color: textColor,
            });
        }
        
        // Add the student photo if it exists
        if (studentData.photoPath && fs.existsSync(studentData.photoPath)) {
            try {
                const photoBytes = fs.readFileSync(studentData.photoPath);
                let photoImage;
                
                // Determine image type and embed
                const ext = path.extname(studentData.photoPath).toLowerCase();
                if (ext === '.png') {
                    photoImage = await pdfDoc.embedPng(photoBytes);
                } else if (ext === '.jpg' || ext === '.jpeg') {
                    photoImage = await pdfDoc.embedJpg(photoBytes);
                }
                
                if (photoImage) {
                    // Draw photo in the photo box (adjust position and size as needed)
                    const photoWidth = 100;
                    const photoHeight = 120;
                    
                    firstPage.drawImage(photoImage, {
                        x: width - 135, // Adjust to match your form
                        y: height - 160, // Adjust to match your form
                        width: photoWidth,
                        height: photoHeight,
                    });
                }
            } catch (photoError) {
                console.error('Error adding photo to PDF:', photoError);
            }
        }
        
        // Save the PDF
        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(outputPath, pdfBytes);
        
        return outputPath;
        
    } catch (error) {
        console.error('PDF Generation Error:', error);
        throw error;
    }
}

module.exports = { generateRegistrationPDF };
