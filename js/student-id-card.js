// Student ID Card Generator
// Requires: JsBarcode library and QRCode.js library

let currentStudentForCard = null;

/**
 * Open ID Card Generator Modal
 * @param {Object} student - Student object with all details
 */
async function openIDCardModal(student) {
    currentStudentForCard = student;
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('idCardModal');
    if (!modal) {
        modal = createIDCardModal();
        document.body.appendChild(modal);
    }
    
    // Fetch the actual password if not already present
    if (!student.emailPassword || student.emailPassword === '********') {
        try {
            const response = await fetch(`/api/student-management/students/${student._id}/password`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (response.ok) {
                const data = await response.json();
                student.emailPassword = data.password || '********';
            }
        } catch (error) {
            console.error('Error fetching password:', error);
            student.emailPassword = '********';
        }
    }
    
    // Generate card content
    generateIDCard(student);
    
    // Show modal
    modal.classList.add('active');
}

/**
 * Close ID Card Modal
 */
function closeIDCardModal() {
    const modal = document.getElementById('idCardModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Create ID Card Modal Structure
 */
function createIDCardModal() {
    const modal = document.createElement('div');
    modal.id = 'idCardModal';
    modal.className = 'id-card-modal';
    
    modal.innerHTML = `
        <div class="id-card-modal-content">
            <div class="id-card-header">
                <h2><i class="fas fa-id-card"></i> Carte d'Étudiant</h2>
                <button class="id-card-close" onclick="closeIDCardModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="id-card-container" id="idCardContainer">
                <!-- Cards will be generated here -->
            </div>
            
            <div class="id-card-actions">
                <button class="id-card-btn" onclick="printIDCard()">
                    <i class="fas fa-print"></i>
                    Imprimer la Carte
                </button>
                <button class="id-card-btn id-card-btn-secondary" onclick="downloadIDCardPDF()">
                    <i class="fas fa-download"></i>
                    Télécharger PDF
                </button>
            </div>
        </div>
    `;
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeIDCardModal();
        }
    });
    
    return modal;
}

/**
 * Generate ID Card HTML
 * @param {Object} student - Student object
 */
function generateIDCard(student) {
    const container = document.getElementById('idCardContainer');
    if (!container) return;
    
    // Get student data
    const studentId = student._id || 'N/A';
    const fullName = student.fullName || 'N/A';
    const groupName = student.groupName || 'N/A';
    const season = student.season || new Date().getFullYear();
    const formation = student.formation || [];
    const filiere = student.filiere || [];
    const schoolEmail = student.schoolEmail || 'N/A';
    const emailPassword = student.emailPassword || '********';
    const photoPath = student.photoPath || 'Img/default-avatar.png';
    
    // Format group code: G.{GroupRef}/F.{BranchInitial}.{BranchNum}
    function formatGroupCode(student) {
        // Extract group reference (last letter or number from group name)
        let groupRef = 'X'; // Default
        if (student.groupName) {
            // Try to extract letter/number AFTER "Group" or "Groupe" (e.g., "Group A" -> "A", "Groupe 1" -> "1")
            const match = student.groupName.match(/(?:Group|Groupe)\s*([A-Z0-9]+)/i);
            if (match) {
                groupRef = match[1].toUpperCase();
            } else {
                // Fallback: get last letter/number
                const fallbackMatch = student.groupName.match(/([A-Z0-9])(?!.*[A-Z0-9])/i);
                if (fallbackMatch) {
                    groupRef = fallbackMatch[1].toUpperCase();
                }
            }
        }
        
        // If no branch subgroup, just show group
        if (!student.branchSubgroupName) {
            return `G.${groupRef}`;
        }
        
        // Extract branch initial and number from subgroup name
        // Examples: "IT Group 1" -> "I.1", "Nursing Group 2" -> "N.2", "Hotel Management Group 1" -> "H.1"
        let branchInitial = 'X';
        let branchNum = '1';
        
        if (student.branchSubgroupName) {
            // Get first letter of branch name
            const branchMatch = student.branchSubgroupName.match(/^([A-Z])/i);
            if (branchMatch) {
                branchInitial = branchMatch[1].toUpperCase();
            }
            
            // Extract number from subgroup name
            const numMatch = student.branchSubgroupName.match(/(\d+)/);
            if (numMatch) {
                branchNum = numMatch[1];
            }
        }
        
        return `G.${groupRef}/F.${branchInitial}.${branchNum}`;
    }
    
    const groupCode = formatGroupCode(student);
    
    // Combine formation (language) and filiere (branch) for display
    // Format: "Language / Branch" or just one if the other is missing
    let formationDisplay = '';
    const formationArray = Array.isArray(formation) ? formation : (formation ? [formation] : []);
    const filiereArray = Array.isArray(filiere) ? filiere : (filiere ? [filiere] : []);
    
    if (formationArray.length > 0 && filiereArray.length > 0) {
        // Both language and branch exist
        formationDisplay = `${formationArray.join(', ')} / ${filiereArray.join(', ')}`;
    } else if (formationArray.length > 0) {
        // Only language
        formationDisplay = formationArray.join(', ');
    } else if (filiereArray.length > 0) {
        // Only branch
        formationDisplay = filiereArray.join(', ');
    } else {
        formationDisplay = 'Aucune formation';
    }
    
    // Generate custom student ID: Firstname_Lastname_SeasonNumber
    let customStudentId = 'N/A';
    if (fullName && fullName !== 'N/A') {
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts[nameParts.length - 1] || '';
        
        // Extract season number (last 2 digits of year)
        let seasonNumber = '';
        if (typeof season === 'string') {
            const yearMatch = season.match(/(\d{4})/);
            if (yearMatch) {
                seasonNumber = yearMatch[1].slice(-2);
            }
        } else if (typeof season === 'number') {
            seasonNumber = season.toString().slice(-2);
        }
        
        customStudentId = `${firstName}_${lastName}_${seasonNumber}`;
    }
    
    // Format season to full format (e.g., 2025-2026)
    let fullSeason = season;
    if (typeof season === 'string' && !season.includes('-')) {
        const year = parseInt(season);
        if (!isNaN(year)) {
            fullSeason = `${year}-${year + 1}`;
        }
    } else if (typeof season === 'number') {
        fullSeason = `${season}-${season + 1}`;
    }
    
    container.innerHTML = `
        <!-- Front Side -->
        <div class="id-card">
            <div class="id-card-front">
                <div class="id-card-front-header">
                    <img src="Img/logo.png" alt="Logo" onerror="this.style.display='none'">
                    <div class="school-name">Nisrine School</div>
                </div>
                <div class="id-card-front-body">
                    <div class="id-card-info">
                        <div class="id-card-info-row">
                            <span class="id-card-info-label">Étudiant ID:</span>
                            <span class="id-card-info-value">${customStudentId}</span>
                        </div>
                        <div class="id-card-info-row">
                            <span class="id-card-info-label">Formation:</span>
                            <span class="id-card-info-value">${formationDisplay}</span>
                        </div>
                        <div class="id-card-info-row">
                            <span class="id-card-info-label">Groups:</span>
                            <span class="id-card-info-value">${groupCode}</span>
                        </div>
                        <div class="id-card-info-row">
                            <span class="id-card-info-label">Session:</span>
                            <span class="id-card-info-value">${fullSeason}</span>
                        </div>
                    </div>
                    <div class="id-card-photo-container">
                        <img src="${photoPath}" alt="Photo" class="id-card-photo" onerror="this.src='Img/default-avatar.png'">
                        <div class="id-card-name">${fullName}</div>
                        <div class="id-card-barcode">
                            <svg id="barcode-${studentId}"></svg>
                        </div>
                    </div>
                </div>
                <div class="id-card-signature">Signature Autorisée</div>
            </div>
        </div>
        
        <!-- Back Side -->
        <div class="id-card">
            <div class="id-card-back">
                <div class="id-card-back-title">Informations de Connexion</div>
                <div class="id-card-back-info">
                    <div class="id-card-back-row">
                        <div class="id-card-back-label">Email Scolaire</div>
                        <div class="id-card-back-value">${schoolEmail}</div>
                    </div>
                    <div class="id-card-back-row">
                        <div class="id-card-back-label">Mot de Passe</div>
                        <div class="id-card-back-value">${emailPassword}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Generate barcode after DOM is ready
    setTimeout(() => {
        generateBarcode(studentId);
    }, 100);
}

/**
 * Generate Barcode using JsBarcode
 * @param {String} studentId - Student ID
 */
function generateBarcode(studentId) {
    try {
        if (typeof JsBarcode !== 'undefined') {
            JsBarcode(`#barcode-${studentId}`, studentId.substring(0, 12), {
                format: "CODE128",
                width: 1.5,
                height: 30,
                displayValue: false,
                margin: 0
            });
        }
    } catch (error) {
        console.error('Error generating barcode:', error);
    }
}

/**
 * Generate QR Code using QRCode.js
 * @param {String} studentId - Student ID
 * @param {String} data - QR code data
 */
function generateQRCode(studentId, data) {
    try {
        if (typeof QRCode !== 'undefined') {
            const canvas = document.getElementById(`qrcode-${studentId}`);
            if (canvas) {
                QRCode.toCanvas(canvas, data, {
                    width: 100,
                    height: 100,
                    margin: 1,
                    color: {
                        dark: '#1f2937',
                        light: '#ffffff'
                    }
                }, function (error) {
                    if (error) console.error('QR Code generation error:', error);
                });
            }
        }
    } catch (error) {
        console.error('Error generating QR code:', error);
    }
}

/**
 * Print ID Card
 */
function printIDCard() {
    window.print();
}

/**
 * Download ID Card as PDF
 * Uses browser's print dialog to save as PDF (more reliable)
 */
function downloadIDCardPDF() {
    // Show instruction to user
    const message = `Pour télécharger la carte en PDF:\n\n` +
                   `1. Une fenêtre d'impression va s'ouvrir\n` +
                   `2. IMPORTANT: Activez "Graphiques d'arrière-plan" ou "Background graphics"\n` +
                   `3. Sélectionnez "Enregistrer au format PDF" ou "Microsoft Print to PDF"\n` +
                   `4. Cliquez sur "Enregistrer"\n` +
                   `5. Choisissez l'emplacement et le nom du fichier\n\n` +
                   `⚠️ Sans les graphiques d'arrière-plan, les couleurs ne s'afficheront pas!\n\n` +
                   `Cliquez sur OK pour continuer.`;
    
    if (confirm(message)) {
        // Trigger print dialog (user can save as PDF from there)
        window.print();
    }
}

/**
 * Add "Generate ID Card" button to student profile
 * Call this function when displaying student details
 * @param {Object} student - Student object
 * @param {String} containerId - ID of container to add button to
 */
function addIDCardButton(student, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const button = document.createElement('button');
    button.className = 'btn btn-info btn-small';
    button.innerHTML = '<i class="fas fa-id-card"></i> Carte d\'Étudiant';
    button.onclick = () => openIDCardModal(student);
    
    container.appendChild(button);
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeIDCardModal();
    }
});
