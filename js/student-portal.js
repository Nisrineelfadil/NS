// API Base URL
const API_URL = '/api/grades';

// Helper function to validate photo path
function isValidPhotoPath(photoPath) {
    if (!photoPath) return false;
    if (photoPath.includes('undefined') || photoPath.includes('null')) return false;
    return true;
}

// Check if user is logged in
let token = localStorage.getItem('studentToken');
let studentData = null;

// Translations
let translations = {};
let currentLang = localStorage.getItem('language') || 'de';

// Inactivity Timer - Auto logout after 15 minutes of inactivity
let inactivityTimer = null;
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

function resetInactivityTimer() {
    // Clear existing timer
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
    
    // Only set timer if user is logged in
    if (token) {
        inactivityTimer = setTimeout(() => {
            alert('You have been logged out due to inactivity.');
            logout();
        }, INACTIVITY_TIMEOUT);
    }
}

// Track user activity
function setupActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
        document.addEventListener(event, resetInactivityTimer, true);
    });
}

// Initialize activity tracking
setupActivityListeners();

// Load translations
async function loadTranslations() {
    try {
        const response = await fetch('/translations/translations.json');
        translations = await response.json();
        applyTranslations();
    } catch (error) {
        console.error('Error loading translations:', error);
        // Fallback to English if translations fail to load
        currentLang = 'en';
    }
}

// Get translation text
function t(path) {
    const keys = path.split('.');
    let value = translations[currentLang];
    
    for (const key of keys) {
        if (value && value[key]) {
            value = value[key];
        } else {
            // Fallback to English
            value = translations['en'];
            for (const k of keys) {
                if (value && value[k]) {
                    value = value[k];
                } else {
                    return path; // Return path if not found
                }
            }
            break;
        }
    }
    
    return value;
}

// Apply translations to the page
function applyTranslations() {
    // Login page
    document.querySelector('.login-box h2').textContent = t('login.title');
    document.querySelector('.login-box p').textContent = t('login.subtitle');
    document.querySelector('label[for="loginEmail"]').textContent = t('login.email');
    document.querySelector('label[for="loginPassword"]').textContent = t('login.password');
    document.getElementById('loginEmail').placeholder = t('login.emailPlaceholder');
    document.getElementById('loginPassword').placeholder = t('login.passwordPlaceholder');
    document.querySelector('.login-btn').innerHTML = `<i class="fas fa-sign-in-alt"></i> ${t('login.loginButton')}`;
    
    // Header
    document.querySelector('.logo h1').textContent = t('header.title');
    document.querySelector('.messages-btn span').textContent = t('header.messages');
    document.querySelector('.logout-btn').innerHTML = `<i class="fas fa-sign-out-alt"></i> ${t('header.logout')}`;
    
    // Stats cards
    document.querySelectorAll('.stat-card')[0].querySelector('h3').textContent = t('stats.totalGrades');
    document.querySelectorAll('.stat-card')[1].querySelector('h3').textContent = t('stats.averageScore');
    const paymentCard = document.getElementById('paymentStatusCard');
    if (paymentCard) {
        paymentCard.querySelector('h3').textContent = t('stats.paymentStatus');
    }
    
    // Subject tabs
    document.querySelector('#tabAll span').textContent = t('tabs.allSubjects');
    document.querySelector('#tabLanguages span').textContent = t('tabs.languages');
    document.querySelector('#tabBranches span').textContent = t('tabs.branches');
    
    // Filters
    document.querySelector('.filters h3').innerHTML = `<i class="fas fa-filter"></i> ${t('filters.title')}`;
    document.querySelector('label[for="filterFormation"]').textContent = t('filters.languageFormation');
    document.querySelector('label[for="filterBranch"]').textContent = t('filters.branchFormation');
    document.querySelector('label[for="filterLevel"]').textContent = t('filters.languageLevel');
    document.querySelector('label[for="filterTestType"]').textContent = t('filters.testType');
    document.querySelector('label[for="filterSemester"]').textContent = t('filters.semester');
    document.querySelector('label[for="filterYear"]').textContent = t('filters.academicYear');
    
    // Filter options
    document.querySelector('#filterFormation option[value=""]').textContent = t('filters.allLanguages');
    document.querySelector('#filterBranch option[value=""]').textContent = t('filters.allBranches');
    document.querySelector('#filterLevel option[value=""]').textContent = t('filters.allLevels');
    document.querySelector('#filterTestType option[value=""]').textContent = t('filters.allTests');
    document.querySelector('#filterTestType option[value="miniTest"]').textContent = t('filters.miniTests');
    document.querySelector('#filterTestType option[value="finalExam"]').textContent = t('filters.finalExams');
    document.querySelector('#filterSemester option[value=""]').textContent = t('filters.allSemesters');
    document.querySelector('#filterSemester option[value="Semester 1"]').textContent = t('filters.semester1');
    document.querySelector('#filterSemester option[value="Semester 2"]').textContent = t('filters.semester2');
    document.querySelector('#filterYear option[value=""]').textContent = t('filters.allYears');
    
    // Grades section
    document.querySelector('.grades-section h2').innerHTML = `<i class="fas fa-chart-bar"></i> ${t('grades.title')}`;
    
    // Messages panel
    document.querySelector('.messages-header h3').innerHTML = `<i class="fas fa-paper-plane"></i> ${t('messages.title')}`;
    document.querySelector('.clear-messages-btn').innerHTML = `<i class="fas fa-trash-alt"></i> ${t('messages.clearAll')}`;
    
    // Settings modal
    document.querySelector('.settings-header h2').innerHTML = `<i class="fas fa-cog"></i> ${t('settings.title')}`;
    document.querySelector('.setting-item label').innerHTML = `<i class="fas fa-language"></i> ${t('settings.language')}`;
    document.querySelectorAll('.setting-item')[1].querySelector('label').innerHTML = `<i class="fas fa-palette"></i> ${t('settings.theme')}`;
    document.querySelector('.theme-option.dark span').textContent = t('settings.dark');
    document.querySelector('.theme-option.light span').textContent = t('settings.light');
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadTranslations();
    
    if (token) {
        loadStudentProfile();
    } else {
        showLoginPage();
    }
});

// Show login page
function showLoginPage() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('mainPortal').classList.add('hidden');
}

// Show main portal
function showMainPortal() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('mainPortal').classList.remove('hidden');
}

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        const response = await fetch(`${API_URL}/student/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            token = data.token;
            studentData = data.student;
            localStorage.setItem('studentToken', token);
            localStorage.setItem('studentData', JSON.stringify(studentData));
            
            resetInactivityTimer(); // Start inactivity timer on login
            showMainPortal();
            loadStudentProfile();
        } else {
            // Display error message and stay on login page
            errorDiv.textContent = data.error || data.message || 'Invalid email or password';
            errorDiv.style.display = 'block';
            // Clear password field for security
            document.getElementById('loginPassword').value = '';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'An error occurred. Please try again.';
        errorDiv.style.display = 'block';
        // Clear password field for security
        document.getElementById('loginPassword').value = '';
    }
});

// Load student profile
async function loadStudentProfile() {
    try {
        const response = await fetch(`${API_URL}/student/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            studentData = await response.json();
            localStorage.setItem('studentData', JSON.stringify(studentData));
            
            // Update UI
            document.getElementById('userName').textContent = studentData.fullName;
            document.getElementById('userEmail').textContent = studentData.schoolEmail;
            
            // Update avatar
            const avatarDiv = document.getElementById('userAvatar');
            if (isValidPhotoPath(studentData.photoPath)) {
                avatarDiv.innerHTML = `<img src="${studentData.photoPath}" alt="Profile">`;
            } else {
                avatarDiv.innerHTML = `<i class="fas fa-user"></i>`;
            }
            
            // Populate formation filter
            const formationFilter = document.getElementById('filterFormation');
            formationFilter.innerHTML = '<option value="">All Languages</option>';
            if (studentData.formation && Array.isArray(studentData.formation)) {
                studentData.formation.forEach(formation => {
                    const option = document.createElement('option');
                    option.value = formation;
                    option.textContent = formation;
                    formationFilter.appendChild(option);
                });
            }
            
            // Populate branch filter
            const branchFilter = document.getElementById('filterBranch');
            branchFilter.innerHTML = '<option value="">All Branches</option>';
            if (studentData.filiere && Array.isArray(studentData.filiere)) {
                studentData.filiere.forEach(branch => {
                    const option = document.createElement('option');
                    option.value = branch;
                    option.textContent = branch;
                    branchFilter.appendChild(option);
                });
            }
            
            // Populate year filter
            populateYearFilter();
            
            // Load grades
            loadGrades();
            
            // Load payment status
            loadPaymentStatus();
            
            // Load message count for badge
            checkNewMessages();
            
            resetInactivityTimer(); // Start timer when profile loads
            showMainPortal();
        } else {
            logout();
        }
    } catch (error) {
        console.error('Load profile error:', error);
        logout();
    }
}

// Load payment status
async function loadPaymentStatus() {
    try {
        const response = await fetch(`${API_URL}/student/payment-status`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayPaymentStatus(data);
        }
    } catch (error) {
        console.error('Error loading payment status:', error);
    }
}

// Display payment status
function displayPaymentStatus(data) {
    if (!data || !data.student) return;
    
    const student = data.student;
    const paymentDate = new Date(student.paymentDate);
    const now = new Date();
    // Set time to start of day for accurate comparison
    paymentDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const daysUntilPayment = Math.ceil((paymentDate - now) / (1000 * 60 * 60 * 24));
    
    const paymentStatusCard = document.getElementById('paymentStatusCard');
    const paymentStatus = document.getElementById('paymentStatus');
    const paymentReminderSection = document.getElementById('paymentReminderSection');
    const paymentReminderText = document.getElementById('paymentReminderText');
    const paymentDueDate = document.getElementById('paymentDueDate');
    const paymentAmount = document.getElementById('paymentAmount');
    
    // Hide reminder section by default
    paymentReminderSection.style.display = 'none';
    
    // Show payment status based on status
    if (student.paymentStatus === 'paid') {
        paymentStatusCard.style.display = 'flex';
        paymentStatusCard.querySelector('.stat-icon').style.background = 'linear-gradient(135deg, #10b981, #059669)';
        paymentStatusCard.querySelector('.stat-icon i').className = 'fas fa-check-circle';
        paymentStatus.textContent = 'Paid ✓';
        paymentStatus.style.color = '#10b981';
        
        // Calculate and show next payment date
        const nextPaymentDate = new Date(paymentDate);
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        const daysUntilNext = Math.ceil((nextPaymentDate - now) / (1000 * 60 * 60 * 24));
        
        // Show next payment info
        paymentReminderSection.style.display = 'block';
        paymentReminderText.innerHTML = `
            <strong style="color: #10b981; font-size: 16px;">✅ Payment Received - Thank You!</strong>
            <br><br>
            Your current payment has been successfully processed. We appreciate your prompt payment.
            <br><br>
            <strong style="color: #FFCC00;">📅 NEXT PAYMENT SCHEDULE:</strong>
            <br><br>
            <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05)); padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin: 10px 0;">
                <i class="fas fa-calendar-check" style="color: #10b981;"></i> 
                <strong style="color: #10b981;">Next Payment Due:</strong> ${nextPaymentDate.toLocaleDateString()}
                <br>
                <i class="fas fa-clock" style="color: #10b981;"></i> 
                <strong style="color: #10b981;">${daysUntilNext} day${daysUntilNext !== 1 ? 's' : ''} remaining</strong>
            </div>
            <br>
            <em style="color: #aaa;">You will receive a reminder 7 days before your next payment is due.</em>
        `;
        paymentDueDate.textContent = `Current Payment: ${paymentDate.toLocaleDateString()} (Paid)`;
        paymentAmount.textContent = `Amount: ${student.paymentAmount} MAD`;
    } else if (student.paymentStatus === 'overdue' || daysUntilPayment < 0) {
        // Show overdue if status is overdue OR if payment date has passed
        paymentStatusCard.style.display = 'flex';
        paymentStatusCard.querySelector('.stat-icon').style.background = 'linear-gradient(135deg, #ff4757, #ff6348)';
        paymentStatusCard.querySelector('.stat-icon i').className = 'fas fa-exclamation-circle';
        paymentStatus.textContent = 'Overdue!';
        paymentStatus.style.color = '#ff4757';
        
        // Show reminder section for overdue with strong warning
        paymentReminderSection.style.display = 'block';
        paymentReminderText.innerHTML = `
            <strong style="color: #ff4757; font-size: 16px;">⚠️ URGENT: PAYMENT OVERDUE</strong>
            <br><br>
            Your tuition payment is now <strong>OVERDUE</strong>. This is a serious matter that requires your immediate attention.
            <br><br>
            <strong style="color: #ff6348;">⛔ CONSEQUENCES OF NON-PAYMENT:</strong>
            <br>
            If payment is not received within the next few days, the following actions will be taken:
            <br><br>
            • <strong>Immediate suspension</strong> of your student account<br>
            • <strong>Loss of access</strong> to all classes and course materials<br>
            • <strong>Inability to take exams</strong> or receive grades<br>
            • <strong>Removal from class rosters</strong> and student records<br>
            • <strong>Cancellation of enrollment</strong> for the current semester<br>
            • <strong>Legal action</strong> may be pursued to recover outstanding fees<br>
            <br>
            <strong style="color: #FFCC00;">💰 IMMEDIATE ACTION REQUIRED:</strong>
            <br>
            Please visit the administration office <strong>TODAY</strong> during working hours (Monday-Friday, 9:00 AM - 5:00 PM) to settle your payment immediately.
            <br><br>
            <strong>📞 Contact us immediately if you need assistance or wish to discuss payment arrangements.</strong>
            <br><br>
            <em style="color: #aaa;">Failure to respond to this notice may result in permanent suspension from Nisrine School.</em>
        `;
        paymentDueDate.textContent = `Due Date: ${paymentDate.toLocaleDateString()}`;
        paymentAmount.textContent = `Amount: ${student.paymentAmount} MAD`;
    } else if (student.paymentStatus === 'pending' && daysUntilPayment <= 7 && daysUntilPayment >= 0) {
        // Show warning for pending payments due within 7 days
        paymentStatusCard.style.display = 'flex';
        paymentStatusCard.querySelector('.stat-icon').style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        paymentStatusCard.querySelector('.stat-icon i').className = 'fas fa-clock';
        paymentStatus.textContent = `Due in ${daysUntilPayment} day${daysUntilPayment !== 1 ? 's' : ''}`;
        paymentStatus.style.color = '#f59e0b';
        
        // Show reminder section for pending payments due soon
        paymentReminderSection.style.display = 'block';
        paymentReminderText.textContent = `📅 Your payment is due soon. Please prepare to settle your financial obligations by the due date.`;
        paymentDueDate.textContent = `Due Date: ${paymentDate.toLocaleDateString()}`;
        paymentAmount.textContent = `Amount: ${student.paymentAmount} MAD`;
    }
}

// Populate year filter with current season
async function populateYearFilter() {
    const yearFilter = document.getElementById('filterYear');
    
    try {
        // Fetch current season from backend
        const response = await fetch('/api/seasons/current');
        
        if (response.ok) {
            const season = await response.json();
            console.log('📅 Current season loaded:', season.name);
            
            yearFilter.innerHTML = `
                <option value="${season.name}" selected>${season.name} (Current Season)</option>
            `;
            
            // Disable the select since we only show current season
            yearFilter.disabled = true;
            yearFilter.style.cursor = 'not-allowed';
            yearFilter.style.opacity = '0.8';
            
            // Add helper text
            const helperText = document.createElement('small');
            helperText.style.color = '#10b981';
            helperText.style.fontSize = '11px';
            helperText.style.display = 'block';
            helperText.style.marginTop = '4px';
            helperText.textContent = t('filters.autoSet');
            yearFilter.parentElement.appendChild(helperText);
        } else {
            // Fallback to manual year selection
            console.warn('No active season found, using fallback');
            populateYearFilterFallback();
        }
    } catch (error) {
        console.error('Error fetching current season:', error);
        populateYearFilterFallback();
    }
}

// Fallback function for year filter
function populateYearFilterFallback() {
    const yearFilter = document.getElementById('filterYear');
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    yearFilter.innerHTML = `<option value="">${t('filters.allYears')}</option>`;
    
    // Generate last 3 academic years
    for (let i = 0; i < 3; i++) {
        let startYear = currentYear - i;
        if (currentMonth < 8) {
            startYear--;
        }
        const academicYear = `${startYear}-${startYear + 1}`;
        const option = document.createElement('option');
        option.value = academicYear;
        option.textContent = academicYear;
        if (i === 0) {
            option.selected = true;
        }
        yearFilter.appendChild(option);
    }
}

// Load grades
async function loadGrades() {
    const gradesContent = document.getElementById('gradesContent');
    gradesContent.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner"></i>
            <p>${t('grades.loading')}</p>
        </div>
    `;
    
    try {
        const formation = document.getElementById('filterFormation').value;
        const branch = document.getElementById('filterBranch').value;
        const semester = document.getElementById('filterSemester').value;
        const academicYear = document.getElementById('filterYear').value;
        
        console.log('🔍 Filter values:', { formation, branch, semester, academicYear });
        
        let url = `${API_URL}/student/grades?`;
        if (formation) url += `formation=${formation}&`;
        if (branch) url += `branch=${branch}&`;
        if (semester) url += `semester=${semester}&`;
        if (academicYear) url += `academicYear=${academicYear}&`;
        
        console.log('📡 Request URL:', url);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Grades received:', data.grades.length, 'grades');
            console.log('📊 Grades data:', data.grades);
            displayGrades(data.grades, data.stats);
        } else {
            gradesContent.innerHTML = `
                <div class="no-grades">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>${t('grades.errorLoading')}</h3>
                    <p>${t('grades.errorMessage')}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Load grades error:', error);
        gradesContent.innerHTML = `
            <div class="no-grades">
                <i class="fas fa-exclamation-circle"></i>
                <h3>${t('grades.errorLoading')}</h3>
                <p>${t('grades.errorMessage')}</p>
            </div>
        `;
    }
}

// Display grades
function displayGrades(grades, stats) {
    const gradesContent = document.getElementById('gradesContent');
    
    // Update stats
    document.getElementById('totalGrades').textContent = stats.totalGrades;
    document.getElementById('averageScore').textContent = stats.averageScore + '%';
    
    // Check if a branch filter is active
    const branch = document.getElementById('filterBranch').value;
    const formation = document.getElementById('filterFormation').value;
    
    if (grades.length === 0) {
        let message = t('grades.noGradesMessage');
        if (branch) {
            message = `No ${branch} grades have been uploaded yet. Please check back later.`;
        } else if (formation) {
            message = `No ${formation} grades have been uploaded yet. Please check back later.`;
        }
        
        gradesContent.innerHTML = `
            <div class="no-grades">
                <i class="fas fa-clipboard-list"></i>
                <h3>${t('grades.noGrades')}</h3>
                <p>${message}</p>
            </div>
        `;
        return;
    }
    
    const languageFormations = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];
    
    // Group grades by formation and level/semester
    const groupedGrades = {};
    grades.forEach(grade => {
        let key;
        if (languageFormations.includes(grade.formation) && grade.languageLevel) {
            // Language grades: group by formation and level
            key = `${grade.formation} - Level ${grade.languageLevel}`;
        } else {
            // Branch grades: group by formation and semester
            key = `${grade.formation} - ${grade.semester} (${grade.academicYear})`;
        }
        if (!groupedGrades[key]) {
            groupedGrades[key] = [];
        }
        groupedGrades[key].push(grade);
    });
    
    let html = '';
    
    Object.keys(groupedGrades).forEach(key => {
        const gradesList = groupedGrades[key];
        const isLanguage = languageFormations.includes(gradesList[0].formation) && gradesList[0].languageLevel;
        
        html += `
            <div style="margin-bottom: 40px;">
                <h3 style="color: #FFCC00; margin-bottom: 20px; font-size: 20px;">
                    <i class="fas fa-book"></i> ${key}
                </h3>
                <div style="overflow-x: auto;">
                    <table class="grades-table">
                        <thead>
                            <tr>
                                ${isLanguage ? `<th>${t('grades.test')}</th>` : `<th>${t('grades.examType')}</th>`}
                                <th>${t('grades.skill')}</th>
                                <th>${t('grades.score')}</th>
                                <th>${t('grades.percentage')}</th>
                                ${isLanguage ? `<th>${t('grades.status')}</th>` : `<th>${t('grades.grade')}</th>`}
                                <th>${t('grades.examDate')}</th>
                                <th>${t('grades.teacher')}</th>
                                ${isLanguage ? '' : `<th>${t('grades.comments')}</th>`}
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        gradesList.forEach(grade => {
            const examDate = new Date(grade.examDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            const percentage = ((grade.score / grade.maxScore) * 100).toFixed(2);
            const gradeBadgeClass = getGradeBadgeClass(percentage);
            const gradeLetter = getGradeLetter(percentage);
            
            // Language skill labels
            const skillLabels = {
                'Lesen': '<i class="fas fa-book-open"></i> Lesen (Reading)',
                'Hören': '<i class="fas fa-headphones"></i> Hören (Listening)',
                'Schreiben': '<i class="fas fa-pen-fancy"></i> Schreiben (Writing)',
                'Sprechen': '<i class="fas fa-comments"></i> Sprechen (Speaking)'
            };
            
            // Branch module labels
            const fieldLabels = {
                'connaissancesTechniques': 'Connaissances techniques / théorie',
                'projetPratique': 'Projet pratique / codage',
                'resolutionProblemes': 'Résolution de problèmes',
                'documentationRapport': 'Documentation & rapport',
                'participationRegularite': 'Participation & régularité',
                'hygieneSecurite': 'Hygiène et sécurité',
                'communicationPatients': 'Communication avec les patients',
                'techniquesSoins': 'Techniques de soins',
                'stagePratique': 'Stage pratique / application',
                'comportementAssiduite': 'Comportement & assiduité',
                'maitriseGestes': 'Maîtrise des gestes techniques',
                'respectProtocoles': 'Respect des protocoles d\'hygiène',
                'relationPatient': 'Relation patient / écoute',
                'rapportDossier': 'Rapport ou dossier pratique',
                'participationPonctualite': 'Participation et ponctualité',
                'connaissanceBesoins': 'Connaissance des besoins sociaux',
                'communicationInteraction': 'Communication & interaction',
                'organisationActivites': 'Organisation d\'activités éducatives',
                'dossierProjet': 'Dossier / projet de terrain',
                'presenceComportement': 'Présence & comportement',
                'analyseCas': 'Analyse de cas sociaux',
                'communicationEcoute': 'Communication & écoute active',
                'rapportTerrain': 'Rapport de terrain',
                'implicationPro': 'Implication & professionnalisme',
                'ethiqueRespect': 'Éthique & respect',
                'techniquesCulinaires': 'Techniques culinaires / service',
                'hygieneAlimentaire': 'Hygiène & sécurité alimentaire',
                'travailEquipe': 'Travail d\'équipe',
                'creativitePresentation': 'Créativité & présentation',
                'disciplinePonctualite': 'Discipline & ponctualité'
            };
            
            if (isLanguage) {
                // Language grade display with A1-B2 system
                const testTypeLabel = grade.testType === 'miniTest' ? `Mini Test ${grade.testNumber}` : 'Final Exam';
                const skillLabel = skillLabels[grade.examType] || grade.examType;
                const statusConfig = getEvaluationStatus(percentage);
                
                html += `
                    <tr>
                        <td data-label="Test"><span class="exam-type-badge">${testTypeLabel}</span></td>
                        <td data-label="Skill">${skillLabel}</td>
                        <td data-label="Score"><strong>${grade.score}/${grade.maxScore}</strong></td>
                        <td data-label="Percentage">${percentage}%</td>
                        <td data-label="Status"><span class="status-badge ${statusConfig.class}">${statusConfig.icon} ${statusConfig.label}</span></td>
                        <td data-label="Exam Date">${examDate}</td>
                        <td data-label="Teacher">${grade.uploadedBy ? grade.uploadedBy.fullName : 'N/A'}</td>
                    </tr>
                `;
            } else {
                // Branch grade display with traditional system
                const examTypeLabel = fieldLabels[grade.examType] || grade.examType || 'Module';
                
                html += `
                    <tr>
                        <td data-label="Exam Type"><span class="exam-type-badge">${examTypeLabel}</span></td>
                        <td data-label="Skill">-</td>
                        <td data-label="Score"><strong>${grade.score}/${grade.maxScore}</strong></td>
                        <td data-label="Percentage">${percentage}%</td>
                        <td data-label="Grade"><span class="grade-badge ${gradeBadgeClass}">${gradeLetter}</span></td>
                        <td data-label="Exam Date">${examDate}</td>
                        <td data-label="Teacher">${grade.uploadedBy ? grade.uploadedBy.fullName : 'N/A'}</td>
                        <td data-label="Comments">${grade.comments || '-'}</td>
                    </tr>
                `;
            }
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });
    
    gradesContent.innerHTML = html;
}

// Get grade badge class
function getGradeBadgeClass(percentage) {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 75) return 'good';
    if (percentage >= 60) return 'average';
    return 'poor';
}

// Get grade letter
function getGradeLetter(percentage) {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
}

// Get evaluation status for language grades (A1-B2 system)
function getEvaluationStatus(percentage) {
    if (percentage >= 70) {
        return {
            class: 'approved',
            icon: '✅',
            label: 'Approved'
        };
    } else if (percentage >= 50) {
        return {
            class: 'mid',
            icon: '⚠️',
            label: 'Mid'
        };
    } else {
        return {
            class: 'failed',
            icon: '❌',
            label: 'Failed'
        };
    }
}

// Check for new messages (for badge)
async function checkNewMessages() {
    try {
        console.log('Checking for new messages...');
        const response = await fetch(`${API_URL}/student/messages`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Messages data:', data);
            console.log('Unread count:', data.unreadCount);
            updateMessageBadge(data.unreadCount);
        } else {
            console.error('Failed to fetch messages:', response.status);
        }
    } catch (error) {
        console.error('Error checking messages:', error);
    }
}

// Toggle messages panel
function toggleMessages() {
    const messagesPanel = document.getElementById('messagesPanel');
    messagesPanel.classList.toggle('active');
    
    if (messagesPanel.classList.contains('active')) {
        loadMessages();
    }
}

// Load messages
async function loadMessages() {
    const messagesContent = document.getElementById('messagesContent');
    
    try {
        const response = await fetch(`${API_URL}/student/messages`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayMessages(data.messages);
            updateMessageBadge(data.unreadCount);
        } else {
            messagesContent.innerHTML = `
                <div class="no-messages">
                    <i class="fas fa-inbox"></i>
                    <h3>${t('messages.noMessages')}</h3>
                    <p>${t('messages.noMessagesText')}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading messages:', error);
        messagesContent.innerHTML = `
            <div class="no-messages">
                <i class="fas fa-exclamation-circle"></i>
                <h3>${t('messages.errorLoading')}</h3>
                <p>${t('messages.errorMessage')}</p>
            </div>
        `;
    }
}

// Display messages
function displayMessages(messages) {
    const messagesContent = document.getElementById('messagesContent');
    
    if (!messages || messages.length === 0) {
        messagesContent.innerHTML = `
            <div class="no-messages">
                <i class="fas fa-inbox"></i>
                <h3>${t('messages.noMessages')}</h3>
                <p>${t('messages.noMessagesText')}</p>
            </div>
        `;
        return;
    }
    
    const messagesHTML = messages.map(message => {
        const date = new Date(message.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="message-item ${message.read ? '' : 'unread'}">
                <div class="message-header-info">
                    <span class="message-type ${message.type}">${message.type}</span>
                    <span class="message-date">${date}</span>
                </div>
                <div class="message-text">${message.message}</div>
                <button class="delete-message-btn" onclick="deleteMessage('${message._id}')" title="Delete this message">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
    }).join('');
    
    messagesContent.innerHTML = messagesHTML;
}

// Update message badge
function updateMessageBadge(count) {
    const messageBadge = document.getElementById('messageBadge');
    
    if (count > 0) {
        messageBadge.style.display = 'block';
    } else {
        messageBadge.style.display = 'none';
    }
}

// Delete single message
async function deleteMessage(messageId) {
    if (!confirm(t('messages.deleteConfirm'))) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/student/messages/${messageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            // Reload messages to show updated list
            loadMessages();
        } else {
            alert(t('messages.deleteFailed'));
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        alert(t('messages.deleteFailed'));
    }
}

// Clear all messages
async function clearAllMessages() {
    if (!confirm(t('messages.clearAllConfirm'))) {
        return;
    }
    
    try {
        console.log('🗑️ Clearing all messages...');
        const response = await fetch(`${API_URL}/student/messages/clear-all`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Messages cleared:', data);
            
            // Show success message
            const messagesContent = document.getElementById('messagesContent');
            messagesContent.innerHTML = `
                <div class="no-messages">
                    <i class="fas fa-check-circle" style="color: #10b981;"></i>
                    <h3>${t('messages.messagesCleared')}</h3>
                    <p>${data.deletedCount || 0} ${t('messages.messagesDeleted')}</p>
                </div>
            `;
            
            // Update badge
            updateMessageBadge(0);
            
            // Reload messages after 2 seconds
            setTimeout(() => {
                loadMessages();
            }, 2000);
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Failed to clear messages:', errorData);
            alert(`${t('messages.clearFailed')}: ${errorData.message || 'Unknown error'}. ${t('grades.errorMessage')}`);
        }
    } catch (error) {
        console.error('❌ Error clearing messages:', error);
        alert(`${t('messages.clearFailed')}: ${error.message}. ${t('grades.errorMessage')}`);
    }
}

// Logout
function logout() {
    // Clear inactivity timer
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
    
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentData');
    token = null;
    studentData = null;
    showLoginPage();
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').style.display = 'none';
}

// Settings Modal Functions
function openSettings() {
    document.getElementById('settingsModal').classList.add('active');
    
    // Load saved preferences
    const savedLang = localStorage.getItem('language') || 'en';
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    document.getElementById('languageSelect').value = savedLang;
    setTheme(savedTheme, false);
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
}

function changeLanguage() {
    const lang = document.getElementById('languageSelect').value;
    currentLang = lang;
    localStorage.setItem('language', lang);
    
    // Apply translations immediately
    applyTranslations();
    
    // Show notification
    const langName = lang === 'en' ? 'English' : lang === 'de' ? 'Deutsch' : 'Français';
    alert(`${t('settings.languageChanged')} ${langName}!`);
    
    // Close settings modal
    closeSettings();
}

function setTheme(theme, save = true) {
    const body = document.body;
    const darkOption = document.querySelector('.theme-option.dark');
    const lightOption = document.querySelector('.theme-option.light');
    
    if (theme === 'light') {
        body.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
        body.style.color = '#1a1a2e';
        darkOption.classList.remove('active');
        lightOption.classList.add('active');
        
        // Update other elements for light theme
        document.querySelectorAll('.header, .filters, .grades-section, .stat-card, .payment-reminder').forEach(el => {
            el.style.background = 'rgba(255, 255, 255, 0.95)';
            el.style.color = '#1a1a2e';
            el.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
        });
        
        document.querySelectorAll('.filter-group select, .setting-item select').forEach(el => {
            el.style.background = '#ffffff';
            el.style.color = '#1a1a2e';
            el.style.border = '2px solid #ddd';
        });
        
        document.querySelectorAll('.filter-group select option, .setting-item select option').forEach(el => {
            el.style.background = '#ffffff';
            el.style.color = '#1a1a2e';
        });
        
        // Update table styling
        document.querySelectorAll('.grades-table th').forEach(el => {
            el.style.background = 'rgba(255, 204, 0, 0.2)';
            el.style.color = '#1a1a2e';
        });
        
        document.querySelectorAll('.grades-table td').forEach(el => {
            el.style.color = '#1a1a2e';
        });
        
        // Update settings button for light theme
        const settingsBtn = document.querySelector('.settings-btn');
        if (settingsBtn) {
            settingsBtn.style.background = 'linear-gradient(135deg, #FFCC00, #FF9500)';
        }
        
    } else {
        body.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
        body.style.color = '#fff';
        darkOption.classList.add('active');
        lightOption.classList.remove('active');
        
        // Reset to dark theme
        document.querySelectorAll('.header, .filters, .grades-section, .stat-card').forEach(el => {
            el.style.background = 'rgba(255, 255, 255, 0.05)';
            el.style.color = '#fff';
            el.style.boxShadow = '';
        });
        
        document.querySelectorAll('.filter-group select, .setting-item select').forEach(el => {
            el.style.background = 'rgba(30, 30, 50, 0.9)';
            el.style.color = 'white';
            el.style.border = '2px solid rgba(255, 204, 0, 0.3)';
        });
        
        document.querySelectorAll('.filter-group select option, .setting-item select option').forEach(el => {
            el.style.background = '#1e1e32';
            el.style.color = 'white';
        });
        
        // Reset settings button for dark theme
        const settingsBtn = document.querySelector('.settings-btn');
        if (settingsBtn) {
            settingsBtn.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        }
    }
    
    if (save) {
        localStorage.setItem('theme', theme);
    }
}

// Switch Subject Tab (All/Languages/Branches)
function switchSubjectTab(type) {
    // Update tab buttons
    document.querySelectorAll('.subject-tab').forEach(tab => tab.classList.remove('active'));
    
    const languageFilter = document.getElementById('languageFilter');
    const branchFilter = document.getElementById('branchFilter');
    const levelFilter = document.getElementById('levelFilter');
    const testTypeFilter = document.getElementById('testTypeFilter');
    const semesterFilter = document.getElementById('semesterFilter');
    const formationSelect = document.getElementById('filterFormation');
    const branchSelect = document.getElementById('filterBranch');
    const levelSelect = document.getElementById('filterLevel');
    const testTypeSelect = document.getElementById('filterTestType');
    const semesterSelect = document.getElementById('filterSemester');
    
    if (type === 'all') {
        document.getElementById('tabAll').classList.add('active');
        languageFilter.style.display = 'none';
        branchFilter.style.display = 'none';
        levelFilter.style.display = 'none';
        testTypeFilter.style.display = 'none';
        semesterFilter.style.display = 'none';
        formationSelect.value = '';
        branchSelect.value = '';
        levelSelect.value = '';
        testTypeSelect.value = '';
        semesterSelect.value = '';
    } else if (type === 'languages') {
        document.getElementById('tabLanguages').classList.add('active');
        languageFilter.style.display = 'block';
        branchFilter.style.display = 'none';
        levelFilter.style.display = 'block';
        testTypeFilter.style.display = 'block';
        semesterFilter.style.display = 'none';
        branchSelect.value = '';
        semesterSelect.value = '';
    } else if (type === 'branches') {
        document.getElementById('tabBranches').classList.add('active');
        languageFilter.style.display = 'none';
        branchFilter.style.display = 'block';
        levelFilter.style.display = 'none';
        testTypeFilter.style.display = 'none';
        semesterFilter.style.display = 'block';
        formationSelect.value = '';
        levelSelect.value = '';
        testTypeSelect.value = '';
    }
    
    // Reload grades with new filter
    loadGrades();
}

// Apply saved theme on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme, false);
});

// Close settings modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('settingsModal');
    if (e.target === modal) {
        closeSettings();
    }
});
