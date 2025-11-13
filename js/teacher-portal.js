// API Configuration
const API_URL = '/api/grades';

// State
let token = null;
let teacher = null;
let students = [];
let grades = {};
let allGrades = [];
let currentLanguage = localStorage.getItem('teacherLanguage') || 'de';
let currentTheme = localStorage.getItem('teacherTheme') || 'dark';

// Translations
const translations = {
    de: {
        teacherPortal: 'Lehrerportal',
        logout: 'Abmelden',
        uploadGrades: 'Noten hochladen',
        manageGrades: 'Noten verwalten',
        selectYourClass: 'Wählen Sie Ihre Klasse',
        formation: 'Formation',
        group: 'Gruppe',
        semester: 'Semester',
        chooseFormation: 'Formation wählen...',
        chooseGroup: 'Gruppe wählen...',
        semester1: 'Semester 1',
        semester2: 'Semester 2',
        noStudentsFound: 'Keine Schüler gefunden',
        thereAreNoStudents: 'Es gibt keine Schüler in dieser Klasse',
        myUploadedGrades: 'Meine hochgeladenen Noten',
        allFormations: 'Alle Formationen',
        allGroups: 'Alle Gruppen',
        student: 'Schüler',
        examType: 'Prüfungstyp',
        score: 'Punktzahl',
        date: 'Datum',
        actions: 'Aktionen',
        edit: 'Bearbeiten',
        delete: 'Löschen',
        noGradesFound: 'Keine Noten gefunden',
        uploadSomeGrades: 'Laden Sie einige Noten hoch, um sie hier zu sehen',
        clickToAdd: 'Klicken zum Hinzufügen',
        autoAssigned: 'Auto-zugewiesen'
    },
    ar: {
        teacherPortal: 'بوابة المعلم',
        logout: 'تسجيل الخروج',
        uploadGrades: 'رفع الدرجات',
        manageGrades: 'إدارة الدرجات',
        selectYourClass: 'اختر صفك',
        formation: 'التكوين',
        group: 'المجموعة',
        semester: 'الفصل الدراسي',
        chooseFormation: 'اختر التكوين...',
        chooseGroup: 'اختر المجموعة...',
        semester1: 'الفصل الدراسي 1',
        semester2: 'الفصل الدراسي 2',
        noStudentsFound: 'لم يتم العثور على طلاب',
        thereAreNoStudents: 'لا يوجد طلاب في هذا الصف',
        myUploadedGrades: 'درجاتي المرفوعة',
        allFormations: 'جميع التكوينات',
        allGroups: 'جميع المجموعات',
        student: 'الطالب',
        examType: 'نوع الامتحان',
        score: 'الدرجة',
        date: 'التاريخ',
        actions: 'الإجراءات',
        edit: 'تعديل',
        delete: 'حذف',
        noGradesFound: 'لم يتم العثور على درجات',
        uploadSomeGrades: 'قم برفع بعض الدرجات لرؤيتها هنا',
        clickToAdd: 'انقر للإضافة',
        autoAssigned: 'تعيين تلقائي'
    },
    en: {
        teacherPortal: 'Teacher Portal',
        logout: 'Logout',
        uploadGrades: 'Upload Grades',
        manageGrades: 'Manage Grades',
        selectYourClass: 'Select Your Class',
        formation: 'Formation',
        group: 'Group',
        semester: 'Semester',
        chooseFormation: 'Choose Formation...',
        chooseGroup: 'Choose Group...',
        semester1: 'Semester 1',
        semester2: 'Semester 2',
        noStudentsFound: 'No Students Found',
        thereAreNoStudents: 'There are no students in this class',
        myUploadedGrades: 'My Uploaded Grades',
        allFormations: 'All Formations',
        allGroups: 'All Groups',
        student: 'Student',
        examType: 'Exam Type',
        score: 'Score',
        date: 'Date',
        actions: 'Actions',
        edit: 'Edit',
        delete: 'Delete',
        noGradesFound: 'No grades found',
        uploadSomeGrades: 'Upload some grades to see them here',
        clickToAdd: 'Click to add',
        autoAssigned: 'Auto-assigned'
    },
    fr: {
        teacherPortal: 'Portail Enseignant',
        logout: 'Déconnexion',
        uploadGrades: 'Télécharger les notes',
        manageGrades: 'Gérer les notes',
        selectYourClass: 'Sélectionnez votre classe',
        formation: 'Formation',
        group: 'Groupe',
        semester: 'Semestre',
        chooseFormation: 'Choisir la formation...',
        chooseGroup: 'Choisir le groupe...',
        semester1: 'Semestre 1',
        semester2: 'Semestre 2',
        noStudentsFound: 'Aucun étudiant trouvé',
        thereAreNoStudents: 'Il n\'y a pas d\'étudiants dans cette classe',
        myUploadedGrades: 'Mes notes téléchargées',
        allFormations: 'Toutes les formations',
        allGroups: 'Tous les groupes',
        student: 'Étudiant',
        examType: 'Type d\'examen',
        score: 'Note',
        date: 'Date',
        actions: 'Actions',
        edit: 'Modifier',
        delete: 'Supprimer',
        noGradesFound: 'Aucune note trouvée',
        uploadSomeGrades: 'Téléchargez des notes pour les voir ici',
        clickToAdd: 'Cliquer pour ajouter',
        autoAssigned: 'Auto-assigné'
    }
};

// Theme Functions
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme();
    localStorage.setItem('teacherTheme', currentTheme);
}

function applyTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('.theme-icon');
    
    if (currentTheme === 'light') {
        body.classList.add('light-theme');
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    } else {
        body.classList.remove('light-theme');
        if (themeIcon) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }
}

// Language Functions
function toggleLanguageMenu() {
    const menu = document.getElementById('languageMenu');
    menu.classList.toggle('active');
}

function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('teacherLanguage', lang);
    
    // Update UI
    updateLanguageUI();
    translatePage();
    
    // Close menu
    document.getElementById('languageMenu').classList.remove('active');
}

function updateLanguageUI() {
    const langMap = { de: 'DE', ar: 'AR', en: 'EN', fr: 'FR' };
    document.getElementById('currentLang').textContent = langMap[currentLanguage];
    
    // Update active state
    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.classList.remove('active');
        if (opt.dataset.lang === currentLanguage) {
            opt.classList.add('active');
        }
    });
    
    // Set RTL for Arabic
    if (currentLanguage === 'ar') {
        document.body.setAttribute('dir', 'rtl');
    } else {
        document.body.setAttribute('dir', 'ltr');
    }
}

function translatePage() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            el.textContent = translations[currentLanguage][key];
        }
    });
}

// Close language menu when clicking outside
document.addEventListener('click', (e) => {
    const languageSelector = document.querySelector('.language-selector');
    const languageMenu = document.getElementById('languageMenu');
    
    if (languageSelector && languageMenu && !languageSelector.contains(e.target)) {
        languageMenu.classList.remove('active');
    }
});

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

// Module Icons for Language Formations
const moduleIcons = {
    'Lesen': 'fa-book-open',
    'Hören': 'fa-headphones',
    'Schreiben': 'fa-pen',
    'Sprechen': 'fa-comments'
};

// Branch Grading Configuration
const branchGradingConfig = {
    'Gériatrie': {
        icon: 'fa-user-nurse',
        color: '#9b59b6',
        fields: [
            { key: 'hygieneSecurite', label: 'Hygiene et sécurité', weight: 20, maxScore: 20, icon: 'fa-shield-alt' },
            { key: 'communicationPatients', label: 'Communication avec les patients', weight: 20, maxScore: 20, icon: 'fa-comments' },
            { key: 'techniquesSoins', label: 'Techniques de soins', weight: 30, maxScore: 20, icon: 'fa-heartbeat' },
            { key: 'stagePratique', label: 'Stage pratique / application', weight: 20, maxScore: 20, icon: 'fa-hospital' },
            { key: 'comportementAssiduite', label: 'Comportement & assiduité', weight: 10, maxScore: 20, icon: 'fa-user-check' }
        ]
    },
    'Aide soignant': {
        icon: 'fa-hand-holding-medical',
        color: '#3498db',
        fields: [
            { key: 'maitriseGestes', label: 'Maîtrise des gestes techniques', weight: 30, maxScore: 20, icon: 'fa-hands' },
            { key: 'respectProtocoles', label: 'Respect des protocoles d\'hygiène', weight: 25, maxScore: 20, icon: 'fa-shield-virus' },
            { key: 'relationPatient', label: 'Relation patient / écoute', weight: 20, maxScore: 20, icon: 'fa-user-friends' },
            { key: 'rapportDossier', label: 'Rapport ou dossier pratique', weight: 15, maxScore: 20, icon: 'fa-clipboard' },
            { key: 'participationPonctualite', label: 'Participation et ponctualité', weight: 10, maxScore: 20, icon: 'fa-clock' }
        ]
    },
    'Agent socio éducatif': {
        icon: 'fa-users',
        color: '#e67e22',
        fields: [
            { key: 'connaissanceBesoins', label: 'Connaissance des besoins sociaux', weight: 25, maxScore: 20, icon: 'fa-brain' },
            { key: 'communicationInteraction', label: 'Communication & interaction', weight: 25, maxScore: 20, icon: 'fa-comments' },
            { key: 'organisationActivites', label: 'Organisation d\'activités éducatives', weight: 20, maxScore: 20, icon: 'fa-tasks' },
            { key: 'dossierProjet', label: 'Dossier / projet de terrain', weight: 20, maxScore: 20, icon: 'fa-folder-open' },
            { key: 'presenceComportement', label: 'Présence & comportement', weight: 10, maxScore: 20, icon: 'fa-user-check' }
        ]
    },
    'Assistante sociale': {
        icon: 'fa-hands-helping',
        color: '#1abc9c',
        fields: [
            { key: 'analyseCas', label: 'Analyse de cas sociaux', weight: 30, maxScore: 20, icon: 'fa-search' },
            { key: 'communicationEcoute', label: 'Communication & écoute active', weight: 25, maxScore: 20, icon: 'fa-ear-listen' },
            { key: 'rapportTerrain', label: 'Rapport de terrain', weight: 20, maxScore: 20, icon: 'fa-file-contract' },
            { key: 'implicationPro', label: 'Implication & professionnalisme', weight: 15, maxScore: 20, icon: 'fa-briefcase' },
            { key: 'ethiqueRespect', label: 'Éthique & respect', weight: 10, maxScore: 20, icon: 'fa-balance-scale' }
        ]
    },
    'Restauration': {
        icon: 'fa-utensils',
        color: '#e74c3c',
        fields: [
            { key: 'techniquesCulinaires', label: 'Techniques culinaires / service', weight: 30, maxScore: 20, icon: 'fa-concierge-bell' },
            { key: 'hygieneAlimentaire', label: 'Hygiène & sécurité alimentaire', weight: 25, maxScore: 20, icon: 'fa-shield-alt' },
            { key: 'travailEquipe', label: 'Travail d\'équipe', weight: 20, maxScore: 20, icon: 'fa-users' },
            { key: 'creativitePresentation', label: 'Créativité & présentation', weight: 15, maxScore: 20, icon: 'fa-palette' },
            { key: 'disciplinePonctualite', label: 'Discipline & ponctualité', weight: 10, maxScore: 20, icon: 'fa-clock' }
        ]
    },
    'Cuisine': {
        icon: 'fa-utensils',
        color: '#e74c3c',
        fields: [
            { key: 'techniquesCulinaires', label: 'Techniques culinaires / service', weight: 30, maxScore: 20, icon: 'fa-utensils' },
            { key: 'hygieneAlimentaire', label: 'Hygiène & sécurité alimentaire', weight: 25, maxScore: 20, icon: 'fa-shield-alt' },
            { key: 'travailEquipe', label: 'Travail d\'équipe', weight: 20, maxScore: 20, icon: 'fa-users' },
            { key: 'creativitePresentation', label: 'Créativité & présentation', weight: 15, maxScore: 20, icon: 'fa-palette' },
            { key: 'disciplinePonctualite', label: 'Discipline & ponctualité', weight: 10, maxScore: 20, icon: 'fa-clock' }
        ]
    },
    'Informatique': {
        icon: 'fa-laptop-code',
        color: '#34495e',
        fields: [
            { key: 'connaissancesTechniques', label: 'Connaissances techniques / théorie', weight: 20, maxScore: 20, icon: 'fa-book' },
            { key: 'projetPratique', label: 'Projet pratique / codage', weight: 35, maxScore: 20, icon: 'fa-code' },
            { key: 'resolutionProblemes', label: 'Résolution de problèmes', weight: 20, maxScore: 20, icon: 'fa-puzzle-piece' },
            { key: 'documentationRapport', label: 'Documentation & rapport', weight: 15, maxScore: 20, icon: 'fa-file-alt' },
            { key: 'participationRegularite', label: 'Participation & régularité', weight: 10, maxScore: 20, icon: 'fa-user-check' }
        ]
    },
    'Gestion hôtelière': {
        icon: 'fa-hotel',
        color: '#16a085',
        fields: [
            { key: 'techniquesCulinaires', label: 'Techniques de gestion', weight: 30, maxScore: 20, icon: 'fa-chart-line' },
            { key: 'hygieneAlimentaire', label: 'Standards de qualité', weight: 25, maxScore: 20, icon: 'fa-star' },
            { key: 'travailEquipe', label: 'Leadership & équipe', weight: 20, maxScore: 20, icon: 'fa-user-tie' },
            { key: 'creativitePresentation', label: 'Service client', weight: 15, maxScore: 20, icon: 'fa-handshake' },
            { key: 'disciplinePonctualite', label: 'Professionnalisme', weight: 10, maxScore: 20, icon: 'fa-medal' }
        ]
    }
};

// Language formations
const languageFormations = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];

// Branch formations
const branchFormations = ['Gériatrie', 'Aide soignant', 'Agent socio éducatif', 'Assistante sociale', 'Restauration', 'Cuisine', 'Informatique', 'Gestion hôtelière'];

// Check if formation is a branch
function isBranchFormation(formation) {
    return branchFormations.includes(formation);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Apply saved theme and language
    applyTheme();
    updateLanguageUI();
    translatePage();
    
    token = localStorage.getItem('teacherToken');
    
    if (token) {
        loadTeacherProfile();
    } else {
        showLogin();
    }
    
    // Set today's date
    const examDateInput = document.getElementById('examDate');
    if (examDateInput) {
        examDateInput.valueAsDate = new Date();
    }
});

// Show/Hide Pages
function showLogin() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('mainPortal').classList.add('hidden');
}

function showPortal() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('mainPortal').classList.remove('hidden');
}

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorMsg = document.getElementById('loginError');
    
    errorMsg.style.display = 'none';
    
    try {
        const response = await fetch(`${API_URL}/teacher/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            token = data.token;
            localStorage.setItem('teacherToken', token);
            resetInactivityTimer(); // Start inactivity timer on login
            await loadTeacherProfile();
        } else {
            errorMsg.textContent = data.message || 'Invalid credentials';
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        errorMsg.textContent = 'Connection error. Please try again.';
        errorMsg.style.display = 'block';
    }
});

// Load Teacher Profile
async function loadTeacherProfile() {
    try {
        const response = await fetch(`${API_URL}/teacher/profile`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        if (response.ok) {
            teacher = await response.json();
            document.getElementById('userName').textContent = teacher.fullName;
            document.getElementById('userEmail').textContent = teacher.email;
            
            // Populate formations
            populateFormations();
            
            // Load groups
            await loadGroups();
            
            resetInactivityTimer(); // Start timer when profile loads
            showPortal();
        } else {
            logout();
        }
    } catch (error) {
        console.error('Profile load error:', error);
        logout();
    }
}

// Populate Formations
function populateFormations() {
    const formationSelect = document.getElementById('formationSelect');
    const filterFormation = document.getElementById('filterFormation');
    
    formationSelect.innerHTML = '<option value="">Choose Formation...</option>';
    filterFormation.innerHTML = '<option value="">All Formations</option>';
    
    if (teacher && teacher.formations) {
        teacher.formations.forEach(formation => {
            const option1 = document.createElement('option');
            option1.value = formation;
            option1.textContent = formation;
            formationSelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = formation;
            option2.textContent = formation;
            filterFormation.appendChild(option2);
        });
        
        // Auto-select if teacher has only one formation
        if (teacher.formations.length === 1) {
            formationSelect.value = teacher.formations[0];
            filterFormation.value = teacher.formations[0];
            // Disable the dropdown and add visual indicator
            formationSelect.disabled = true;
            formationSelect.style.opacity = '0.7';
            formationSelect.style.cursor = 'not-allowed';
            // Add a label to show it's auto-assigned
            const formationLabel = formationSelect.parentElement.querySelector('label');
            if (formationLabel && !formationLabel.querySelector('.auto-assigned-badge')) {
                const badge = document.createElement('span');
                badge.className = 'auto-assigned-badge';
                badge.innerHTML = ' <i class="fas fa-check-circle" style="color: #38ef7d; font-size: 12px;"></i> <span style="font-size: 11px; color: #38ef7d;">(Auto-assigned)</span>';
                formationLabel.appendChild(badge);
            }
        } else {
            // Enable dropdown if multiple formations
            formationSelect.disabled = false;
            formationSelect.style.opacity = '1';
            formationSelect.style.cursor = 'pointer';
        }
    }
}

// Load Groups
async function loadGroups() {
    try {
        const response = await fetch(`${API_URL}/teacher/groups`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const allGroups = await response.json();
            
            const groupSelect = document.getElementById('groupSelect');
            const filterGroup = document.getElementById('filterGroup');
            const formationSelect = document.getElementById('formationSelect');
            
            groupSelect.innerHTML = '<option value="">Choose Group...</option>';
            filterGroup.innerHTML = '<option value="">All Groups...</option>';
            
            // For branch teachers, show all groups (already filtered by backend)
            // For language teachers, groups are already filtered by backend
            const selectedFormation = formationSelect.value;
            
            allGroups.forEach(group => {
                const option1 = document.createElement('option');
                option1.value = group._id;
                option1.textContent = `${group.name} (${group.formation})`;
                groupSelect.appendChild(option1);
                
                const option2 = document.createElement('option');
                option2.value = group._id;
                option2.textContent = `${group.name} (${group.formation})`;
                filterGroup.appendChild(option2);
            });
            
            // Auto-select if only one group available for this formation
            if (allGroups.length === 1) {
                groupSelect.value = allGroups[0]._id;
                groupSelect.disabled = true;
                groupSelect.style.opacity = '0.7';
                groupSelect.style.cursor = 'not-allowed';
                // Add auto-assigned badge
                const groupLabel = groupSelect.parentElement.querySelector('label');
                if (groupLabel && !groupLabel.querySelector('.auto-assigned-badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'auto-assigned-badge';
                    badge.innerHTML = ' <i class="fas fa-check-circle" style="color: #38ef7d; font-size: 12px;"></i> <span style="font-size: 11px; color: #38ef7d;">(Auto-assigned)</span>';
                    groupLabel.appendChild(badge);
                }
                // Auto-load students if both formation and group are set
                if (selectedFormation) {
                    loadStudentsCards();
                }
            } else {
                groupSelect.disabled = false;
                groupSelect.style.opacity = '1';
                groupSelect.style.cursor = 'pointer';
            }
        }
    } catch (error) {
        console.error('Load groups error:', error);
    }
}

// Load Students Cards
async function loadStudentsCards() {
    const formation = document.getElementById('formationSelect').value;
    const groupId = document.getElementById('groupSelect').value;
    const semester = document.getElementById('semesterSelect').value;
    
    const studentsGrid = document.getElementById('studentsGrid');
    
    if (!formation || !groupId) {
        studentsGrid.innerHTML = '';
        return;
    }
    
    try {
        // Load students
        const studentsResponse = await fetch(
            `${API_URL}/teacher/students?formation=${formation}&groupId=${groupId}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        if (!studentsResponse.ok) throw new Error('Failed to load students');
        
        students = await studentsResponse.json();
        
        // Load grades
        const gradesResponse = await fetch(
            `${API_URL}/teacher/grades?formation=${formation}&groupId=${groupId}&semester=${semester}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        if (gradesResponse.ok) {
            const gradesData = await gradesResponse.json();
            console.log('📥 Loaded grades from server:', gradesData.length, 'grades');
            
            grades = {};
            gradesData.forEach(grade => {
                const studentId = grade.student._id || grade.student;
                if (!grades[studentId]) grades[studentId] = {};
                // Store grade by examType (works for both languages and branches)
                // For languages: examType = "Lesen", "Hören", etc.
                // For branches: examType = "connaissancesTechniques", "projetPratique", etc.
                grades[studentId][grade.examType] = grade;
            });
            console.log('📊 Final grades object:', grades);
        }
        
        // Display students
        displayStudentCards();
        
    } catch (error) {
        studentsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error Loading Students</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Display Student Cards
function displayStudentCards() {
    const studentsGrid = document.getElementById('studentsGrid');
    const formation = document.getElementById('formationSelect').value;
    
    if (students.length === 0) {
        studentsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-slash"></i>
                <h3>No Students Found</h3>
                <p>There are no students in this class</p>
            </div>
        `;
        return;
    }
    
    const isBranch = isBranchFormation(formation);
    const modules = isBranch ? branchGradingConfig[formation].fields : 
                    ['Lesen', 'Hören', 'Schreiben', 'Sprechen'];
    
    studentsGrid.innerHTML = students.map(student => {
        const initials = student.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const studentGrades = grades[student._id] || {};
        
        // Show filiere for branch teachers, formation for language teachers
        const displayFormations = isBranch 
            ? (Array.isArray(student.filiere) ? student.filiere.join(', ') : student.filiere)
            : (Array.isArray(student.formation) ? student.formation.join(', ') : student.formation);
        
        return `
            <div class="student-card">
                <div class="student-header">
                    <div class="student-avatar">${initials}</div>
                    <div class="student-info">
                        <h3>${student.fullName}</h3>
                        <p>${displayFormations}</p>
                    </div>
                </div>
                <div class="modules-grid ${isBranch ? 'branch-grid' : ''}">
                    ${isBranch ? 
                        // Branch formation - show 5 grading field cards
                        modules.map(field => {
                            const grade = studentGrades[field.key];
                            const hasGrade = !!grade;
                            
                            return `
                                <div class="module-box ${hasGrade ? 'completed' : ''}" 
                                     onclick="openBranchGradeModal('${student._id}', '${student.fullName}', '${formation}', '${field.key}', ${hasGrade ? `'${grade._id}'` : 'null'})"
                                     style="border-color: ${branchGradingConfig[formation].color};">
                                    <div class="module-icon">
                                        <i class="fas ${field.icon || branchGradingConfig[formation].icon}"></i>
                                    </div>
                                    <div class="module-name">${field.label}</div>
                                    <div class="module-weight">${field.weight}%</div>
                                    ${hasGrade ? 
                                        `<div class="module-grade">${grade.score}<span>/20</span></div>` :
                                        `<div class="module-empty">Click to add</div>`
                                    }
                                </div>
                            `;
                        }).join('')
                        :
                        // Language formation - show 4 modules
                        modules.map(module => {
                            const grade = studentGrades[module];
                            const hasGrade = !!grade;
                            
                            return `
                                <div class="module-box ${hasGrade ? 'completed' : ''}" 
                                     onclick="openGradeModal('${student._id}', '${student.fullName}', '${module}', ${hasGrade ? `'${grade._id}'` : 'null'})">
                                    <div class="module-icon">
                                        <i class="fas ${moduleIcons[module]}"></i>
                                    </div>
                                    <div class="module-name">${module}</div>
                                    ${hasGrade ? 
                                        `<div class="module-grade">${grade.score}<span>/${grade.maxScore}</span></div>` :
                                        `<div class="module-empty">Click to add</div>`
                                    }
                                </div>
                            `;
                        }).join('')
                    }
                </div>
            </div>
        `;
    }).join('');
}

// Open Grade Modal (for language teachers)
function openGradeModal(studentId, studentName, module, gradeId) {
    console.log('🎯 Opening grade modal:', { studentId, studentName, module, gradeId });
    
    document.getElementById('gradeModalTitle').innerHTML = `<i class="fas fa-edit"></i> ${module} - ${studentName}`;
    document.getElementById('studentId').value = studentId;
    document.getElementById('moduleType').value = module;
    document.getElementById('gradeId').value = gradeId || '';
    
    // Set max score to 100 for language teachers
    const scoreInput = document.getElementById('score');
    scoreInput.max = 100;
    scoreInput.placeholder = '0-100';
    
    // If editing, populate fields
    if (gradeId) {
        const grade = Object.values(grades[studentId] || {}).find(g => g._id === gradeId);
        if (grade) {
            document.getElementById('score').value = grade.score;
            document.getElementById('maxScore').value = grade.maxScore;
            document.getElementById('examDate').value = grade.examDate.split('T')[0];
            document.getElementById('comments').value = grade.comments || '';
        }
    } else {
        document.getElementById('gradeForm').reset();
        document.getElementById('examDate').valueAsDate = new Date();
        document.getElementById('maxScore').value = 100;
    }
    
    document.getElementById('gradeModal').classList.add('active');
}

// Open Branch Grade Modal (for branch teachers - IT, Cuisine, etc.)
function openBranchGradeModal(studentId, studentName, formation, fieldKey, gradeId) {
    console.log('🎯 Opening branch grade modal:', { studentId, studentName, formation, fieldKey, gradeId });
    
    // Get the field label from config
    const fieldConfig = branchGradingConfig[formation].fields.find(f => f.key === fieldKey);
    const fieldLabel = fieldConfig ? fieldConfig.label : fieldKey;
    
    document.getElementById('gradeModalTitle').innerHTML = `<i class="fas fa-edit"></i> ${fieldLabel} - ${studentName}`;
    document.getElementById('studentId').value = studentId;
    document.getElementById('moduleType').value = fieldKey; // Store the field key
    document.getElementById('gradeId').value = gradeId || '';
    
    // Set max score to 20 for branch teachers
    const scoreInput = document.getElementById('score');
    scoreInput.max = 20;
    scoreInput.placeholder = '0-20';
    
    // If editing, populate fields
    if (gradeId) {
        const grade = grades[studentId][fieldKey];
        if (grade) {
            document.getElementById('score').value = grade.score;
            document.getElementById('maxScore').value = grade.maxScore || 20;
            if (grade.examDate) {
                document.getElementById('examDate').value = grade.examDate.split('T')[0];
            }
            document.getElementById('comments').value = grade.comments || '';
        }
    } else {
        document.getElementById('gradeForm').reset();
        document.getElementById('examDate').valueAsDate = new Date();
        document.getElementById('maxScore').value = 20; // Branch teachers use 20 as max score
    }
    
    document.getElementById('gradeModal').classList.add('active');
}

// Close Grade Modal
function closeGradeModal() {
    document.getElementById('gradeModal').classList.remove('active');
}

// Save Grade
document.getElementById('gradeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const studentId = document.getElementById('studentId').value;
    const moduleType = document.getElementById('moduleType').value;
    const gradeId = document.getElementById('gradeId').value;
    const formation = document.getElementById('formationSelect').value;
    const groupId = document.getElementById('groupSelect').value;
    const semester = document.getElementById('semesterSelect').value;
    
    console.log('🔧 Form values:', { studentId, moduleType, gradeId, formation, groupId, semester });
    
    // Calculate academic year (e.g., "2025-2026")
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const academicYear = month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    
    // Simple: always send examType (works for both languages and branches)
    const gradeData = {
        student: studentId,
        formation: formation,
        group: groupId,
        examType: moduleType, // For languages: "Lesen", "Hören", etc. For branches: "connaissancesTechniques", etc.
        score: parseInt(document.getElementById('score').value),
        maxScore: parseInt(document.getElementById('maxScore').value),
        examDate: document.getElementById('examDate').value,
        semester: semester,
        academicYear: academicYear,
        comments: document.getElementById('comments').value
    };
    
    console.log('📝 Uploading grade:', gradeData);
    
    try {
        const url = gradeId ? `${API_URL}/teacher/grades/${gradeId}` : `${API_URL}/teacher/grades`;
        const method = gradeId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(gradeData)
        });
        
        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Grade saved:', result);
            console.log('📊 Grade branchGrades:', result.grade?.branchGrades);
            console.log('📊 Full grade object:', JSON.stringify(result.grade, null, 2));
            closeGradeModal();
            await loadStudentsCards();
        } else {
            const error = await response.json();
            console.error('❌ Error response:', error);
            alert(error.message || 'Failed to save grade');
        }
    } catch (error) {
        console.error('❌ Fetch error:', error);
        alert('Error saving grade. Please try again.');
    }
});

// Switch Tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.closest('.tab').classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (tabName === 'upload') {
        document.getElementById('uploadTab').classList.add('active');
    } else if (tabName === 'manage') {
        document.getElementById('manageTab').classList.add('active');
        loadGrades();
    }
}

// Load Grades
async function loadGrades() {
    const gradesContent = document.getElementById('gradesContent');
    gradesContent.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i><p>Loading grades...</p></div>';
    
    const formation = document.getElementById('filterFormation').value;
    const groupId = document.getElementById('filterGroup').value;
    const semester = document.getElementById('filterSemester').value;
    
    let url = `${API_URL}/teacher/grades?`;
    if (formation) url += `formation=${formation}&`;
    if (groupId) url += `groupId=${groupId}&`;
    if (semester) url += `semester=${semester}&`;
    
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            allGrades = await response.json();
            displayGrades();
        } else {
            gradesContent.innerHTML = '<div class="no-data"><i class="fas fa-exclamation-circle"></i><h3>Error loading grades</h3></div>';
        }
    } catch (error) {
        gradesContent.innerHTML = '<div class="no-data"><i class="fas fa-exclamation-circle"></i><h3>Error loading grades</h3></div>';
    }
}

// Display Grades
function displayGrades() {
    const gradesContent = document.getElementById('gradesContent');
    
    if (allGrades.length === 0) {
        gradesContent.innerHTML = '<div class="no-data"><i class="fas fa-inbox"></i><h3>No grades found</h3><p>Upload some grades to see them here</p></div>';
        return;
    }
    
    let tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Student</th>
                    <th>Formation</th>
                    <th>Group</th>
                    <th>Exam Type</th>
                    <th>Score</th>
                    <th>Date</th>
                    <th>Semester</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    allGrades.forEach(grade => {
        const studentName = grade.student?.fullName || 'Unknown';
        const groupName = grade.group?.name || 'Unknown';
        const percentage = ((grade.score / grade.maxScore) * 100).toFixed(1);
        
        tableHTML += `
            <tr>
                <td data-label="Student">${studentName}</td>
                <td data-label="Formation">${grade.formation}</td>
                <td data-label="Group">${groupName}</td>
                <td data-label="Exam Type">${grade.examType}</td>
                <td data-label="Score">${grade.score}/${grade.maxScore} (${percentage}%)</td>
                <td data-label="Date">${new Date(grade.examDate).toLocaleDateString()}</td>
                <td data-label="Semester">${grade.semester}</td>
                <td data-label="Actions">
                    <button class="btn btn-edit" onclick="editGrade('${grade._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-delete" onclick="deleteGrade('${grade._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    gradesContent.innerHTML = tableHTML;
}

// Edit Grade
function editGrade(gradeId) {
    const grade = allGrades.find(g => g._id === gradeId);
    if (!grade) return;
    
    document.getElementById('editGradeId').value = grade._id;
    document.getElementById('editScore').value = grade.score;
    document.getElementById('editMaxScore').value = grade.maxScore;
    document.getElementById('editExamDate').value = grade.examDate.split('T')[0];
    document.getElementById('editComments').value = grade.comments || '';
    
    document.getElementById('editModal').classList.add('active');
}

// Close Edit Modal
function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
}

// Edit Grade Form
document.getElementById('editGradeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const gradeId = document.getElementById('editGradeId').value;
    const editMessage = document.getElementById('editMessage');
    const editError = document.getElementById('editError');
    
    editMessage.style.display = 'none';
    editError.style.display = 'none';
    
    const updateData = {
        score: parseInt(document.getElementById('editScore').value),
        maxScore: parseInt(document.getElementById('editMaxScore').value),
        examDate: document.getElementById('editExamDate').value,
        comments: document.getElementById('editComments').value
    };
    
    try {
        const response = await fetch(`${API_URL}/teacher/grades/${gradeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
            editMessage.textContent = 'Grade updated successfully!';
            editMessage.style.display = 'block';
            
            setTimeout(() => {
                closeEditModal();
                loadGrades();
            }, 1500);
        } else {
            const data = await response.json();
            editError.textContent = data.message || 'Failed to update grade';
            editError.style.display = 'block';
        }
    } catch (error) {
        editError.textContent = 'Error updating grade. Please try again.';
        editError.style.display = 'block';
    }
});

// Delete Grade
async function deleteGrade(gradeId) {
    if (!confirm('Are you sure you want to delete this grade?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/teacher/grades/${gradeId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            loadGrades();
        } else {
            alert('Failed to delete grade');
        }
    } catch (error) {
        alert('Error deleting grade. Please try again.');
    }
}

// Logout
function logout() {
    // Clear inactivity timer
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
    
    // Clear all cached data
    localStorage.removeItem('teacherToken');
    sessionStorage.clear(); // Clear any session storage
    token = null;
    teacher = null;
    grades = {};
    
    // Reload the page to ensure fresh state
    window.location.reload();
}

// Close modals on outside click
document.getElementById('gradeModal').addEventListener('click', (e) => {
    if (e.target.id === 'gradeModal') {
        closeGradeModal();
    }
});

document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target.id === 'editModal') {
        closeEditModal();
    }
});
