// Admin Dashboard - Modern UI

// ==================== MOBILE MENU ====================
// Define this first so it's available for inline onclick handlers

window.toggleMobileMenu = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    
    if (!sidebar || !overlay || !menuToggle) return;
    
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
    
    // Change icon
    const icon = menuToggle.querySelector('i');
    if (sidebar.classList.contains('mobile-open')) {
        icon.className = 'fas fa-times';
    } else {
        icon.className = 'fas fa-bars';
    }
}

// API Configuration
const API_BASE_URL = window.location.origin;
let authToken = localStorage.getItem('adminToken');
let allStudents = [];
let currentLanguage = localStorage.getItem('adminLanguage') || 'de';
let translations = {};

// Global function to handle 401 Unauthorized errors
function handleUnauthorized() {
    console.warn('⚠️ Session expired or invalid token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('isSuperAdmin');
    authToken = null;
    
    // Hide dashboard, show login
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('dashboardContainer').style.display = 'none';
    
    alert('⚠️ Session expired. Please login again.');
}

// Check if already logged in
if (authToken) {
    showDashboard();
}

// Login Form Handler
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            authToken = data.token;
            localStorage.setItem('adminToken', authToken);
            // Check if user is super admin or dev
            const isSuperAdmin = data.admin && (data.admin.role === 'super_admin' || data.admin.role === 'dev');
            localStorage.setItem('isSuperAdmin', isSuperAdmin);
            // Store username and role
            localStorage.setItem('adminUsername', data.admin.username);
            localStorage.setItem('adminRole', data.admin.role);
            showDashboard();
        } else {
            showError(data.message || 'Login failed');
        }
    } catch (error) {
        showError('Connection error. Please try again.');
    }
});

// Logout Handler
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    stopRegistrationSync();
    localStorage.removeItem('adminToken');
    localStorage.removeItem('isSuperAdmin');
    localStorage.removeItem('adminUsername');
    localStorage.removeItem('adminRole');
    location.reload();
});

// Show Dashboard
async function showDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    
    // Ensure dashboard tab is active by default
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    const dashboardTab = document.getElementById('dashboardTab');
    if (dashboardTab) {
        dashboardTab.classList.add('active');
    }
    
    // Ensure dashboard menu item is active
    document.querySelectorAll('.menu-item').forEach(mi => mi.classList.remove('active'));
    const dashboardMenuItem = document.querySelector('.menu-item[data-tab="dashboard"]');
    if (dashboardMenuItem) {
        dashboardMenuItem.classList.add('active');
    }
    
    // Load translations first
    await loadTranslations();
    
    // Load initial data
    await loadStats();
    await loadSettings();
    await loadStudents();
    
    // Start syncing registration status across all admin panels
    startRegistrationSync();
    
    // Display username in sidebar
    const username = localStorage.getItem('adminUsername');
    if (username) {
        document.getElementById('adminUsername').textContent = username;
    }
    
    // Check if super admin
    const isSuperAdmin = localStorage.getItem('isSuperAdmin') === 'true';
    if (isSuperAdmin) {
        document.getElementById('employeesMenuItem')?.classList.remove('hidden');
        document.getElementById('activityMenuItem')?.classList.remove('hidden');
        document.getElementById('sessionsMenuItem')?.classList.remove('hidden');
        document.getElementById('settingsMenuItem')?.classList.remove('hidden');
    }
    
    // Check if Dev account - show EXAM section with Telc
    const adminRole = localStorage.getItem('adminRole');
    if (adminRole === 'dev') {
        document.getElementById('examSection')?.classList.remove('hidden');
    }
}

// Show Error Message
function showError(message) {
    const errorEl = document.getElementById('loginError');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 3000);
    }
}

// Load Statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        // Check for 401 Unauthorized
        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        const data = await response.json();

        if (data.success) {
            document.getElementById('totalStudents').textContent = data.stats.total;
            document.getElementById('pendingStudents').textContent = data.stats.pending;
            document.getElementById('approvedStudents').textContent = data.stats.approved;
            document.getElementById('rejectedStudents').textContent = data.stats.rejected;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load Settings
async function loadSettings() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        // Check for 401 Unauthorized
        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        const data = await response.json();

        if (data.success) {
            const toggle = document.getElementById('registrationToggle');
            const phoneInput = document.getElementById('contactPhone');
            const cvToggle = document.getElementById('cvServiceToggle');
            const applyingToggle = document.getElementById('applyingServiceToggle');
            const translationToggle = document.getElementById('translationServiceToggle');
            
            if (toggle) {
                toggle.checked = data.settings.isRegistrationOpen;
            }
            if (phoneInput && data.settings.contactPhone) {
                phoneInput.value = data.settings.contactPhone;
            }
            // Service toggles
            if (cvToggle) {
                cvToggle.checked = data.settings.isCvServiceOpen !== undefined ? data.settings.isCvServiceOpen : true;
            }
            if (applyingToggle) {
                applyingToggle.checked = data.settings.isApplyingServiceOpen !== undefined ? data.settings.isApplyingServiceOpen : true;
            }
            if (translationToggle) {
                translationToggle.checked = data.settings.isTranslationServiceOpen !== undefined ? data.settings.isTranslationServiceOpen : true;
            }
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Sync registration status across all admin panels
let registrationSyncInterval = null;

async function syncRegistrationStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.success) {
            const toggle = document.getElementById('registrationToggle');
            if (toggle && toggle.checked !== data.settings.isRegistrationOpen) {
                // Update toggle without triggering change event
                toggle.checked = data.settings.isRegistrationOpen;
                console.log('✅ Registration status synced:', data.settings.isRegistrationOpen ? 'OPEN' : 'CLOSED');
            }
        }
    } catch (error) {
        console.error('Error syncing registration status:', error);
    }
}

// Start syncing registration status every 5 seconds
function startRegistrationSync() {
    if (registrationSyncInterval) {
        clearInterval(registrationSyncInterval);
    }
    // Sync every 5 seconds
    registrationSyncInterval = setInterval(syncRegistrationStatus, 5000);
}

// Stop syncing when logging out
function stopRegistrationSync() {
    if (registrationSyncInterval) {
        clearInterval(registrationSyncInterval);
        registrationSyncInterval = null;
    }
}

// Toggle Registration (No Confirmation)
document.getElementById('registrationToggle')?.addEventListener('change', async (e) => {
    const isOpen = e.target.checked;
    const action = isOpen ? 'OPEN' : 'CLOSE';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isRegistrationOpen: isOpen })
        });

        const data = await response.json();

        if (data.success) {
            console.log(`✅ Registration ${action === 'OPEN' ? 'opened' : 'closed'} successfully!`);
            // Trigger immediate sync to update all admin panels
            await syncRegistrationStatus();
        } else {
            console.error('❌ Error updating registration status');
            // Revert toggle on error
            e.target.checked = !isOpen;
        }
    } catch (error) {
        console.error('Error updating settings:', error);
        // Revert toggle on error
        e.target.checked = !isOpen;
    }
});

// Save Service Setting with Confirmation
async function saveServiceSetting(serviceType) {
    const toggleMap = {
        'cv': { toggle: 'cvServiceToggle', field: 'isCvServiceOpen', name: 'CV Service' },
        'applying': { toggle: 'applyingServiceToggle', field: 'isApplyingServiceOpen', name: 'Applying Service' },
        'translation': { toggle: 'translationServiceToggle', field: 'isTranslationServiceOpen', name: 'Translation Service' }
    };
    
    const config = toggleMap[serviceType];
    if (!config) return;
    
    const toggle = document.getElementById(config.toggle);
    if (!toggle) return;
    
    const isOpen = toggle.checked;
    const action = isOpen ? 'ENABLE' : 'DISABLE';
    const message = `Are you sure you want to ${action} ${config.name}?\n\n${isOpen ? 'Users will be able to submit requests.' : 'Users will NOT be able to submit requests.'}`;
    
    if (!confirm(message)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ [config.field]: isOpen })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`✅ ${config.name} ${isOpen ? 'enabled' : 'disabled'} successfully!`);
            console.log(`✅ ${config.name} ${isOpen ? 'enabled' : 'disabled'}`);
        } else {
            alert(`❌ Error updating ${config.name}`);
            toggle.checked = !isOpen;
        }
    } catch (error) {
        console.error(`Error updating ${config.name}:`, error);
        alert(`❌ Error updating ${config.name}`);
        toggle.checked = !isOpen;
    }
}

// Current category filter
let currentCategory = 'all';

// Load Students with caching
let studentsCache = null;
let studentsCacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

async function loadStudents(forceRefresh = false) {
    try {
        // Use cache if available and not expired
        if (!forceRefresh && studentsCache && (Date.now() - studentsCacheTime < CACHE_DURATION)) {
            allStudents = studentsCache;
            updateCategoryCounts();
            filterByCategory(currentCategory);
            document.getElementById('studentsLoading').style.display = 'none';
            document.getElementById('studentsGridContainer').style.display = 'block';
            return;
        }

        const response = await fetch(`${API_BASE_URL}/api/admin/students`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        // Check for 401 Unauthorized
        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        const data = await response.json();

        if (data.success) {
            allStudents = data.students;
            studentsCache = data.students;
            studentsCacheTime = Date.now();
            updateCategoryCounts();
            filterByCategory(currentCategory);
            document.getElementById('studentsLoading').style.display = 'none';
            document.getElementById('studentsGridContainer').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

// Refresh Registrations (without page reload)
async function refreshRegistrations() {
    const refreshBtn = document.getElementById('refreshRegistrationsBtn');
    const icon = refreshBtn?.querySelector('i');
    
    try {
        // Add spinning animation to icon
        if (icon) {
            icon.classList.add('fa-spin');
        }
        
        // Disable button during refresh
        if (refreshBtn) {
            refreshBtn.disabled = true;
        }
        
        console.log('🔄 Refreshing registrations...');
        
        // Force refresh students data
        await loadStudents(true);
        
        // Also refresh stats
        await loadStats();
        
        console.log('✅ Registrations refreshed successfully');
        
        // Show success feedback
        showRefreshSuccess();
        
    } catch (error) {
        console.error('❌ Error refreshing registrations:', error);
        alert('Failed to refresh registrations. Please try again.');
    } finally {
        // Remove spinning animation and re-enable button
        if (icon) {
            icon.classList.remove('fa-spin');
        }
        if (refreshBtn) {
            refreshBtn.disabled = false;
        }
    }
}

// Show refresh success feedback
function showRefreshSuccess() {
    const refreshBtn = document.getElementById('refreshRegistrationsBtn');
    if (!refreshBtn) return;
    
    const originalHTML = refreshBtn.innerHTML;
    refreshBtn.innerHTML = '<i class="fas fa-check"></i> <span>Refreshed!</span>';
    refreshBtn.style.background = 'var(--success-color)';
    
    setTimeout(() => {
        refreshBtn.innerHTML = originalHTML;
        refreshBtn.style.background = '';
    }, 2000);
}

// Update Category Counts
function updateCategoryCounts() {
    const counts = {
        all: allStudents.length,
        pending: allStudents.filter(s => s.status === 'pending').length,
        approved: allStudents.filter(s => s.status === 'approved').length,
        rejected: allStudents.filter(s => s.status === 'rejected').length
    };
    
    document.getElementById('allCount').textContent = counts.all;
    document.getElementById('pendingCount').textContent = counts.pending;
    document.getElementById('approvedCount').textContent = counts.approved;
    document.getElementById('rejectedCount').textContent = counts.rejected;
}

// Filter by Category
function filterByCategory(category) {
    currentCategory = category;
    
    // Update active tab
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.category === category) {
            tab.classList.add('active');
        }
    });
    
    // Update title with translation
    updateCategoryTitle(category);
    
    // Filter and display
    const filtered = category === 'all' ? allStudents : allStudents.filter(s => s.status === category);
    displayStudentsCards(filtered);
}

// Update category title with translation
function updateCategoryTitle(category) {
    if (!translations[currentLanguage]) {
        const titles = {
            'all': 'All Students',
            'pending': 'Pending Students',
            'approved': 'Approved Students',
            'rejected': 'Rejected Students'
        };
        document.getElementById('categoryTitle').textContent = titles[category];
        return;
    }
    
    const t = translations[currentLanguage].translations.admin;
    const titles = {
        'all': t.registrations.all_students,
        'pending': t.dashboard.pending + ' ' + t.registrations.all_students,
        'approved': t.dashboard.approved + ' ' + t.registrations.all_students,
        'rejected': t.dashboard.rejected + ' ' + t.registrations.all_students
    };
    document.getElementById('categoryTitle').textContent = titles[category] || titles['all'];
}

// Display Students as Cards
function displayStudentsCards(students) {
    const grid = document.getElementById('studentsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';

    if (students.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 40px;">No students in this category</p>';
        return;
    }

    students.forEach(student => {
        const card = document.createElement('div');
        card.className = 'student-card';
        const statusClass = student.status === 'pending' ? 'badge-pending' : 
                          student.status === 'approved' ? 'badge-approved' : 'badge-rejected';
        
        card.innerHTML = `
            <div class="student-card-header">
                <div>
                    <div class="student-name">${student.fullName}</div>
                    <span class="badge ${statusClass}">${student.status}</span>
                </div>
            </div>
            <div class="student-info">
                <div class="student-info-item">
                    <i class="fas fa-phone"></i>
                    <span>${student.phoneNumber}</span>
                </div>
                <div class="student-info-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${student.city}</span>
                </div>
                <div class="student-info-item">
                    <i class="fas fa-calendar"></i>
                    <span>${new Date(student.registrationDate).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="student-card-actions">
                ${student.status === 'pending' ? `
                    <button class="action-btn btn-success" onclick="updateStatus('${student._id}', 'approved')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="action-btn btn-danger" onclick="updateStatus('${student._id}', 'rejected')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                ` : ''}
                ${student.status === 'approved' ? `
                    <button class="action-btn btn-info" onclick="backupToMega('${student._id}', '${student.fullName.replace(/'/g, "\\'")}')">
                        <i class="fas fa-cloud"></i> Backup
                    </button>
                ` : ''}
                <button class="action-btn btn-info" onclick="viewStudent('${student._id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="action-btn btn-warning" onclick="downloadPDF('${student._id}', '${student.cin}')">
                    <i class="fas fa-download"></i> PDF
                </button>
                <button class="action-btn btn-danger" onclick="deleteStudent('${student._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Delete Student
async function deleteStudent(studentId) {
    if (!confirm('Delete this student? This action cannot be undone.')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/students/${studentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();
        if (data.success) {
            alert('✅ Student deleted successfully');
            await loadStudents();
            await loadStats();
        } else {
            alert('❌ Error deleting student');
        }
    } catch (error) {
        console.error('Error deleting student:', error);
        alert('❌ Error deleting student');
    }
}

// Clear Category
async function clearCategory() {
    const categoryNames = {
        'all': 'all registrations',
        'pending': 'pending registrations',
        'approved': 'approved registrations',
        'rejected': 'rejected registrations'
    };
    
    const message = `⚠️ Clear ${categoryNames[currentCategory]}?\n\nThis will permanently delete all students in this category. This action cannot be undone!`;
    
    if (!confirm(message)) return;
    
    const confirmText = prompt('Type "DELETE" to confirm:');
    if (confirmText !== 'DELETE') {
        alert('Cancelled');
        return;
    }
    
    try {
        const studentsToDelete = currentCategory === 'all' ? allStudents : allStudents.filter(s => s.status === currentCategory);
        
        for (const student of studentsToDelete) {
            await fetch(`${API_BASE_URL}/api/admin/students/${student._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
        }
        
        alert(`✅ Deleted ${studentsToDelete.length} students`);
        await loadStudents();
        await loadStats();
    } catch (error) {
        console.error('Error clearing category:', error);
        alert('❌ Error clearing category');
    }
}

// Download Category PDFs
async function downloadCategoryPDFs() {
    const students = currentCategory === 'all' ? allStudents : allStudents.filter(s => s.status === currentCategory);
    
    if (students.length === 0) {
        alert('No students to download');
        return;
    }
    
    alert(`Downloading ${students.length} PDFs... This may take a moment.`);
    
    for (const student of students) {
        await downloadPDF(student._id, student.cin);
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay between downloads
    }
}

// Update Student Status
async function updateStatus(studentId, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/students/${studentId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();

        if (data.success) {
            if (status === 'approved') {
                alert(`✅ Student approved successfully!\n\n☁️ PDF will be automatically backed up to Mega.nz (20GB FREE).`);
            } else {
                alert(`✅ Student ${status} successfully!`);
            }
            await loadStudents();
            await loadStats();
        } else {
            alert('❌ Error updating status');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('❌ Error updating status');
    }
}

// View Student Details
function viewStudent(studentId) {
    const student = allStudents.find(s => s._id === studentId);
    if (!student) return;

    const details = `
Name: ${student.fullName}
Date of Birth: ${student.dateOfBirth}
CIN: ${student.cin}
City: ${student.city}
Phone: ${student.phoneNumber}
Parent Phone: ${student.parentPhone}
Study Level: ${student.studyLevel}
Formation: ${student.formationChoisie?.join(', ') || 'N/A'}
Filiere: ${student.filiere?.join(', ') || 'N/A'}
Status: ${student.status}
Registration Date: ${new Date(student.registrationDate).toLocaleString()}
    `;

    alert(details);
}

// Download Student PDF
async function downloadPDF(studentId, cin) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/students/${studentId}/pdf`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `student_${cin}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            alert('Error downloading PDF');
        }
    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Error downloading PDF');
    }
}

// Menu Navigation
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        const tab = this.getAttribute('data-tab');
        
        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(mi => mi.classList.remove('active'));
        this.classList.add('active');
        
        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
        const targetTab = document.getElementById(tab + 'Tab');
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // Update page title
        const titles = {
            'dashboard': 'Dashboard',
            'registrations': 'Student Registrations',
            'messages': 'Contact Messages',
            'services': 'Service Requests',
            'employees': 'Employee Management',
            'activity': 'Activity Log',
            'sessions': 'Login Sessions',
            'settings': 'Settings'
        };
        document.getElementById('pageTitle').textContent = titles[tab] || 'Dashboard';
        
        // Load tab-specific data
        if (tab === 'messages') loadMessages();
        if (tab === 'services') {
            // Services now uses the new service type selection (job-applications.js)
            // Load service type counts instead of old loadServices
            if (typeof loadServiceTypeCounts === 'function') {
                loadServiceTypeCounts();
            }
        }
        if (tab === 'employees') {
            // Load all employee data in parallel for better performance
            Promise.all([
                loadEmployees(),
                loadEmployeePerformance(),
                loadEmployeeActivity()
            ]);
        }
        if (tab === 'activity') loadActivityLogs();
        if (tab === 'sessions') loadLoginSessions();
        if (tab === 'settings') {
            // Initialize system stats when Settings tab is opened
            if (typeof initializeSystemStats === 'function') {
                initializeSystemStats();
                startStatsAutoRefresh();
            }
        } else {
            // Stop auto-refresh when leaving Settings tab
            if (typeof stopStatsAutoRefresh === 'function') {
                stopStatsAutoRefresh();
            }
        }
    });
});

document.getElementById('mobileMenuToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('active');
});

// ========================================
// TRANSLATION SYSTEM
// ========================================

// Load Translations
async function loadTranslations() {
    try {
        const response = await fetch('/js/languages.json');
        const data = await response.json();
        translations = data;
        applyTranslations(currentLanguage);
    } catch (error) {
        console.error('Error loading translations:', error);
    }
}

// Apply Translations
function applyTranslations(lang) {
    if (!translations[lang]) return;
    
    const t = translations[lang].translations;
    
    // Update all elements with data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = getNestedTranslation(t, key);
        if (translation) {
            element.textContent = translation;
        }
    });
    
    // Update page title based on current tab
    updatePageTitle();
    
    // Update service category title if on services tab
    updateServiceCategoryTitle();
    
    // Update registration category title if on registrations tab
    if (typeof currentCategory !== 'undefined') {
        updateCategoryTitle(currentCategory);
    }
}

// Get nested translation
function getNestedTranslation(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Update page title
function updatePageTitle() {
    const activeTab = document.querySelector('.menu-item.active')?.getAttribute('data-tab');
    if (!activeTab || !translations[currentLanguage]) return;
    
    const t = translations[currentLanguage].translations.admin.menu;
    const titles = {
        'dashboard': t.dashboard,
        'registrations': t.registrations,
        'messages': t.messages,
        'services': t.services,
        'employees': t.employees,
        'activity': t.activity,
        'sessions': t.sessions,
        'settings': t.settings
    };
    
    if (titles[activeTab]) {
        document.getElementById('pageTitle').textContent = titles[activeTab];
    }
}

// Update service category title
function updateServiceCategoryTitle() {
    const activeCategory = document.querySelector('[data-service-category].active')?.getAttribute('data-service-category');
    if (!activeCategory || !translations[currentLanguage]) return;
    
    const t = translations[currentLanguage].translations.admin.services;
    const titles = {
        'all': t.all_services,
        'cv': t.cv,
        'applying': t.applying,
        'translation': t.translation
    };
    
    if (titles[activeCategory]) {
        document.getElementById('serviceCategoryTitle').textContent = titles[activeCategory];
    }
}

// Language Switcher with Dropdown
let currentLang = currentLanguage.toUpperCase();
const languageBtn = document.getElementById('languageBtn');
const languageDropdownMenu = document.getElementById('languageDropdownMenu');
const langDropdownIcon = document.getElementById('langDropdownIcon');
const currentLangText = document.getElementById('currentLangText');

// Toggle dropdown
languageBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    languageDropdownMenu.classList.toggle('active');
    langDropdownIcon.classList.toggle('rotated');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.language-dropdown')) {
        languageDropdownMenu?.classList.remove('active');
        langDropdownIcon?.classList.remove('rotated');
    }
});

// Handle language selection
document.querySelectorAll('.language-option').forEach(option => {
    option.addEventListener('click', (e) => {
        const selectedLang = option.getAttribute('data-lang');
        currentLang = selectedLang.toUpperCase();
        currentLanguage = selectedLang;
        
        // Update button text
        currentLangText.textContent = currentLang;
        
        // Update active state
        document.querySelectorAll('.language-option').forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        
        // Close dropdown
        languageDropdownMenu.classList.remove('active');
        langDropdownIcon.classList.remove('rotated');
        
        // Save preference
        localStorage.setItem('adminLanguage', currentLanguage);
        
        // Apply translations
        applyTranslations(currentLanguage);
        
        // Apply RTL for Arabic
        if (currentLanguage === 'ar') {
            document.body.setAttribute('dir', 'rtl');
        } else {
            document.body.setAttribute('dir', 'ltr');
        }
    });
});

// Set initial active language and update button text
document.querySelectorAll('.language-option').forEach(option => {
    if (option.getAttribute('data-lang') === currentLanguage) {
        option.classList.add('active');
    }
});

// Update button text to match saved language on page load
if (currentLangText) {
    currentLangText.textContent = currentLanguage.toUpperCase();
}

// Load Messages
async function loadMessages() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/messages`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.success) {
            // Display messages (implement as needed)
            console.log('Messages loaded:', data.messages);
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Load Employees
async function loadEmployees() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/employees`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.success) {
            // Display employees (implement as needed)
            console.log('Employees loaded:', data.employees);
        }
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

// Load Activity Logs
async function loadActivityLogs() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/activity-logs?limit=100`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.success) {
            // Display activity logs (implement as needed)
            console.log('Activity logs loaded:', data.logs);
        }
    } catch (error) {
        console.error('Error loading activity logs:', error);
    }
}

// Load Login Sessions
async function loadLoginSessions() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/login-sessions?limit=50`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.success) {
            // Display login sessions (implement as needed)
            console.log('Login sessions loaded:', data.sessions);
        }
    } catch (error) {
        console.error('Error loading login sessions:', error);
    }
}

// Save Registration Settings Form
document.getElementById('registrationSettingsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const contactPhone = document.getElementById('contactPhone').value;
    const isOpen = document.getElementById('registrationToggle').checked;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                isRegistrationOpen: isOpen,
                contactPhone: contactPhone 
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Settings saved successfully!');
        } else {
            alert('❌ Error saving settings');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('❌ Error saving settings');
    }
});

// Category Tab Click Handlers
document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const category = this.dataset.category;
        filterByCategory(category);
    });
});

// Load and Display Messages
async function loadMessages() {
    const loading = document.getElementById('messagesLoading');
    const container = document.getElementById('messagesTableContainer');
    const tbody = document.getElementById('messagesTableBody');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/messages`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.success) {
            tbody.innerHTML = '';
            data.messages.forEach(msg => {
                const row = document.createElement('tr');
                // Add click handler to mark message as read when clicked
                row.style.cursor = 'pointer';
                row.onclick = () => {
                    if (!msg.isRead) {
                        markAsRead(msg._id);
                    }
                };
                
                row.innerHTML = `
                    <td>${msg.fullName}</td>
                    <td>${msg.phoneNumber}</td>
                    <td style="max-width: 400px; white-space: normal; word-wrap: break-word; line-height: 1.5;">${msg.message}</td>
                    <td>${new Date(msg.createdAt).toLocaleDateString()}</td>
                    <td><span class="badge ${msg.isRead ? 'badge-approved' : 'badge-pending'}">${msg.isRead ? 'Read' : 'Unread'}</span></td>
                    <td>
                        ${!msg.isRead ? `<button class="action-btn btn-info" onclick="event.stopPropagation(); markAsRead('${msg._id}')"><i class="fas fa-check"></i> Mark Read</button>` : ''}
                        <button class="action-btn btn-danger" onclick="event.stopPropagation(); deleteMessage('${msg._id}')"><i class="fas fa-trash"></i> Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            loading.style.display = 'none';
            container.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Mark Message as Read
async function markAsRead(messageId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/messages/${messageId}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();
        if (data.success) {
            loadMessages();
        }
    } catch (error) {
        console.error('Error marking message as read:', error);
    }
}

// Delete Message
async function deleteMessage(messageId) {
    if (!confirm('Delete this message?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/messages/${messageId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();
        if (data.success) {
            loadMessages();
        }
    } catch (error) {
        console.error('Error deleting message:', error);
    }
}

// Load and Display Employees
async function loadEmployees() {
    const loading = document.getElementById('employeesLoading');
    const container = document.getElementById('employeesTableContainer');
    const tbody = document.getElementById('employeesTableBody');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/employees`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.success) {
            tbody.innerHTML = '';
            data.employees.forEach(emp => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${emp.username}</td>
                    <td>${emp.email || 'N/A'}</td>
                    <td><span class="badge ${emp.isActive ? 'badge-approved' : 'badge-rejected'}">${emp.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>${new Date(emp.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="action-btn btn-info" onclick="changeEmployeePassword('${emp._id}', '${emp.username}')">
                            <i class="fas fa-key"></i> Change Password
                        </button>
                        <button class="action-btn ${emp.isActive ? 'btn-warning' : 'btn-success'}" onclick="toggleEmployee('${emp._id}')">
                            <i class="fas fa-toggle-${emp.isActive ? 'off' : 'on'}"></i> ${emp.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button class="action-btn btn-danger" onclick="deleteEmployee('${emp._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            loading.style.display = 'none';
            container.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

// Toggle Employee Status
async function toggleEmployee(employeeId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/employees/${employeeId}/toggle`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();
        if (data.success) {
            loadEmployees();
        }
    } catch (error) {
        console.error('Error toggling employee:', error);
    }
}

// Change Employee Password
async function changeEmployeePassword(employeeId, username) {
    const newPassword = prompt(`Enter new password for ${username}:`);
    if (!newPassword) return;
    
    const confirmPassword = prompt('Confirm new password:');
    if (newPassword !== confirmPassword) {
        alert('❌ Passwords do not match!');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/employees/${employeeId}/change-password`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newPassword })
        });

        const data = await response.json();
        if (data.success) {
            alert(`✅ Password changed successfully for ${username}!`);
        } else {
            alert('❌ ' + (data.message || 'Error changing password'));
        }
    } catch (error) {
        console.error('Error changing employee password:', error);
        alert('❌ Error changing password');
    }
}

// Delete Employee
async function deleteEmployee(employeeId) {
    if (!confirm('Delete this employee? This action cannot be undone.')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/employees/${employeeId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();
        if (data.success) {
            loadEmployees();
        }
    } catch (error) {
        console.error('Error deleting employee:', error);
    }
}

// Load and Display Activity Logs
async function loadActivityLogs() {
    const loading = document.getElementById('activityLoading');
    const container = document.getElementById('activityTableContainer');
    const tbody = document.getElementById('activityTableBody');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin-activity/logs?limit=100`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.activities) {
            tbody.innerHTML = '';
            data.activities.forEach(log => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${log.adminUsername || 'System'}</td>
                    <td>${formatAction(log.action)}</td>
                    <td>${log.details || 'N/A'}</td>
                    <td>${new Date(log.timestamp).toLocaleString()}</td>
                `;
                tbody.appendChild(row);
            });
            loading.style.display = 'none';
            container.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading activity logs:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #ef4444;">Error loading activity logs</td></tr>';
    }
}

// Helper function to format action names
function formatAction(action) {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Helper function to get platform icon
function getPlatformIcon(platform) {
    const icons = {
        'web': '🌐',
        'desktop': '💻',
        'mobile': '📱',
        'unknown': '❓'
    };
    return icons[platform] || icons.unknown;
}

// Clear Activity Logs
async function clearActivityLogs() {
    if (!confirm('Clear ALL activity logs? This cannot be undone!')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/clear-activity-logs`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();
        if (data.success) {
            alert('Activity logs cleared successfully');
            loadActivityLogs();
        }
    } catch (error) {
        console.error('Error clearing activity logs:', error);
    }
}

// Load and Display Login Sessions
async function loadLoginSessions() {
    const loading = document.getElementById('sessionsLoading');
    const container = document.getElementById('sessionsTableContainer');
    const tbody = document.getElementById('sessionsTableBody');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin-activity/sessions?limit=50`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.sessions) {
            tbody.innerHTML = '';
            data.sessions.forEach(session => {
                const platform = session.platform || 'unknown';
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${session.adminUsername || 'Unknown'}</td>
                    <td>${session.ipAddress || 'N/A'}</td>
                    <td title="${session.userAgent}">${session.userAgent ? session.userAgent.substring(0, 50) + '...' : 'N/A'}</td>
                    <td>
                        <span class="platform-badge ${platform}">
                            ${getPlatformIcon(platform)} ${platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </span>
                    </td>
                    <td>${new Date(session.timestamp).toLocaleString()}</td>
                `;
                tbody.appendChild(row);
            });
            loading.style.display = 'none';
            container.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading login sessions:', error);
    }
}

// Clear Login Sessions
async function clearLoginSessions() {
    if (!confirm('Clear ALL login session history? This cannot be undone!')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/clear-login-sessions`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();
        if (data.success) {
            alert('Login sessions cleared successfully');
            loadLoginSessions();
        }
    } catch (error) {
        console.error('Error clearing login sessions:', error);
    }
}

// Download All Approved Students PDFs
async function downloadAllApproved() {
    const approved = allStudents.filter(s => s.status === 'approved');
    if (approved.length === 0) {
        alert('No approved students to download');
        return;
    }
    
    if (!confirm(`Download PDFs for ${approved.length} approved students?`)) return;
    
    alert('Download feature will be implemented with bulk PDF generation');
}

// Change Username Form
document.getElementById('changeUsernameForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newUsername = document.getElementById('newUsername').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/change-username`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newUsername })
        });

        const data = await response.json();
        if (data.success) {
            alert('Username updated successfully! Please login again.');
            localStorage.removeItem('adminToken');
            location.reload();
        } else {
            alert(data.message || 'Error updating username');
        }
    } catch (error) {
        console.error('Error changing username:', error);
        alert('Error updating username');
    }
});

// Change Password Form
document.getElementById('changePasswordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/change-password`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();
        if (data.success) {
            alert('Password updated successfully! Please login again.');
            localStorage.removeItem('adminToken');
            location.reload();
        } else {
            alert(data.message || 'Error updating password');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        alert('Error updating password');
    }
});

// Show Create Employee Modal
function showCreateEmployeeForm() {
    const modal = document.getElementById('addEmployeeModal');
    modal.classList.add('active');
    // Clear form
    document.getElementById('addEmployeeForm').reset();
}

// Close Employee Modal
function closeEmployeeModal() {
    const modal = document.getElementById('addEmployeeModal');
    modal.classList.remove('active');
}

// Handle Add Employee Form Submit
document.getElementById('addEmployeeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('empUsername').value;
    const email = document.getElementById('empEmail').value;
    const password = document.getElementById('empPassword').value;
    const confirmPassword = document.getElementById('empConfirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('❌ Passwords do not match!');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/create-employee`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        if (data.success) {
            alert('✅ Employee created successfully!');
            closeEmployeeModal();
            loadEmployees();
        } else {
            alert('❌ ' + (data.message || 'Error creating employee'));
        }
    } catch (error) {
        console.error('Error creating employee:', error);
        alert('❌ Error creating employee');
    }
});

// Load Employee Performance
async function loadEmployeePerformance() {
    const loading = document.getElementById('performanceLoading');
    const container = document.getElementById('performanceContainer');
    const grid = document.getElementById('performanceGrid');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/employee-performance`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.success) {
            grid.innerHTML = '';
            data.performance.forEach(emp => {
                const card = document.createElement('div');
                card.className = 'stat-card';
                card.innerHTML = `
                    <div class="stat-icon blue">
                        <i class="fas fa-user-tie"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${emp.employeeName}</h3>
                        <div class="number">${emp.loginsToday}</div>
                        <small style="color: var(--text-light);">Logins Today</small>
                    </div>
                `;
                grid.appendChild(card);
            });
            loading.style.display = 'none';
            container.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading employee performance:', error);
    }
}

// Load Employee Activity Dashboard
async function loadEmployeeActivity() {
    const loading = document.getElementById('activityDashboardLoading');
    const container = document.getElementById('activityDashboardContainer');
    const tbody = document.getElementById('activityDashboardBody');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin-activity/summary`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const summary = await response.json();

        if (summary && Array.isArray(summary)) {
            tbody.innerHTML = '';
            
            if (summary.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #6b7280;">No activity data available</td></tr>';
            } else {
                summary.forEach(employee => {
                    // Get top 3 actions
                    const topActions = employee.actionBreakdown ? 
                        Object.entries(employee.actionBreakdown)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 3)
                            .map(([action, count]) => `${formatAction(action)} (${count})`)
                            .join(', ') : 
                        'No actions yet';
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><strong>${employee.adminUsername}</strong></td>
                        <td>${topActions}</td>
                        <td><span style="background: #3b82f6; color: white; padding: 4px 12px; border-radius: 12px; font-weight: 600;">${employee.totalActions}</span></td>
                        <td>${new Date(employee.lastActivity).toLocaleString()}</td>
                    `;
                    tbody.appendChild(row);
                });
            }
            loading.style.display = 'none';
            container.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading employee activity:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #ef4444;">Error loading employee activity</td></tr>';
    }
}

// Clear Employee Activity
async function clearEmployeeActivity() {
    if (!confirm('Clear ALL employee activity data? This cannot be undone!')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/clear-employee-activity`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();
        if (data.success) {
            alert('Employee activity cleared successfully');
            loadEmployeeActivity();
        }
    } catch (error) {
        console.error('Error clearing employee activity:', error);
        alert('Error clearing employee activity');
    }
}

// Manual Backup to Mega.nz
async function backupToMega(studentId, studentName) {
    if (!confirm(`☁️ Backup ${studentName} to Mega.nz?\n\nThis will generate the PDF and upload it to your Mega cloud (20GB FREE).`)) {
        return;
    }
    
    try {
        alert(`☁️ Backing up ${studentName} to Mega.nz...\n\nThis may take a moment.`);
        
        const response = await fetch(`${API_BASE_URL}/api/admin/students/${studentId}/backup-dropbox`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ ${studentName} backed up successfully!\n\n☁️ File: ${data.backup.fileName}\n📅 Uploaded: ${new Date(data.backup.uploadedAt).toLocaleString()}`);
        } else {
            let errorMsg = '❌ Mega Backup Failed\n\n';
            errorMsg += data.message || 'Error backing up to Mega.nz';
            
            if (data.message && data.message.includes('not configured')) {
                errorMsg += '\n\n💡 Solution:\n';
                errorMsg += '1. Check Mega credentials in .env:\n';
                errorMsg += '   MEGA_EMAIL=your@email.com\n';
                errorMsg += '   MEGA_PASSWORD=your_password\n';
                errorMsg += '2. Restart server\n';
            }
            
            alert(errorMsg);
        }
    } catch (error) {
        console.error('Error backing up to Mega:', error);
        alert('❌ Error backing up to Mega.nz');
    }
}

// Check Cloud Status (Mega.nz)
async function checkCloudStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/cloud-status`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        // Check for 401 Unauthorized
        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        const data = await response.json();

        if (data.success) {
            const stats = data.statistics;
            const mega = data.mega;
            const cloudStatus = mega.connected ? '✅ Connected' : '❌ Not Connected';
            
            let message = `☁️ CLOUD BACKUP STATUS\n\n`;
            message += `Mega.nz: ${cloudStatus}\n`;
            if (mega.connected && mega.accountEmail) {
                message += `Account: ${mega.accountEmail}\n`;
                message += `Storage: ${mega.storageUsed} / ${mega.storageTotal} (${mega.storageAvailable} available)\n`;
            }
            message += `\n📊 Backup Statistics:\n`;
            message += `• Total Students: ${stats.totalStudents}\n`;
            message += `• Approved Students: ${stats.approvedStudents}\n`;
            message += `• Backed Up to Cloud: ${stats.backedUpStudents}\n`;
            message += `• Pending Backup: ${stats.pendingBackup}\n`;
            message += `• Backup Progress: ${stats.backupPercentage}%\n`;
            
            if (data.recentBackups && data.recentBackups.length > 0) {
                message += `\n📁 Recent Backups:\n`;
                data.recentBackups.slice(0, 5).forEach(backup => {
                    message += `• ${backup.studentName} - ${new Date(backup.backupDate).toLocaleDateString()}\n`;
                });
            }
            
            alert(message);
        } else {
            alert('❌ Error checking cloud status');
        }
    } catch (error) {
        console.error('Error checking cloud status:', error);
        alert('❌ Error checking cloud status');
    }
}

// ========================================
// SERVICES MANAGEMENT
// ========================================

let currentServiceCategory = 'all';

// Load Services
async function loadServices(category = 'all') {
    try {
        currentServiceCategory = category;
        document.getElementById('servicesLoading').style.display = 'block';
        document.getElementById('servicesTableContainer').style.display = 'none';

        const url = category === 'all' 
            ? `${API_BASE_URL}/api/services`
            : `${API_BASE_URL}/api/services?serviceType=${category}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.success) {
            displayServices(data.services);
            await loadServiceStats();
        }
    } catch (error) {
        console.error('Error loading services:', error);
        document.getElementById('servicesLoading').innerHTML = '❌ Error loading services';
    }
}

// Display Services
function displayServices(services) {
    const tbody = document.getElementById('servicesTableBody');
    tbody.innerHTML = '';
    
    // Get translations
    const t = translations[currentLanguage]?.translations?.admin?.services || {};

    if (services.length === 0) {
        const noRequestsText = t.no_requests || 'No service requests found';
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px;">${noRequestsText}</td></tr>`;
        document.getElementById('servicesLoading').style.display = 'none';
        document.getElementById('servicesTableContainer').style.display = 'block';
        return;
    }

    services.forEach(service => {
        const row = document.createElement('tr');
        
        // Service Type with icon
        let serviceIcon = '';
        let serviceLabel = '';
        if (service.serviceType === 'cv') {
            serviceIcon = '<i class="fas fa-file-alt"></i>';
            serviceLabel = t.cv_service || 'CV Service';
        } else if (service.serviceType === 'applying') {
            serviceIcon = '<i class="fas fa-briefcase"></i>';
            serviceLabel = t.applying_service || 'Applying Service';
        } else if (service.serviceType === 'translation') {
            serviceIcon = '<i class="fas fa-language"></i>';
            serviceLabel = t.translation_service || 'Translation Service';
        }

        // Status badge
        let statusClass = '';
        let statusText = service.status;
        if (service.status === 'pending') {
            statusClass = 'status-pending';
            statusText = t.pending || 'Pending';
        } else if (service.status === 'in-progress') {
            statusClass = 'status-approved';
            statusText = t.in_progress || 'In Progress';
        } else if (service.status === 'completed') {
            statusClass = 'status-completed';
            statusText = t.completed || 'Completed';
        } else if (service.status === 'cancelled') {
            statusClass = 'status-rejected';
            statusText = t.cancelled || 'Cancelled';
        }

        // Check if service has uploaded file
        let hasFile = false;
        let fileName = '';
        if (service.serviceType === 'cv' && service.cvDetails?.fileName) {
            hasFile = true;
            fileName = service.cvDetails.fileName;
        } else if (service.serviceType === 'applying' && service.applyingDetails?.fileName) {
            hasFile = true;
            fileName = service.applyingDetails.fileName;
        } else if (service.serviceType === 'translation' && service.translationDetails?.fileName) {
            hasFile = true;
            fileName = service.translationDetails.fileName;
        }

        // Download button (only if file exists)
        const downloadButton = hasFile ? `
            <button class="action-btn btn-sm" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;" 
                    onclick="downloadServiceFile('${service._id}', '${fileName}')" 
                    title="Download: ${fileName}">
                <i class="fas fa-download"></i>
            </button>
        ` : '';

        // Cloud backup button (only if completed and has file)
        const cloudButton = (service.status === 'completed' && hasFile) ? `
            <button class="action-btn btn-sm" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;" 
                    onclick="backupServiceToCloud('${service._id}')" 
                    title="Backup to Cloud">
                <i class="fas fa-cloud-upload-alt"></i>
            </button>
        ` : '';

        row.innerHTML = `
            <td>${serviceIcon} ${serviceLabel}</td>
            <td>${service.fullName}</td>
            <td>${service.phone}</td>
            <td>${service.email}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${new Date(service.createdAt).toLocaleDateString()}</td>
            <td class="actions-cell">
                <div class="action-buttons-group">
                    <button class="action-btn btn-sm" style="background: #3b82f6; color: white; border: none;" 
                            onclick="viewServiceDetails('${service._id}')" 
                            title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${downloadButton}
                    ${cloudButton}
                    <button class="action-btn btn-sm" style="background: #10b981; color: white; border: none;" 
                            onclick="updateServiceStatus('${service._id}', 'in-progress')" 
                            title="Mark In Progress">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="action-btn btn-sm" style="background: #f59e0b; color: white; border: none;" 
                            onclick="updateServiceStatus('${service._id}', 'completed')" 
                            title="Mark Completed">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="action-btn btn-sm" style="background: #ef4444; color: white; border: none;" 
                            onclick="deleteService('${service._id}')" 
                            title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('servicesLoading').style.display = 'none';
    document.getElementById('servicesTableContainer').style.display = 'block';
}

// Load Service Statistics
async function loadServiceStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/services/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.success) {
            const stats = data.stats;
            document.getElementById('cvServiceCount').textContent = stats.cv;
            document.getElementById('applyingServiceCount').textContent = stats.applying;
            document.getElementById('translationServiceCount').textContent = stats.translation;
            document.getElementById('pendingServicesCount').textContent = stats.pending;

            // Update tab counts
            document.getElementById('allServicesCount').textContent = stats.total;
            document.getElementById('cvTabCount').textContent = stats.cv;
            document.getElementById('applyingTabCount').textContent = stats.applying;
            document.getElementById('translationTabCount').textContent = stats.translation;
        }
    } catch (error) {
        console.error('Error loading service stats:', error);
    }
}

// View Service Details
async function viewServiceDetails(serviceId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/services/${serviceId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.success) {
            const service = data.service;
            let details = `📋 SERVICE REQUEST DETAILS\n\n`;
            details += `Service Type: ${service.serviceType.toUpperCase()}\n`;
            details += `Name: ${service.fullName}\n`;
            details += `Phone: ${service.phone}\n`;
            details += `Email: ${service.email}\n`;
            details += `Status: ${service.status}\n`;
            details += `Date: ${new Date(service.createdAt).toLocaleString()}\n\n`;

            if (service.serviceType === 'cv' && service.cvDetails) {
                details += `CV DETAILS:\n`;
                details += `Experience: ${service.cvDetails.experience || 'N/A'}\n`;
                details += `Education: ${service.cvDetails.education || 'N/A'}\n`;
                details += `Skills: ${service.cvDetails.skills || 'N/A'}\n`;
                if (service.cvDetails.fileName) {
                    details += `📎 Uploaded File: ${service.cvDetails.fileName}\n`;
                    details += `   File Size: ${(service.cvDetails.fileSize / 1024).toFixed(2)} KB\n`;
                }
                if (service.cvDetails.additionalInfo) {
                    details += `Additional Info: ${service.cvDetails.additionalInfo}\n`;
                }
            } else if (service.serviceType === 'applying' && service.applyingDetails) {
                details += `APPLYING DETAILS:\n`;
                details += `Target Position: ${service.applyingDetails.targetPosition || 'N/A'}\n`;
                details += `Target Company: ${service.applyingDetails.targetCompany || 'N/A'}\n`;
                details += `Experience: ${service.applyingDetails.experience || 'N/A'}\n`;
                details += `Qualifications: ${service.applyingDetails.qualifications || 'N/A'}\n`;
                if (service.applyingDetails.fileName) {
                    details += `📎 Uploaded File: ${service.applyingDetails.fileName}\n`;
                    details += `   File Size: ${(service.applyingDetails.fileSize / 1024).toFixed(2)} KB\n`;
                }
                if (service.applyingDetails.additionalInfo) {
                    details += `Additional Info: ${service.applyingDetails.additionalInfo}\n`;
                }
            } else if (service.serviceType === 'translation' && service.translationDetails) {
                details += `TRANSLATION DETAILS:\n`;
                details += `From: ${service.translationDetails.sourceLanguage || 'N/A'}\n`;
                details += `To: ${service.translationDetails.targetLanguage || 'N/A'}\n`;
                details += `Document Type: ${service.translationDetails.documentType || 'N/A'}\n`;
                details += `Page Count: ${service.translationDetails.pageCount || 'N/A'}\n`;
                details += `Urgency: ${service.translationDetails.urgency || 'N/A'}\n`;
                if (service.translationDetails.fileName) {
                    details += `📎 Uploaded File: ${service.translationDetails.fileName}\n`;
                    details += `   File Size: ${(service.translationDetails.fileSize / 1024).toFixed(2)} KB\n`;
                }
                if (service.translationDetails.additionalInfo) {
                    details += `Additional Info: ${service.translationDetails.additionalInfo}\n`;
                }
            }

            if (service.notes) {
                details += `\nNOTES: ${service.notes}\n`;
            }

            alert(details);
        }
    } catch (error) {
        console.error('Error viewing service:', error);
        alert('❌ Error loading service details');
    }
}

// Update Service Status
async function updateServiceStatus(serviceId, newStatus) {
    try {
        const notes = prompt(`Update status to "${newStatus}". Add notes (optional):`);
        if (notes === null) return; // User cancelled

        const response = await fetch(`${API_BASE_URL}/api/services/${serviceId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus, notes })
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ Service status updated to ${newStatus}`);
            loadServices(currentServiceCategory);
        } else {
            alert(`❌ ${data.message}`);
        }
    } catch (error) {
        console.error('Error updating service status:', error);
        alert('❌ Error updating service status');
    }
}

// Delete Service
async function deleteService(serviceId) {
    if (!confirm('Are you sure you want to delete this service request?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/services/${serviceId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Service request deleted');
            loadServices(currentServiceCategory);
        } else {
            alert(`❌ ${data.message}`);
        }
    } catch (error) {
        console.error('Error deleting service:', error);
        alert('❌ Error deleting service');
    }
}

// Download Service File
async function downloadServiceFile(serviceId, fileName) {
    try {
        console.log(`📥 Downloading file: ${fileName}`);
        
        const response = await fetch(`${API_BASE_URL}/api/services/${serviceId}/download`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Download failed');
        }

        // Get the file blob
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log(`✅ File downloaded: ${fileName}`);
    } catch (error) {
        console.error('Error downloading file:', error);
        alert(`❌ Error downloading file: ${error.message}`);
    }
}

// Backup Service to Cloud (Organized by Year/Month)
async function backupServiceToCloud(serviceId) {
    try {
        console.log(`☁️ Backing up service to cloud: ${serviceId}`);
        
        const response = await fetch(`${API_BASE_URL}/api/services/${serviceId}/backup`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ Service backed up to cloud!\n\nLocation: ${data.backupPath}`);
        } else {
            throw new Error(data.message || 'Backup failed');
        }
    } catch (error) {
        console.error('Error backing up service:', error);
        alert(`❌ Error backing up to cloud: ${error.message}`);
    }
}

// Refresh Services
function refreshServices() {
    loadServices(currentServiceCategory);
}

// Export Services Data
async function exportServicesData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/services`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.success) {
            const csv = convertServicesToCSV(data.services);
            downloadCSV(csv, 'service-requests.csv');
        }
    } catch (error) {
        console.error('Error exporting services:', error);
        alert('❌ Error exporting data');
    }
}

// Convert Services to CSV
function convertServicesToCSV(services) {
    const headers = ['Service Type', 'Full Name', 'Phone', 'Email', 'Status', 'Date', 'Notes'];
    const rows = services.map(s => [
        s.serviceType,
        s.fullName,
        s.phone,
        s.email,
        s.status,
        new Date(s.createdAt).toLocaleString(),
        s.notes || ''
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

// Download CSV
function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Service Category Tab Switching
document.querySelectorAll('[data-service-category]').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('[data-service-category]').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        const category = this.dataset.serviceCategory;
        loadServices(category);
        
        // Update title
        const titles = {
            'all': 'All Service Requests',
            'cv': 'CV Service Requests',
            'applying': 'Applying Service Requests',
            'translation': 'Translation Service Requests'
        };
        document.getElementById('serviceCategoryTitle').textContent = titles[category];
    });
});

// Make functions globally accessible
window.updateStatus = updateStatus;
window.viewStudent = viewStudent;
window.downloadPDF = downloadPDF;
window.deleteStudent = deleteStudent;
window.clearCategory = clearCategory;
window.downloadCategoryPDFs = downloadCategoryPDFs;
window.markAsRead = markAsRead;
window.deleteMessage = deleteMessage;
window.toggleEmployee = toggleEmployee;
window.changeEmployeePassword = changeEmployeePassword;
window.deleteEmployee = deleteEmployee;
window.clearActivityLogs = clearActivityLogs;
window.clearLoginSessions = clearLoginSessions;
window.downloadAllApproved = downloadAllApproved;
window.showCreateEmployeeForm = showCreateEmployeeForm;
window.closeEmployeeModal = closeEmployeeModal;
window.loadEmployeePerformance = loadEmployeePerformance;
window.loadEmployeeActivity = loadEmployeeActivity;
window.clearEmployeeActivity = clearEmployeeActivity;
window.backupToMega = backupToMega;
window.checkCloudStatus = checkCloudStatus;
window.saveServiceSetting = saveServiceSetting;
window.loadServices = loadServices;
window.viewServiceDetails = viewServiceDetails;
window.updateServiceStatus = updateServiceStatus;
window.deleteService = deleteService;
window.downloadServiceFile = downloadServiceFile;
window.backupServiceToCloud = backupServiceToCloud;
window.refreshServices = refreshServices;
window.exportServicesData = exportServicesData;

// Close mobile menu when clicking menu items
document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('sidebar');
                if (sidebar && sidebar.classList.contains('mobile-open')) {
                    window.toggleMobileMenu();
                }
            }
        });
    });
});
