// ============================================
// PHASE 2.2: STUDENT PROFILE EXPANSION VIEW
// ============================================

// Helper function to validate photo path
function isValidPhotoPath(photoPath) {
    if (!photoPath) return false;
    if (photoPath.includes('undefined') || photoPath.includes('null')) return false;
    return true;
}

// Open student profile expansion view - OPTIMIZED FOR SPEED
window.viewStudentProfile = async function(studentId) {
    try {
        // Close any existing modal first
        const existingModal = document.getElementById('studentProfileModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // ⚡ INSTANT: Show skeleton modal immediately (no waiting!)
        showSkeletonModal(studentId);
        
        // ⚡ PARALLEL: Fetch student data and grades simultaneously
        const [studentResponse, gradesResponse] = await Promise.all([
            fetch(`/api/student-management/students/${studentId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`/api/grades/admin/students/${studentId}/grades`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }).catch(() => null) // Don't fail if grades fail
        ]);
        
        if (!studentResponse.ok) throw new Error('Failed to load student data');
        
        const data = await studentResponse.json();
        const student = data.student || data;
        
        if (!student || !student._id) {
            throw new Error('Invalid student data received');
        }
        
        // Parse grades
        let grades = [];
        if (gradesResponse && gradesResponse.ok) {
            const gradesData = await gradesResponse.json();
            grades = gradesData.grades || gradesData || [];
        }
        
        // ⚡ UPDATE: Replace skeleton with real data
        updateModalWithData(student, grades);
        
        // Load CIN status in background
        setTimeout(() => loadCINStatus(studentId), 100);
        
    } catch (error) {
        console.error('Error loading student profile:', error);
        const modal = document.getElementById('studentProfileModal');
        if (modal) modal.remove();
        showNotification('Failed to load student profile', 'error');
    }
};

// ⚡ Show skeleton loading modal instantly
function showSkeletonModal(studentId) {
    const modal = document.createElement('div');
    modal.className = 'split-modal active';
    modal.id = 'studentProfileModal';
    
    modal.innerHTML = `
        <div class="split-modal-container">
            <div class="split-modal-header">
                <h2><i class="fas fa-user-circle"></i> ${t('loadingAttendanceRecords').split('...')[0]}...</h2>
                <button class="split-modal-close" onclick="closeStudentProfile()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="split-modal-body">
                <div class="split-panel-left">
                    <div class="skeleton-loader">
                        <div class="skeleton-box" style="height: 200px; margin-bottom: 20px;"></div>
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line"></div>
                    </div>
                </div>
                
                <div class="split-panel-right">
                    <div class="skeleton-loader">
                        <div class="skeleton-circle" style="width: 120px; height: 120px; margin: 0 auto 20px;"></div>
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line"></div>
                    </div>
                </div>
            </div>
            
            <div class="split-modal-footer">
                <div class="skeleton-line" style="width: 150px;"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ⚡ Update modal with real data
function updateModalWithData(student, grades) {
    const modal = document.getElementById('studentProfileModal');
    if (!modal) return;
    
    modal.innerHTML = `
        <div class="split-modal-container">
            <div class="split-modal-header">
                <h2><i class="fas fa-user-circle"></i> ${student.fullName || ''}</h2>
                <button class="split-modal-close" onclick="closeStudentProfile()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="split-modal-body">
                <div class="split-panel-left">
                    ${renderStudentForm(student)}
                </div>
                
                <div class="split-panel-right">
                    ${renderStudentData(student, grades)}
                </div>
            </div>
            
            <div class="split-modal-footer">
                <div class="btn-group">
                    <button type="button" class="btn-split secondary" onclick="editStudentProfile('${student._id}')">
                        <i class="fas fa-edit"></i> ${t('editStudent')}
                    </button>
                </div>
                <div class="btn-group">
                    <button type="button" class="btn-split secondary" onclick="closeStudentProfile()">
                        <i class="fas fa-times"></i> ${t('close')}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Render student form (read-only) - PDF Registration Form Style
function renderStudentForm(student) {
    const formations = Array.isArray(student.formation) ? student.formation : [student.formation];
    const filieres = Array.isArray(student.filiere) ? student.filiere : (student.filiere ? [student.filiere] : []);
    
    return `
        <!-- Registration Form Header -->
        <div style="background: white; padding: 24px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 24px;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                        <img src="/Img/logo.png" alt="Logo" style="height: 70px; width: auto;" onerror="this.style.display='none'">
                        <div>
                            <h3 style="margin: 0; color: #1e293b; font-size: 1.4rem; font-weight: 700; line-height: 1.2;">NISRINE GERMAN</h3>
                            <h3 style="margin: 0; color: #1e293b; font-size: 1.4rem; font-weight: 700; line-height: 1.2;">SCHOOL</h3>
                        </div>
                    </div>
                </div>
                <div style="text-align: center; flex: 1;">
                    <h2 style="margin: 0; color: #667eea; font-size: 1.5rem; font-weight: 700;">Fiche d'inscription</h2>
                    <p style="margin: 4px 0 0 0; color: #64748b; font-size: 0.9rem;">Registration Form</p>
                </div>
                <div style="width: 120px; height: 150px; border: 2px solid #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    ${isValidPhotoPath(student.photoPath) ? 
                        `<img src="${student.photoPath}" alt="Student" style="width: 100%; height: 100%; object-fit: cover;">` :
                        `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem; font-weight: 600;">${student.fullName ? student.fullName.charAt(0).toUpperCase() : '?'}</div>`
                    }
                </div>
            </div>
            
            <!-- Student Information Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr style="border-bottom: 2px solid #e2e8f0;">
                    <td style="padding: 12px 16px; font-weight: 600; color: #475569; width: 200px;">Date d'inscription:</td>
                    <td style="padding: 12px 16px; color: #1e293b;">${student.createdAt ? new Date(student.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</td>
                </tr>
                <tr style="border-bottom: 2px solid #e2e8f0;">
                    <td style="padding: 12px 16px; font-weight: 600; color: #475569;">Nom et Prénom:</td>
                    <td style="padding: 12px 16px; color: #1e293b;">${student.fullName || ''}</td>
                </tr>
                <tr style="border-bottom: 2px solid #e2e8f0;">
                    <td style="padding: 12px 16px; font-weight: 600; color: #475569;">Date de naissance:</td>
                    <td style="padding: 12px 16px; color: #1e293b;">${(student.dateOfBirth && student.dateOfBirth !== '') ? new Date(student.dateOfBirth).toLocaleDateString('fr-FR') : '<span style="color: #94a3b8;">Not provided</span>'}</td>
                </tr>
                <tr style="border-bottom: 2px solid #e2e8f0;">
                    <td style="padding: 12px 16px; font-weight: 600; color: #475569;">Adresse:</td>
                    <td style="padding: 12px 16px; color: #1e293b;">${(student.address && student.address.trim() !== '') ? student.address : '<span style="color: #94a3b8;">Not provided</span>'}</td>
                </tr>
                <tr style="border-bottom: 2px solid #e2e8f0;">
                    <td style="padding: 12px 16px; font-weight: 600; color: #475569;">Ville / Quartier:</td>
                    <td style="padding: 12px 16px; color: #1e293b;">${(student.city && student.city.trim() !== '') ? student.city : '<span style="color: #94a3b8;">Not provided</span>'}</td>
                </tr>
                <tr style="border-bottom: 2px solid #e2e8f0;">
                    <td style="padding: 12px 16px; font-weight: 600; color: #475569;">GSM Etudiant:</td>
                    <td style="padding: 12px 16px; color: #1e293b;">${student.phoneNumber || student.phones?.[0] || ''}</td>
                </tr>
                <tr style="border-bottom: 2px solid #e2e8f0;">
                    <td style="padding: 12px 16px; font-weight: 600; color: #475569;">Numéro d'appel:</td>
                    <td style="padding: 12px 16px; color: #1e293b;">${student.parentPhone || student.phones?.[1] || ''}</td>
                </tr>
                <tr style="border-bottom: 2px solid #e2e8f0;">
                    <td style="padding: 12px 16px; font-weight: 600; color: #475569;">Email:</td>
                    <td style="padding: 12px 16px; color: #1e293b;">${student.email || student.schoolEmail || ''}</td>
                </tr>
            </table>
            
            <!-- Formation Choisie -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 12px 16px; margin-bottom: 16px; border-radius: 6px;">
                <h3 style="margin: 0; color: white; font-size: 1rem; font-weight: 600;">FORMATION CHOISIE</h3>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px;">
                <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid ${formations.includes('Allemand') ? '#667eea' : '#e2e8f0'}; border-radius: 6px; background: ${formations.includes('Allemand') ? 'rgba(102, 126, 234, 0.1)' : 'white'};">
                    <input type="checkbox" ${formations.includes('Allemand') ? 'checked' : ''} disabled style="width: 18px; height: 18px; accent-color: #667eea;">
                    <span style="font-weight: 500; color: #1e293b;">Allemand</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid ${formations.includes('Anglais') ? '#667eea' : '#e2e8f0'}; border-radius: 6px; background: ${formations.includes('Anglais') ? 'rgba(102, 126, 234, 0.1)' : 'white'};">
                    <input type="checkbox" ${formations.includes('Anglais') ? 'checked' : ''} disabled style="width: 18px; height: 18px; accent-color: #667eea;">
                    <span style="font-weight: 500; color: #1e293b;">Anglais</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid ${formations.includes('Français') ? '#667eea' : '#e2e8f0'}; border-radius: 6px; background: ${formations.includes('Français') ? 'rgba(102, 126, 234, 0.1)' : 'white'};">
                    <input type="checkbox" ${formations.includes('Français') ? 'checked' : ''} disabled style="width: 18px; height: 18px; accent-color: #667eea;">
                    <span style="font-weight: 500; color: #1e293b;">Français</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid ${formations.includes('Ausbildung') ? '#667eea' : '#e2e8f0'}; border-radius: 6px; background: ${formations.includes('Ausbildung') ? 'rgba(102, 126, 234, 0.1)' : 'white'};">
                    <input type="checkbox" ${formations.includes('Ausbildung') ? 'checked' : ''} disabled style="width: 18px; height: 18px; accent-color: #667eea;">
                    <span style="font-weight: 500; color: #1e293b;">Ausbildung</span>
                </label>
            </div>
            
            <!-- Filière (Spécialisation) -->
            ${filieres.length > 0 ? `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 12px 16px; margin-bottom: 16px; border-radius: 6px;">
                <h3 style="margin: 0; color: white; font-size: 1rem; font-weight: 600;">FILIÈRE (Spécialisation)</h3>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px;">
                <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid ${filieres.includes('Gériatrie') ? '#667eea' : '#e2e8f0'}; border-radius: 6px; background: ${filieres.includes('Gériatrie') ? 'rgba(102, 126, 234, 0.1)' : 'white'};">
                    <input type="checkbox" ${filieres.includes('Gériatrie') ? 'checked' : ''} disabled style="width: 18px; height: 18px; accent-color: #667eea;">
                    <span style="font-weight: 500; color: #1e293b;">Gériatrie</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid ${filieres.includes('Aide soignant') ? '#667eea' : '#e2e8f0'}; border-radius: 6px; background: ${filieres.includes('Aide soignant') ? 'rgba(102, 126, 234, 0.1)' : 'white'};">
                    <input type="checkbox" ${filieres.includes('Aide soignant') ? 'checked' : ''} disabled style="width: 18px; height: 18px; accent-color: #667eea;">
                    <span style="font-weight: 500; color: #1e293b;">Aide soignant</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid ${filieres.includes('Agent socio éducatif') ? '#667eea' : '#e2e8f0'}; border-radius: 6px; background: ${filieres.includes('Agent socio éducatif') ? 'rgba(102, 126, 234, 0.1)' : 'white'};">
                    <input type="checkbox" ${filieres.includes('Agent socio éducatif') ? 'checked' : ''} disabled style="width: 18px; height: 18px; accent-color: #667eea;">
                    <span style="font-weight: 500; color: #1e293b;">Agent socio éducatif</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid ${filieres.includes('Assistante sociale') ? '#667eea' : '#e2e8f0'}; border-radius: 6px; background: ${filieres.includes('Assistante sociale') ? 'rgba(102, 126, 234, 0.1)' : 'white'};">
                    <input type="checkbox" ${filieres.includes('Assistante sociale') ? 'checked' : ''} disabled style="width: 18px; height: 18px; accent-color: #667eea;">
                    <span style="font-weight: 500; color: #1e293b;">Assistante sociale</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid ${filieres.includes('Restauration') ? '#667eea' : '#e2e8f0'}; border-radius: 6px; background: ${filieres.includes('Restauration') ? 'rgba(102, 126, 234, 0.1)' : 'white'};">
                    <input type="checkbox" ${filieres.includes('Restauration') ? 'checked' : ''} disabled style="width: 18px; height: 18px; accent-color: #667eea;">
                    <span style="font-weight: 500; color: #1e293b;">Restauration</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid ${filieres.includes('Cuisine') ? '#667eea' : '#e2e8f0'}; border-radius: 6px; background: ${filieres.includes('Cuisine') ? 'rgba(102, 126, 234, 0.1)' : 'white'};">
                    <input type="checkbox" ${filieres.includes('Cuisine') ? 'checked' : ''} disabled style="width: 18px; height: 18px; accent-color: #667eea;">
                    <span style="font-weight: 500; color: #1e293b;">Cuisine</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid ${filieres.includes('Informatique') ? '#667eea' : '#e2e8f0'}; border-radius: 6px; background: ${filieres.includes('Informatique') ? 'rgba(102, 126, 234, 0.1)' : 'white'};">
                    <input type="checkbox" ${filieres.includes('Informatique') ? 'checked' : ''} disabled style="width: 18px; height: 18px; accent-color: #667eea;">
                    <span style="font-weight: 500; color: #1e293b;">Informatique</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid ${filieres.includes('Gestion hôtelière') ? '#667eea' : '#e2e8f0'}; border-radius: 6px; background: ${filieres.includes('Gestion hôtelière') ? 'rgba(102, 126, 234, 0.1)' : 'white'};">
                    <input type="checkbox" ${filieres.includes('Gestion hôtelière') ? 'checked' : ''} disabled style="width: 18px; height: 18px; accent-color: #667eea;">
                    <span style="font-weight: 500; color: #1e293b;">Gestion hôtelière</span>
                </label>
            </div>
            ` : ''}
            
            <!-- Pack Section -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 12px 16px; margin: 24px 0 16px 0; border-radius: 6px;">
                <h3 style="margin: 0; color: white; font-size: 1rem; font-weight: 600;">PACK</h3>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 8px; padding: 12px; border: 2px solid ${(!student.paymentPlan || student.paymentPlan === 'pm') ? '#3b82f6' : '#e2e8f0'}; border-radius: 8px; background: ${(!student.paymentPlan || student.paymentPlan === 'pm') ? 'rgba(59, 130, 246, 0.1)' : 'white'};">
                    <div style="width: 18px; height: 18px; border-radius: 50%; border: 2px solid ${(!student.paymentPlan || student.paymentPlan === 'pm') ? '#3b82f6' : '#cbd5e1'}; display: flex; align-items: center; justify-content: center;">
                        ${(!student.paymentPlan || student.paymentPlan === 'pm') ? '<div style="width: 10px; height: 10px; border-radius: 50%; background: #3b82f6;"></div>' : ''}
                    </div>
                    <span style="font-weight: 600; color: ${(!student.paymentPlan || student.paymentPlan === 'pm') ? '#2563eb' : '#94a3b8'};">P.M</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; padding: 12px; border: 2px solid ${student.paymentPlan === 'trimestrial' ? '#7c3aed' : '#e2e8f0'}; border-radius: 8px; background: ${student.paymentPlan === 'trimestrial' ? 'rgba(124, 58, 237, 0.1)' : 'white'};">
                    <div style="width: 18px; height: 18px; border-radius: 50%; border: 2px solid ${student.paymentPlan === 'trimestrial' ? '#7c3aed' : '#cbd5e1'}; display: flex; align-items: center; justify-content: center;">
                        ${student.paymentPlan === 'trimestrial' ? '<div style="width: 10px; height: 10px; border-radius: 50%; background: #7c3aed;"></div>' : ''}
                    </div>
                    <span style="font-weight: 600; color: ${student.paymentPlan === 'trimestrial' ? '#6d28d9' : '#94a3b8'};">Trimestre</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; padding: 12px; border: 2px solid ${student.paymentPlan === 'semestriel' ? '#059669' : '#e2e8f0'}; border-radius: 8px; background: ${student.paymentPlan === 'semestriel' ? 'rgba(5, 150, 105, 0.1)' : 'white'};">
                    <div style="width: 18px; height: 18px; border-radius: 50%; border: 2px solid ${student.paymentPlan === 'semestriel' ? '#059669' : '#cbd5e1'}; display: flex; align-items: center; justify-content: center;">
                        ${student.paymentPlan === 'semestriel' ? '<div style="width: 10px; height: 10px; border-radius: 50%; background: #059669;"></div>' : ''}
                    </div>
                    <span style="font-weight: 600; color: ${student.paymentPlan === 'semestriel' ? '#047857' : '#94a3b8'};">P.Semestriel</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; padding: 12px; border: 2px solid ${student.paymentPlan === 'annuel' ? '#d97706' : '#e2e8f0'}; border-radius: 8px; background: ${student.paymentPlan === 'annuel' ? 'rgba(217, 119, 6, 0.1)' : 'white'};">
                    <div style="width: 18px; height: 18px; border-radius: 50%; border: 2px solid ${student.paymentPlan === 'annuel' ? '#d97706' : '#cbd5e1'}; display: flex; align-items: center; justify-content: center;">
                        ${student.paymentPlan === 'annuel' ? '<div style="width: 10px; height: 10px; border-radius: 50%; background: #d97706;"></div>' : ''}
                    </div>
                    <span style="font-weight: 600; color: ${student.paymentPlan === 'annuel' ? '#b45309' : '#94a3b8'};">P.Annuel</span>
                </div>
            </div>
            
            <!-- Payment Information Section -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 12px 16px; margin: 24px 0 16px 0; border-radius: 6px;">
                <h3 style="margin: 0; color: white; font-size: 1rem; font-weight: 600;">INFORMATIONS DE PAIEMENT</h3>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr style="border-bottom: 2px solid #e2e8f0;">
                    <td style="padding: 12px 16px; font-weight: 600; color: #475569; width: 200px;">Date de paiement:</td>
                    <td style="padding: 12px 16px; color: #1e293b;">${student.paymentDate ? new Date(student.paymentDate).toLocaleDateString('fr-FR') : 'Non défini'}</td>
                </tr>
                <tr style="border-bottom: 2px solid #e2e8f0;">
                    <td style="padding: 12px 16px; font-weight: 600; color: #475569;">Montant:</td>
                    <td style="padding: 12px 16px; color: #1e293b; font-weight: 600; font-size: 1.1rem;">${student.paymentAmount ? student.paymentAmount + ' MAD' : 'Non défini'}</td>
                </tr>
                <tr style="border-bottom: 2px solid #e2e8f0;">
                    <td style="padding: 12px 16px; font-weight: 600; color: #475569;">Statut:</td>
                    <td style="padding: 12px 16px;">
                        <span style="display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 0.9rem;
                                     background: ${student.paymentStatus === 'paid' ? '#d1fae5' : student.paymentStatus === 'overdue' ? '#fee2e2' : '#fef3c7'};
                                     color: ${student.paymentStatus === 'paid' ? '#065f46' : student.paymentStatus === 'overdue' ? '#dc2626' : '#92400e'};">
                            ${student.paymentStatus === 'paid' ? '✓ PAYÉ' : student.paymentStatus === 'overdue' ? '✗ EN RETARD' : '⏱ EN ATTENTE'}
                        </span>
                    </td>
                </tr>
            </table>
            
            <!-- Download and Backup Buttons -->
            <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button onclick="downloadStudentPDF('${student._id}', '${(student.fullName || 'Student').replace(/'/g, "\\'")}', '${student.schoolEmail}')" 
                        style="flex: 1; padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(102, 126, 234, 0.4)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)';">
                    <i class="fas fa-download"></i> ${t('archiveDownload')} PDF
                </button>
                <button onclick="backupToCloud('${student._id}', '${(student.fullName || 'Student').replace(/'/g, "\\'")}', '${student.schoolEmail}')" 
                        style="flex: 1; padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(102, 126, 234, 0.4)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)';">
                    <i class="fas fa-cloud-upload-alt"></i> Backup to Cloud
                </button>
            </div>
            
            <!-- ID Card Button -->
            <div style="margin-top: 12px;">
                <button onclick='openIDCardModal(${JSON.stringify(student).replace(/'/g, "\\'")})'
                        style="width: 100%; padding: 14px; background: linear-gradient(135deg, #FFCC00, #FF9500); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(255, 204, 0, 0.3);"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(255, 204, 0, 0.4)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(255, 204, 0, 0.3)';">
                    <i class="fas fa-id-card"></i> Carte d'Étudiant
                </button>
            </div>
        </div>
    `;
}

// Render student data panel
function renderStudentData(student, grades) {
    const formations = Array.isArray(student.formation) ? student.formation : [student.formation];
    const filieres = Array.isArray(student.filiere) ? student.filiere : (student.filiere ? [student.filiere] : []);
    
    // Calculate grade statistics
    const gradesByFormation = {};
    const gradeStats = {
        total: grades.length,
        passed: 0,
        failed: 0,
        average: 0
    };
    
    grades.forEach(grade => {
        const percentage = (grade.score / grade.maxScore) * 100;
        if (percentage >= 50) gradeStats.passed++;
        else gradeStats.failed++;
        gradeStats.average += percentage;
        
        if (!gradesByFormation[grade.formation]) {
            gradesByFormation[grade.formation] = [];
        }
        gradesByFormation[grade.formation].push(grade);
    });
    
    if (grades.length > 0) {
        gradeStats.average = (gradeStats.average / grades.length).toFixed(1);
    }
    
    // Determine overall status
    let statusClass = 'approved';
    let statusIcon = 'check-circle';
    let statusText = t('active');
    
    if (student.status === 'pending') {
        statusClass = 'pending';
        statusIcon = 'clock';
        statusText = t('pending');
    } else if (student.status === 'inactive') {
        statusClass = 'incomplete';
        statusIcon = 'exclamation-circle';
        statusText = t('inactive');
    }
    
    const initial = student.fullName ? student.fullName.charAt(0).toUpperCase() : '?';
    
    return `
        <!-- Profile Card -->
        <div class="preview-card">
            <div class="preview-avatar">
                ${isValidPhotoPath(student.photoPath) ? 
                    `<img src="${student.photoPath}" alt="Student">` : 
                    initial
                }
            </div>
            <div class="preview-name">${student.fullName || 'Student Name'}</div>
            <div class="preview-email">${student.schoolEmail || 'email@nisrineschool.com'}</div>
            
            <div class="preview-status ${statusClass}">
                <i class="fas fa-${statusIcon}"></i>
                <span>${statusText}</span>
            </div>
        </div>
        
        <!-- Contact Information -->
        <div class="preview-section">
            <div class="preview-section-title">${t('phoneNumber')}</div>
            <div class="preview-item">
                <i class="fas fa-envelope"></i>
                <span>${student.email || '-'}</span>
            </div>
            <div class="preview-item">
                <i class="fas fa-phone"></i>
                <span>${student.phoneNumber || student.phones?.[0] || '-'}</span>
            </div>
            <div class="preview-item">
                <i class="fas fa-user-friends"></i>
                <span>${student.parentPhone || student.phones?.[1] || '-'}</span>
            </div>
            
            <!-- CIN Card Download -->
            <div class="cin-download-section" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                <button id="downloadCINBtn-${student._id}" 
                        class="btn-download-cin" 
                        onclick="downloadStudentCIN('${student._id}')"
                        style="width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s;">
                    <i class="fas fa-download"></i>
                    <span>${t('archiveDownload')} CIN</span>
                </button>
                <div id="cinStatus-${student._id}" style="margin-top: 8px; text-align: center; font-size: 0.85rem;"></div>
            </div>
        </div>
        
        <!-- Academic Summary -->
        <div class="preview-section">
            <div class="preview-section-title">${t('academicSummary')}</div>
            <div class="preview-item">
                <i class="fas fa-calendar-alt"></i>
                <span>${student.seasonName || student.season?.name || student.season || '-'}</span>
            </div>
            <div class="preview-item">
                <i class="fas fa-users"></i>
                <span>${student.groupName || '-'}</span>
            </div>
            <div class="preview-item">
                <i class="fas fa-book"></i>
                <span>${formations.length} ${t('language')}</span>
            </div>
            ${filieres.length > 0 ? `
            <div class="preview-item">
                <i class="fas fa-briefcase"></i>
                <span>${filieres.length} ${t('branch')}</span>
            </div>
            ` : ''}
        </div>
        
        <!-- Level Tabs and Content -->
        <div class="preview-section">
            <div class="preview-section-title">${t('studentGrades')}</div>
            
            <!-- Level Tabs -->
            <div id="levelTabs-${student._id}" class="level-tabs-container">
                ${renderLevelTabs(grades, student._id)}
            </div>
            
            <!-- Level Content (Grades Overview + Performance Summary) -->
            <div id="levelContent-${student._id}">
                <!-- Content will be loaded dynamically based on selected level -->
            </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="preview-section">
            <div class="preview-section-title">${t('quickActions')}</div>
            <button onclick="editStudentProfile('${student._id}')" 
                    style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-bottom: 8px;">
                <i class="fas fa-edit"></i> ${t('editStudent')}
            </button>
            <button onclick="viewStudentGrades('${student._id}')" 
                    style="width: 100%; padding: 12px; background: white; color: #667eea; border: 2px solid #667eea; border-radius: 8px; font-weight: 600; cursor: pointer; margin-bottom: 8px;">
                <i class="fas fa-chart-bar"></i> ${t('viewGrades')}
            </button>
            <button onclick="viewPaymentHistory('${student._id}', '${(student.fullName || 'Student').replace(/'/g, "\\'")}');" 
                    style="width: 100%; padding: 12px; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-bottom: 8px; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);">
                <i class="fas fa-history"></i> ${t('paymentHistory')}
            </button>
            <button onclick="exportPaymentJournal('${student._id}', '${(student.fullName || 'Student').replace(/'/g, "\\'")}');" 
                    style="width: 100%; padding: 12px; background: linear-gradient(135deg, #FFCC00, #FF9500); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-bottom: 8px; box-shadow: 0 2px 8px rgba(255, 204, 0, 0.3);">
                <i class="fas fa-file-download"></i> ${t('paymentHistory')} PDF
            </button>
            ${student.paymentStatus !== 'paid' ? `
            <button onclick="markStudentAsPaid('${student._id}')" 
                    style="width: 100%; padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                <i class="fas fa-check"></i> ${t('markAsPaid')}
            ` : ''}
        </div>
    `;
}

// Close student profile
window.closeStudentProfile = function() {
    const modal = document.getElementById('studentProfileModal');
    if (modal) {
        modal.remove();
    }
};

// Edit student profile (placeholder)
window.editStudentProfile = function(studentId) {
    closeStudentProfile();
    // Call existing edit function
    if (typeof editStudent === 'function') {
        editStudent(studentId);
    } else {
        showNotification('Edit functionality coming soon', 'info');
    }
};

// View student grades (placeholder)
window.viewStudentGrades = function(studentId) {
    closeStudentProfile();
    // Switch to grades tab and filter by student
    switchTab('grades');
    setTimeout(() => {
        const studentFilter = document.getElementById('gradesStudentFilter');
        if (studentFilter) {
            studentFilter.value = studentId;
            if (typeof loadStudentGrades === 'function') {
                loadStudentGrades();
            }
        }
    }, 300);
};

// Mark student as paid (placeholder)
window.markStudentAsPaid = function(studentId) {
    if (typeof markAsPaid === 'function') {
        closeStudentProfile();
        markAsPaid(studentId);
    } else {
        showNotification('Payment functionality coming soon', 'info');
    }
};

// Download student PDF
window.downloadStudentPDF = async function(studentId, studentName, studentEmail) {
    try {
        showNotification('📄 Generating PDF...', 'info');
        
        // Use the student-management endpoint
        const pdfResponse = await fetch(`/api/student-management/students/${studentId}/generate-pdf`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!pdfResponse.ok) {
            const error = await pdfResponse.json();
            throw new Error(error.error || 'Failed to generate PDF');
        }
        
        const blob = await pdfResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Fiche-inscription-${studentName.replace(/\s+/g, '-')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification('✅ PDF downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error downloading PDF:', error);
        showNotification('❌ Failed to generate PDF: ' + error.message, 'error');
    }
};

// Backup to cloud (MEGA)
window.backupToCloud = async function(studentId, studentName, studentEmail) {
    try {
        showNotification('☁️ Backing up to MEGA...', 'info');
        
        // Use the student-management endpoint
        const backupResponse = await fetch(`/api/student-management/students/${studentId}/backup-dropbox`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!backupResponse.ok) {
            const error = await backupResponse.json();
            throw new Error(error.message || error.error || 'Failed to backup to MEGA');
        }
        
        const result = await backupResponse.json();
        showNotification(`✅ ${result.message || 'Student data backed up to MEGA successfully!'}`, 'success');
    } catch (error) {
        console.error('Error backing up to MEGA:', error);
        showNotification('❌ Failed to backup: ' + error.message, 'error');
    }
};

// ============================================
// LEVEL TABS RENDERING
// ============================================

function renderLevelTabs(grades, studentId) {
    const languageFormations = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];
    const languageGrades = grades.filter(g => languageFormations.includes(g.formation));
    
    // Get unique levels from grades
    const levels = [...new Set(languageGrades.map(g => g.languageLevel))].filter(l => l).sort();
    
    if (levels.length === 0) {
        return `
            <div style="text-align: center; padding: 20px; color: #94a3b8;">
                No level data available
            </div>
        `;
    }
    
    // Render tabs
    let html = '<div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">';
    
    levels.forEach((level, index) => {
        const isActive = index === 0;
        html += `
            <button 
                class="level-tab ${isActive ? 'active' : ''}" 
                data-level="${level}"
                data-student-id="${studentId}"
                onclick="switchLevel('${level}', '${studentId}')"
                style="
                    padding: 12px 24px;
                    background: ${isActive ? 'linear-gradient(135deg, #FFCC00, #FF9500)' : 'rgba(255, 255, 255, 0.05)'};
                    color: ${isActive ? '#1a1a2e' : '#FFCC00'};
                    border: 2px solid ${isActive ? '#FFCC00' : 'rgba(255, 204, 0, 0.3)'};
                    border-radius: 10px;
                    font-weight: 700;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: ${isActive ? '0 4px 15px rgba(255, 204, 0, 0.3)' : 'none'};
                "
                onmouseover="if(!this.classList.contains('active')) { this.style.background='rgba(255, 204, 0, 0.1)'; this.style.borderColor='#FFCC00'; }"
                onmouseout="if(!this.classList.contains('active')) { this.style.background='rgba(255, 255, 255, 0.05)'; this.style.borderColor='rgba(255, 204, 0, 0.3)'; }"
            >
                ${level}
            </button>
        `;
    });
    
    html += '</div>';
    
    // Load first level content by default
    if (levels.length > 0) {
        setTimeout(() => switchLevel(levels[0], studentId), 100);
    }
    
    return html;
}

// Switch level tab
window.switchLevel = function(level, studentId) {
    console.log('🔄 Switching to level:', level);
    
    // Update tab styles
    const tabs = document.querySelectorAll(`[data-student-id="${studentId}"].level-tab`);
    tabs.forEach(tab => {
        const isActive = tab.getAttribute('data-level') === level;
        tab.classList.toggle('active', isActive);
        tab.style.background = isActive ? 'linear-gradient(135deg, #FFCC00, #FF9500)' : 'rgba(255, 255, 255, 0.05)';
        tab.style.color = isActive ? '#1a1a2e' : '#FFCC00';
        tab.style.borderColor = isActive ? '#FFCC00' : 'rgba(255, 204, 0, 0.3)';
        tab.style.boxShadow = isActive ? '0 4px 15px rgba(255, 204, 0, 0.3)' : 'none';
    });
    
    // Get student data from modal
    const modal = document.getElementById('studentProfileModal');
    if (!modal) return;
    
    // Fetch grades again (they should be cached)
    fetch(`/api/grades/admin/students/${studentId}/grades`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(response => response.json())
    .then(data => {
        const grades = data.grades || data || [];
        const levelGrades = grades.filter(g => g.languageLevel === level);
        
        // Render content for this level
        const contentDiv = document.getElementById(`levelContent-${studentId}`);
        if (contentDiv) {
            contentDiv.innerHTML = renderLevelContent(levelGrades, level);
        }
    })
    .catch(error => {
        console.error('Error loading level content:', error);
    });
};

// Render content for a specific level
function renderLevelContent(grades, level) {
    return `
        <!-- Grades Overview for Level -->
        <div style="margin-bottom: 30px;">
            <h3 style="color: #FFCC00; font-size: 1.1rem; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-chart-bar"></i>
                ${t('studentGrades')} - ${level}
            </h3>
            ${renderGradesOverviewForLevel(grades, level)}
        </div>
        
        <!-- Performance Summary for Level -->
        <div style="margin-bottom: 30px;">
            <h3 style="color: #FFCC00; font-size: 1.1rem; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-chart-line"></i>
                ${t('academicSummary')} - ${level}
            </h3>
            ${renderPerformanceSummaryForLevel(grades, level)}
        </div>
    `;
}

// ============================================
// GRADES OVERVIEW RENDERING (PER LEVEL)
// ============================================

function renderGradesOverviewForLevel(grades, level) {
    if (grades.length === 0) {
        return `
            <div style="text-align: center; padding: 40px 20px; background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); border-radius: 12px; border: 1px solid rgba(255, 204, 0, 0.15);">
                <i class="fas fa-chart-line" style="font-size: 3rem; color: rgba(255, 204, 0, 0.3); margin-bottom: 12px;"></i>
                <p style="margin: 0; font-size: 0.9rem; color: #94a3b8;">-</p>
            </div>
        `;
    }
    
    return renderGradesOverview(grades, []);
}

// ============================================
// PERFORMANCE SUMMARY RENDERING (PER LEVEL)
// ============================================

function renderPerformanceSummaryForLevel(grades, level) {
    if (grades.length === 0) {
        return `
            <div style="text-align: center; padding: 40px 20px; background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); border-radius: 12px; border: 1px solid rgba(255, 204, 0, 0.15);">
                <i class="fas fa-clock" style="font-size: 3rem; color: rgba(255, 204, 0, 0.3); margin-bottom: 12px;"></i>
                <p style="margin: 0; font-size: 0.9rem; color: #94a3b8;">-</p>
            </div>
        `;
    }
    
    return renderPerformanceSummary(grades, []);
}

// ============================================
// GRADES OVERVIEW RENDERING
// ============================================

function renderGradesOverview(grades, formations) {
    console.log('🎓 renderGradesOverview called with:', grades.length, 'grades');
    const languageFormations = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];
    
    // Filter only language formation grades
    const languageGrades = grades.filter(g => languageFormations.includes(g.formation));
    console.log('🎓 Filtered language grades:', languageGrades.length);
    
    if (languageGrades.length === 0) {
        return `
            <div style="text-align: center; padding: 40px 20px; background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); border-radius: 12px; border: 1px solid rgba(255, 204, 0, 0.15);">
                <i class="fas fa-chart-line" style="font-size: 3rem; color: rgba(255, 204, 0, 0.3); margin-bottom: 12px;"></i>
                <p style="margin: 0; font-size: 0.9rem; color: #94a3b8;">-</p>
            </div>
        `;
    }
    
    // Group by formation and level, then calculate averages for each test
    const testAverages = {};
    languageGrades.forEach(grade => {
        const formation = grade.formation;
        const level = grade.languageLevel || 'N/A';
        const testInfo = grade.testType === 'miniTest' 
            ? `Test ${grade.testNumber}` 
            : 'Final Exam';
        const key = `${formation}-${level}-${testInfo}`;
        
        if (!testAverages[key]) {
            testAverages[key] = {
                formation,
                level,
                testInfo,
                scores: [],
                count: 0
            };
        }
        const percentage = (grade.score / grade.maxScore) * 100;
        testAverages[key].scores.push(percentage);
        testAverages[key].count++;
    });
    
    let html = '';
    
    Object.values(testAverages).forEach(test => {
        const average = (test.scores.reduce((a, b) => a + b, 0) / test.scores.length).toFixed(1);
        const isComplete = test.count === 4;
        
        html += `
            <div style="background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px; margin-bottom: 12px; border: 1px solid rgba(255, 204, 0, 0.2); transition: all 0.3s;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div>
                        <div style="font-weight: 600; color: #FFCC00; font-size: 1rem; margin-bottom: 4px;">
                            ${test.formation} - ${test.level}
                        </div>
                        <div style="font-size: 0.9rem; color: #94a3b8;">
                            Average ${test.testInfo}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 2rem; font-weight: 700; color: ${average >= 50 ? '#10b981' : '#ef4444'};">
                            ${average}%
                        </div>
                        <div style="font-size: 0.85rem; color: #94a3b8;">
                            ${test.count}/4 skills
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    return html;
}

// ============================================
// PERFORMANCE SUMMARY RENDERING WITH CHART
// ============================================

function renderPerformanceSummary(grades, formations) {
    console.log('📈 renderPerformanceSummary called with:', grades.length, 'grades');
    const languageFormations = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];
    const languageGrades = grades.filter(g => languageFormations.includes(g.formation));
    console.log('📈 Filtered language grades:', languageGrades.length);
    
    if (languageGrades.length === 0) {
        console.log('📈 No language grades found, showing empty state');

        return `
            <div style="text-align: center; padding: 40px 20px; background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); border-radius: 12px; border: 1px solid rgba(255, 204, 0, 0.15);">
                <i class="fas fa-clock" style="font-size: 3rem; color: rgba(255, 204, 0, 0.3); margin-bottom: 12px;"></i>
                <p style="margin: 0; font-size: 0.9rem; color: #94a3b8;">No performance data yet</p>
            </div>
        `;
    }
    
    // Calculate skill averages
    const skillAverages = {
        'Lesen': [],
        'Hören': [],
        'Schreiben': [],
        'Sprechen': []
    };
    
    languageGrades.forEach(grade => {
        if (skillAverages[grade.examType]) {
            const percentage = (grade.score / grade.maxScore) * 100;
            skillAverages[grade.examType].push(percentage);
        }
    });
    
    const skillData = Object.keys(skillAverages).map(skill => {
        const scores = skillAverages[skill];
        const avg = scores.length > 0 
            ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
            : 0;
        return { skill, average: parseFloat(avg), count: scores.length };
    });
    
    const overallAverage = skillData.length > 0
        ? (skillData.reduce((sum, s) => sum + s.average, 0) / skillData.filter(s => s.count > 0).length).toFixed(1)
        : 0;
    
    // Generate performance insights
    const insights = generatePerformanceInsights(skillData);
    
    const chartId = `performanceChart-${Date.now()}`;
    
    console.log('📈 Chart ID:', chartId);
    console.log('📈 Skill data for chart:', skillData);
    console.log('📈 Overall average:', overallAverage);
    
    // Render chart after DOM is ready
    setTimeout(() => renderPerformanceChart(chartId, skillData), 100);
    
    // Get German grade label
    const getGermanGrade = (percentage) => {
        if (percentage >= 85) return 'Sehr gut';
        if (percentage >= 70) return 'Gut';
        if (percentage >= 60) return 'Befriedigend';
        if (percentage >= 50) return 'Ausreichend';
        return 'Schlecht';
    };
    
    const gradeLabel = getGermanGrade(parseFloat(overallAverage));
    
    return `
        <!-- Overall Average -->
        <div style="padding: 20px; background: linear-gradient(135deg, #FFCC00, #FF9500); border-radius: 12px; text-align: center; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(255, 204, 0, 0.3);">
            <div style="font-size: 0.9rem; color: #1a1a2e; margin-bottom: 6px; font-weight: 600;">Overall Average</div>
            <div style="font-size: 2.5rem; font-weight: 700; color: #1a1a2e;">${gradeLabel}</div>
            <div style="font-size: 1.2rem; color: rgba(26, 26, 46, 0.7); margin-top: 4px;">${overallAverage}%</div>
        </div>
        
        <!-- Performance Chart -->
        <div style="background: #ffffff; border-radius: 12px; padding: 25px; margin-bottom: 20px; border: 1px solid rgba(255, 204, 0, 0.3); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
            <canvas id="${chartId}" style="max-height: 300px; width: 100%;"></canvas>
        </div>
        
        <!-- Performance Insights -->
        <div style="background: #ffffff; border-radius: 12px; padding: 16px; border: 1px solid rgba(255, 204, 0, 0.3); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
            <div style="font-weight: 600; color: #FFCC00; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-lightbulb"></i>
                Performance Insights
            </div>
            ${insights.map(insight => `
                <div style="padding: 10px; background: #f8fafc; border-radius: 8px; margin-bottom: 8px; font-size: 0.85rem; color: #1e293b; line-height: 1.5; border: 1px solid #e2e8f0;">
                    <i class="fas fa-${insight.icon}" style="color: ${insight.color}; margin-right: 8px;"></i>
                    ${insight.text}
                </div>
            `).join('')}
        </div>
    `;
}

// Generate performance insights
function generatePerformanceInsights(skillData) {
    const insights = [];
    
    if (skillData.length === 0 || skillData.every(s => s.count === 0)) {
        return [{
            icon: 'info-circle',
            color: '#94a3b8',
            text: 'No performance data available yet.'
        }];
    }
    
    // Find strongest and weakest skills
    const validSkills = skillData.filter(s => s.count > 0);
    const strongest = validSkills.reduce((max, s) => s.average > max.average ? s : max, validSkills[0]);
    const weakest = validSkills.reduce((min, s) => s.average < min.average ? s : min, validSkills[0]);
    
    if (strongest.average >= 70) {
        insights.push({
            icon: 'trophy',
            color: '#10b981',
            text: `${strongest.skill} shows excellent performance with ${strongest.average}% average.`
        });
    }
    
    if (weakest.average < 60) {
        insights.push({
            icon: 'exclamation-triangle',
            color: '#f59e0b',
            text: `${weakest.skill} needs improvement (${weakest.average}% average). Consider additional practice.`
        });
    }
    
    // Check for improvement trends (if we have multiple tests)
    const hasMultipleTests = validSkills.some(s => s.count >= 2);
    if (hasMultipleTests) {
        insights.push({
            icon: 'chart-line',
            color: '#667eea',
            text: 'Performance data shows consistent progress across multiple tests.'
        });
    }
    
    // Overall performance assessment
    const overallAvg = validSkills.reduce((sum, s) => sum + s.average, 0) / validSkills.length;
    if (overallAvg >= 70) {
        insights.push({
            icon: 'check-circle',
            color: '#10b981',
            text: 'Overall performance is strong. Keep up the excellent work!'
        });
    } else if (overallAvg >= 50) {
        insights.push({
            icon: 'info-circle',
            color: '#3b82f6',
            text: 'Overall performance is satisfactory. Focus on weaker areas for improvement.'
        });
    } else {
        insights.push({
            icon: 'exclamation-circle',
            color: '#ef4444',
            text: 'Overall performance needs attention. Additional support recommended.'
        });
    }
    
    return insights;
}

// Render performance chart using Chart.js
function renderPerformanceChart(chartId, skillData) {
    console.log('📊 renderPerformanceChart called for:', chartId);
    console.log('📊 Skill data:', skillData);
    
    const canvas = document.getElementById(chartId);
    if (!canvas) {
        console.error('❌ Canvas not found:', chartId);
        console.log('Available elements:', document.querySelectorAll('[id^="performanceChart"]'));
        return;
    }
    
    console.log('✅ Canvas found:', canvas);
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('❌ Chart.js not loaded');
        canvas.parentElement.innerHTML = '<p style="text-align: center; color: #ef4444;">Chart library not loaded. Please refresh the page.</p>';
        return;
    }
    
    console.log('✅ Chart.js is loaded');
    
    const ctx = canvas.getContext('2d');
    console.log('✅ Canvas context obtained');
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: skillData.map(s => s.skill),
            datasets: [{
                label: 'Performance',
                data: skillData.map(s => s.average),
                backgroundColor: 'rgba(255, 204, 0, 0.3)',
                borderColor: '#FFCC00',
                borderWidth: 3,
                pointBackgroundColor: '#FFCC00',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#FF9500',
                pointHoverBorderColor: '#FFCC00',
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20,
                        color: '#64748b',
                        backdropColor: 'rgba(255, 255, 255, 0.8)',
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    },
                    grid: {
                        color: 'rgba(100, 116, 139, 0.2)',
                        lineWidth: 2
                    },
                    angleLines: {
                        color: 'rgba(100, 116, 139, 0.2)',
                        lineWidth: 2
                    },
                    pointLabels: {
                        color: '#1e293b',
                        font: {
                            size: 13,
                            weight: '700'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1e293b',
                    bodyColor: '#1e293b',
                    borderColor: '#FFCC00',
                    borderWidth: 2,
                    padding: 12,
                    displayColors: false,
                    titleFont: {
                        size: 14,
                        weight: '700'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return `Average: ${context.parsed.r.toFixed(1)}%`;
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// CIN CARD MANAGEMENT FUNCTIONS
// ============================================

// Download student CIN card
window.downloadStudentCIN = async function(studentId) {
    try {
        const btn = document.getElementById(`downloadCINBtn-${studentId}`);
        const statusDiv = document.getElementById(`cinStatus-${studentId}`);
        
        // Disable button
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Downloading...</span>';
        
        // First, get student name
        let studentName = 'Student';
        try {
            const studentResponse = await fetch(`/api/student-management/students/${studentId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (studentResponse.ok) {
                const studentData = await studentResponse.json();
                const student = studentData.student || studentData;
                studentName = student.fullName || 'Student';
            }
        } catch (error) {
            console.warn('Could not fetch student name, using default');
        }
        
        // Download CIN
        const response = await fetch(`/api/student-management/students/${studentId}/download-cin?format=pdf`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to download CIN card');
        }
        
        // Create filename with student name (sanitized)
        const sanitizedName = studentName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CIN_${sanitizedName}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        // Show success
        statusDiv.innerHTML = '<span style="color: #10b981;"><i class="fas fa-check-circle"></i> Downloaded successfully</span>';
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 3000);
        
    } catch (error) {
        console.error('Error downloading CIN:', error);
        const statusDiv = document.getElementById(`cinStatus-${studentId}`);
        statusDiv.innerHTML = `<span style="color: #ef4444;"><i class="fas fa-exclamation-circle"></i> ${error.message}</span>`;
    } finally {
        const btn = document.getElementById(`downloadCINBtn-${studentId}`);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-download"></i> <span>Download CIN Card</span>';
    }
};

// Load CIN status for a student
window.loadCINStatus = async function(studentId) {
    try {
        const response = await fetch(`/api/student-management/students/${studentId}/cin-status`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const btn = document.getElementById(`downloadCINBtn-${studentId}`);
            const statusDiv = document.getElementById(`cinStatus-${studentId}`);
            
            if (!btn || !statusDiv) return;
            
            if (result.status.hasCIN) {
                btn.disabled = false;
                btn.style.opacity = '1';
                statusDiv.innerHTML = '<span style="color: #10b981;"><i class="fas fa-check-circle"></i> Available</span>';
            } else {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                
                if (result.status.addLater) {
                    statusDiv.innerHTML = '<span style="color: #f59e0b;"><i class="fas fa-clock"></i> Pending Upload</span>';
                } else {
                    statusDiv.innerHTML = '<span style="color: #ef4444;"><i class="fas fa-times-circle"></i> Not Uploaded</span>';
                }
            }
        }
    } catch (error) {
        console.error('Error loading CIN status:', error);
    }
};

// Call loadCINStatus when student profile is opened
// This will be called automatically when the profile modal is shown
window.addEventListener('studentProfileOpened', function(event) {
    if (event.detail && event.detail.studentId) {
        loadCINStatus(event.detail.studentId);
    }
});

// View Payment History (Digital View)
window.viewPaymentHistory = async function(studentId, studentName) {
    try {
        showNotification('📊 Loading payment history...', 'info');
        
        const response = await fetch(`/api/student-management/students/${studentId}/payment-history`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch payment history');
        }
        
        const data = await response.json();
        
        // Create modal for payment history
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'paymentHistoryModal';
        modal.style.zIndex = '10001';
        
        const paymentHistory = data.paymentHistory || [];
        const student = data.student || {};
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1000px; max-height: 85vh; overflow: hidden; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 28px 32px; position: relative;">
                    <button onclick="closePaymentHistoryModal()" style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border: none; color: white; font-size: 20px; cursor: pointer; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
                        <i class="fas fa-times"></i>
                    </button>
                    <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                        <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px;">
                            <i class="fas fa-receipt"></i>
                        </div>
                        <div>
                            <h2 style="margin: 0; font-size: 1.75rem; font-weight: 700;">${t('paymentHistory')}</h2>
                            <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 1rem;">${studentName}</p>
                        </div>
                    </div>
                </div>
                
                <div style="padding: 32px; max-height: calc(85vh - 200px); overflow-y: auto;">
                    <!-- Student Info Cards -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 32px;">
                        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 20px; border-radius: 12px; border: 1px solid #bbf7d0;">
                            <div style="color: #15803d; font-size: 0.813rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">${t('studentNameUpper')}</div>
                            <div style="color: #166534; font-size: 1.125rem; font-weight: 700;">${student.fullName || studentName}</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 20px; border-radius: 12px; border: 1px solid #bfdbfe;">
                            <div style="color: #1e40af; font-size: 0.813rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">${t('languageGroupUpper')}</div>
                            <div style="color: #1e3a8a; font-size: 1.125rem; font-weight: 700;">${Array.isArray(student.formation) ? student.formation.join(', ') : (student.formation || 'N/A')}</div>
                        </div>
                        ${student.branch ? `
                        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; border: 1px solid #fcd34d;">
                            <div style="color: #92400e; font-size: 0.813rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">${t('branchUpper')}</div>
                            <div style="color: #78350f; font-size: 1.125rem; font-weight: 700;">${student.branch}</div>
                        </div>
                        ` : ''}
                        <div style="background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%); padding: 20px; border-radius: 12px; border: 1px solid #99f6e4;">
                            <div style="color: #115e59; font-size: 0.813rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">${t('totalPayments')}</div>
                            <div style="color: #134e4a; font-size: 1.875rem; font-weight: 800;">${paymentHistory.length}</div>
                        </div>
                    </div>
                    
                    <!-- Payment History Table -->
                    ${paymentHistory.length === 0 ? `
                        <div style="text-align: center; padding: 48px 24px; color: #64748b;">
                            <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                            <p style="font-size: 1.125rem; font-weight: 600; margin: 0;">${t('noPaymentHistory')}</p>
                            <p style="margin: 8px 0 0 0; font-size: 0.875rem;"></p>
                        </div>
                    ` : `
                        <!-- Payment Records -->
                        <div style="background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
                            <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); padding: 16px 20px; border-bottom: 2px solid #e5e7eb;">
                                <h3 style="margin: 0; font-size: 1rem; font-weight: 700; color: #1f2937; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-list-ul" style="color: #10b981;"></i>
                                    ${t('paymentHistory')}
                                </h3>
                            </div>
                            <div style="overflow-x: auto;">
                                ${paymentHistory.map((payment, index) => {
                                    const paymentDate = payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('fr-FR') : 'N/A';
                                    const markedDate = payment.markedAsPaidDate ? new Date(payment.markedAsPaidDate).toLocaleDateString('fr-FR') : 'N/A';
                                    
                                    return `
                                        <div style="padding: 20px; border-bottom: 1px solid #f3f4f6; transition: all 0.2s; ${index === paymentHistory.length - 1 ? 'border-bottom: none;' : ''}" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">
                                            <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 20px; align-items: center;">
                                                <!-- Number Badge -->
                                                <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #10b981, #059669); color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.125rem; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);">
                                                    ${index + 1}
                                                </div>
                                                
                                                <!-- Payment Info -->
                                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
                                                    <div>
                                                        <div style="color: #6b7280; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">${t('amount')}</div>
                                                        <div style="color: #10b981; font-size: 1.25rem; font-weight: 800;">${payment.amount || 0} MAD</div>
                                                    </div>
                                                    <div>
                                                        <div style="color: #6b7280; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">${t('date')}</div>
                                                        <div style="color: #1f2937; font-size: 0.938rem; font-weight: 600;">${paymentDate}</div>
                                                    </div>
                                                    <div>
                                                        <div style="color: #6b7280; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">${t('markAsPaid')}</div>
                                                        <div style="color: #1f2937; font-size: 0.938rem; font-weight: 600;">${markedDate}</div>
                                                    </div>
                                                    <div>
                                                        <div style="color: #6b7280; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Admin</div>
                                                        <span style="display: inline-block; background: linear-gradient(135deg, #dbeafe, #bfdbfe); color: #1e40af; padding: 6px 14px; border-radius: 8px; font-size: 0.875rem; font-weight: 700; margin-top: 4px;">
                                                            <i class="fas fa-user-shield" style="margin-right: 6px;"></i>${payment.markedByName || 'Admin'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                        
                        <!-- Summary Stats -->
                        <div style="margin-top: 32px; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
                            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25); position: relative; overflow: hidden;">
                                <div style="position: absolute; top: -10px; right: -10px; width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                                <div style="position: relative; z-index: 1;">
                                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                        <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-coins" style="font-size: 20px;"></i>
                                        </div>
                                        <div style="font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.95;">${t('totalPayments')}</div>
                                    </div>
                                    <div style="font-size: 2rem; font-weight: 800; line-height: 1;">
                                        ${paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()} MAD
                                    </div>
                                </div>
                            </div>
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25); position: relative; overflow: hidden;">
                                <div style="position: absolute; top: -10px; right: -10px; width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                                <div style="position: relative; z-index: 1;">
                                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                        <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-chart-line" style="font-size: 20px;"></i>
                                        </div>
                                        <div style="font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.95;">${t('amount')}</div>
                                    </div>
                                    <div style="font-size: 2rem; font-weight: 800; line-height: 1;">
                                        ${paymentHistory.length > 0 ? Math.round(paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0) / paymentHistory.length).toLocaleString() : 0} MAD
                                    </div>
                                </div>
                            </div>
                            <div style="background: linear-gradient(135deg, #FFCC00 0%, #FF9500 100%); color: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(255, 204, 0, 0.25); position: relative; overflow: hidden;">
                                <div style="position: absolute; top: -10px; right: -10px; width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                                <div style="position: relative; z-index: 1;">
                                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                        <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-hashtag" style="font-size: 20px;"></i>
                                        </div>
                                        <div style="font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.95;">${t('total')}</div>
                                    </div>
                                    <div style="font-size: 2rem; font-weight: 800; line-height: 1;">
                                        ${paymentHistory.length}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `}
                </div>
                
                <!-- Footer -->
                <div style="padding: 20px 32px; background: linear-gradient(to top, #f9fafb, #ffffff); border-top: 1px solid #e5e7eb; display: flex; gap: 12px; justify-content: flex-end; align-items: center;">
                    <button onclick="exportPaymentJournal('${studentId}', '${studentName}');" 
                            style="padding: 12px 24px; background: linear-gradient(135deg, #FFCC00, #FF9500); color: white; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 12px rgba(255, 204, 0, 0.3); transition: all 0.2s; font-size: 0.938rem;"
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(255, 204, 0, 0.4)'"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(255, 204, 0, 0.3)'">
                        <i class="fas fa-file-pdf"></i> ${t('exportPDF')}
                    </button>
                    <button onclick="closePaymentHistoryModal()" 
                            style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 0.938rem;"
                            onmouseover="this.style.background='#4b5563'"
                            onmouseout="this.style.background='#6b7280'">
                        ${t('close')}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        showNotification('✅ Payment history loaded!', 'success');
        
    } catch (error) {
        console.error('Error viewing payment history:', error);
        showNotification('❌ Failed to load payment history: ' + error.message, 'error');
    }
};

// Close payment history modal
window.closePaymentHistoryModal = function() {
    const modal = document.getElementById('paymentHistoryModal');
    if (modal) {
        modal.remove();
    }
};

// Export Payment Journal PDF
window.exportPaymentJournal = async function(studentId, studentName) {
    try {
        showNotification('📄 Generating Payment Journal...', 'info');
        
        const response = await fetch(`/api/student-management/students/${studentId}/payment-journal`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate payment journal');
        }
        
        // Download the PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Payment-Journal-${studentName.replace(/\s+/g, '-')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification('✅ Payment Journal downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error exporting payment journal:', error);
        showNotification('❌ Failed to generate payment journal: ' + error.message, 'error');
    }
};
