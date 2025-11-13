const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const pdfValidator = require('../utils/pdfValidator');

/**
 * Generates a registration PDF matching the school's official form
 * IMPORTANT: Generated PDFs must meet strict requirements:
 * - File size must not exceed 3 MB
 * - All content must be fully visible and readable
 * - Original layout and formatting must be preserved
 * - File naming convention: StudentName_Season.pdf
 * 
 * @param {Object} studentData - Student registration data
 * @param {string} outputPath - (Optional) Path where PDF will be saved. If not provided, returns buffer
 * @returns {Promise<Buffer|string>} - PDF buffer or path to generated PDF
 */
async function generateRegistrationPDF(studentData, outputPath = null) {
    return new Promise((resolve, reject) => {
        try {
            // Create PDF document with optimized settings for size
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 40, bottom: 40, left: 50, right: 50 },
                compress: true, // Enable compression to reduce file size
                autoFirstPage: true
            });

            // Use buffer for Vercel compatibility
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', async () => {
                const pdfBuffer = Buffer.concat(buffers);
                
                // Validate generated PDF size
                const sizeValidation = pdfValidator.validateFileSize({ buffer: pdfBuffer });
                if (!sizeValidation.valid) {
                    console.error('❌ Generated PDF exceeds size limit:', sizeValidation.error);
                    console.warn('⚠️ PDF Size:', pdfValidator.formatBytes(sizeValidation.size));
                    // Still resolve but log warning - compression may be needed
                }
                
                // Log PDF size for monitoring
                console.log(`📄 Generated PDF size: ${pdfValidator.formatBytes(sizeValidation.size)}`);
                
                if (outputPath) {
                    // Save to file if path provided (local development)
                    fs.writeFileSync(outputPath, pdfBuffer);
                    resolve(outputPath);
                } else {
                    // Return buffer (Vercel production)
                    resolve(pdfBuffer);
                }
            });

            // Add school logo
            const logoPath = path.join(__dirname, '..', 'Img', 'logo.png');
            if (fs.existsSync(logoPath)) {
                try {
                    doc.image(logoPath, 50, 40, {
                        fit: [80, 80],
                        align: 'center',
                        valign: 'center'
                    });
                } catch (logoError) {
                    console.error('Error adding logo to PDF:', logoError);
                }
            }

            // Header Section
            drawHeader(doc, studentData);

            // Add photo FIRST (before other content) if exists
            if (studentData.photoPath) {
                try {
                    // Check if it's a base64 data URL
                    if (studentData.photoPath.startsWith('data:')) {
                        // Base64 image
                        const base64Data = studentData.photoPath.split(',')[1];
                        const imageBuffer = Buffer.from(base64Data, 'base64');
                        doc.image(imageBuffer, 452, 42, {
                            fit: [96, 116],
                            align: 'center',
                            valign: 'center'
                        });
                    } else {
                        // Try different path formats
                        let photoFullPath = null;
                        
                        // If it's a relative path like /uploads/photos/...
                        if (studentData.photoPath.startsWith('/uploads/')) {
                            photoFullPath = path.join(__dirname, '..', studentData.photoPath);
                        } 
                        // If it's already a full path
                        else if (fs.existsSync(studentData.photoPath)) {
                            photoFullPath = studentData.photoPath;
                        }
                        // Try uploads folder
                        else {
                            const uploadsPath = path.join(__dirname, '..', 'uploads', 'photos', path.basename(studentData.photoPath));
                            if (fs.existsSync(uploadsPath)) {
                                photoFullPath = uploadsPath;
                            }
                        }
                        
                        // Add photo if found
                        if (photoFullPath && fs.existsSync(photoFullPath)) {
                            console.log('✅ Adding photo to PDF:', photoFullPath);
                            doc.image(photoFullPath, 452, 42, {
                                fit: [96, 116],
                                align: 'center',
                                valign: 'center'
                            });
                        } else {
                            console.log('⚠️ Photo not found:', studentData.photoPath);
                        }
                    }
                } catch (photoError) {
                    console.error('❌ Error adding photo to PDF:', photoError);
                }
            }

            // Title and Date
            doc.fontSize(18)
               .font('Helvetica-Bold')
               .text('Fiche d\'inscription', 50, 120, { align: 'center' });
            
            doc.fontSize(10)
               .font('Helvetica')
               .text(`Date d'inscription : ${new Date().toLocaleDateString('fr-FR')}`, 50, 125);

            // Personal Information Section
            let yPos = 160;
            drawPersonalInfo(doc, studentData, yPos);

            // Formation Section
            yPos = 430;
            drawFormationSection(doc, studentData, yPos);

            // Filière Section (if applicable)
            yPos = 540;
            drawFiliereSection(doc, studentData, yPos);

            // Finalize PDF
            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

function drawHeader(doc, studentData) {
    // School name (next to logo)
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#8B0000')
       .text('NISRINE GERMAN', 140, 60);
    
    doc.fontSize(16)
       .text('SCHOOL', 140, 80);

    // Photo box border only (no fill)
    doc.rect(450, 40, 100, 120)
       .stroke('#000000');
    
    doc.fillColor('#666666')
       .fontSize(10)
       .font('Helvetica')
       .text('PHOTO', 480, 95);

    // Reset color
    doc.fillColor('#000000');
}

function drawPersonalInfo(doc, studentData, startY) {
    const lineHeight = 35; // Increased spacing for clarity
    let y = startY;

    doc.fontSize(11).font('Helvetica');

    // Name
    doc.font('Helvetica-Bold').text('Nom et Prénom:', 50, y);
    doc.font('Helvetica').text(studentData.fullName || '', 200, y);
    doc.moveTo(200, y + 18).lineTo(550, y + 18).stroke();
    y += lineHeight;

    // Date of Birth
    doc.font('Helvetica-Bold').text('Date de naissance:', 50, y);
    const dob = studentData.dateOfBirth ? new Date(studentData.dateOfBirth).toLocaleDateString('fr-FR') : '';
    doc.font('Helvetica').text(dob, 200, y);
    doc.moveTo(200, y + 18).lineTo(550, y + 18).stroke();
    y += lineHeight;

    // CIN
    doc.font('Helvetica-Bold').text('CIN:', 50, y);
    doc.font('Helvetica').text(studentData.cin || '', 200, y);
    doc.moveTo(200, y + 18).lineTo(550, y + 18).stroke();
    y += lineHeight;

    // City
    doc.font('Helvetica-Bold').text('Ville / Cartier:', 50, y);
    doc.font('Helvetica').text(studentData.city || '', 200, y);
    doc.moveTo(200, y + 18).lineTo(550, y + 18).stroke();
    y += lineHeight;

    // Phone
    doc.font('Helvetica-Bold').text('GSM:', 50, y);
    doc.font('Helvetica').text(studentData.phoneNumber || '', 200, y);
    doc.moveTo(200, y + 18).lineTo(550, y + 18).stroke();
    y += lineHeight;

    // Parent Phone
    doc.font('Helvetica-Bold').text('GSM Parents:', 50, y);
    doc.font('Helvetica').text(studentData.parentPhone || '', 200, y);
    doc.moveTo(200, y + 18).lineTo(550, y + 18).stroke();
    y += lineHeight;

    // Study Level
    doc.font('Helvetica-Bold').text('Niveau d\'étude:', 50, y);
    doc.font('Helvetica').text(studentData.studyLevel || '', 200, y);
    doc.moveTo(200, y + 18).lineTo(550, y + 18).stroke();
}

function drawFormationSection(doc, studentData, startY) {
    // Section header with background
    doc.rect(50, startY, 500, 30)
       .fillColor('#8B0000')
       .fill();
    
    doc.fillColor('#FFFFFF')
       .fontSize(13)
       .font('Helvetica-Bold')
       .text('FORMATION CHOISIE', 60, startY + 10);

    // Reset color
    doc.fillColor('#000000').font('Helvetica');

    // Formation options with clear spacing
    const formations = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];
    let xPos = 70;
    const yPos = startY + 50;
    
    // Get selected formations - check multiple possible field names
    let selectedFormations = [];
    if (studentData.formationChoisie) {
        selectedFormations = Array.isArray(studentData.formationChoisie) 
            ? studentData.formationChoisie 
            : [studentData.formationChoisie];
    } else if (studentData.formation) {
        selectedFormations = Array.isArray(studentData.formation) 
            ? studentData.formation 
            : [studentData.formation];
    }
    
    console.log('📝 PDF Formation marking:', { 
        formationChoisie: studentData.formationChoisie,
        formation: studentData.formation,
        selectedFormations 
    });
    
    formations.forEach(formation => {
        // Checkbox
        doc.rect(xPos, yPos, 15, 15).stroke();
        
        // Mark X if selected
        if (selectedFormations.includes(formation)) {
            console.log(`✅ Marking ${formation} as selected`);
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text('X', xPos + 3, yPos + 1);
            doc.font('Helvetica');
        }
        
        // Label
        doc.fontSize(11).text(formation, xPos + 25, yPos + 3);
        xPos += 120;
    });
}

function drawPackSection(doc, studentData, startY) {
    // Red box for "Pack"
    doc.rect(50, startY, 150, 30)
       .fillColor('#8B0000')
       .fill();
    
    doc.fillColor('#FFFFFF')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('Pack', 110, startY + 10);

    // Reset color
    doc.fillColor('#000000').font('Helvetica');

    // Pack options
    const packs = ['P.M', 'Trimestre', 'P.Normal', 'PVIP'];
    let xPos = 220;
    
    packs.forEach(pack => {
        // Checkbox
        doc.rect(xPos, startY + 8, 12, 12).stroke();
        
        // Label
        doc.fontSize(10).text(pack, xPos + 20, startY + 10);
        xPos += 80;
    });
}

function drawFiliereSection(doc, studentData, startY) {
    // Section header with background
    doc.rect(50, startY, 500, 30)
       .fillColor('#8B0000')
       .fill();
    
    doc.fillColor('#FFFFFF')
       .fontSize(13)
       .font('Helvetica-Bold')
       .text('FILIÈRE (Specialization)', 60, startY + 10);

    // Reset color
    doc.fillColor('#000000').font('Helvetica');

    // Convert to array if it's a single value
    const selectedFilieres = Array.isArray(studentData.filiere) 
        ? studentData.filiere 
        : (studentData.filiere && studentData.filiere !== 'None' ? [studentData.filiere] : []);

    // Filière options - Row 1
    const filieres1 = ['Gériatrie', 'Aide soignant', 'Agent socio éducatif', 'Assistante sociale'];
    let xPos = 70;
    let yPos = startY + 50;
    
    filieres1.forEach(filiere => {
        // Checkbox
        doc.rect(xPos, yPos, 15, 15).stroke();
        
        // Mark if selected
        if (selectedFilieres.includes(filiere)) {
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text('X', xPos + 3, yPos + 1);
            doc.font('Helvetica');
        }
        
        // Label
        doc.fontSize(9).text(filiere, xPos + 20, yPos + 3, { width: 90 });
        xPos += 120;
    });

    // Filière options - Row 2
    const filieres2 = ['Restauration', 'Cuisine', 'Informatique', 'Gestion hôtelière'];
    xPos = 70;
    yPos = startY + 80;
    
    filieres2.forEach(filiere => {
        // Checkbox
        doc.rect(xPos, yPos, 15, 15).stroke();
        
        // Mark if selected
        if (selectedFilieres.includes(filiere)) {
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text('X', xPos + 3, yPos + 1);
            doc.font('Helvetica');
        }
        
        // Label
        doc.fontSize(9).text(filiere, xPos + 20, yPos + 3);
        xPos += 120;
    });
}

module.exports = { generateRegistrationPDF };
