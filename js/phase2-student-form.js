// ============================================
// PHASE 2.1: NEW STUDENT FORM & ENHANCED UI
// ============================================

// Global state for form
let studentFormData = {
    fullName: '',
    dateOfBirth: '',
    email: '',
    schoolEmail: '',
    phoneNumber: '',
    parentPhone: '',
    address: '',
    photo: null,
    photoPreview: null,
    formation: [],
    filiere: [],
    season: null,
    group: null,
    status: 'pending'
};

// Open new student form modal
window.openNewStudentForm = function() {
    // Reset form data
    studentFormData = {
        fullName: '',
        dateOfBirth: '',
        email: '',
        schoolEmail: '',
        phoneNumber: '',
        parentPhone: '',
        address: '',
        photo: null,
        photoPreview: null,
        formation: [],
        filiere: [],
        season: null,
        group: null,
        status: 'pending'
    };
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'split-modal active';
    modal.id = 'newStudentModal';
    
    modal.innerHTML = `
        <div class="split-modal-container">
            <!-- Header -->
            <div class="split-modal-header">
                <h2><i class="fas fa-user-plus"></i> Add New Student</h2>
                <button class="split-modal-close" onclick="closeNewStudentForm()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <!-- Body -->
            <div class="split-modal-body">
                <!-- Left Panel: Form -->
                <div class="split-panel-left">
                    <form id="newStudentFormElement" onsubmit="submitNewStudent(event)">
                        
                        <!-- Personal Information -->
                        <div class="form-section">
                            <div class="form-section-header">
                                <div class="form-section-icon">
                                    <i class="fas fa-user"></i>
                                </div>
                                <h3 class="form-section-title">Personal Information</h3>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Full Name <span class="required">*</span></label>
                                    <input type="text" name="fullName" id="studentFullName" required 
                                           placeholder="Enter full name" onkeyup="updatePreview()">
                                </div>
                                <div class="form-group">
                                    <label>Date of Birth <span class="required">*</span></label>
                                    <input type="date" name="dateOfBirth" id="studentDOB" required onchange="updatePreview()">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Email</label>
                                    <input type="email" name="email" id="studentEmail" 
                                           placeholder="student@example.com" onkeyup="updatePreview()">
                                    <span class="helper-text">Optional personal email</span>
                                </div>
                                <div class="form-group">
                                    <label>School Email <span class="required">*</span></label>
                                    <input type="email" name="schoolEmail" id="studentSchoolEmail" 
                                           readonly placeholder="Will be generated from name">
                                    <span class="helper-text">Auto-generated from student's name</span>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Phone Number <span class="required">*</span></label>
                                    <input type="tel" name="phoneNumber" id="studentPhone" required 
                                           placeholder="06XXXXXXXX" onkeyup="updatePreview()">
                                </div>
                                <div class="form-group">
                                    <label>Parent Phone <span class="required">*</span></label>
                                    <input type="tel" name="parentPhone" id="studentParentPhone" required 
                                           placeholder="06XXXXXXXX" onkeyup="updatePreview()">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Address</label>
                                <textarea name="address" id="studentAddress" rows="2" 
                                          placeholder="Optional address" onkeyup="updatePreview()"></textarea>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>CIN (ID Number)</label>
                                    <input type="text" name="cin" id="studentCIN" 
                                           placeholder="National ID number" onkeyup="updatePreview()">
                                    <span class="helper-text">Optional - National ID card number</span>
                                </div>
                                <div class="form-group">
                                    <label>City / District</label>
                                    <input type="text" name="city" id="studentCity" 
                                           placeholder="City or district" onkeyup="updatePreview()">
                                    <span class="helper-text">Ville / Cartier</span>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Study Level (Niveau d'étude)</label>
                                <select name="studyLevel" id="studentStudyLevel" onchange="toggleStudyLevelOther(); updatePreview()">
                                    <option value="">Select level</option>
                                    <option value="Niveau bac">Niveau bac</option>
                                    <option value="Bac">Bac</option>
                                    <option value="Bac+1">Bac+1</option>
                                    <option value="Bac+2">Bac+2</option>
                                    <option value="Bac+3">Bac+3</option>
                                    <option value="Quatrième année">Quatrième année</option>
                                    <option value="Bac+4">Bac+4</option>
                                    <option value="Bac+5">Bac+5</option>
                                    <option value="Master">Master</option>
                                    <option value="Doctorat">Doctorat</option>
                                    <option value="Autre">Autre</option>
                                </select>
                            </div>
                            
                            <div class="form-group" id="studyLevelOtherContainer" style="display: none;">
                                <label>Specify Other Level</label>
                                <input type="text" name="studyLevelOther" id="studentStudyLevelOther" 
                                       placeholder="Please specify" onkeyup="updatePreview()">
                                <span class="helper-text">Required when "Autre" is selected</span>
                            </div>
                        </div>
                        
                        <!-- Photo Upload -->
                        <div class="form-section">
                            <div class="form-section-header">
                                <div class="form-section-icon">
                                    <i class="fas fa-camera"></i>
                                </div>
                                <h3 class="form-section-title">Student Photo</h3>
                            </div>
                            
                            <div class="photo-upload-area" id="photoUploadArea" onclick="document.getElementById('photoInput').click()">
                                <div id="photoPreviewContainer">
                                    <div class="photo-upload-icon">
                                        <i class="fas fa-cloud-upload-alt"></i>
                                    </div>
                                    <p style="margin: 0; color: #64748b; font-weight: 500;">Click to upload photo</p>
                                    <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 0.85rem;">JPG or PNG, max 5MB</p>
                                </div>
                                <input type="file" id="photoInput" name="photo" accept="image/*" 
                                       style="display: none;" onchange="handlePhotoUpload(event)">
                            </div>
                        </div>
                        
                        <!-- CIN Card Upload -->
                        <div class="form-section">
                            <div class="form-section-header">
                                <div class="form-section-icon">
                                    <i class="fas fa-id-card"></i>
                                </div>
                                <h3 class="form-section-title">CIN Card (ID Card)</h3>
                            </div>
                            
                            <div class="cin-upload-instructions" style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px;">
                                <p style="margin: 0; color: #1e40af; font-size: 0.9rem; font-weight: 500;">
                                    <i class="fas fa-info-circle"></i> Upload Instructions:
                                </p>
                                <ul style="margin: 8px 0 0 20px; color: #1e40af; font-size: 0.85rem;">
                                    <li>Scan both front and back sides of the CIN card</li>
                                    <li>Ensure images are clear and readable</li>
                                    <li>Supported formats: JPEG, PNG, PDF (max 2MB per side)</li>
                                    <li>Images will be automatically optimized for storage</li>
                                </ul>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>CIN Front Side</label>
                                    <div class="cin-upload-area" id="cinFrontUploadArea" onclick="document.getElementById('cinFrontInput').click()">
                                        <div id="cinFrontPreviewContainer">
                                            <div class="cin-upload-icon">
                                                <i class="fas fa-id-card"></i>
                                            </div>
                                            <p style="margin: 0; color: #64748b; font-weight: 500;">Front Side</p>
                                            <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 0.85rem;">Click to upload</p>
                                        </div>
                                        <input type="file" id="cinFrontInput" name="cinFront" accept="image/*,application/pdf" 
                                               style="display: none;" onchange="handleCINUpload(event, 'front')">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>CIN Back Side</label>
                                    <div class="cin-upload-area" id="cinBackUploadArea" onclick="document.getElementById('cinBackInput').click()">
                                        <div id="cinBackPreviewContainer">
                                            <div class="cin-upload-icon">
                                                <i class="fas fa-id-card"></i>
                                            </div>
                                            <p style="margin: 0; color: #64748b; font-weight: 500;">Back Side</p>
                                            <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 0.85rem;">Click to upload</p>
                                        </div>
                                        <input type="file" id="cinBackInput" name="cinBack" accept="image/*,application/pdf" 
                                               style="display: none;" onchange="handleCINUpload(event, 'back')">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="cinAddLater" name="cinAddLater" onchange="toggleCINInputs()">
                                    <span>Add now & add later (Student doesn't have CIN today)</span>
                                </label>
                                <span class="helper-text">Check this if the student will provide the CIN card later</span>
                            </div>
                        </div>
                        
                        <!-- Academic Information -->
                        <div class="form-section">
                            <div class="form-section-header">
                                <div class="form-section-icon">
                                    <i class="fas fa-graduation-cap"></i>
                                </div>
                                <h3 class="form-section-title">Academic Information</h3>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Season <span class="required">*</span></label>
                                    <select name="season" id="studentSeason" required onchange="updatePreview(); loadSeasonGroups()">
                                        <option value="">Select Season</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Group <span class="required">*</span></label>
                                    <select name="group" id="studentGroup" required onchange="updatePreview()">
                                        <option value="">Select Season First</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Language Formation (Select all that apply) <span class="required">*</span></label>
                                <div class="checkbox-grid">
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="lang_allemand" name="formation" value="Allemand" onchange="updatePreview()">
                                        <label for="lang_allemand">Allemand (German)</label>
                                    </div>
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="lang_anglais" name="formation" value="Anglais" onchange="updatePreview()">
                                        <label for="lang_anglais">Anglais (English)</label>
                                    </div>
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="lang_francais" name="formation" value="Français" onchange="updatePreview()">
                                        <label for="lang_francais">Français (French)</label>
                                    </div>
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="lang_ausbildung" name="formation" value="Ausbildung" onchange="updatePreview()">
                                        <label for="lang_ausbildung">Ausbildung</label>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Branch/Subject (Filière) - Optional</label>
                                <div class="checkbox-grid">
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="branch_geriatrie" name="filiere" value="Gériatrie" onchange="updatePreview()">
                                        <label for="branch_geriatrie">Gériatrie</label>
                                    </div>
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="branch_aide" name="filiere" value="Aide soignant" onchange="updatePreview()">
                                        <label for="branch_aide">Aide soignant</label>
                                    </div>
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="branch_agent" name="filiere" value="Agent socio éducatif" onchange="updatePreview()">
                                        <label for="branch_agent">Agent socio éducatif</label>
                                    </div>
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="branch_assistante" name="filiere" value="Assistante sociale" onchange="updatePreview()">
                                        <label for="branch_assistante">Assistante sociale</label>
                                    </div>
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="branch_restauration" name="filiere" value="Restauration" onchange="updatePreview()">
                                        <label for="branch_restauration">Restauration</label>
                                    </div>
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="branch_cuisine" name="filiere" value="Cuisine" onchange="updatePreview()">
                                        <label for="branch_cuisine">Cuisine</label>
                                    </div>
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="branch_informatique" name="filiere" value="Informatique" onchange="updatePreview()">
                                        <label for="branch_informatique">Informatique</label>
                                    </div>
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="branch_gestion" name="filiere" value="Gestion hôtelière" onchange="updatePreview()">
                                        <label for="branch_gestion">Gestion hôtelière</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Password Generation -->
                        <div class="form-section">
                            <div class="form-section-header">
                                <div class="form-section-icon">
                                    <i class="fas fa-key"></i>
                                </div>
                                <h3 class="form-section-title">Account Credentials</h3>
                            </div>
                            
                            <div class="form-group">
                                <label>Email Password <span class="required">*</span></label>
                                <div style="display: flex; gap: 12px;">
                                    <input type="text" name="emailPassword" id="studentPassword" required 
                                           placeholder="Click generate to create password" style="flex: 1;">
                                    <button type="button" class="btn-split secondary" onclick="generateStudentPassword()">
                                        <i class="fas fa-key"></i> Generate
                                    </button>
                                </div>
                                <span class="helper-text">Password for student portal login</span>
                            </div>
                        </div>
                        
                        <!-- Pack Selection -->
                        <div class="form-section">
                            <div class="form-section-header">
                                <div class="form-section-icon">
                                    <i class="fas fa-box"></i>
                                </div>
                                <h3 class="form-section-title">Pack</h3>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                                <label style="display: flex; align-items: center; gap: 8px; padding: 12px; border: 2px solid var(--border-color, #e2e8f0); border-radius: 8px; cursor: pointer; transition: all 0.2s;" class="pack-option" data-pack="pm">
                                    <input type="radio" name="paymentPlan" value="pm" checked style="width: 16px; height: 16px;" onchange="handlePackChange(this.value)">
                                    <span style="font-weight: 600;">P.M</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; padding: 12px; border: 2px solid var(--border-color, #e2e8f0); border-radius: 8px; cursor: pointer; transition: all 0.2s;" class="pack-option" data-pack="trimestrial">
                                    <input type="radio" name="paymentPlan" value="trimestrial" style="width: 16px; height: 16px;" onchange="handlePackChange(this.value)">
                                    <span style="font-weight: 600;">Trimestre</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; padding: 12px; border: 2px solid var(--border-color, #e2e8f0); border-radius: 8px; cursor: pointer; transition: all 0.2s;" class="pack-option" data-pack="semestriel">
                                    <input type="radio" name="paymentPlan" value="semestriel" style="width: 16px; height: 16px;" onchange="handlePackChange(this.value)">
                                    <span style="font-weight: 600;">P.Semestriel</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; padding: 12px; border: 2px solid var(--border-color, #e2e8f0); border-radius: 8px; cursor: pointer; transition: all 0.2s;" class="pack-option" data-pack="annuel">
                                    <input type="radio" name="paymentPlan" value="annuel" style="width: 16px; height: 16px;" onchange="handlePackChange(this.value)">
                                    <span style="font-weight: 600;">P.Annuel</span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Payment Information -->
                        <div class="form-section" id="paymentInfoSection">
                            <div class="form-section-header">
                                <div class="form-section-icon">
                                    <i class="fas fa-credit-card"></i>
                                </div>
                                <h3 class="form-section-title">Payment Information</h3>
                            </div>
                            
                            <div id="annualPaymentNotice" style="display: none; padding: 16px; background: rgba(16, 185, 129, 0.1); border: 2px solid #059669; border-radius: 8px; margin-bottom: 16px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <i class="fas fa-star" style="color: #059669; font-size: 1.2rem;"></i>
                                    <div>
                                        <strong style="color: #059669;">Annual Payment (P.Annuel)</strong>
                                        <p style="margin: 4px 0 0; color: #047857; font-size: 0.85rem;">This student pays once for the full 10-month season. No payment reminders will be sent.</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Payment Date <span class="required">*</span></label>
                                    <input type="date" name="paymentDate" id="studentPaymentDate" required>
                                    <span class="helper-text">Next payment due date</span>
                                </div>
                                <div class="form-group">
                                    <label>Payment Amount <span class="required">*</span></label>
                                    <input type="number" name="paymentAmount" id="studentPaymentAmount" required 
                                           min="0" step="0.01" placeholder="0.00">
                                    <span class="helper-text">Amount in local currency</span>
                                </div>
                            </div>
                            
                            <div class="form-group" id="reminderDaysGroup">
                                <label>Reminder Days Before</label>
                                <input type="number" name="reminderDaysBefore" id="studentReminderDays" 
                                       min="1" max="30" value="7" placeholder="7">
                                <span class="helper-text">Send payment reminder X days before due date (default: 7)</span>
                            </div>
                        </div>
                        
                    </form>
                </div>
                
                <!-- Right Panel: Preview -->
                <div class="split-panel-right" id="studentPreviewPanel">
                    <!-- Preview content will be dynamically updated -->
                </div>
            </div>
            
            <!-- Footer -->
            <div class="split-modal-footer">
                <div class="btn-group">
                    <button type="button" class="btn-split danger" onclick="resetNewStudentForm()">
                        <i class="fas fa-redo"></i> Reset Form
                    </button>
                </div>
                <div class="btn-group">
                    <button type="button" class="btn-split secondary" onclick="closeNewStudentForm()">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button type="submit" form="newStudentFormElement" class="btn-split primary">
                        <i class="fas fa-save"></i> Create Student
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Load seasons
    loadSeasonsForForm();
    
    // Initialize preview
    updatePreview();
};

// Close modal
window.closeNewStudentForm = function() {
    const modal = document.getElementById('newStudentModal');
    if (modal) {
        modal.remove();
    }
};

// Reset form
window.resetNewStudentForm = function() {
    if (confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
        document.getElementById('newStudentFormElement').reset();
        studentFormData = {
            fullName: '',
            dateOfBirth: '',
            email: '',
            schoolEmail: '',
            phoneNumber: '',
            parentPhone: '',
            address: '',
            photo: null,
            photoPreview: null,
            formation: [],
            filiere: [],
            season: null,
            group: null,
            status: 'pending'
        };
        updatePreview();
    }
};

// Load seasons for dropdown
async function loadSeasonsForForm() {
    try {
        const response = await fetch('/api/seasons', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load seasons');
        
        const seasons = await response.json();
        const select = document.getElementById('studentSeason');
        
        select.innerHTML = '<option value="">Select Season</option>';
        seasons.forEach(season => {
            const option = document.createElement('option');
            option.value = season._id;
            option.textContent = `${season.name} (${season.status})`;
            option.dataset.name = season.name;
            if (season.status === 'active') {
                option.selected = true;
                loadSeasonGroups();
            }
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading seasons:', error);
    }
}

// Load groups for selected season
async function loadSeasonGroups() {
    const seasonSelect = document.getElementById('studentSeason');
    const groupSelect = document.getElementById('studentGroup');
    const seasonId = seasonSelect.value;
    
    if (!seasonId) {
        groupSelect.innerHTML = '<option value="">Select Season First</option>';
        return;
    }
    
    try {
        const response = await fetch(`/api/student-management/groups?season=${seasonId}&status=active`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load groups');
        
        const data = await response.json();
        const groups = data.success ? data.groups : (Array.isArray(data) ? data : []);
        
        groupSelect.innerHTML = '<option value="">Select Group</option>';
        
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group._id;
            option.textContent = `${group.name} (${group.currentStudentCount || 0}/${group.maxStudents})`;
            option.dataset.name = group.name;
            groupSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading groups:', error);
        groupSelect.innerHTML = '<option value="">Error loading groups</option>';
    }
}

// Handle photo upload
window.handlePhotoUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        event.target.value = '';
        return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG or PNG)');
        event.target.value = '';
        return;
    }
    
    // Read and preview
    const reader = new FileReader();
    reader.onload = function(e) {
        studentFormData.photo = file;
        studentFormData.photoPreview = e.target.result;
        
        // Update upload area
        const uploadArea = document.getElementById('photoUploadArea');
        uploadArea.classList.add('has-photo');
        
        const previewContainer = document.getElementById('photoPreviewContainer');
        previewContainer.innerHTML = `
            <img src="${e.target.result}" class="photo-preview" alt="Student Photo">
            <p style="margin: 0; color: #10b981; font-weight: 600;">
                <i class="fas fa-check-circle"></i> Photo uploaded
            </p>
            <p style="margin: 8px 0 0 0; color: #64748b; font-size: 0.85rem;">Click to change</p>
        `;
        
        updatePreview();
    };
    reader.readAsDataURL(file);
};

// Handle pack change - show annual notice for P.Annuel, hide reminder for annual
window.handlePackChange = function(value) {
    const reminderGroup = document.getElementById('reminderDaysGroup');
    const annualNotice = document.getElementById('annualPaymentNotice');
    
    if (value === 'annuel') {
        // Annual payment - hide reminder, show notice
        if (reminderGroup) reminderGroup.style.display = 'none';
        if (annualNotice) annualNotice.style.display = 'block';
    } else {
        if (reminderGroup) reminderGroup.style.display = 'block';
        if (annualNotice) annualNotice.style.display = 'none';
    }
};

// Generate password
window.generateStudentPassword = function() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    document.getElementById('studentPassword').value = password;
};

// Update preview panel
window.updatePreview = function() {
    // Get form values
    const fullName = document.getElementById('studentFullName')?.value || '';
    const email = document.getElementById('studentEmail')?.value || '';
    const phoneNumber = document.getElementById('studentPhone')?.value || '';
    const parentPhone = document.getElementById('studentParentPhone')?.value || '';
    const seasonSelect = document.getElementById('studentSeason');
    const groupSelect = document.getElementById('studentGroup');
    
    // Generate school email
    if (fullName) {
        const emailPrefix = fullName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
        const schoolEmail = `${emailPrefix}@nisrineschool.com`;
        document.getElementById('studentSchoolEmail').value = schoolEmail;
        studentFormData.schoolEmail = schoolEmail;
    }
    
    // Get selected formations
    const formations = Array.from(document.querySelectorAll('input[name="formation"]:checked'))
        .map(cb => cb.value);
    const filieres = Array.from(document.querySelectorAll('input[name="filiere"]:checked'))
        .map(cb => cb.value);
    
    studentFormData.fullName = fullName;
    studentFormData.email = email;
    studentFormData.phoneNumber = phoneNumber;
    studentFormData.parentPhone = parentPhone;
    studentFormData.formation = formations;
    studentFormData.filiere = filieres;
    studentFormData.season = seasonSelect?.value || null;
    studentFormData.group = groupSelect?.value || null;
    
    // Get season and group names
    const seasonName = seasonSelect?.selectedOptions[0]?.dataset.name || '';
    const groupName = groupSelect?.selectedOptions[0]?.dataset.name || '';
    
    // Update preview panel
    const previewPanel = document.getElementById('studentPreviewPanel');
    if (!previewPanel) return;
    
    const initial = fullName ? fullName.charAt(0).toUpperCase() : '?';
    const hasPhoto = studentFormData.photoPreview;
    
    previewPanel.innerHTML = `
        <!-- Profile Card -->
        <div class="preview-card">
            <div class="preview-avatar">
                ${hasPhoto ? `<img src="${studentFormData.photoPreview}" alt="Student">` : initial}
            </div>
            <div class="preview-name">${fullName || 'Student Name'}</div>
            <div class="preview-email">${studentFormData.schoolEmail || 'email@nisrineschool.com'}</div>
            
            <div class="preview-status ${fullName ? 'pending' : 'pending'}">
                <i class="fas fa-clock"></i>
                <span>Pending Approval</span>
            </div>
        </div>
        
        <!-- Contact Information -->
        <div class="preview-section">
            <div class="preview-section-title">Contact Information</div>
            <div class="preview-item">
                <i class="fas fa-envelope"></i>
                <span>${email || 'No personal email'}</span>
            </div>
            <div class="preview-item">
                <i class="fas fa-phone"></i>
                <span>${phoneNumber || 'No phone number'}</span>
            </div>
            <div class="preview-item">
                <i class="fas fa-user-friends"></i>
                <span>${parentPhone || 'No parent phone'}</span>
            </div>
        </div>
        
        <!-- Academic Information -->
        <div class="preview-section">
            <div class="preview-section-title">Academic Information</div>
            <div class="preview-item">
                <i class="fas fa-calendar-alt"></i>
                <span>${seasonName || 'No season selected'}</span>
            </div>
            <div class="preview-item">
                <i class="fas fa-users"></i>
                <span>${groupName || 'No group selected'}</span>
            </div>
        </div>
        
        <!-- Selected Formations -->
        ${formations.length > 0 ? `
        <div class="preview-section">
            <div class="preview-section-title">Language Formations</div>
            <div>
                ${formations.map(f => `<span class="preview-badge language">${f}</span>`).join('')}
            </div>
        </div>
        ` : ''}
        
        ${filieres.length > 0 ? `
        <div class="preview-section">
            <div class="preview-section-title">Branch/Subject (Filière)</div>
            <div>
                ${filieres.map(f => `<span class="preview-badge branch">${f}</span>`).join('')}
            </div>
        </div>
        ` : ''}
        
        <!-- Quick Stats -->
        <div class="preview-section">
            <div class="preview-section-title">Quick Summary</div>
            <div class="preview-item">
                <i class="fas fa-check-circle" style="color: ${fullName ? '#10b981' : '#94a3b8'}"></i>
                <span>Personal Info: ${fullName ? 'Complete' : 'Incomplete'}</span>
            </div>
            <div class="preview-item">
                <i class="fas fa-check-circle" style="color: ${formations.length > 0 ? '#10b981' : '#94a3b8'}"></i>
                <span>Languages: ${formations.length > 0 ? 'Selected' : 'Not selected'}</span>
            </div>
            <div class="preview-item">
                <i class="fas fa-check-circle" style="color: ${studentFormData.season && studentFormData.group ? '#10b981' : '#94a3b8'}"></i>
                <span>Assignment: ${studentFormData.season && studentFormData.group ? 'Complete' : 'Incomplete'}</span>
            </div>
        </div>
    `;
};

// Submit form
window.submitNewStudent = async function(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    // Get selected formations and filieres
    const formations = Array.from(document.querySelectorAll('input[name="formation"]:checked'))
        .map(cb => cb.value);
    const filieres = Array.from(document.querySelectorAll('input[name="filiere"]:checked'))
        .map(cb => cb.value);
    
    // Validate at least one language selected
    if (formations.length === 0) {
        alert('Please select at least one language formation');
        return;
    }
    
    // Get study level - use "Other" text if "Autre" is selected
    let studyLevel = formData.get('studyLevel');
    if (studyLevel === 'Autre') {
        const studyLevelOther = formData.get('studyLevelOther');
        if (!studyLevelOther || studyLevelOther.trim() === '') {
            alert('Please specify the study level when selecting "Autre"');
            return;
        }
        studyLevel = studyLevelOther.trim();
    }
    
    // Prepare data
    const data = {
        fullName: formData.get('fullName'),
        dateOfBirth: formData.get('dateOfBirth'),
        email: formData.get('email'),
        schoolEmail: formData.get('schoolEmail'),
        phoneNumber: formData.get('phoneNumber'),
        parentPhone: formData.get('parentPhone'),
        address: formData.get('address'),
        cin: formData.get('cin'),
        city: formData.get('city'),
        studyLevel: studyLevel,
        emailPassword: formData.get('emailPassword'),
        formation: formations,
        filiere: filieres,
        season: formData.get('season'),
        group: formData.get('group'),
        paymentDate: formData.get('paymentDate'),
        paymentAmount: formData.get('paymentAmount'),
        paymentPlan: formData.get('paymentPlan') || 'pm',
        reminderDaysBefore: formData.get('reminderDaysBefore') || '7',
        status: 'active'
    };
    
    try {
        // Show loading
        const modal = document.querySelector('.split-modal-container');
        modal.style.position = 'relative';
        const loading = document.createElement('div');
        loading.className = 'form-loading';
        loading.innerHTML = '<div class="spinner"></div>';
        modal.appendChild(loading);
        
        // Create FormData for file upload
        const submitData = new FormData();
        Object.keys(data).forEach(key => {
            if (Array.isArray(data[key])) {
                data[key].forEach(val => submitData.append(key, val));
            } else {
                submitData.append(key, data[key]);
            }
        });
        
        // Add photo if exists
        if (studentFormData.photo) {
            submitData.append('photo', studentFormData.photo);
        }
        
        // Add CIN card files if exist
        if (studentFormData.cinCard) {
            if (studentFormData.cinCard.front) {
                submitData.append('cinFront', studentFormData.cinCard.front);
            }
            if (studentFormData.cinCard.back) {
                submitData.append('cinBack', studentFormData.cinCard.back);
            }
        }
        
        // Add cinAddLater flag
        const cinAddLater = document.getElementById('cinAddLater')?.checked || false;
        submitData.append('cinAddLater', cinAddLater);
        
        const response = await fetch('/api/student-management/students', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: submitData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create student');
        }
        
        const result = await response.json();
        
        // Success
        showNotification('Student created successfully!', 'success');
        closeNewStudentForm();
        
        // Reload students list
        if (typeof loadStudents === 'function') {
            loadStudents();
        }
        
    } catch (error) {
        console.error('Error creating student:', error);
        showNotification(error.message || 'Failed to create student', 'error');
        
        // Remove loading
        const loading = document.querySelector('.form-loading');
        if (loading) loading.remove();
    }
};

// Toggle study level "Other" text field
window.toggleStudyLevelOther = function() {
    const studyLevel = document.getElementById('studentStudyLevel').value;
    const otherContainer = document.getElementById('studyLevelOtherContainer');
    const otherInput = document.getElementById('studentStudyLevelOther');
    
    if (studyLevel === 'Autre') {
        otherContainer.style.display = 'block';
        otherInput.required = true;
    } else {
        otherContainer.style.display = 'none';
        otherInput.required = false;
        otherInput.value = '';
    }
};

// Handle CIN card upload
window.handleCINUpload = function(event, side) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        event.target.value= '';
        return;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a JPEG, PNG, or PDF file');
        event.target.value= '';
        return;
    }
    
    // Store file in global state
    if (!studentFormData.cinCard) {
        studentFormData.cinCard = {};
    }
    studentFormData.cinCard[side] = file;
    
    // Show preview
    const previewContainer = document.getElementById(`cin${side.charAt(0).toUpperCase() + side.slice(1)}PreviewContainer`);
    const reader = new FileReader();
    
    reader.onload = function(e) {
        if (file.type === 'application/pdf') {
            previewContainer.innerHTML = `
                <div style="text-align: center;">
                    <i class="fas fa-file-pdf" style="font-size: 48px; color: #ef4444;"></i>
                    <p style="margin: 8px 0 0 0; color: #64748b; font-weight: 500;">${file.name}</p>
                    <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 0.85rem;">${(file.size / 1024).toFixed(2)} KB</p>
                    <button type="button" onclick="removeCINUpload('${side}')" style="margin-top: 8px; padding: 4px 12px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-times"></i> Remove
                    </button>
                </div>
            `;
        } else {
            previewContainer.innerHTML = `
                <div style="position: relative;">
                    <img src="${e.target.result}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;">
                    <button type="button" onclick="removeCINUpload('${side}')" style="position: absolute; top: 8px; right: 8px; padding: 4px 8px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-times"></i>
                    </button>
                    <p style="margin: 8px 0 0 0; color: #64748b; font-size: 0.85rem; text-align: center;">${(file.size / 1024).toFixed(2)} KB</p>
                </div>
            `;
        }
    };
    
    reader.readAsDataURL(file);
};

// Remove CIN upload
window.removeCINUpload = function(side) {
    // Clear file input
    const input = document.getElementById(`cin${side.charAt(0).toUpperCase() + side.slice(1)}Input`);
    input.value = '';
    
    // Clear from global state
    if (studentFormData.cinCard) {
        delete studentFormData.cinCard[side];
    }
    
    // Reset preview
    const previewContainer = document.getElementById(`cin${side.charAt(0).toUpperCase() + side.slice(1)}PreviewContainer`);
    previewContainer.innerHTML = `
        <div class="cin-upload-icon">
            <i class="fas fa-id-card"></i>
        </div>
        <p style="margin: 0; color: #64748b; font-weight: 500;">${side.charAt(0).toUpperCase() + side.slice(1)} Side</p>
        <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 0.85rem;">Click to upload</p>
    `;
};

// Toggle CIN inputs when "Add Later" is checked
window.toggleCINInputs = function() {
    const addLater = document.getElementById('cinAddLater').checked;
    const frontInput = document.getElementById('cinFrontInput');
    const backInput = document.getElementById('cinBackInput');
    const frontArea = document.getElementById('cinFrontUploadArea');
    const backArea = document.getElementById('cinBackUploadArea');
    
    if (addLater) {
        frontInput.disabled = true;
        backInput.disabled = true;
        frontArea.style.opacity = '0.5';
        backArea.style.opacity = '0.5';
        frontArea.style.pointerEvents = 'none';
        backArea.style.pointerEvents = 'none';
        
        // Clear any uploaded files
        removeCINUpload('front');
        removeCINUpload('back');
    } else {
        frontInput.disabled = false;
        backInput.disabled = false;
        frontArea.style.opacity = '1';
        backArea.style.opacity = '1';
        frontArea.style.pointerEvents = 'auto';
        backArea.style.pointerEvents = 'auto';
    }
};
