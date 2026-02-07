// Student Management System - Frontend JavaScript
const API_BASE = '/api/student-management';
let authToken = localStorage.getItem('adminToken');
let currentUser = null;
let allGroups = [];
let allStudents = [];
let cachedBranchSubgroups = null; // Cache for branch subgroups
let branchSubgroupsLoadTime = null; // Track when cache was loaded

// Pagination state
const STUDENTS_PER_PAGE = 9; // Show 9 students per page
let currentPage = 1;
let totalStudents = 0;
let filteredStudents = [];

// Helper function to validate photo path
function isValidPhotoPath(photoPath) {
    if (!photoPath) return false;
    if (photoPath.includes('undefined') || photoPath.includes('null')) return false;
    return true;
}

// Helper function to normalize photo path
function normalizePhotoPath(photoPath) {
    if (!photoPath) return null;
    
    // If it's already a base64 data URI, return as-is
    if (photoPath.startsWith('data:')) {
        return photoPath;
    }
    
    // If it's a Mega.nz media URL, return as-is
    if (photoPath.startsWith('/api/media/')) {
        return photoPath;
    }
    
    // If it's a relative path starting with /uploads, return as-is
    if (photoPath.startsWith('/uploads')) {
        return photoPath;
    }
    
    // If it's just a filename (old format), prepend /uploads/managed-students/
    if (photoPath.includes('student-') && photoPath.endsWith('.png')) {
        return `/uploads/managed-students/${photoPath}`;
    }
    
    // For any other case, return as-is
    return photoPath;
}

// Photo cache to avoid re-fetching
const photoCache = new Map();

// Intersection Observer for lazy loading photos (only load when visible)
let photoObserver = null;

function initPhotoObserver() {
    if (photoObserver) return;
    
    photoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const studentId = img.dataset.studentId;
                if (studentId && !img.src) {
                    loadStudentPhoto(studentId, img);
                    photoObserver.unobserve(img); // Stop observing once loaded
                }
            }
        });
    }, {
        rootMargin: '50px' // Start loading 50px before element is visible
    });
}

// Lazy load student photo
async function loadStudentPhoto(studentId, photoElement) {
    // Check cache first
    if (photoCache.has(studentId)) {
        const photoPath = photoCache.get(studentId);
        if (photoPath) {
            photoElement.src = normalizePhotoPath(photoPath);
            photoElement.style.display = 'block';
        }
        return;
    }
    
    // Show loading spinner
    photoElement.style.opacity = '0.5';
    
    try {
        const response = await fetch(`${API_BASE}/students/${studentId}/photo`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.photoPath) {
                const normalizedPath = normalizePhotoPath(data.photoPath);
                photoCache.set(studentId, normalizedPath);
                photoElement.src = normalizedPath;
                photoElement.style.display = 'block';
                photoElement.style.opacity = '1';
            } else {
                // No photo available
                photoElement.style.opacity = '1';
            }
        }
    } catch (error) {
        console.error('Error loading photo for student:', studentId, error);
        photoElement.style.opacity = '1';
    }
}

// Season context - synced with Phase 2 (using legacy prefix to avoid conflicts)
let legacyCurrentSeasonId = null;
let legacyCurrentSeasonName = null;
let legacyActiveSeasonId = null;  // Track the actual active season ID

// Initialize season context from Phase 2 on page load
async function initializeSeasonContext() {
    try {
        // Try to get the active season from backend
        const response = await fetch('/api/seasons/current', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const season = await response.json();
            legacyCurrentSeasonId = season._id;
            legacyCurrentSeasonName = season.name;
            legacyActiveSeasonId = season._id;  // Store active season ID
            console.log('✅ Legacy system initialized with active season:', season.name);
        } else {
            console.log('ℹ️ No active season found - will show all groups');
        }
    } catch (error) {
        console.warn('⚠️ Could not initialize season context:', error);
    }
}

// Load season filter dropdown
async function loadSeasonFilter() {
    const seasonFilter = document.getElementById('seasonFilter');
    
    // If element doesn't exist, skip silently
    if (!seasonFilter) {
        console.log('ℹ️ Season filter element not found - skipping');
        return;
    }
    
    try {
        const response = await fetch('/api/seasons', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            console.warn('Could not load seasons for filter - status:', response.status);
            return;
        }
        
        const seasons = await response.json();
        
        if (!Array.isArray(seasons) || seasons.length === 0) {
            console.warn('No seasons available');
            return;
        }
        
        // Clear existing options (no "All Seasons" option)
        seasonFilter.innerHTML = '';
        
        // Add seasons (active first, then upcoming, then archived)
        const sortedSeasons = seasons.sort((a, b) => {
            const order = { 'active': 0, 'upcoming': 1, 'archived': 2 };
            return order[a.status] - order[b.status];
        });
        
        let activeSeasonFound = false;
        
        sortedSeasons.forEach(season => {
            const option = document.createElement('option');
            option.value = season._id;
            option.textContent = `${season.name} ${season.status === 'active' ? '(Active)' : season.status === 'archived' ? '(Archived)' : '(Upcoming)'}`;
            
            // Pre-select active season
            if (season.status === 'active') {
                option.selected = true;
                legacyCurrentSeasonId = season._id;
                legacyCurrentSeasonName = season.name;
                legacyActiveSeasonId = season._id;  // Store active season ID
                activeSeasonFound = true;
            }
            
            seasonFilter.appendChild(option);
        });
        
        // If no active season, select the first one
        if (!activeSeasonFound && sortedSeasons.length > 0) {
            seasonFilter.selectedIndex = 0;
            legacyCurrentSeasonId = sortedSeasons[0]._id;
            legacyCurrentSeasonName = sortedSeasons[0].name;
        }
        
        console.log('✅ Season filter loaded with', seasons.length, 'seasons');
    } catch (error) {
        console.error('Error loading season filter:', error);
        // Don't throw - just log and continue
    }
}

// Listen for season changes from Phase 2 system
document.addEventListener('seasonSelected', (event) => {
    console.log('🔄 Legacy system: Season changed to', event.detail);
    legacyCurrentSeasonId = event.detail.seasonId;
    legacyCurrentSeasonName = event.detail.seasonName;
    
    // Update season dropdown to match
    const seasonFilter = document.getElementById('seasonFilter');
    if (seasonFilter) {
        seasonFilter.value = event.detail.seasonId;
        console.log('🔄 Season dropdown updated to:', event.detail.seasonName);
    }
    
    // Reload data if on students tab
    const studentsTab = document.getElementById('studentsTab');
    if (studentsTab && studentsTab.classList.contains('active')) {
        console.log('🔄 Reloading students for new season');
        loadStudents();
        updateGroupFilters();
    }
    
    // Clear branch subgroups cache when season changes
    cachedBranchSubgroups = null;
    branchSubgroupsLoadTime = null;
});

// Language Management
function toggleLanguageMenu() {
    const menu = document.getElementById('langMenu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function changeLanguage(lang) {
    setCurrentLanguage(lang);
    updateLanguageDisplay();
    translatePage();
    document.getElementById('langMenu').style.display = 'none';
    
    // Reload data to apply translations
    loadDashboardStats();
    loadGroups();
    loadStudents();
    loadPaymentReminders();
}

function updateLanguageDisplay() {
    const lang = getCurrentLanguage();
    const langMap = { de: 'DE', en: 'EN', fr: 'FR', ar: 'AR' };
    document.getElementById('currentLang').textContent = langMap[lang] || 'DE';
}

function translatePage() {
    // Translate all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = t(key);
    });
    
    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });
    
    // Update page title based on current tab
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        const tabName = activeTab.id.replace('-tab', '');
        updateHeaderActions(tabName);
    }
}

// Check authentication
document.addEventListener('DOMContentLoaded', async () => {
    if (!authToken) {
        window.location.href = '/admin';
        return;
    }
    
    try {
        const response = await fetch('/api/admin/verify', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            throw new Error('Invalid token');
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error('Verification failed');
        }
        
        currentUser = data;
        
        // Show Teachers menu item only for super admin or dev
        if (currentUser.role === 'super_admin' || currentUser.role === 'dev') {
            const teachersMenuItem = document.getElementById('teachersMenuItem');
            if (teachersMenuItem) {
                teachersMenuItem.style.display = 'block';
            }
        }
        
        // Show Seasons & Groups for all admins (both super_admin and admin)
        const seasonsMenuItem = document.getElementById('seasonsMenuItem');
        if (seasonsMenuItem) {
            seasonsMenuItem.style.display = 'block';
        }
        
        // Initialize language
        updateLanguageDisplay();
        translatePage();
        
        // Initialize season context from Phase 2 (if available)
        await initializeSeasonContext();
        
        // Load season dropdown (non-critical - don't fail if it errors)
        try {
            await loadSeasonFilter();
        } catch (err) {
            console.warn('Could not load season filter:', err);
        }
        
        // Update payment tab visibility on page load
        updatePaymentTabVisibility();
        
        await loadDashboardStats();
        await loadGroups();
        await loadStudents();
        await loadPaymentReminders();
        
        // Preload branch subgroups cache in background (don't await - non-blocking)
        loadBranchSubgroupsAsync().catch(err => console.log('Background cache load failed:', err));
        
        // Initialize header actions for dashboard
        updateHeaderActions('dashboard');
    } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('adminToken');
        window.location.href = '/admin';
    }
});

// API Helper
async function apiRequest(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: { ...defaultOptions.headers, ...options.headers }
    };
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, mergedOptions);
        
        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin';
            return null;
        }
        
        if (response.status === 403) {
            const data = await response.json();
            throw new Error(data.error || 'Access denied. Super admin only.');
        }
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `Request failed with status ${response.status}`);
        }
        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Dashboard
async function loadDashboardStats() {
    try {
        const data = await apiRequest('/dashboard/stats');
        if (data && data.success) {
            document.getElementById('totalGroups').textContent = data.stats.totalGroups;
            document.getElementById('totalStudents').textContent = data.stats.totalStudents;
            document.getElementById('upcomingPayments').textContent = data.stats.upcomingPayments;
            document.getElementById('overduePayments').textContent = data.stats.overduePayments;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Update header actions based on current tab
function updateHeaderActions(tabName) {
    const headerActions = document.getElementById('headerActions');
    if (!headerActions) {
        console.error('headerActions element not found!');
        return;
    }
    
    console.log('Updating header actions for tab:', tabName);
    
    // Preserve language switcher element (not just HTML to keep event listeners)
    const langSwitcher = headerActions.querySelector('.language-switcher');
    
    // Remove all buttons except language switcher
    const buttons = headerActions.querySelectorAll('button:not(.language-switcher button)');
    buttons.forEach(btn => {
        if (!btn.closest('.language-switcher')) {
            btn.remove();
        }
    });
    
    // Add new buttons based on tab
    if (tabName === 'groups') {
        // Show create group button for all authenticated admins
        const createBtn = document.createElement('button');
        createBtn.className = 'btn';
        createBtn.onclick = openCreateGroupModal;
        createBtn.innerHTML = `<i class="fas fa-plus"></i> ${t('createGroup')}`;
        headerActions.appendChild(createBtn);
        console.log('Added Create Group button');
    } else if (tabName === 'students') {
        // Export button removed as per user request
        
        const addBtn = document.createElement('button');
        addBtn.className = 'btn';
        addBtn.onclick = openNewStudentForm; // Phase 2.1: New student form
        addBtn.innerHTML = `<i class="fas fa-plus"></i> ${t('addStudent')}`;
        headerActions.appendChild(addBtn);
        console.log('Added Add Student button');
    } else {
        console.log('No buttons for tab:', tabName);
    }
}

// Tab Switching
async function switchTab(tabName) {
    // Update sidebar menu - find the correct menu item
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        // Check if this menu item is for the current tab
        const itemText = item.textContent.trim().toLowerCase();
        if ((tabName === 'dashboard' && itemText.includes('dashboard')) ||
            (tabName === 'groups' && itemText.includes('groups')) ||
            (tabName === 'seasons' && itemText.includes('seasons')) ||
            (tabName === 'students' && itemText.includes('students')) ||
            (tabName === 'reminders' && itemText.includes('payment')) ||
            (tabName === 'grades' && itemText.includes('grades')) ||
            (tabName === 'attendance' && itemText.includes('attendance')) ||
            (tabName === 'teachers' && itemText.includes('teachers'))) {
            item.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    const tabContent = document.getElementById(`${tabName}-tab`);
    if (tabContent) {
        tabContent.classList.add('active');
    }
    
    // Update page title
    const titleKeys = {
        'dashboard': 'dashboard',
        'groups': 'groupsManagement',
        'seasons': 'seasonsManagement',
        'branchGroups': 'branchGroupsManagement',
        'students': 'studentsManagement',
        'reminders': 'paymentRemindersTitle',
        'overdue': 'overduePaymentsTitle',
        'grades': 'studentGrades',
        'attendance': 'attendanceMonitoring',
        'teachers': 'teacherManagement'
    };
    const pageTitleEl = document.getElementById('pageTitle');
    if (pageTitleEl) {
        pageTitleEl.textContent = t(titleKeys[tabName] || 'dashboard');
        pageTitleEl.setAttribute('data-i18n', titleKeys[tabName] || 'dashboard');
    }
    
    // Load data for specific tabs
    if (tabName === 'grades') {
        // Load season filter first, which will also load groups and students
        await loadGradesSeasonFilter();
    } else if (tabName === 'teachers') {
        loadTeachers();
    } else if (tabName === 'seasons') {
        // Load seasons and branch groups for the main view
        loadSeasons();
        loadBranchGroups();
    } else if (tabName === 'reminders') {
        loadOverdueStudents();
    } else if (tabName === 'attendance') {
        if (typeof initializeAttendance === 'function') {
            initializeAttendance();
        }
    }
    
    // Update header actions immediately
    updateHeaderActions(tabName);
}

// Store all students for filtering
let allGradesStudents = [];

// Populate student filter for grades tab
async function populateStudentFilter() {
    const studentFilter = document.getElementById('gradesStudentFilter');
    if (!studentFilter) return;
    
    try {
        // Get selected season and group from filters
        const seasonId = document.getElementById('gradesSeasonFilter')?.value;
        const groupId = document.getElementById('gradesGroupFilter')?.value;
        
        // Build query with season and group parameters
        const params = new URLSearchParams();
        if (seasonId) {
            params.append('season', seasonId);
        }
        if (groupId) {
            params.append('group', groupId);
        }
        // Remove the limit to get ALL students (not just 50)
        params.append('limit', '1000');
        
        console.log('📥 Fetching students for grades tab:', { seasonId, groupId });
        
        // Fetch students for the selected season/group
        const data = await apiRequest(`/students?${params.toString()}`);
        
        if (data && data.success) {
            allGradesStudents = data.students;
            
            console.log(`✅ Loaded ${allGradesStudents.length} students for grades tab`);
            
            // Don't populate the dropdown here - let filterGradesStudents() handle it
            // This ensures the dropdown is always filtered by group/search
            studentFilter.innerHTML = `<option value="">${t('selectStudent')}</option>`;
            
            // Trigger filtering to populate the dropdown based on current filters
            filterGradesStudents();
        }
    } catch (error) {
        console.error('Error loading students for grades:', error);
        allGradesStudents = [];
        studentFilter.innerHTML = `<option value="">${t('selectStudent')}</option>`;
    }
}

// Load season filter for grades page
async function loadGradesSeasonFilter() {
    try {
        const response = await fetch('/api/seasons', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            console.warn('Could not load seasons for grades filter');
            return;
        }
        
        const seasons = await response.json();
        const seasonFilter = document.getElementById('gradesSeasonFilter');
        
        if (!seasonFilter) return;
        
        // Clear existing options
        seasonFilter.innerHTML = '';
        
        // Sort: Active first, then upcoming, then archived
        const sortedSeasons = seasons.sort((a, b) => {
            const order = { 'active': 0, 'upcoming': 1, 'archived': 2 };
            return order[a.status] - order[b.status];
        });
        
        sortedSeasons.forEach(season => {
            const option = document.createElement('option');
            option.value = season._id;
            option.textContent = `${season.name} ${season.status === 'active' ? '(Active)' : season.status === 'archived' ? '(Archived)' : '(Upcoming)'}`;
            
            // Pre-select active season
            if (season.status === 'active') {
                option.selected = true;
            }
            
            seasonFilter.appendChild(option);
        });
        
        console.log('✅ Grades season filter loaded with', seasons.length, 'seasons');
        
        // Also load groups for the group filter
        await loadGradesGroupFilter();
        
        // Then populate student filter
        await populateStudentFilter();
    } catch (error) {
        console.error('Error loading grades season filter:', error);
    }
}

// Load group filter for grades page
async function loadGradesGroupFilter() {
    try {
        // Get selected season to filter groups
        const seasonId = document.getElementById('gradesSeasonFilter')?.value;
        
        const response = await fetch('/api/student-management/groups', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            console.warn('Could not load groups for grades filter');
            return;
        }
        
        const data = await response.json();
        let groups = data.groups || [];
        
        // Filter groups by selected season
        if (seasonId) {
            groups = groups.filter(group => {
                const groupSeasonId = group.season?._id?.toString() || group.season?.toString();
                return groupSeasonId === seasonId;
            });
            console.log(`🔍 Filtered to ${groups.length} groups for season ${seasonId}`);
        }
        
        const groupFilter = document.getElementById('gradesGroupFilter');
        
        if (!groupFilter) return;
        
        // Clear existing options (keep "All Groups")
        groupFilter.innerHTML = '<option value="">All Groups</option>';
        
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group._id;
            option.textContent = `${group.name} (${group.formation})`;
            groupFilter.appendChild(option);
        });
        
        console.log('✅ Grades group filter loaded with', groups.length, 'groups');
    } catch (error) {
        console.error('Error loading grades group filter:', error);
    }
}

// Filter students in grades dropdown based on search, season, and group
function filterGradesStudents() {
    const searchTerm = document.getElementById('gradesStudentSearch').value.toLowerCase();
    const seasonId = document.getElementById('gradesSeasonFilter')?.value;
    const groupId = document.getElementById('gradesGroupFilter')?.value;
    const studentFilter = document.getElementById('gradesStudentFilter');
    
    if (!studentFilter) return;
    
    console.log('🔍 Filtering students:', { searchTerm, seasonId, groupId, totalStudents: allGradesStudents.length });
    
    const currentValue = studentFilter.value;
    studentFilter.innerHTML = `<option value="">${t('selectStudent')}</option>`;
    
    let firstMatchId = null;
    let matchCount = 0;
    
    allGradesStudents.forEach(student => {
        const name = student.fullName.toLowerCase();
        const email = (student.schoolEmail || '').toLowerCase();
        const phones = (student.phones || []).join(' ').toLowerCase();
        
        // Filter by season if selected
        const studentSeasonId = student.group?.season?.toString();
        const matchesSeason = !seasonId || studentSeasonId === seasonId;
        
        // Filter by group if selected
        const studentGroupId = student.group?._id?.toString() || student.group?.toString();
        const matchesGroup = !groupId || studentGroupId === groupId;
        
        // Check if search term matches name, email, or phone AND season AND group match
        const nameMatch = name.includes(searchTerm);
        const emailMatch = email.includes(searchTerm);
        const phoneMatch = phones.includes(searchTerm);
        const searchMatch = !searchTerm || nameMatch || emailMatch || phoneMatch;
        
        // Debug logging for first student when filtering by group or searching
        if ((groupId || searchTerm) && matchCount === 0) {
            console.log(`🔎 First student check: "${student.fullName}"`);
            console.log(`   Group: ${studentGroupId} vs ${groupId} = ${matchesGroup}`);
            console.log(`   Season: ${studentSeasonId} vs ${seasonId} = ${matchesSeason}`);
            console.log(`   Search: "${searchTerm}" in "${name}" = ${nameMatch}`);
        }
        
        if (matchesSeason && matchesGroup && searchMatch) {
            const option = document.createElement('option');
            option.value = student._id;
            option.textContent = student.fullName;
            studentFilter.appendChild(option);
            
            // Track first match
            if (!firstMatchId) {
                firstMatchId = student._id;
            }
            matchCount++;
        }
    });
    
    console.log(`✅ Found ${matchCount} matching students, first match: ${firstMatchId}`);
    
    // If no students found when group is selected, show which groups have students
    if (matchCount === 0 && groupId) {
        const groupsWithStudents = {};
        allGradesStudents.forEach(s => {
            const gId = s.group?._id?.toString() || s.group?.toString();
            if (gId) {
                groupsWithStudents[gId] = (groupsWithStudents[gId] || 0) + 1;
            }
        });
        console.log('📊 Students per group in loaded data:', groupsWithStudents);
        console.log('🔍 Selected group ID:', groupId);
    }
    
    // Auto-select and load first matching student if there's a search term
    if (searchTerm && firstMatchId) {
        studentFilter.value = firstMatchId;
        loadStudentGrades();
    } else if (!searchTerm && currentValue) {
        // Restore previous selection if no search term
        studentFilter.value = currentValue;
    } else if (!searchTerm) {
        // Clear grades if no search and no previous selection
        const gradesContent = document.getElementById('gradesContent');
        if (gradesContent) {
            gradesContent.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-light);">
                    <i class="fas fa-user-graduate" style="font-size: 3rem; color: var(--primary-color); opacity: 0.3; margin-bottom: 15px;"></i>
                    <p>Select a student to view their grades</p>
                </div>
            `;
        }
    }
}

// Groups
async function loadGroups() {
    try {
        const data = await apiRequest('/groups');
        if (data && data.success) {
            allGroups = data.groups;
            displayGroups(data.groups);
            updateGroupFilters();
        }
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

function displayGroups(groups) {
    const grid = document.getElementById('groupsGrid');
    if (groups.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-layer-group"></i><h3>No Groups Yet</h3></div>';
        return;
    }
    
    grid.innerHTML = groups.map(group => `
        <div class="group-card">
            <h3>${group.name}</h3>
            <div class="group-info">
                <span><i class="fas fa-users"></i> ${group.currentStudentCount}/${group.maxStudents}</span>
                <span class="badge badge-${group.status === 'active' ? 'success' : 'warning'}">${group.status}</span>
            </div>
            <div class="group-info"><span><i class="fas fa-book"></i> ${group.formation}</span></div>
            <p style="color: var(--text-gray); margin-top: 10px;">${group.description || 'No description'}</p>
            <div class="group-actions">
                <button class="btn btn-small" onclick="viewGroupStudents('${group._id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-small btn-info" onclick="openGroupMessageModal('${group._id}', '${group.name}', ${group.currentStudentCount})" title="Send message to all students in this group">
                    <i class="fas fa-paper-plane"></i> Message
                </button>
                <button class="btn btn-small btn-secondary" onclick="editGroup('${group._id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteGroup('${group._id}', '${group.name}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Students
async function loadStudents(resetPage = true) {
    try {
        const params = new URLSearchParams();
        const search = document.getElementById('studentSearch')?.value;
        const groupValue = document.getElementById('groupFilter')?.value;
        const formation = document.getElementById('formationFilter')?.value;
        const branch = document.getElementById('branchFilter')?.value;
        const paymentStatus = document.getElementById('paymentStatusFilter')?.value;
        
        // Reset to page 1 when filters change
        if (resetPage) {
            currentPage = 1;
        }
        
        // Add season filter - use current season context
        if (legacyCurrentSeasonId) {
            params.append('season', legacyCurrentSeasonId);
            console.log('🔍 Loading students for season:', legacyCurrentSeasonId);
        } else {
            console.log('ℹ️ No season context - will load active season students');
        }
        
        if (search) params.append('search', search);
        
        // Handle group filter - check if it's a language group or branch subgroup
        if (groupValue) {
            if (groupValue.startsWith('language:')) {
                // Language group - use 'group' parameter
                params.append('group', groupValue.replace('language:', ''));
            } else if (groupValue.startsWith('branch:')) {
                // Branch subgroup - use 'branchSubgroup' parameter
                params.append('branchSubgroup', groupValue.replace('branch:', ''));
            } else {
                // Legacy format - assume language group
                params.append('group', groupValue);
            }
        }
        
        if (formation) params.append('formation', formation);
        if (branch) params.append('filiere', branch);  // Backend expects 'filiere' not 'branch'
        if (paymentStatus) params.append('paymentStatus', paymentStatus);
        
        // Server-side pagination for fast loading
        params.append('page', currentPage);
        params.append('limit', STUDENTS_PER_PAGE);
        
        // Show loading indicator
        const grid = document.getElementById('studentsGrid');
        grid.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-color);"></i><p style="margin-top: 10px; color: var(--text-light);">Loading students...</p></div>';
        
        const data = await apiRequest(`/students?${params.toString()}`);
        if (data && data.success) {
            allStudents = data.students;
            
            // Get total count from pagination data
            totalStudents = data.pagination?.total || data.students.length;
            
            // Separate pending assignment students from active students
            const pendingStudents = data.students.filter(s => s.status === 'pending_assignment');
            const activeStudents = data.students.filter(s => s.status !== 'pending_assignment');
            
            // Store filtered students for pagination
            filteredStudents = activeStudents;
            
            displayStudents(activeStudents, pendingStudents);
        }
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

function displayStudents(students, pendingStudents = []) {
    const grid = document.getElementById('studentsGrid');
    
    let html = '';
    
    // Calculate pagination based on total students from server
    const totalPages = Math.ceil(totalStudents / STUDENTS_PER_PAGE);
    
    // Students are already paginated from server, no need to slice
    const pageStudents = students;
    
    // Pending Assignment Section
    if (pendingStudents.length > 0) {
        html += `
            <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #856404; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-exclamation-triangle"></i>
                    Pending Group Assignment (${pendingStudents.length})
                </h3>
                <p style="margin: 0 0 20px 0; color: #856404;">
                    These students have been approved from online registration and need to be assigned to a group.
                </p>
                <div style="display: grid !important; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)) !important; gap: 15px !important;">
                    ${pendingStudents.map(student => createPendingStudentCard(student)).join('')}
                </div>
            </div>
        `;
    }
    
    // Active Students Section
    if (students.length === 0 && pendingStudents.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-user-graduate"></i><h3>No Students Found</h3></div>';
        return;
    }
    
    if (students.length > 0) {
        // Pagination info at top
        const startItem = ((currentPage - 1) * STUDENTS_PER_PAGE) + 1;
        const endItem = Math.min(currentPage * STUDENTS_PER_PAGE, totalStudents);
        
        html += `
            <div style="grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #1e293b;">Active Students (${totalStudents})</h3>
                ${totalPages > 1 ? `
                    <div class="pagination-info" style="color: #64748b; font-size: 0.9rem;">
                        Showing ${startItem}-${endItem} of ${totalStudents}
                    </div>
                ` : ''}
            </div>
        `;
        
        // Pagination controls at top
        if (totalPages > 1) {
            html += createStudentPaginationControls(currentPage, totalPages, 'top');
        }
        
        html += pageStudents.map(student => {
        const now = new Date();
        const paymentDate = new Date(student.paymentDate);
        const reminderDays = student.reminderDaysBefore || 7;
        
        // Calculate days until payment
        const daysUntilPayment = Math.ceil((paymentDate - now) / (1000 * 60 * 60 * 24));
        
        // Determine payment status and bell color
        const isPaid = student.paymentStatus === 'paid';
        const isOverdue = now > paymentDate && !isPaid;
        const isDueSoon = daysUntilPayment <= reminderDays && daysUntilPayment >= 0 && !isPaid;
        
        // Calculate next payment date for paid students
        let nextPaymentDate = null;
        let daysUntilNextPayment = 0;
        let showNextPayment = false;
        
        if (isPaid) {
            nextPaymentDate = new Date(paymentDate);
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
            daysUntilNextPayment = Math.ceil((nextPaymentDate - now) / (1000 * 60 * 60 * 24));
            
            // Calculate days since payment was marked as paid
            const daysSincePaid = Math.ceil((now - paymentDate) / (1000 * 60 * 60 * 24));
            
            // Show next payment notification only if:
            // 1. More than 2 days have passed since payment, OR
            // 2. Less than 7 days until next payment
            showNextPayment = daysSincePaid > 2 || daysUntilNextPayment <= 7;
        }
        
        // Helper function to format group code
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
            // Examples: "IT Group 1" -> "I.1", "Nursing Group 2" -> "N.2"
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
        
        // Bell icon and color logic:
        // Green bell with check = Paid
        // Yellow bell = Due soon (within reminder days)
        // Red bell = Overdue (past due date and not paid)
        let bellIcon = '';
        let bellClass = '';
        
        if (isPaid) {
            bellIcon = '<i class="fas fa-check-circle" style="color: var(--success-color); font-size: 1.5rem; animation: none;"></i>';
            bellClass = 'paid';
        } else if (isOverdue) {
            bellIcon = '<i class="fas fa-bell" style="color: var(--danger-color); font-size: 1.5rem;"></i>';
            bellClass = 'overdue';
        } else if (isDueSoon) {
            bellIcon = '<i class="fas fa-bell" style="color: var(--warning-color); font-size: 1.5rem; animation: bell-ring 1s infinite;"></i>';
            bellClass = 'due-soon';
        }
        
        // Determine status styling
        const statusConfig = {
            active: {
                color: '#FFCC00',
                bgColor: 'rgba(255, 204, 0, 0.1)',
                borderColor: '#FFCC00',
                icon: 'fa-user-check',
                label: 'Active'
            },
            graduated: {
                color: '#10b981',
                bgColor: 'rgba(16, 185, 129, 0.1)',
                borderColor: '#10b981',
                icon: 'fa-graduation-cap',
                label: 'Graduated'
            },
            dropped: {
                color: '#ef4444',
                bgColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: '#ef4444',
                icon: 'fa-user-slash',
                label: 'Dropped'
            },
            inactive: {
                color: '#6b7280',
                bgColor: 'rgba(107, 116, 128, 0.1)',
                borderColor: '#6b7280',
                icon: 'fa-user-clock',
                label: 'Inactive'
            }
        };
        
        const statusStyle = statusConfig[student.status] || statusConfig.active;
        
        return `
            <div class="student-card ${bellClass}" style="position: relative; border-left: 4px solid ${statusStyle.borderColor}; background: linear-gradient(to right, ${statusStyle.bgColor}, white);">
                ${bellIcon ? `<div style="position: absolute; top: 10px; right: 10px;">${bellIcon}</div>` : ''}
                <div style="position: absolute; top: 10px; left: 10px;">
                    <i class="fas ${statusStyle.icon}" style="color: ${statusStyle.color}; font-size: 1.2rem;" title="${statusStyle.label}"></i>
                </div>
                ${student.hasPhoto !== false ? 
                  `<img data-student-id="${student._id}" class="student-photo lazy-photo" style="border-color: ${statusStyle.borderColor}; background: ${statusStyle.bgColor};">` : 
                  `<div class="student-photo" style="background: ${statusStyle.color}; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: white; border-color: ${statusStyle.borderColor};">${student.fullName.charAt(0)}</div>`}
                <div class="student-name">${student.fullName}</div>
                <div class="student-info">
                    <span class="badge" style="background: ${statusStyle.bgColor}; color: ${statusStyle.color}; border: 1px solid ${statusStyle.borderColor};">
                        <i class="fas ${statusStyle.icon}"></i> ${statusStyle.label.toUpperCase()}
                    </span>
                </div>
                <div class="student-info"><i class="fas fa-layer-group"></i> ${student.groupName}</div>
                <div class="student-info"><i class="fas fa-envelope"></i> ${student.schoolEmail}</div>
                <div class="student-info"><i class="fas fa-id-badge"></i> ${formatGroupCode(student)}</div>
                <div class="student-info"><i class="fas fa-book"></i> ${student.formation.join(', ')}</div>
                <div class="student-info">
                    <i class="fas fa-calendar"></i> 
                    ${isPaid ? `<span style="color: var(--text-light); text-decoration: line-through;">${new Date(student.paymentDate).toLocaleDateString()}</span>` : new Date(student.paymentDate).toLocaleDateString()}
                    ${isDueSoon && !isOverdue ? `<span style="color: var(--warning-color); font-weight: 600; margin-left: 5px;">(${daysUntilPayment} day${daysUntilPayment !== 1 ? 's' : ''})</span>` : ''}
                    ${isOverdue ? `<span style="color: var(--danger-color); font-weight: 600; margin-left: 5px;">(Overdue)</span>` : ''}
                    ${isPaid ? `<span style="color: var(--success-color); font-weight: 600; margin-left: 5px;">(Paid ✓)</span>` : ''}
                </div>
                ${isPaid && nextPaymentDate && showNextPayment ? `
                <div class="student-info" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(5, 150, 105, 0.03)); padding: 6px 8px; border-radius: 6px; border-left: 2px solid var(--success-color); margin-top: 4px; font-size: 0.8rem;">
                    <i class="fas fa-calendar-check" style="color: var(--success-color); font-size: 0.75rem;"></i> 
                    <strong style="color: var(--success-color);">Next:</strong> ${nextPaymentDate.toLocaleDateString()}
                    <span style="color: var(--success-color); font-weight: 600; margin-left: 4px;">
                        <i class="fas fa-clock" style="font-size: 0.75rem;"></i> ${daysUntilNextPayment}d
                    </span>
                </div>` : ''}
                <div class="student-info">
                    <span class="badge badge-${isPaid ? 'success' : isOverdue ? 'danger' : 'warning'}">
                        ${student.paymentStatus.toUpperCase()}
                    </span>
                </div>
                <div class="student-card-actions">
                    <button class="btn btn-small" onclick="viewStudent('${student._id}')" title="View Details"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-small btn-secondary" onclick="editStudent('${student._id}')" title="Edit Student"><i class="fas fa-edit"></i></button>
                    ${!isPaid ? `<button class="btn btn-small btn-success" onclick="markAsPaid('${student._id}', '${student.fullName}')" title="Mark as Paid"><i class="fas fa-check"></i></button>` : ''}
                    <button class="btn btn-small btn-info" onclick="openMessageModal('${student._id}', '${student.fullName.replace(/'/g, "\\'")}')" title="Send Private Message" data-i18n-title="admin.students.send_message_title"><i class="fas fa-envelope"></i></button>
                    <button class="btn btn-small btn-warning" onclick="clearAbsenceHistory('${student._id}', '${student.fullName}')" title="Clear Absence History"><i class="fas fa-eraser"></i></button>
                    <button class="btn btn-small btn-danger" onclick="deleteStudent('${student._id}', '${student.fullName}')" title="Delete Student"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
        }).join('');
        
        // Pagination controls at bottom
        if (totalPages > 1) {
            html += createStudentPaginationControls(currentPage, totalPages, 'bottom');
        }
    }
    
    grid.innerHTML = html;
    
    // Initialize photo lazy loading observer
    initPhotoObserver();
    
    // Observe all lazy-load images
    const lazyImages = grid.querySelectorAll('.lazy-photo');
    lazyImages.forEach(img => {
        if (photoObserver) {
            photoObserver.observe(img);
        }
    });
}

// Create pagination controls for students (modern design with prev/next)
function createStudentPaginationControls(currentPage, totalPages, position) {
    const startItem = ((currentPage - 1) * STUDENTS_PER_PAGE) + 1;
    const endItem = Math.min(currentPage * STUDENTS_PER_PAGE, totalStudents);
    
    // Generate smart page numbers (show limited pages with ellipsis)
    let pageButtons = '';
    const maxVisiblePages = 5;
    
    // Previous button
    pageButtons += `
        <button class="pagination-nav-btn ${currentPage === 1 ? 'disabled' : ''}" 
                onclick="changeStudentPage(${currentPage - 1})"
                ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Calculate which pages to show
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page + ellipsis
    if (startPage > 1) {
        pageButtons += `
            <button class="pagination-page-btn" onclick="changeStudentPage(1)">
                <span>1</span>
            </button>
        `;
        if (startPage > 2) {
            pageButtons += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        pageButtons += `
            <button class="pagination-page-btn ${i === currentPage ? 'active' : ''}" 
                    onclick="changeStudentPage(${i})">
                <span>${i}</span>
            </button>
        `;
    }
    
    // Last page + ellipsis
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pageButtons += `<span class="pagination-ellipsis">...</span>`;
        }
        pageButtons += `
            <button class="pagination-page-btn" onclick="changeStudentPage(${totalPages})">
                <span>${totalPages}</span>
            </button>
        `;
    }
    
    // Next button
    pageButtons += `
        <button class="pagination-nav-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                onclick="changeStudentPage(${currentPage + 1})"
                ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    return `
        <div class="student-pagination-controls" style="grid-column: 1 / -1; margin-top: ${position === 'bottom' ? '20px' : '0'}; margin-bottom: ${position === 'top' ? '20px' : '0'};">
            <div class="pagination-info">
                Showing ${startItem}-${endItem} of ${totalStudents}
            </div>
            <div class="pagination-buttons">
                ${pageButtons}
            </div>
        </div>
    `;
}

// Change student page with smooth animation
window.changeStudentPage = function(newPage) {
    if (newPage < 1 || newPage > Math.ceil(totalStudents / STUDENTS_PER_PAGE)) return;
    if (newPage === currentPage) return;
    
    currentPage = newPage;
    
    // Reload students without resetting page
    loadStudents(false);
    
    // Smooth scroll to top of student grid
    const grid = document.getElementById('studentsGrid');
    if (grid) {
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Create pending student card with edit button for missing data
function createPendingStudentCard(student) {
    return `
        <div class="student-card" style="border-left: 4px solid #ffc107; background: white;">
            ${isValidPhotoPath(student.photoPath) ? `<img src="${normalizePhotoPath(student.photoPath)}" class="student-photo" style="border-color: #ffc107;">` : 
                `<div class="student-photo-placeholder" style="border-color: #ffc107;"><i class="fas fa-user"></i></div>`}
            <div class="student-info">
                <h3 style="margin: 0 0 10px 0;">${student.fullName}</h3>
                <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.9rem;">
                    <div><i class="fas fa-envelope"></i> ${student.schoolEmail}</div>
                    <div><i class="fas fa-phone"></i> ${student.phones && student.phones.length > 0 ? student.phones.join(', ') : 'N/A'}</div>
                    <div><i class="fas fa-id-card"></i> ${student.cin}</div>
                    <div><i class="fas fa-book"></i> ${student.formation ? student.formation.join(', ') : 'N/A'}</div>
                    ${student.filiere && student.filiere.length > 0 ? `<div><i class="fas fa-graduation-cap"></i> ${student.filiere.join(', ')}</div>` : ''}
                    <div style="color: #dc3545; font-weight: 600;">
                        <i class="fas fa-exclamation-circle"></i> No Group Assigned
                    </div>
                </div>
            </div>
            <div class="student-card-actions" style="margin-top: 15px;">
                <button class="btn btn-small btn-warning" onclick="editStudent('${student._id}')" title="Complete Missing Data & Assign Group">
                    <i class="fas fa-edit"></i> Complete Setup
                </button>
                <button class="btn btn-small btn-primary" onclick="viewStudent('${student._id}')" title="View Details">
                    <i class="fas fa-eye"></i> View
                </button>
            </div>
        </div>
    `;
}

// Filters
async function updateGroupFilters() {
    const filter = document.getElementById('groupFilter');
    if (!filter) return;
    
    try {
        // Build query with season filter if available
        const seasonParam = legacyCurrentSeasonId ? `&season=${legacyCurrentSeasonId}` : '';
        console.log('🔍 Updating group filters with season:', legacyCurrentSeasonId);
        
        // Load both language groups and branch subgroups (filtered by season)
        const [languageGroupsData, branchSubgroupsData] = await Promise.all([
            apiRequest(`/groups?groupType=language${seasonParam}`),  // Season-filtered language groups
            fetch('/api/branch-groups', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }).then(r => r.json())
        ]);
        
        const languageGroups = languageGroupsData.success ? languageGroupsData.groups : [];
        const branchGroups = Array.isArray(branchSubgroupsData) ? branchSubgroupsData : [];
        
        // Get all subgroups from all branch groups in PARALLEL (much faster!)
        const subgroupPromises = branchGroups.map(branchGroup => {
            const url = legacyCurrentSeasonId 
                ? `/api/branch-groups/${branchGroup._id}/subgroups?season=${legacyCurrentSeasonId}`
                : `/api/branch-groups/${branchGroup._id}/subgroups`;
                
            return fetch(url, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
            .then(r => r.ok ? r.json() : [])
            .catch(() => []);
        });
        
        // Wait for all subgroup requests to complete
        const subgroupArrays = await Promise.all(subgroupPromises);
        const allSubgroups = subgroupArrays.flat(); // Flatten array of arrays
        
        // Build dropdown with sections
        let optionsHTML = '<option value="">All Groups</option>';
        
        // Language Groups section
        if (languageGroups.length > 0) {
            optionsHTML += '<optgroup label="Language Groups">';
            optionsHTML += languageGroups.map(g => 
                `<option value="language:${g._id}">${g.name}</option>`
            ).join('');
            optionsHTML += '</optgroup>';
        }
        
        // Branch Subgroups section
        if (allSubgroups.length > 0) {
            optionsHTML += '<optgroup label="Branch Subgroups">';
            optionsHTML += allSubgroups.map(sg => 
                `<option value="branch:${sg._id}">${sg.name}</option>`
            ).join('');
            optionsHTML += '</optgroup>';
        }
        
        filter.innerHTML = optionsHTML;
        
    } catch (error) {
        console.error('Error loading groups for filter:', error);
        filter.innerHTML = '<option value="">All Groups</option>';
    }
}

function searchStudents() {
    loadStudents();
}

// Update payment reminders tab visibility based on season
function updatePaymentTabVisibility() {
    const paymentTab = document.getElementById('paymentRemindersMenuItem');
    
    if (!paymentTab) return;
    
    // Check if viewing active season
    const isViewingActiveSeason = !legacyActiveSeasonId || legacyCurrentSeasonId === legacyActiveSeasonId;
    
    if (isViewingActiveSeason) {
        // Viewing active season - show payment tab
        paymentTab.style.display = 'flex';
        console.log('✅ Payment reminders tab visible (active season)');
    } else {
        // Viewing old season - hide payment tab
        paymentTab.style.display = 'none';
        console.log('🔒 Payment reminders tab hidden (viewing historical season)');
        
        // If currently on payment tab, switch to dashboard
        const currentTab = document.querySelector('.tab-content.active');
        if (currentTab && currentTab.id === 'remindersTab') {
            switchTab('dashboard');
        }
    }
}

function filterStudents() {
    // Update season context when season filter changes
    const seasonFilter = document.getElementById('seasonFilter');
    if (seasonFilter && seasonFilter.value) {
        const oldSeasonId = legacyCurrentSeasonId;
        legacyCurrentSeasonId = seasonFilter.value;
        console.log('🔄 Season filter changed to:', seasonFilter.value);
        
        // Update payment tab visibility when season changes
        updatePaymentTabVisibility();
        
        // If season changed, update group filters too
        if (oldSeasonId !== legacyCurrentSeasonId) {
            console.log('🔄 Updating group filters for new season');
            updateGroupFilters();
        }
    }
    
    loadStudents();
}

// Export
async function exportStudents() {
    try {
        const params = new URLSearchParams();
        const group = document.getElementById('groupFilter')?.value;
        const formation = document.getElementById('formationFilter')?.value;
        
        if (group) params.append('group', group);
        if (formation) params.append('formation', formation);
        
        window.location.href = `${API_BASE}/students/export/csv?${params.toString()}`;
        showNotification('Exporting students...', 'success');
    } catch (error) {
        console.error('Error exporting:', error);
    }
}

// Modals
function createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="close-modal" onclick="closeModal()">&times;</button>
            </div>
            ${content}
        </div>
    `;
    return modal;
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(m => m.remove());
}

// Notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    
    // Define vibrant colors for clear visibility
    const colors = {
        success: { bg: '#10b981', icon: '✓', shadow: 'rgba(16, 185, 129, 0.4)' },
        error: { bg: '#ef4444', icon: '✕', shadow: 'rgba(239, 68, 68, 0.4)' },
        info: { bg: '#3b82f6', icon: 'ℹ', shadow: 'rgba(59, 130, 246, 0.4)' },
        warning: { bg: '#f59e0b', icon: '⚠', shadow: 'rgba(245, 158, 11, 0.4)' }
    };
    
    const style = colors[type] || colors.info;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${style.bg};
        color: white;
        border-radius: 12px;
        box-shadow: 0 8px 24px ${style.shadow};
        z-index: 10000;
        font-size: 15px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease-out;
        min-width: 300px;
    `;
    
    notification.innerHTML = `
        <span style="font-size: 20px; font-weight: bold;">${style.icon}</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Logout
function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin';
}

// Email Generator from Name
function generateEmailFromName() {
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('schoolEmail');
    
    if (fullNameInput && emailInput) {
        const fullName = fullNameInput.value.trim();
        if (fullName) {
            // Remove spaces, convert to lowercase, remove special characters
            const emailPrefix = fullName
                .toLowerCase()
                .replace(/\s+/g, '') // Remove all spaces
                .replace(/[^a-z0-9]/g, ''); // Remove special characters, keep only letters and numbers
            
            emailInput.value = `${emailPrefix}@nisrineschool.com`;
        } else {
            emailInput.value = '';
        }
    }
}

// Password Generator
function generatePassword() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    const passwordInput = document.getElementById('emailPassword') || document.getElementById('newPassword');
    if (passwordInput) {
        passwordInput.value = password;
    }
}

// Group CRUD Operations
function openCreateGroupModal() {
    const modal = createModal('Create New Group', `
        <form onsubmit="createGroup(event)">
            <div class="form-group">
                <label>Group Name *</label>
                <input type="text" name="name" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Max Students *</label>
                    <input type="number" name="maxStudents" required min="1" value="30">
                </div>
                <div class="form-group">
                    <label>Language Formation</label>
                    <select name="formation">
                        <option value="Mixed">Mixed</option>
                        <option value="Allemand">Allemand</option>
                        <option value="Anglais">Anglais</option>
                        <option value="Français">Français</option>
                        <option value="Ausbildung">Ausbildung</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Branch Formation (Filière) <span style="font-size: 11px; color: #888;">- Keep as "Mixed" for all groups</span></label>
                <select name="branchFormation">
                    <option value="Mixed" selected>All Branches (Mixed) - Recommended</option>
                    <option value="None">None</option>
                    <option value="Gériatrie">Gériatrie</option>
                    <option value="Aide soignant">Aide soignant</option>
                    <option value="Agent socio éducatif">Agent socio éducatif</option>
                    <option value="Assistante sociale">Assistante sociale</option>
                    <option value="Restauration">Restauration</option>
                    <option value="Cuisine">Cuisine</option>
                    <option value="Informatique">Informatique</option>
                    <option value="Gestion hôtelière">Gestion hôtelière</option>
                </select>
                <small style="color: #666; font-size: 11px; display: block; margin-top: 5px;">
                    ℹ️ Branch teachers will see students from all groups who study their branch
                </small>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea name="description" rows="3"></textarea>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button type="submit" class="btn"><i class="fas fa-save"></i> Create</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `);
    document.body.appendChild(modal);
    modal.classList.add('active');
}

async function createGroup(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    try {
        const result = await apiRequest('/groups', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (result && result.success) {
            showNotification('Group created successfully!', 'success');
            closeModal();
            await loadGroups();
            await loadDashboardStats();
        } else {
            showNotification(result?.error || 'Failed to create group', 'error');
        }
    } catch (error) {
        console.error('Error creating group:', error);
        showNotification(error.message || 'Failed to create group', 'error');
    }
}

async function deleteGroup(groupId, groupName) {
    if (!confirm(`Delete "${groupName}"?`)) return;
    
    try {
        const result = await apiRequest(`/groups/${groupId}`, { method: 'DELETE' });
        if (result && result.success) {
            showNotification('Group deleted!', 'success');
            await loadGroups();
            await loadDashboardStats();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function viewGroupStudents(groupId) {
    switchTab('students');
    document.getElementById('groupFilter').value = groupId;
    filterStudents();
}

// Student Operations
function openAddStudentModal() {
    const modal = createModal('Add New Student', `
        <form onsubmit="addStudent(event)" enctype="multipart/form-data">
            <div class="form-row">
                <div class="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="fullName" id="fullName" required onkeyup="generateEmailFromName()">
                </div>
                <div class="form-group">
                    <label>Group *</label>
                    <select name="group" required>
                        <option value="">Select Group</option>
                        ${allGroups.filter(g => g.status === 'active').map(g => 
                            `<option value="${g._id}">${g.name} (${g.currentStudentCount}/${g.maxStudents})</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Phone *</label>
                    <input type="tel" name="phoneNumber" required placeholder="06XXXXXXXX">
                </div>
                <div class="form-group">
                    <label>Parent Phone *</label>
                    <input type="tel" name="parentPhone" required placeholder="06XXXXXXXX">
                </div>
            </div>
            <div class="form-group">
                <label>School Email (Auto-generated) *</label>
                <input type="email" name="schoolEmail" id="schoolEmail" required placeholder="Will be generated from name" readonly style="background: #f0f0f0;">
                <small style="color: var(--text-light);">Email is automatically generated from student's name</small>
            </div>
            <div class="form-group">
                <label>Email Password *</label>
                <div style="display: flex; gap: 10px;">
                    <input type="text" name="emailPassword" id="emailPassword" required style="flex: 1;">
                    <button type="button" class="btn btn-secondary" onclick="generatePassword()">
                        <i class="fas fa-key"></i> Generate
                    </button>
                </div>
            </div>
            <div class="form-group">
                <label>Formation choisie (Languages) - Select all that apply *</label>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px;">
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="formation" value="Allemand" style="width: 18px; height: 18px;">
                        <span>Allemand (German)</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="formation" value="Anglais" style="width: 18px; height: 18px;">
                        <span>Anglais (English)</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="formation" value="Français" style="width: 18px; height: 18px;">
                        <span>Français (French)</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="formation" value="Ausbildung" style="width: 18px; height: 18px;">
                        <span>Ausbildung</span>
                    </label>
                </div>
            </div>
            <div class="form-group">
                <label>Filière (Branches) - Select all that apply (Optional)</label>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px;">
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="filiere" value="Gériatrie" style="width: 18px; height: 18px;">
                        <span>Gériatrie</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="filiere" value="Aide soignant" style="width: 18px; height: 18px;">
                        <span>Aide soignant</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="filiere" value="Agent socio éducatif" style="width: 18px; height: 18px;">
                        <span>Agent socio éducatif</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="filiere" value="Assistante sociale" style="width: 18px; height: 18px;">
                        <span>Assistante sociale</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="filiere" value="Restauration" style="width: 18px; height: 18px;">
                        <span>Restauration</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="filiere" value="Cuisine" style="width: 18px; height: 18px;">
                        <span>Cuisine</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="filiere" value="Informatique" style="width: 18px; height: 18px;">
                        <span>Informatique</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="filiere" value="Gestion hôtelière" style="width: 18px; height: 18px;">
                        <span>Gestion hôtelière</span>
                    </label>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Payment Date *</label>
                    <input type="date" name="paymentDate" id="addStudentPaymentDate" required>
                </div>
                <div class="form-group">
                    <label>Amount (MAD) *</label>
                    <input type="number" name="paymentAmount" required min="0" step="0.01">
                </div>
            </div>
            <div class="form-group">
                <label>Photo</label>
                <input type="file" name="photo" accept="image/*">
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button type="submit" class="btn"><i class="fas fa-save"></i> Add</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `);
    document.body.appendChild(modal);
    modal.classList.add('active');
    
    // Set default payment date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('addStudentPaymentDate').value = today;
}

async function addStudent(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    console.log('=== Adding Student ===');
    console.log('Form data entries:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }
    
    try {
        // Don't use apiRequest for FormData - it adds Content-Type: application/json
        const response = await fetch(`${API_BASE}/students`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${authToken}`
                // Don't set Content-Type - browser will set it with boundary for FormData
            },
            body: formData
        });
        
        console.log('Response status:', response.status);
        
        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin';
            return;
        }
        
        const result = await response.json();
        console.log('Response result:', result);
        
        if (response.ok && result.success) {
            showNotification('Student added successfully!', 'success');
            closeModal();
            await loadStudents();
            await loadGroups();
            await loadDashboardStats();
        } else {
            // Show validation errors if available
            if (result.validationErrors && result.validationErrors.length > 0) {
                const errorMessages = result.validationErrors.map(e => `${e.field}: ${e.message}`).join('\n');
                throw new Error(`Validation errors:\n${errorMessages}`);
            } else {
                throw new Error(result.error || 'Failed to add student');
            }
        }
    } catch (error) {
        console.error('=== Error adding student ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error:', error);
        showNotification(error.message || 'Failed to add student', 'error');
    }
}

async function markAsPaid(studentId, studentName) {
    if (!confirm(`Mark "${studentName}" as paid?`)) return;
    
    try {
        const result = await apiRequest(`/students/${studentId}/mark-paid`, { 
            method: 'PUT',
            body: JSON.stringify({ paymentStatus: 'paid' })
        });
        
        if (result && result.success) {
            // Calculate next payment date
            const currentPaymentDate = new Date(result.student.paymentDate);
            const nextPaymentDate = new Date(currentPaymentDate);
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
            
            const now = new Date();
            const daysUntilNext = Math.ceil((nextPaymentDate - now) / (1000 * 60 * 60 * 24));
            
            showNotification(
                `✅ Payment marked as paid!\n\n📅 Next Payment: ${nextPaymentDate.toLocaleDateString()}\n⏰ ${daysUntilNext} day${daysUntilNext !== 1 ? 's' : ''} remaining`, 
                'success'
            );
            await loadStudents();
            await loadDashboardStats();
            await loadPaymentReminders();
        }
    } catch (error) {
        console.error('Error marking as paid:', error);
        showNotification(error.message || 'Failed to mark as paid', 'error');
    }
}

async function deleteStudent(studentId, studentName) {
    if (!confirm(`Delete "${studentName}"?`)) return;
    
    try {
        const result = await apiRequest(`/students/${studentId}`, { method: 'DELETE' });
        if (result && result.success) {
            showNotification('Student deleted!', 'success');
            await loadStudents();
            await loadGroups();
            await loadDashboardStats();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function clearAbsenceHistory(studentId, studentName) {
    if (!confirm(`⚠️ Clear ALL absence records for "${studentName}"?\n\nThis will permanently delete all absence history for this student. This action cannot be undone.`)) return;
    
    try {
        const result = await apiRequest(`/students/${studentId}/clear-absences`, { 
            method: 'DELETE' 
        });
        
        if (result && result.success) {
            showNotification(`✅ Absence history cleared for ${studentName}! (${result.deletedCount} record(s) removed)`, 'success');
            await loadStudents();
            await loadDashboardStats();
        }
    } catch (error) {
        console.error('Error clearing absence history:', error);
        showNotification(error.message || 'Failed to clear absence history', 'error');
    }
}

async function viewStudent(studentId) {
    // Phase 2.2: Use new profile expansion view
    if (typeof viewStudentProfile === 'function') {
        viewStudentProfile(studentId);
        return;
    }
    
    // Fallback to old view
    try {
        const data = await apiRequest(`/students/${studentId}`);
        if (data && data.success) {
            const s = data.student;
            const modal = createModal('Student Details', `
                <div style="text-align: center; margin-bottom: 20px;">
                    ${s.photoPath ? `<img src="${normalizePhotoPath(s.photoPath)}" style="width: 120px; height: 120px; border-radius: 50%; border: 4px solid var(--primary-color);">` : 
                      `<div style="width: 120px; height: 120px; border-radius: 50%; background: var(--primary-color); display: inline-flex; align-items: center; justify-content: center; font-size: 3rem; color: var(--dark-bg);">${s.fullName.charAt(0)}</div>`}
                    <h2 style="color: var(--primary-color); margin-top: 15px;">${s.fullName}</h2>
                    <span class="badge badge-${s.paymentStatus === 'paid' ? 'success' : s.paymentStatus === 'overdue' ? 'danger' : 'warning'}">${s.paymentStatus.toUpperCase()}</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                    <div><strong>Group:</strong> ${s.groupName}</div>
                    <div><strong>Email:</strong> ${s.schoolEmail}</div>
                    <div><strong>Phone:</strong> ${s.phoneNumber}</div>
                    <div><strong>Parent:</strong> ${s.parentPhone}</div>
                    <div><strong>Formation:</strong> ${s.formation.join(', ')}</div>
                    <div><strong>Payment:</strong> ${new Date(s.paymentDate).toLocaleDateString()}</div>
                    <div><strong>Amount:</strong> ${s.paymentAmount} MAD</div>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                </div>
            `);
            document.body.appendChild(modal);
            modal.classList.add('active');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Payment Reminders
// Store reminders data to avoid re-fetching
let cachedRemindersData = {
    due15Days: [],
    due7Days: [],
    dueTomorrow: []
};

async function loadPaymentReminders() {
    try {
        const data = await apiRequest('/payment-reminders');
        if (data && data.success) {
            displayPaymentReminders(data.reminders);
        }
    } catch (error) {
        console.error('Error loading payment reminders:', error);
    }
}

function displayPaymentReminders(reminders) {
    const grid = document.getElementById('remindersGrid');
    const now = new Date();
    
    // Categorize students by days until payment
    const due15Days = [];
    const due7Days = [];
    const dueTomorrow = [];
    
    reminders.forEach(reminder => {
        const student = reminder.student;
        const daysUntil = reminder.daysUntilPayment;
        
        // Skip paid students and overdue (negative days)
        if (student.paymentStatus === 'paid') return;
        if (daysUntil < 0) return; // Skip overdue - they appear in the overdue section
        
        // Categorize based on days until payment (upcoming only)
        if (daysUntil <= 1) {
            dueTomorrow.push(student);
        } else if (daysUntil <= 7) {
            due7Days.push(student);
        } else if (daysUntil <= 30) {
            // Extended to 30 days to show more upcoming payments
            due15Days.push(student);
        }
    });
    
    // Cache the categorized data
    cachedRemindersData = {
        due15Days,
        due7Days,
        dueTomorrow
    };
    
    // Render the sections
    renderPaymentRemindersSections();
}

// Separate render function (doesn't fetch data, just displays)
function renderPaymentRemindersSections() {
    const grid = document.getElementById('remindersGrid');
    const { due15Days, due7Days, dueTomorrow } = cachedRemindersData;
    
    let html = '';
    
    // Section 1: Due in 8-30 days
    html += createReminderSection(
        'Due in 8-30 Days',
        'due-15',
        due15Days,
        '#3b82f6'
    );
    
    // Section 2: Due in 7 days
    html += createReminderSection(
        'Due in 7 Days',
        'due-7',
        due7Days,
        '#f59e0b'
    );
    
    // Section 3: Due Tomorrow
    html += createReminderSection(
        'Due Tomorrow',
        'due-tomorrow',
        dueTomorrow,
        '#ef4444'
    );
    
    if (due15Days.length === 0 && due7Days.length === 0 && dueTomorrow.length === 0) {
        html = '<div class="empty-state"><i class="fas fa-bell-slash"></i><h3>No Upcoming Payment Reminders</h3><p>All payments are up to date!</p></div>';
    }
    
    grid.innerHTML = html;
}

// Pagination state for each section
const paginationState = {
    'overdue': { currentPage: 1, itemsPerPage: 6 },
    'due-15': { currentPage: 1, itemsPerPage: 6 },
    'due-7': { currentPage: 1, itemsPerPage: 6 },
    'due-tomorrow': { currentPage: 1, itemsPerPage: 6 }
};

function createReminderSection(title, className, students, color) {
    if (students.length === 0) return '';
    
    const state = paginationState[className];
    const totalPages = Math.ceil(students.length / state.itemsPerPage);
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const paginatedStudents = students.slice(startIndex, endIndex);
    
    let html = `
        <div class="reminder-section">
            <div class="reminder-section-header ${className}">
                <span><i class="fas fa-bell"></i> ${title}</span>
                <span class="reminder-count">${students.length} Student${students.length !== 1 ? 's' : ''}</span>
            </div>
            <table class="reminder-table">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Group</th>
                        <th>Phone</th>
                        <th>Formation</th>
                        <th>Payment Date</th>
                        <th>Amount</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="${className}-tbody">
    `;
    
    paginatedStudents.forEach(student => {
        const paymentDate = new Date(student.paymentDate);
        const daysUntil = Math.ceil((paymentDate - new Date()) / (1000 * 60 * 60 * 24));
        
        html += `
            <tr class="fade-in">
                <td>
                    <div class="student-name-cell">
                        ${isValidPhotoPath(student.photoPath) ? 
                            `<img src="${normalizePhotoPath(student.photoPath)}" class="student-photo-small">` : 
                            `<div class="student-photo-small" style="background: var(--primary-color); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${student.fullName.charAt(0)}</div>`
                        }
                        <div>
                            <div style="font-weight: 600;">${student.fullName}</div>
                            <div style="font-size: 0.85rem; color: var(--text-light);">${student.schoolEmail}</div>
                        </div>
                    </div>
                </td>
                <td>${student.groupName}</td>
                <td>${student.phoneNumber}</td>
                <td>${student.formation.join(', ')}</td>
                <td>
                    <div>${paymentDate.toLocaleDateString()}</div>
                    <div style="font-size: 0.85rem; color: ${color}; font-weight: 600;">
                        ${daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                    </div>
                </td>
                <td style="font-weight: 600;">${student.paymentAmount} MAD</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-small" onclick="viewStudent('${student._id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-small btn-success" onclick="markAsPaid('${student._id}', '${student.fullName}')" title="Mark as Paid">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-small btn-secondary" onclick="sendReminder('${student._id}', '${student.fullName}')" title="Send Reminder">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
    `;
    
    // Add pagination controls if needed
    if (totalPages > 1) {
        html += createPaginationControls(className, state.currentPage, totalPages, students.length, color);
    }
    
    html += `</div>`;
    
    return html;
}

// Create beautiful pagination controls
function createPaginationControls(className, currentPage, totalPages, totalItems, color) {
    const startItem = (currentPage - 1) * paginationState[className].itemsPerPage + 1;
    const endItem = Math.min(currentPage * paginationState[className].itemsPerPage, totalItems);
    
    let html = `
        <div class="pagination-container" style="border-top: 1px solid #e5e7eb; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; background: #f9fafb;">
            <div class="pagination-info" style="color: #64748b; font-size: 0.9rem;">
                Showing <strong style="color: ${color};">${startItem}-${endItem}</strong> of <strong>${totalItems}</strong> students
            </div>
            <div class="pagination-controls" style="display: flex; gap: 8px; align-items: center;">
                <button 
                    class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
                    onclick="changePage('${className}', ${currentPage - 1})"
                    ${currentPage === 1 ? 'disabled' : ''}
                    title="Previous Page"
                    style="padding: 8px 12px; border: 1px solid #e5e7eb; background: white; border-radius: 6px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 5px;">
                    <i class="fas fa-chevron-left" style="font-size: 0.8rem;"></i>
                    <span>Previous</span>
                </button>
                
                <div class="pagination-numbers" style="display: flex; gap: 5px;">
    `;
    
    // Page numbers with smart ellipsis
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `
                <button 
                    class="pagination-number ${i === currentPage ? 'active' : ''}" 
                    onclick="changePage('${className}', ${i})"
                    style="
                        min-width: 40px;
                        height: 40px;
                        border: 1px solid ${i === currentPage ? color : '#e5e7eb'};
                        background: ${i === currentPage ? color : 'white'};
                        color: ${i === currentPage ? 'white' : '#64748b'};
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: ${i === currentPage ? '600' : '400'};
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span style="padding: 0 5px; color: #cbd5e1;">...</span>`;
        }
    }
    
    html += `
                </div>
                
                <button 
                    class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                    onclick="changePage('${className}', ${currentPage + 1})"
                    ${currentPage === totalPages ? 'disabled' : ''}
                    title="Next Page"
                    style="padding: 8px 12px; border: 1px solid #e5e7eb; background: white; border-radius: 6px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 5px;">
                    <span>Next</span>
                    <i class="fas fa-chevron-right" style="font-size: 0.8rem;"></i>
                </button>
            </div>
        </div>
    `;
    
    return html;
}

// Change page function (OPTIMIZED - no server call!)
window.changePage = function(className, newPage) {
    paginationState[className].currentPage = newPage;
    renderPaymentRemindersSections(); // Just re-render, no API call!
};

async function sendReminder(studentId, studentName) {
    if (!confirm(`Send payment reminder to "${studentName}"?`)) return;
    
    try {
        // Send message to student
        const result = await apiRequest(`/students/${studentId}/send-message`, {
            method: 'POST',
            body: JSON.stringify({ 
                type: 'payment',
                message: `📢 IMPORTANT PAYMENT NOTICE

Dear Student,

This is an important reminder regarding your tuition payment. Your payment is currently due and requires immediate attention.

⚠️ PAYMENT STATUS: PENDING

To continue your studies without any interruption, please settle your financial obligations as soon as possible. Failure to make payment by the due date may result in:

• Suspension of access to classes and course materials
• Inability to take exams or receive grades
• Temporary suspension of your student account
• Delay in receiving your certificates upon completion

💰 PAYMENT INFORMATION:
Please visit the administration office during working hours (Monday-Friday, 9:00 AM - 5:00 PM) to complete your payment. We accept cash, bank transfer, or credit/debit cards.

📞 NEED HELP?
If you are experiencing financial difficulties or need to discuss a payment plan, please contact our administration office immediately. We are here to help you continue your education.

Thank you for your prompt attention to this matter.

Best regards,
Nisrine School Administration`
            })
        });
        
        if (result && result.success) {
            showNotification('Payment reminder sent successfully!', 'success');
            await loadPaymentReminders();
        }
    } catch (error) {
        console.error('Error sending reminder:', error);
        showNotification(error.message || 'Failed to send reminder', 'error');
    }
}

// Edit Student
async function editStudent(studentId) {
    try {
        const data = await apiRequest(`/students/${studentId}`);
        if (data && data.success) {
            const student = data.student;
            openEditStudentModal(student);
        }
    } catch (error) {
        console.error('Error loading student:', error);
        showNotification('Failed to load student data', 'error');
    }
}

async function openEditStudentModal(student) {
    // Get student's current group ID (handle both populated and non-populated cases)
    const currentGroupId = student.group?._id || student.group || '';
    
    // Get student's current branch subgroup ID
    const currentBranchSubgroupId = student.branchSubgroup?._id || student.branchSubgroup || '';
    
    // Get student's season from their group
    const studentSeason = student.group?.season || legacyCurrentSeasonId;
    console.log('📝 Editing student - Season:', studentSeason, 'Current:', legacyCurrentSeasonId);
    
    // Filter groups by student's season (or current season if student has no group yet)
    const seasonGroups = allGroups.filter(g => {
        if (!studentSeason) return g.status === 'active'; // No season filter if no season context
        return g.status === 'active' && g.season?.toString() === studentSeason.toString();
    });
    
    console.log(`📋 Filtered ${seasonGroups.length} groups for season from ${allGroups.length} total`);
    
    // Check if student has selected any branches
    const hasBranches = student.filiere && student.filiere.length > 0;
    
    // Show modal immediately with loading state for branch subgroups
    let allBranchSubgroups = [];
    let branchSubgroupsLoading = hasBranches;
    
    // Use cached data if available and fresh (less than 5 minutes old)
    const cacheAge = branchSubgroupsLoadTime ? Date.now() - branchSubgroupsLoadTime : Infinity;
    const cacheValid = cachedBranchSubgroups && cacheAge < 5 * 60 * 1000;
    
    if (hasBranches && cacheValid) {
        allBranchSubgroups = cachedBranchSubgroups;
        branchSubgroupsLoading = false;
    }
    
    // Render modal immediately
    const modal = createModal('Edit Student', `
        <form onsubmit="updateStudent(event, '${student._id}')" enctype="multipart/form-data">
            <div class="form-row">
                <div class="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="fullName" value="${student.fullName}" required>
                </div>
                <div class="form-group">
                    <label>Date of Birth</label>
                    <input type="date" name="dateOfBirth" value="${student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : ''}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Address</label>
                    <input type="text" name="address" value="${student.address || ''}" placeholder="Street address">
                </div>
                <div class="form-group">
                    <label>City *</label>
                    <input type="text" name="city" value="${student.city}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Language Group *</label>
                    <select name="group" required>
                        <option value="">-- Select Group --</option>
                        ${seasonGroups.map(g => 
                            `<option value="${g._id}" ${g._id === currentGroupId ? 'selected' : ''}>${g.name} (${g.currentStudentCount}/${g.maxStudents})</option>`
                        ).join('')}
                    </select>
                    ${studentSeason && seasonGroups.length === 0 ? 
                        `<small style="color: #f59e0b; display: block; margin-top: 5px;">
                            <i class="fas fa-exclamation-triangle"></i> No groups available for this season
                        </small>` : ''}
                </div>
                ${hasBranches ? `
                <div class="form-group">
                    <label>Branch Subgroup <span style="color: #64748b; font-size: 0.85rem;">(Optional)</span></label>
                    <select name="branchSubgroup" id="branchSubgroupSelect" ${branchSubgroupsLoading ? 'disabled' : ''}>
                        ${branchSubgroupsLoading ? 
                            `<option value="">⏳ Loading subgroups...</option>` :
                            `<option value="">-- Not Assigned --</option>
                            ${allBranchSubgroups.map(sg => 
                                `<option value="${sg._id}" ${sg._id === currentBranchSubgroupId ? 'selected' : ''}>${sg.branchGroupName} - ${sg.name}</option>`
                            ).join('')}`
                        }
                    </select>
                    <small style="color: var(--text-light); display: block; margin-top: 5px;">
                        <i class="fas fa-info-circle"></i> Assign student to a branch subgroup based on their selected subject
                    </small>
                </div>
                ` : ''}
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Phone *</label>
                    <input type="tel" name="phoneNumber" value="${student.phoneNumber}" required placeholder="06XXXXXXXX">
                </div>
                <div class="form-group">
                    <label>Parent Phone *</label>
                    <input type="tel" name="parentPhone" value="${student.parentPhone}" required placeholder="06XXXXXXXX">
                </div>
            </div>
            <div class="form-group">
                <label>School Email *</label>
                <input type="email" name="schoolEmail" value="${student.schoolEmail}" required placeholder="name@nisrineschool.com" readonly style="background: #f0f0f0;">
                <small style="color: var(--text-light);">Email cannot be changed</small>
            </div>
            <div class="form-group">
                <label>Formation choisie (Languages) - Select all that apply *</label>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px;">
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="formation" value="Allemand" ${student.formation.includes('Allemand') ? 'checked' : ''} style="width: 18px; height: 18px;">
                        <span>Allemand (German)</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="formation" value="Anglais" ${student.formation.includes('Anglais') ? 'checked' : ''} style="width: 18px; height: 18px;">
                        <span>Anglais (English)</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="formation" value="Français" ${student.formation.includes('Français') ? 'checked' : ''} style="width: 18px; height: 18px;">
                        <span>Français (French)</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="formation" value="Ausbildung" ${student.formation.includes('Ausbildung') ? 'checked' : ''} style="width: 18px; height: 18px;">
                        <span>Ausbildung</span>
                    </label>
                </div>
            </div>
            <div class="form-group">
                <label>Filière (Branches) - Select all that apply (Optional)</label>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px;">
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="filiere" value="Gériatrie" ${student.filiere && student.filiere.includes('Gériatrie') ? 'checked' : ''} style="width: 18px; height: 18px;">
                        <span>Gériatrie</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="filiere" value="Aide soignant" ${student.filiere && student.filiere.includes('Aide soignant') ? 'checked' : ''} style="width: 18px; height: 18px;">
                        <span>Aide soignant</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="filiere" value="Agent socio éducatif" ${student.filiere && student.filiere.includes('Agent socio éducatif') ? 'checked' : ''} style="width: 18px; height: 18px;">
                        <span>Agent socio éducatif</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="filiere" value="Assistante sociale" ${student.filiere && student.filiere.includes('Assistante sociale') ? 'checked' : ''} style="width: 18px; height: 18px;">
                        <span>Assistante sociale</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="filiere" value="Restauration" ${student.filiere && student.filiere.includes('Restauration') ? 'checked' : ''} style="width: 18px; height: 18px;">
                        <span>Restauration</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="filiere" value="Cuisine" ${student.filiere && student.filiere.includes('Cuisine') ? 'checked' : ''} style="width: 18px; height: 18px;">
                        <span>Cuisine</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="filiere" value="Informatique" ${student.filiere && student.filiere.includes('Informatique') ? 'checked' : ''} style="width: 18px; height: 18px;">
                        <span>Informatique</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" name="filiere" value="Gestion hôtelière" ${student.filiere && student.filiere.includes('Gestion hôtelière') ? 'checked' : ''} style="width: 18px; height: 18px;">
                        <span>Gestion hôtelière</span>
                    </label>
                </div>
            </div>
            <div class="form-group">
                <label>Email Password (Change if needed)</label>
                <div style="display: flex; gap: 10px;">
                    <input type="text" name="newPassword" id="newPassword" placeholder="Leave empty to keep current password" style="flex: 1;">
                    <button type="button" class="btn btn-secondary" onclick="generatePassword()">
                        <i class="fas fa-key"></i> Generate New
                    </button>
                </div>
                <small style="color: var(--text-light);">Leave empty to keep the current password. Enter a new password to change it.</small>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Payment Date *</label>
                    <input type="date" name="paymentDate" value="${student.paymentDate ? new Date(student.paymentDate).toISOString().split('T')[0] : ''}" required>
                </div>
                <div class="form-group">
                    <label>Amount (MAD) *</label>
                    <input type="number" name="paymentAmount" value="${student.paymentAmount || ''}" required min="0" step="0.01">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Payment Status *</label>
                    <select name="paymentStatus" required>
                        <option value="pending" ${student.paymentStatus === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="paid" ${student.paymentStatus === 'paid' ? 'selected' : ''}>Paid</option>
                        <option value="overdue" ${student.paymentStatus === 'overdue' ? 'selected' : ''}>Overdue</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Status *</label>
                    <select name="status" required>
                        <option value="active" ${student.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${student.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="graduated" ${student.status === 'graduated' ? 'selected' : ''}>Graduated</option>
                        <option value="dropped" ${student.status === 'dropped' ? 'selected' : ''}>Dropped</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Update Photo (optional)</label>
                <input type="file" name="photo" accept="image/*">
                ${isValidPhotoPath(student.photoPath) ? `<small style="color: var(--text-light);">Current photo will be replaced if you upload a new one</small>` : ''}
            </div>
            
            <!-- CIN Card Upload Section -->
            <div style="border-top: 2px solid var(--border-color); padding-top: 20px; margin-top: 20px;">
                <h3 style="margin-bottom: 15px; color: var(--primary-color); display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-id-card"></i> CIN Card (ID Card)
                    ${student.cinCard && (student.cinCard.front || student.cinCard.back) ? 
                        '<span style="font-size: 0.75rem; background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-weight: normal;">✓ Uploaded</span>' : 
                        student.cinCard && student.cinCard.addLater ?
                        '<span style="font-size: 0.75rem; background: #f59e0b; color: white; padding: 4px 8px; border-radius: 4px; font-weight: normal;">⏰ Pending</span>' :
                        '<span style="font-size: 0.75rem; background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-weight: normal;">✗ Not Uploaded</span>'
                    }
                </h3>
                
                <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin-bottom: 15px; border-radius: 4px;">
                    <p style="margin: 0; color: #1e40af; font-size: 0.9rem; font-weight: 500;">
                        <i class="fas fa-info-circle"></i> Upload or Update CIN Card:
                    </p>
                    <ul style="margin: 8px 0 0 20px; color: #1e40af; font-size: 0.85rem;">
                        <li>Upload both front and back sides</li>
                        <li>Supported formats: JPEG, PNG, PDF (max 2MB per side)</li>
                        <li>Images will be automatically optimized</li>
                        ${student.cinCard && (student.cinCard.front || student.cinCard.back) ? '<li><strong>Current CIN will be replaced if you upload new files</strong></li>' : ''}
                    </ul>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>CIN Front Side ${student.cinCard && student.cinCard.front ? '(Current: ✓ Uploaded)' : ''}</label>
                        <input type="file" id="editCinFront" name="cinFront" accept="image/*,application/pdf" onchange="handleEditCINUpload(event, 'front', '${student._id}')">
                        <div id="editCinFrontPreview-${student._id}" style="margin-top: 8px;"></div>
                    </div>
                    <div class="form-group">
                        <label>CIN Back Side ${student.cinCard && student.cinCard.back ? '(Current: ✓ Uploaded)' : ''}</label>
                        <input type="file" id="editCinBack" name="cinBack" accept="image/*,application/pdf" onchange="handleEditCINUpload(event, 'back', '${student._id}')">
                        <div id="editCinBackPreview-${student._id}" style="margin-top: 8px;"></div>
                    </div>
                </div>
                
                ${!student.cinCard || (!student.cinCard.front && !student.cinCard.back) ? `
                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="editCinAddLater" name="cinAddLater" onchange="toggleEditCINInputs('${student._id}')" style="width: 18px; height: 18px;">
                        <span>Add now & add later (Student doesn't have CIN today)</span>
                    </label>
                    <small style="color: var(--text-light);">Check this if the student will provide the CIN card later</small>
                </div>
                ` : ''}
            </div>
            
            <div class="form-group">
                <label>Notes</label>
                <textarea name="notes" rows="3">${student.notes || ''}</textarea>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button type="submit" class="btn"><i class="fas fa-save"></i> Update</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `);
    document.body.appendChild(modal);
    modal.classList.add('active');
    
    // Load branch subgroups asynchronously if needed (after modal is shown)
    if (hasBranches && branchSubgroupsLoading) {
        loadBranchSubgroupsAsync(currentBranchSubgroupId);
    }
}

// Helper function to load and cache branch subgroups (with parallel API calls)
async function loadBranchSubgroupsAsync(selectedSubgroupId = '') {
    try {
        // Get season context - use current season or warn if not available
        const seasonId = legacyCurrentSeasonId;
        if (!seasonId) {
            console.warn('⚠️ No season selected, branch subgroups may show from all seasons');
        } else {
            console.log('📋 Loading branch subgroups for season:', seasonId);
        }
        
        const branchGroupsResponse = await fetch('/api/branch-groups', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const branchGroups = await branchGroupsResponse.json();
        
        // Fetch all subgroups in parallel (much faster than sequential)
        const subgroupPromises = branchGroups.map(async (branchGroup) => {
            try {
                // Add season parameter if available
                const url = seasonId 
                    ? `/api/branch-groups/${branchGroup._id}/subgroups?season=${seasonId}`
                    : `/api/branch-groups/${branchGroup._id}/subgroups`;
                    
                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if (response.ok) {
                    const subgroups = await response.json();
                    return subgroups.map(sg => ({
                        ...sg,
                        branchGroupName: branchGroup.displayName
                    }));
                }
                return [];
            } catch (error) {
                console.error(`Error loading subgroups for ${branchGroup.displayName}:`, error);
                return [];
            }
        });
        
        const subgroupArrays = await Promise.all(subgroupPromises);
        const allSubgroups = subgroupArrays.flat();
        
        // Cache the results
        cachedBranchSubgroups = allSubgroups;
        branchSubgroupsLoadTime = Date.now();
        
        // Update the dropdown if it exists
        const select = document.getElementById('branchSubgroupSelect');
        if (select) {
            select.disabled = false;
            select.innerHTML = `
                <option value="">-- Not Assigned --</option>
                ${allSubgroups.map(sg => 
                    `<option value="${sg._id}" ${sg._id === selectedSubgroupId ? 'selected' : ''}>${sg.branchGroupName} - ${sg.name}</option>`
                ).join('')}
            `;
        }
    } catch (error) {
        console.error('Error loading branch subgroups:', error);
        const select = document.getElementById('branchSubgroupSelect');
        if (select) {
            select.disabled = false;
            select.innerHTML = '<option value="">-- Failed to load --</option>';
        }
    }
}

async function updateStudent(event, studentId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    console.log('=== Updating Student ===');
    console.log('Student ID:', studentId);
    console.log('Form data entries:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }
    
    try {
        const response = await fetch(`${API_BASE}/students/${studentId}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        console.log('Response status:', response.status);
        
        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin';
            return;
        }
        
        const result = await response.json();
        console.log('Response result:', result);
        
        if (response.ok && result.success) {
            showNotification('Student updated successfully!', 'success');
            closeModal();
            await loadStudents();
            await loadGroups();
            await loadDashboardStats();
            await loadPaymentReminders();
        } else {
            throw new Error(result.error || 'Failed to update student');
        }
    } catch (error) {
        console.error('=== Error updating student ===');
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        showNotification(error.message || 'Failed to update student', 'error');
    }
}

// ==================== GRADES MANAGEMENT ====================

// Update grades filters based on formation/branch selection
function updateGradesFilters(preserveSelection = false) {
    const formation = document.getElementById('gradesFormationFilter').value;
    const branch = document.getElementById('gradesBranchFilter').value;
    
    // Language formations use A1-B2 system
    const languageFormations = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];
    const isLanguageFormation = formation && languageFormations.includes(formation);
    const isBranchFormation = branch && branch !== '';
    
    // Update Semester/Level filter based on formation type
    const semesterFilter = document.getElementById('gradesSemesterFilter');
    const semesterLabel = document.getElementById('gradesSemesterLabel');
    
    // Save current selection if preserving
    const currentSemesterValue = preserveSelection ? semesterFilter.value : '';
    
    if (isLanguageFormation && !isBranchFormation) {
        // Language formation: Show A1-B2 levels
        semesterLabel.textContent = 'Language Level';
        semesterFilter.innerHTML = `
            <option value="">All Levels</option>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
        `;
        
        // Restore selection if preserving
        if (preserveSelection && currentSemesterValue) {
            semesterFilter.value = currentSemesterValue;
        }
    } else {
        // Branch formation or default: Show semesters
        semesterLabel.textContent = 'Semester';
        semesterFilter.innerHTML = `
            <option value="">All Semesters</option>
            <option value="Semester 1">Semester 1</option>
            <option value="Semester 2">Semester 2</option>
        `;
        
        // Restore selection if preserving
        if (preserveSelection && currentSemesterValue) {
            semesterFilter.value = currentSemesterValue;
        }
    }
    
    // Update Exam filter based on formation type
    const examFilter = document.getElementById('gradesExamFilter');
    const examLabel = document.getElementById('gradesExamLabel');
    
    if (isLanguageFormation && !isBranchFormation) {
        // Language formation: Show Test 1, Test 2, Test 3, and Exam for selected level
        examLabel.innerHTML = '<i class="fas fa-file-alt"></i> Test Type';
        
        // Get the selected level
        const selectedLevel = semesterFilter.value;
        
        if (selectedLevel && selectedLevel !== '') {
            // Specific level selected: Show tests + exam for that level only
            examFilter.innerHTML = `
                <option value="">All Tests</option>
                <option value="Test 1">Test 1</option>
                <option value="Test 2">Test 2</option>
                <option value="Test 3">Test 3</option>
                <option value="Test 4">Test 4</option>
                <option value="Exam ${selectedLevel}">Exam ${selectedLevel}</option>
            `;
        } else {
            // No specific level selected: Show all tests + all exams
            examFilter.innerHTML = `
                <option value="">All Tests</option>
                <option value="Test 1">Test 1</option>
                <option value="Test 2">Test 2</option>
                <option value="Test 3">Test 3</option>
                <option value="Test 4">Test 4</option>
                <option value="Exam A1">Exam A1</option>
                <option value="Exam A2">Exam A2</option>
                <option value="Exam B1">Exam B1</option>
                <option value="Exam B2">Exam B2</option>
            `;
        }
    } else {
        // Branch formation: Show Exam 1-5
        examLabel.innerHTML = '<i class="fas fa-file-alt"></i> Exam Number';
        examFilter.innerHTML = `
            <option value="">All Exams</option>
            <option value="1">Exam 1</option>
            <option value="2">Exam 2</option>
            <option value="3">Exam 3</option>
            <option value="4">Exam 4</option>
            ${isBranchFormation ? '<option value="5">Exam 5</option>' : ''}
        `;
    }
}

// Load student grades
async function loadStudentGrades() {
    const studentId = document.getElementById('gradesStudentFilter').value;
    const formation = document.getElementById('gradesFormationFilter').value;
    const branch = document.getElementById('gradesBranchFilter').value;
    const semester = document.getElementById('gradesSemesterFilter').value;
    const examNumber = document.getElementById('gradesExamFilter').value;
    const gradesContent = document.getElementById('gradesContent');
    
    if (!studentId) {
        gradesContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-light);">
                <i class="fas fa-user-graduate" style="font-size: 3rem; color: var(--primary-color); opacity: 0.3; margin-bottom: 15px;"></i>
                <p>Select a student to view their grades</p>
            </div>
        `;
        return;
    }
    
    gradesContent.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-light);">
            <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--primary-color);"></i>
            <p>Loading grades...</p>
        </div>
    `;
    
    try {
        let url = `/api/grades/admin/students/${studentId}/grades?`;
        if (formation) url += `formation=${formation}&`;
        if (branch) url += `branch=${branch}&`;
        
        // For language formations, use languageLevel instead of semester
        const languageFormations = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];
        const isLanguageFormation = formation && languageFormations.includes(formation);
        
        if (semester) {
            if (isLanguageFormation && !branch) {
                // Language level (A1, A2, B1, B2)
                url += `languageLevel=${semester}&`;
            } else {
                // Traditional semester
                url += `semester=${semester}&`;
            }
        }
        
        // For test types (Test 1, Test 2, Exam A1, etc.), use testType parameter
        if (examNumber) {
            if (examNumber.startsWith('Test ') || examNumber.startsWith('Exam ')) {
                // Language test type (Test 1, Test 2, Exam A1, etc.)
                url += `testType=${encodeURIComponent(examNumber)}&`;
            } else {
                // Traditional exam number (1, 2, 3, 4, 5)
                url += `examNumber=${examNumber}&`;
            }
        }
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to load grades');
        }
        
        const grades = await response.json();
        displayStudentGrades(grades);
    } catch (error) {
        console.error('Error loading grades:', error);
        gradesContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--danger-color);">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <p>Error loading grades: ${error.message}</p>
            </div>
        `;
    }
}

// Display student grades
function displayStudentGrades(grades) {
    const gradesContent = document.getElementById('gradesContent');
    
    if (grades.length === 0) {
        gradesContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-light);">
                <i class="fas fa-clipboard-list" style="font-size: 3rem; color: var(--primary-color); opacity: 0.3; margin-bottom: 15px;"></i>
                <p>No grades found for this student</p>
            </div>
        `;
        return;
    }
    
    // Language formations use A1-B2 system
    const languageFormations = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];
    
    // Group grades by formation, level/semester, and exam number
    const groupedGrades = {};
    grades.forEach(grade => {
        const isLanguage = languageFormations.includes(grade.formation);
        let key;
        
        if (isLanguage && grade.languageLevel) {
            // A1-B2 system: Group by level and test type
            const testInfo = grade.testType === 'miniTest' ? `Mini Test ${grade.testNumber}` : 'Final Exam';
            key = `${grade.formation} - ${grade.languageLevel} - ${testInfo} (${grade.academicYear})`;
        } else {
            // Traditional system: Group by semester and exam number
            const examInfo = grade.examNumber ? ` - Exam ${grade.examNumber}` : '';
            key = `${grade.formation} - ${grade.semester}${examInfo} (${grade.academicYear})`;
        }
        
        if (!groupedGrades[key]) {
            groupedGrades[key] = {
                isLanguage: isLanguage && grade.languageLevel,
                grades: []
            };
        }
        groupedGrades[key].grades.push(grade);
    });
    
    let html = '';
    
    Object.keys(groupedGrades).forEach(key => {
        const { isLanguage, grades: gradesList } = groupedGrades[key];
        
        html += `
            <div style="margin-bottom: 30px;">
                <h3 style="color: var(--primary-color); margin-bottom: 15px; font-size: 18px;">
                    <i class="fas fa-book"></i> ${key}
                </h3>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--bg-light);">
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">${t('examType')}</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">${t('score')}</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">${t('percentage')}</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">${isLanguage ? t('status') : t('grade')}</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">${t('examDate')}</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">${t('teacher')}</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">${t('comments')}</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        gradesList.forEach(grade => {
            const percentage = ((grade.score / grade.maxScore) * 100).toFixed(2);
            const examDate = new Date(grade.examDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            let gradeDisplay;
            if (isLanguage) {
                // Visual evaluation system for languages
                const status = grade.evaluationStatus || getEvaluationStatus(percentage);
                const statusConfig = getStatusConfig(status);
                gradeDisplay = `
                    <span style="background: ${statusConfig.color}; color: white; padding: 6px 12px; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
                        ${statusConfig.icon} ${statusConfig.label}
                    </span>
                `;
            } else {
                // Traditional letter grade system for branches
                const gradeLetter = getGradeLetter(percentage);
                const gradeColor = getGradeColor(percentage);
                gradeDisplay = `<span style="background: ${gradeColor}; color: white; padding: 4px 12px; border-radius: 6px; font-weight: 600;">${gradeLetter}</span>`;
            }
            
            const displayComment = isLanguage ? (grade.autoComment || grade.comments || '-') : (grade.comments || '-');
            
            html += `
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 12px;"><span style="background: rgba(255, 204, 0, 0.1); padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: 600;">${grade.examType}</span></td>
                    <td style="padding: 12px;"><strong>${grade.score}/${grade.maxScore}</strong></td>
                    <td style="padding: 12px;">${percentage}%</td>
                    <td style="padding: 12px;">${gradeDisplay}</td>
                    <td style="padding: 12px;">${examDate}</td>
                    <td style="padding: 12px;">${grade.uploadedBy ? grade.uploadedBy.fullName : 'N/A'}</td>
                    <td style="padding: 12px; font-style: ${isLanguage ? 'italic' : 'normal'};">${displayComment}</td>
                </tr>
            `;
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

// Visual Evaluation System for A1-B2 Languages
function getEvaluationStatus(percentage) {
    if (percentage >= 70) return 'approved';
    if (percentage >= 50) return 'mid';
    return 'failed';
}

function getStatusConfig(status) {
    const configs = {
        approved: {
            icon: '<i class="fas fa-check-circle"></i>',
            label: t('approved'),
            color: '#10b981'
        },
        mid: {
            icon: '<i class="fas fa-exclamation-triangle"></i>',
            label: 'Mid',
            color: '#f59e0b'
        },
        failed: {
            icon: '<i class="fas fa-times-circle"></i>',
            label: 'Failed',
            color: '#ef4444'
        }
    };
    return configs[status] || configs.mid;
}

// Traditional Letter Grade System for Branches
function getGradeLetter(percentage) {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
}

function getGradeColor(percentage) {
    if (percentage >= 90) return '#10b981';
    if (percentage >= 75) return '#3b82f6';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
}

// ==================== TEACHER MANAGEMENT ====================

let allTeachers = [];

// Load teachers
async function loadTeachers() {
    const teachersContent = document.getElementById('teachersContent');
    
    teachersContent.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-light);">
            <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--primary-color);"></i>
            <p>Loading teachers...</p>
        </div>
    `;
    
    try {
        const response = await fetch('/api/grades/admin/teachers', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load teachers');
        
        allTeachers = await response.json();
        displayTeachers(allTeachers);
    } catch (error) {
        console.error('Error loading teachers:', error);
        teachersContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--danger-color);">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <p>Error loading teachers</p>
            </div>
        `;
    }
}

// Display teachers
function displayTeachers(teachers) {
    const teachersContent = document.getElementById('teachersContent');
    
    if (teachers.length === 0) {
        teachersContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-light);">
                <i class="fas fa-chalkboard-teacher" style="font-size: 3rem; color: var(--primary-color); opacity: 0.3; margin-bottom: 15px;"></i>
                <p>${t('noTeachersFound')}</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: var(--bg-light);">
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">${t('name')}</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">${t('email')}</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">${t('phone')}</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">${t('formations')}</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">${t('assignedGroups')}</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">${t('status')}</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">${t('actions')}</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    teachers.forEach(teacher => {
        const statusColor = teacher.status === 'active' ? 'var(--success-color)' : 'var(--text-light)';
        const formations = teacher.formations.join(', ');
        
        // Get group names for assigned groups (show ALL groups with season info)
        const teacherGroups = teacher.groups || [];
        let groupsDisplay = 'None';
        if (teacherGroups.length > 0) {
            const groupNames = teacherGroups.map(g => {
                if (typeof g === 'string') {
                    // If it's just an ID, find the group name
                    const group = allGroups.find(gr => gr._id === g);
                    if (!group) return null;
                    // Show group name with season if available
                    const seasonName = group.seasonName || '';
                    return seasonName ? `${group.name} (${seasonName})` : group.name;
                } else {
                    // If it's populated, show group name with season
                    const seasonName = g.seasonName || '';
                    return seasonName ? `${g.name} (${seasonName})` : (g.name || null);
                }
            }).filter(name => name !== null); // Remove null entries
            groupsDisplay = groupNames.length > 0 ? groupNames.join(', ') : 'None';
        }
        
        html += `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 12px;"><strong>${teacher.fullName}</strong></td>
                <td style="padding: 12px;">${teacher.email}</td>
                <td style="padding: 12px;">${teacher.phoneNumber}</td>
                <td style="padding: 12px;">${formations}</td>
                <td style="padding: 12px;"><span style="color: var(--primary-color); font-weight: 500;">${groupsDisplay}</span></td>
                <td style="padding: 12px;"><span style="color: ${statusColor}; font-weight: 600;">${t(teacher.status)}</span></td>
                <td style="padding: 12px;">
                    <div class="action-buttons">
                        <button class="btn btn-small" onclick="openEditTeacherModal('${teacher._id}')" title="Edit Teacher">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-small btn-warning" onclick="resetTeacherPassword('${teacher._id}')" title="Reset Password">
                            <i class="fas fa-key"></i>
                        </button>
                        <button class="btn btn-small btn-danger" onclick="deleteTeacher('${teacher._id}')" title="Delete Teacher">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    teachersContent.innerHTML = html;
}

// Open add teacher modal
function openAddTeacherModal() {
    // Filter groups by active season only
    const activeSeasonGroups = allGroups.filter(group => {
        if (!legacyCurrentSeasonId) return true; // If no season context, show all
        const groupSeasonId = group.season?.toString();
        return groupSeasonId === legacyCurrentSeasonId;
    });
    
    // Generate groups checkboxes
    const groupsHTML = activeSeasonGroups.length > 0 ? 
        activeSeasonGroups.map(group => `
            <label style="display: flex; align-items: center; gap: 8px; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px;">
                <input type="checkbox" name="groups" value="${group._id}">
                <span>${group.name} (${group.formation})</span>
            </label>
        `).join('') : 
        '<p style="color: var(--text-light); font-style: italic;">No groups available in active season. Create groups first.</p>';
    
    const modal = createModal(`
        <h2 style="color: var(--primary-color); margin-bottom: 25px;"><i class="fas fa-user-plus"></i> Add Teacher</h2>
        <form onsubmit="addTeacher(event)">
            <div class="form-group">
                <label>Full Name *</label>
                <input type="text" name="fullName" id="teacherFullName" required oninput="generateTeacherEmail()">
            </div>
            <div class="form-group">
                <label>School Email (Auto-generated) *</label>
                <input type="email" name="email" id="teacherEmail" required placeholder="Will be generated from name" readonly style="background: #f0f0f0;">
                <small style="color: var(--text-light);">Email is automatically generated from teacher's name</small>
            </div>
            <div class="form-group">
                <label>Password *</label>
                <div style="position: relative;">
                    <input type="password" name="password" id="teacherPassword" minlength="6" required>
                    <button type="button" onclick="generateTeacherPassword()" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: var(--primary-color); border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; color: white; font-size: 12px;">
                        <i class="fas fa-key"></i> Generate
                    </button>
                </div>
            </div>
            <div class="form-group">
                <label>Phone Number *</label>
                <input type="tel" name="phoneNumber" pattern="0[5-7][0-9]{8}" placeholder="06XXXXXXXX" required>
            </div>
            <div class="form-group">
                <label>Formations * <small style="color: var(--text-light); font-weight: normal;">(Select all that apply)</small></label>
                
                <div style="margin-bottom: 15px;">
                    <strong style="color: var(--primary-color); display: block; margin-bottom: 8px;">📚 Language Formations</strong>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Allemand">
                            <span>Allemand (German)</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Anglais">
                            <span>Anglais (English)</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Français">
                            <span>Français (French)</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Ausbildung">
                            <span>Ausbildung</span>
                        </label>
                    </div>
                </div>
                
                <div>
                    <strong style="color: var(--primary-color); display: block; margin-bottom: 8px;">🎓 Branch Formations (Filières)</strong>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Gériatrie">
                            <span>Gériatrie</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Aide soignant">
                            <span>Aide soignant</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Agent socio éducatif">
                            <span>Agent socio éducatif</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Assistante sociale">
                            <span>Assistante sociale</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Restauration">
                            <span>Restauration</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Cuisine">
                            <span>Cuisine</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Informatique">
                            <span>Informatique</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Gestion hôtelière">
                            <span>Gestion hôtelière</span>
                        </label>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Assign Groups (Optional)</label>
                <small style="color: var(--text-light); display: block; margin-bottom: 10px;">Select which groups this teacher will manage</small>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; max-height: 200px; overflow-y: auto; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-light);">
                    ${groupsHTML}
                </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button type="submit" class="btn"><i class="fas fa-save"></i> Add Teacher</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `);
    document.body.appendChild(modal);
    modal.classList.add('active');
}

// Generate teacher email from name
function generateTeacherEmail() {
    const fullNameInput = document.getElementById('teacherFullName');
    const emailInput = document.getElementById('teacherEmail');
    
    if (fullNameInput && emailInput) {
        const fullName = fullNameInput.value.trim();
        if (fullName) {
            // Remove spaces, convert to lowercase, remove special characters
            const emailPrefix = fullName
                .toLowerCase()
                .replace(/\s+/g, '') // Remove all spaces
                .replace(/[^a-z0-9]/g, ''); // Remove special characters, keep only letters and numbers
            
            emailInput.value = `${emailPrefix}@nisrineschool.com`;
        } else {
            emailInput.value = '';
        }
    }
}

// Generate teacher password
function generateTeacherPassword() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    const passwordInput = document.getElementById('teacherPassword');
    if (passwordInput) {
        passwordInput.value = password;
        passwordInput.type = 'text'; // Show password temporarily
        setTimeout(() => {
            passwordInput.type = 'password';
        }, 3000);
    }
}

// Add teacher
async function addTeacher(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const formations = [];
    formData.getAll('formations').forEach(f => formations.push(f));
    
    const groups = [];
    formData.getAll('groups').forEach(g => groups.push(g));
    
    if (formations.length === 0) {
        showNotification('Please select at least one formation', 'error');
        return;
    }
    
    // Email will be auto-generated on backend from fullName
    const teacherData = {
        fullName: formData.get('fullName'),
        password: formData.get('password'),
        phoneNumber: formData.get('phoneNumber'),
        formations: formations,
        groups: groups // Include assigned groups
    };
    
    console.log('Teacher data being sent:', teacherData);
    
    // Validate before sending
    if (!teacherData.fullName || !teacherData.password || !teacherData.phoneNumber) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/grades/admin/teachers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(teacherData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification(`Teacher added successfully! Email: ${result.teacher.email}`, 'success');
            closeModal();
            await loadTeachers();
        } else {
            throw new Error(result.message || 'Failed to add teacher');
        }
    } catch (error) {
        console.error('Error adding teacher:', error);
        showNotification(error.message || 'Failed to add teacher', 'error');
    }
}

// Open edit teacher modal
async function openEditTeacherModal(teacherId) {
    const teacher = allTeachers.find(t => t._id === teacherId);
    if (!teacher) return;
    
    // Filter groups by active season only
    const activeSeasonGroups = allGroups.filter(group => {
        if (!legacyCurrentSeasonId) return true; // If no season context, show all
        const groupSeasonId = group.season?.toString();
        return groupSeasonId === legacyCurrentSeasonId;
    });
    
    // Generate groups checkboxes with current assignments
    const teacherGroups = teacher.groups || [];
    const groupsHTML = activeSeasonGroups.length > 0 ? 
        activeSeasonGroups.map(group => {
            const isAssigned = teacherGroups.some(g => (typeof g === 'string' ? g : g._id) === group._id);
            return `
                <label style="display: flex; align-items: center; gap: 8px; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px;">
                    <input type="checkbox" name="groups" value="${group._id}" ${isAssigned ? 'checked' : ''}>
                    <span>${group.name} (${group.formation})</span>
                </label>
            `;
        }).join('') : 
        '<p style="color: var(--text-light); font-style: italic;">No groups available in active season.</p>';
    
    const modal = createModal(`
        <h2 style="color: var(--primary-color); margin-bottom: 25px;"><i class="fas fa-edit"></i> Edit Teacher</h2>
        <form onsubmit="updateTeacher(event, '${teacherId}')">
            <div class="form-group">
                <label>Full Name *</label>
                <input type="text" name="fullName" value="${teacher.fullName}" required>
            </div>
            <div class="form-group">
                <label>Phone Number *</label>
                <input type="tel" name="phoneNumber" value="${teacher.phoneNumber}" pattern="0[5-7][0-9]{8}" required>
            </div>
            <div class="form-group">
                <label>Formations * <small style="color: var(--text-light); font-weight: normal;">(Select all that apply)</small></label>
                
                <div style="margin-bottom: 15px;">
                    <strong style="color: var(--primary-color); display: block; margin-bottom: 8px;">📚 Language Formations</strong>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Allemand" ${teacher.formations.includes('Allemand') ? 'checked' : ''}>
                            <span>Allemand (German)</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Anglais" ${teacher.formations.includes('Anglais') ? 'checked' : ''}>
                            <span>Anglais (English)</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Français" ${teacher.formations.includes('Français') ? 'checked' : ''}>
                            <span>Français (French)</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Ausbildung" ${teacher.formations.includes('Ausbildung') ? 'checked' : ''}>
                            <span>Ausbildung</span>
                        </label>
                    </div>
                </div>
                
                <div>
                    <strong style="color: var(--primary-color); display: block; margin-bottom: 8px;">🎓 Branch Formations (Filières)</strong>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Gériatrie" ${teacher.formations.includes('Gériatrie') ? 'checked' : ''}>
                            <span>Gériatrie</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Aide soignant" ${teacher.formations.includes('Aide soignant') ? 'checked' : ''}>
                            <span>Aide soignant</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Agent socio éducatif" ${teacher.formations.includes('Agent socio éducatif') ? 'checked' : ''}>
                            <span>Agent socio éducatif</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Assistante sociale" ${teacher.formations.includes('Assistante sociale') ? 'checked' : ''}>
                            <span>Assistante sociale</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Restauration" ${teacher.formations.includes('Restauration') ? 'checked' : ''}>
                            <span>Restauration</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Cuisine" ${teacher.formations.includes('Cuisine') ? 'checked' : ''}>
                            <span>Cuisine</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Informatique" ${teacher.formations.includes('Informatique') ? 'checked' : ''}>
                            <span>Informatique</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="formations" value="Gestion hôtelière" ${teacher.formations.includes('Gestion hôtelière') ? 'checked' : ''}>
                            <span>Gestion hôtelière</span>
                        </label>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Assign Groups (Optional)</label>
                <small style="color: var(--text-light); display: block; margin-bottom: 10px;">Select which groups this teacher will manage</small>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; max-height: 200px; overflow-y: auto; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-light);">
                    ${groupsHTML}
                </div>
            </div>
            <div class="form-group">
                <label>Status *</label>
                <select name="status" required>
                    <option value="active" ${teacher.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="inactive" ${teacher.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                </select>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button type="submit" class="btn"><i class="fas fa-save"></i> Update</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `);
    document.body.appendChild(modal);
    modal.classList.add('active');
}

// Update teacher
async function updateTeacher(event, teacherId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const formations = [];
    formData.getAll('formations').forEach(f => formations.push(f));
    
    const groups = [];
    formData.getAll('groups').forEach(g => groups.push(g));
    
    if (formations.length === 0) {
        showNotification('Please select at least one formation', 'error');
        return;
    }
    
    const teacherData = {
        fullName: formData.get('fullName'),
        phoneNumber: formData.get('phoneNumber'),
        formations: formations,
        groups: groups, // Include updated groups
        status: formData.get('status')
    };
    
    try {
        const response = await fetch(`/api/grades/admin/teachers/${teacherId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(teacherData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Teacher updated successfully!', 'success');
            closeModal();
            await loadTeachers();
        } else {
            throw new Error(result.message || 'Failed to update teacher');
        }
    } catch (error) {
        console.error('Error updating teacher:', error);
        showNotification(error.message || 'Failed to update teacher', 'error');
    }
}

// Reset teacher password
async function resetTeacherPassword(teacherId) {
    const newPassword = prompt('Enter new password (minimum 6 characters):');
    if (!newPassword || newPassword.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/grades/admin/teachers/${teacherId}/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ password: newPassword })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Password reset successfully!', 'success');
        } else {
            throw new Error(result.message || 'Failed to reset password');
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        showNotification(error.message || 'Failed to reset password', 'error');
    }
}

// Delete teacher
async function deleteTeacher(teacherId) {
    if (!confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/grades/admin/teachers/${teacherId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Teacher deleted successfully!', 'success');
            await loadTeachers();
        } else {
            throw new Error(result.message || 'Failed to delete teacher');
        }
    } catch (error) {
        console.error('Error deleting teacher:', error);
        showNotification(error.message || 'Failed to delete teacher', 'error');
    }
}

// Edit Group with Data (Instant - No API call needed!)
window.editGroupWithData = function(group) {
    try {
        console.log('Opening edit modal with data:', group);
        
        // Safely get values with fallbacks
        const groupName = group.name || '';
        const groupFormation = group.formation || 'Mixed';
        const groupBranchFormation = group.branchFormation || 'None';
        const groupMaxStudents = group.maxStudents || 30;
        const groupStatus = group.status || 'active';
        const groupId = group._id;
        
        // Open modal with group data (INSTANT!)
        const modal = createModal('Edit Group', `
            <form onsubmit="updateGroup(event, '${groupId}')">
                <div class="form-group">
                    <label>Group Name *</label>
                    <input type="text" name="name" value="${groupName}" required>
                </div>
                <div class="form-group">
                    <label>Language Formation *</label>
                    <select name="formation" required>
                        <option value="Mixed" ${groupFormation === 'Mixed' ? 'selected' : ''}>Mixed</option>
                        <option value="Allemand" ${groupFormation === 'Allemand' ? 'selected' : ''}>Allemand</option>
                        <option value="Anglais" ${groupFormation === 'Anglais' ? 'selected' : ''}>Anglais</option>
                        <option value="Français" ${groupFormation === 'Français' ? 'selected' : ''}>Français</option>
                        <option value="Ausbildung" ${groupFormation === 'Ausbildung' ? 'selected' : ''}>Ausbildung</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Branch Formation (Filière) <span style="font-size: 11px; color: #888;">- Keep as "Mixed"</span></label>
                    <select name="branchFormation">
                        <option value="Mixed" ${groupBranchFormation === 'Mixed' ? 'selected' : ''}>All Branches (Mixed) - Recommended</option>
                        <option value="None" ${!groupBranchFormation || groupBranchFormation === 'None' ? 'selected' : ''}>None</option>
                        <option value="Gériatrie" ${groupBranchFormation === 'Gériatrie' ? 'selected' : ''}>Gériatrie</option>
                        <option value="Aide soignant" ${groupBranchFormation === 'Aide soignant' ? 'selected' : ''}>Aide soignant</option>
                        <option value="Agent socio éducatif" ${groupBranchFormation === 'Agent socio éducatif' ? 'selected' : ''}>Agent socio éducatif</option>
                        <option value="Assistante sociale" ${groupBranchFormation === 'Assistante sociale' ? 'selected' : ''}>Assistante sociale</option>
                        <option value="Restauration" ${groupBranchFormation === 'Restauration' ? 'selected' : ''}>Restauration</option>
                        <option value="Cuisine" ${groupBranchFormation === 'Cuisine' ? 'selected' : ''}>Cuisine</option>
                        <option value="Informatique" ${groupBranchFormation === 'Informatique' ? 'selected' : ''}>Informatique</option>
                        <option value="Gestion hôtelière" ${groupBranchFormation === 'Gestion hôtelière' ? 'selected' : ''}>Gestion hôtelière</option>
                    </select>
                    <small style="color: #666; font-size: 11px; display: block; margin-top: 5px;">
                        ℹ️ Branch teachers will see students from all groups who study their branch
                    </small>
                </div>
                <div class="form-group">
                    <label>Max Students *</label>
                    <input type="number" name="maxStudents" value="${groupMaxStudents}" min="1" required>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select name="status">
                        <option value="active" ${groupStatus === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${groupStatus === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> Update Group
                </button>
            </form>
        `);
        
        document.body.appendChild(modal);
        modal.classList.add('active');
    } catch (error) {
        console.error('Error opening edit modal:', error);
        showNotification(error.message || 'Failed to open edit modal', 'error');
    }
};

// Edit Group (Legacy - with API call)
window.editGroup = async function(groupId) {
    try {
        // Fetch group details
        const response = await fetch(`${API_BASE}/groups/${groupId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch group details');
        
        const group = await response.json();
        
        console.log('Group data:', group); // Debug log
        
        // Safely get values with fallbacks
        const groupName = group.name || '';
        const groupFormation = group.formation || 'Mixed';
        const groupBranchFormation = group.branchFormation || 'None';
        const groupMaxStudents = group.maxStudents || 30;
        const groupStatus = group.status || 'active';
        
        // Open modal with group data
        const modal = createModal('Edit Group', `
            <form onsubmit="updateGroup(event, '${groupId}')">
                <div class="form-group">
                    <label>Group Name *</label>
                    <input type="text" name="name" value="${groupName}" required>
                </div>
                <div class="form-group">
                    <label>Language Formation *</label>
                    <select name="formation" required>
                        <option value="Mixed" ${group.formation === 'Mixed' ? 'selected' : ''}>Mixed</option>
                        <option value="Allemand" ${group.formation === 'Allemand' ? 'selected' : ''}>Allemand</option>
                        <option value="Anglais" ${group.formation === 'Anglais' ? 'selected' : ''}>Anglais</option>
                        <option value="Français" ${group.formation === 'Français' ? 'selected' : ''}>Français</option>
                        <option value="Ausbildung" ${group.formation === 'Ausbildung' ? 'selected' : ''}>Ausbildung</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Branch Formation (Filière) <span style="font-size: 11px; color: #888;">- Keep as "Mixed"</span></label>
                    <select name="branchFormation">
                        <option value="Mixed" ${group.branchFormation === 'Mixed' ? 'selected' : ''}>All Branches (Mixed) - Recommended</option>
                        <option value="None" ${!group.branchFormation || group.branchFormation === 'None' ? 'selected' : ''}>None</option>
                        <option value="Gériatrie" ${group.branchFormation === 'Gériatrie' ? 'selected' : ''}>Gériatrie</option>
                        <option value="Aide soignant" ${group.branchFormation === 'Aide soignant' ? 'selected' : ''}>Aide soignant</option>
                        <option value="Agent socio éducatif" ${group.branchFormation === 'Agent socio éducatif' ? 'selected' : ''}>Agent socio éducatif</option>
                        <option value="Assistante sociale" ${group.branchFormation === 'Assistante sociale' ? 'selected' : ''}>Assistante sociale</option>
                        <option value="Restauration" ${group.branchFormation === 'Restauration' ? 'selected' : ''}>Restauration</option>
                        <option value="Cuisine" ${group.branchFormation === 'Cuisine' ? 'selected' : ''}>Cuisine</option>
                        <option value="Informatique" ${group.branchFormation === 'Informatique' ? 'selected' : ''}>Informatique</option>
                        <option value="Gestion hôtelière" ${group.branchFormation === 'Gestion hôtelière' ? 'selected' : ''}>Gestion hôtelière</option>
                    </select>
                    <small style="color: #666; font-size: 11px; display: block; margin-top: 5px;">
                        ℹ️ Branch teachers will see students from all groups who study their branch
                    </small>
                </div>
                <div class="form-group">
                    <label>Max Students *</label>
                    <input type="number" name="maxStudents" value="${groupMaxStudents}" min="1" required>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select name="status">
                        <option value="active" ${groupStatus === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${groupStatus === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> Update Group
                </button>
            </form>
        `);
        
        document.body.appendChild(modal);
        modal.classList.add('active');
    } catch (error) {
        console.error('Error loading group:', error);
        showNotification(error.message || 'Failed to load group details', 'error');
    }
}

async function updateGroup(event, groupId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch(`${API_BASE}/groups/${groupId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update group');
        }
        
        showNotification('Group updated successfully!', 'success');
        closeModal();
        loadGroups();
    } catch (error) {
        console.error('Error updating group:', error);
        showNotification(error.message || 'Failed to update group', 'error');
    }
}

// Load overdue students
async function loadOverdueStudents() {
    const overdueContent = document.getElementById('overdueContent');
    
    try {
        overdueContent.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading overdue students...</div>';
        
        const data = await apiRequest('/students?paymentStatus=overdue');
        
        if (data && data.success && data.students) {
            displayOverdueStudents(data.students);
        } else {
            overdueContent.innerHTML = '<div class="no-data"><i class="fas fa-check-circle"></i><p>No overdue payments found!</p></div>';
        }
    } catch (error) {
        console.error('Error loading overdue students:', error);
        overdueContent.innerHTML = '<div class="no-data"><i class="fas fa-exclamation-circle"></i><p>Error loading overdue students</p></div>';
    }
}

// Display overdue students with pagination
function displayOverdueStudents(students) {
    const overdueContent = document.getElementById('overdueContent');
    
    if (!students || students.length === 0) {
        overdueContent.innerHTML = '<div class="no-data"><i class="fas fa-check-circle"></i><p>No overdue payments found!</p></div>';
        return;
    }
    
    // Sort by payment date (oldest first)
    students.sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate));
    
    // Pagination
    const state = paginationState['overdue'];
    const totalPages = Math.ceil(students.length / state.itemsPerPage);
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const paginatedStudents = students.slice(startIndex, endIndex);
    
    let html = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: var(--bg-light);">
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">Student</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">Email</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">Group</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">Formation</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">Due Date</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">Days Overdue</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">Amount</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border-color);">Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    paginatedStudents.forEach(student => {
        const paymentDate = new Date(student.paymentDate);
        const now = new Date();
        const daysOverdue = Math.floor((now - paymentDate) / (1000 * 60 * 60 * 24));
        const groupName = student.group?.name || student.groupName || 'N/A';
        
        html += `
            <tr class="fade-in" style="border-bottom: 1px solid var(--border-color); background: rgba(255, 71, 87, 0.05);">
                <td style="padding: 12px;">
                    <strong>${student.fullName}</strong>
                </td>
                <td style="padding: 12px;">${student.schoolEmail}</td>
                <td style="padding: 12px;">${groupName}</td>
                <td style="padding: 12px;">${student.formation}</td>
                <td style="padding: 12px;">
                    <span style="color: #ff4757; font-weight: 600;">${paymentDate.toLocaleDateString()}</span>
                </td>
                <td style="padding: 12px;">
                    <span style="background: linear-gradient(135deg, #ff4757, #ff6348); color: white; padding: 4px 12px; border-radius: 12px; font-weight: 600; font-size: 13px;">
                        ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}
                    </span>
                </td>
                <td style="padding: 12px;">
                    <strong style="color: var(--primary-color);">${student.paymentAmount} MAD</strong>
                </td>
                <td style="padding: 12px; display: flex; gap: 8px; align-items: center;">
                    <button onclick="sendReminder('${student._id}', '${student.fullName}')" 
                            style="background: linear-gradient(135deg, #0088cc, #229ED9); border: none; width: 40px; height: 40px; border-radius: 50%; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s;"
                            onmouseover="this.style.transform='scale(1.1)'" 
                            onmouseout="this.style.transform='scale(1)'">
                        <i class="fab fa-telegram-plane" style="font-size: 18px;"></i>
                    </button>
                    <button onclick="editStudent('${student._id}')" 
                            style="background: linear-gradient(135deg, #FFCC00, #FF9500); border: none; width: 40px; height: 40px; border-radius: 50%; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s;"
                            onmouseover="this.style.transform='scale(1.1)'" 
                            onmouseout="this.style.transform='scale(1)'">
                        <i class="fas fa-edit" style="font-size: 16px;"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    // Add pagination if needed
    if (totalPages > 1) {
        html += createOverduePaginationControls(state.currentPage, totalPages, students.length);
    }
    
    html += `
        <div style="margin-top: 20px; padding: 15px; background: rgba(255, 71, 87, 0.1); border-left: 4px solid #ff4757; border-radius: 8px;">
            <p style="color: #ff4757; font-weight: 600; margin-bottom: 8px;">
                <i class="fas fa-exclamation-triangle"></i> ${students.length} student${students.length !== 1 ? 's' : ''} with overdue payments
            </p>
            <p style="color: var(--text-light); font-size: 14px;">
                These students require immediate attention. Send payment reminders or contact them directly to resolve their outstanding payments.
            </p>
        </div>
    `;
    
    overdueContent.innerHTML = html;
}

// Create pagination controls for overdue section
function createOverduePaginationControls(currentPage, totalPages, totalItems) {
    const startItem = (currentPage - 1) * paginationState['overdue'].itemsPerPage + 1;
    const endItem = Math.min(currentPage * paginationState['overdue'].itemsPerPage, totalItems);
    const color = '#ff4757'; // Red for overdue
    
    let html = `
        <div class="pagination-container" style="border-top: 1px solid #e5e7eb; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; background: #f9fafb; margin-top: 0;">
            <div class="pagination-info" style="color: #64748b; font-size: 0.9rem;">
                Showing <strong style="color: ${color};">${startItem}-${endItem}</strong> of <strong>${totalItems}</strong> students
            </div>
            <div class="pagination-controls" style="display: flex; gap: 8px; align-items: center;">
                <button 
                    class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
                    onclick="changeOverduePage(${currentPage - 1})"
                    ${currentPage === 1 ? 'disabled' : ''}
                    title="Previous Page"
                    style="padding: 8px 12px; border: 1px solid #e5e7eb; background: white; border-radius: 6px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 5px;">
                    <i class="fas fa-chevron-left" style="font-size: 0.8rem;"></i>
                    <span>Previous</span>
                </button>
                
                <div class="pagination-numbers" style="display: flex; gap: 5px;">
    `;
    
    // Page numbers with smart ellipsis
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `
                <button 
                    class="pagination-number ${i === currentPage ? 'active' : ''}" 
                    onclick="changeOverduePage(${i})"
                    style="
                        min-width: 40px;
                        height: 40px;
                        border: 1px solid ${i === currentPage ? color : '#e5e7eb'};
                        background: ${i === currentPage ? color : 'white'};
                        color: ${i === currentPage ? 'white' : '#64748b'};
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: ${i === currentPage ? '600' : '400'};
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span style="padding: 0 5px; color: #cbd5e1;">...</span>`;
        }
    }
    
    html += `
                </div>
                
                <button 
                    class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                    onclick="changeOverduePage(${currentPage + 1})"
                    ${currentPage === totalPages ? 'disabled' : ''}
                    title="Next Page"
                    style="padding: 8px 12px; border: 1px solid #e5e7eb; background: white; border-radius: 6px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 5px;">
                    <span>Next</span>
                    <i class="fas fa-chevron-right" style="font-size: 0.8rem;"></i>
                </button>
            </div>
        </div>
    `;
    
    return html;
}

// Change page function for overdue section
window.changeOverduePage = function(newPage) {
    paginationState['overdue'].currentPage = newPage;
    loadOverdueStudents(); // Reload overdue students with new page
};

// ==================== GROUP MESSAGING ====================

let currentGroupId = null;

function openGroupMessageModal(groupId, groupName, studentCount) {
    currentGroupId = groupId;
    document.getElementById('groupMessageName').value = groupName;
    document.getElementById('groupMessageCount').value = `${studentCount} student${studentCount !== 1 ? 's' : ''}`;
    document.getElementById('groupMessageType').value = 'info';
    document.getElementById('groupMessageText').value = '';
    document.getElementById('groupMessageModal').style.display = 'flex';
}

function closeGroupMessageModal() {
    document.getElementById('groupMessageModal').style.display = 'none';
    currentGroupId = null;
}

async function sendGroupMessage(event) {
    const type = document.getElementById('groupMessageType').value;
    const message = document.getElementById('groupMessageText').value.trim();
    
    if (!message) {
        showNotification('Please enter a message', 'error');
        return;
    }
    
    if (!currentGroupId) {
        showNotification('No group selected', 'error');
        return;
    }
    
    const btn = event ? event.target : document.querySelector('#groupMessageModal .btn-primary');
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        
        const data = await apiRequest(`/groups/${currentGroupId}/send-message`, {
            method: 'POST',
            body: JSON.stringify({ type, message })
        });
        
        if (data && data.success) {
            showNotification(data.message || 'Message sent successfully!', 'success');
            closeGroupMessageModal();
        } else {
            showNotification(data.message || 'Failed to send message', 'error');
        }
    } catch (error) {
        console.error('Send group message error:', error);
        showNotification('Error sending message', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
    }
}

// Close modal on overlay click
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('groupMessageModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeGroupMessageModal();
            }
        });
    }
});

// ==================== ATTENDANCE FUNCTIONS ====================

// Export group attendance to Excel
async function exportGroupAttendanceToExcel() {
    const groupFilter = document.getElementById('attendanceGroupFilter');
    const groupId = groupFilter ? groupFilter.value : '';
    
    if (!groupId) {
        showNotification('Please select a group first', 'error');
        return;
    }
    
    try {
        showNotification('Generating Excel file...', 'info');
        
        // Trigger download
        window.location.href = `/api/attendance/export/group/${groupId}?token=${authToken}`;
        
        setTimeout(() => {
            showNotification('Excel file downloaded successfully!', 'success');
        }, 1000);
    } catch (error) {
        console.error('Error exporting attendance:', error);
        showNotification('Failed to export attendance', 'error');
    }
}

// Clear all presences
async function clearAllPresences() {
    if (!confirm('Are you sure you want to clear ALL presence records? This will reset all presence counts to 0. This action cannot be undone!')) {
        return;
    }
    
    try {
        const response = await fetch('/api/attendance/clear-presences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to clear presences');
        }
        
        const data = await response.json();
        showNotification(data.message || 'All presence records cleared successfully!', 'success');
        
        // Reload attendance data if on attendance tab
        if (typeof loadAttendanceRecords === 'function') {
            loadAttendanceRecords();
        }
    } catch (error) {
        console.error('Error clearing presences:', error);
        showNotification('Failed to clear presence records', 'error');
    }
}

// Clear all absences
async function clearAllAbsences() {
    if (!confirm('Are you sure you want to clear ALL absence records? This will reset all absence counts to 0. This action cannot be undone!')) {
        return;
    }
    
    try {
        const response = await fetch('/api/attendance/clear-absences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to clear absences');
        }
        
        const data = await response.json();
        showNotification(data.message || 'All absence records cleared successfully!', 'success');
        
        // Reload attendance data if on attendance tab
        if (typeof loadAttendanceRecords === 'function') {
            loadAttendanceRecords();
        }
    } catch (error) {
        console.error('Error clearing absences:', error);
        showNotification('Failed to clear absence records', 'error');
    }
}

// ==================== MOBILE MENU ====================

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

// ==================== CIN CARD MANAGEMENT FOR EDIT MODE ====================

// Global storage for CIN files in edit mode
let editCINFiles = {
    front: null,
    back: null
};

// Handle CIN upload in edit mode
window.handleEditCINUpload = function(event, side, studentId) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        event.target.value = '';
        return;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a JPEG, PNG, or PDF file');
        event.target.value = '';
        return;
    }
    
    // Store file
    editCINFiles[side] = file;
    
    // Show preview
    const previewContainer = document.getElementById(`editCin${side.charAt(0).toUpperCase() + side.slice(1)}Preview-${studentId}`);
    const reader = new FileReader();
    
    reader.onload = function(e) {
        if (file.type === 'application/pdf') {
            previewContainer.innerHTML = `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center;">
                    <i class="fas fa-file-pdf" style="font-size: 32px; color: #ef4444;"></i>
                    <p style="margin: 8px 0 0 0; color: #64748b; font-weight: 500; font-size: 0.9rem;">${file.name}</p>
                    <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 0.85rem;">${(file.size / 1024).toFixed(2)} KB</p>
                    <button type="button" onclick="removeEditCINUpload('${side}', '${studentId}')" style="margin-top: 8px; padding: 4px 12px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
                        <i class="fas fa-times"></i> Remove
                    </button>
                </div>
            `;
        } else {
            previewContainer.innerHTML = `
                <div style="position: relative; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px;">
                    <img src="${e.target.result}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px;">
                    <button type="button" onclick="removeEditCINUpload('${side}', '${studentId}')" style="position: absolute; top: 12px; right: 12px; padding: 4px 8px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
                        <i class="fas fa-times"></i>
                    </button>
                    <p style="margin: 8px 0 0 0; color: #64748b; font-size: 0.85rem; text-align: center;">${(file.size / 1024).toFixed(2)} KB</p>
                </div>
            `;
        }
    };
    
    reader.readAsDataURL(file);
};

// Remove CIN upload in edit mode
window.removeEditCINUpload = function(side, studentId) {
    // Clear file input
    const input = document.getElementById(`editCin${side.charAt(0).toUpperCase() + side.slice(1)}`);
    if (input) input.value = '';
    
    // Clear from storage
    editCINFiles[side] = null;
    
    // Clear preview
    const previewContainer = document.getElementById(`editCin${side.charAt(0).toUpperCase() + side.slice(1)}Preview-${studentId}`);
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }
};

// Toggle CIN inputs when "Add Later" is checked in edit mode
window.toggleEditCINInputs = function(studentId) {
    const addLater = document.getElementById('editCinAddLater')?.checked || false;
    const frontInput = document.getElementById('editCinFront');
    const backInput = document.getElementById('editCinBack');
    
    if (frontInput && backInput) {
        frontInput.disabled = addLater;
        backInput.disabled = addLater;
        
        if (addLater) {
            // Clear any uploaded files
            removeEditCINUpload('front', studentId);
            removeEditCINUpload('back', studentId);
        }
    }
};

// ==================== PRIVATE MESSAGE FUNCTIONS ====================

// Open message modal
window.openMessageModal = function(studentId, studentName) {
    const modal = document.getElementById('privateMessageModal');
    const studentNameInput = document.getElementById('messageStudentName');
    const studentIdInput = document.getElementById('messageStudentId');
    const messageText = document.getElementById('messageText');
    const messageTitle = document.getElementById('messageTitle');
    const messageType = document.getElementById('messageType');
    
    // Set student info
    studentNameInput.value = studentName;
    studentIdInput.value = studentId;
    
    // Reset form
    messageText.value = '';
    messageTitle.value = '';
    messageType.value = 'info';
    
    // Show modal
    modal.style.display = 'flex';
};

// Close message modal
window.closeMessageModal = function() {
    const modal = document.getElementById('privateMessageModal');
    modal.style.display = 'none';
};

// Send private message
window.sendPrivateMessage = async function() {
    const studentId = document.getElementById('messageStudentId').value;
    const studentName = document.getElementById('messageStudentName').value;
    const messageText = document.getElementById('messageText').value.trim();
    const messageTitle = document.getElementById('messageTitle').value.trim();
    const messageType = document.getElementById('messageType').value;
    
    // Validate message content
    if (!messageText) {
        showNotification('Please enter a message', 'error');
        return;
    }
    
    try {
        // Show loading state
        const sendButton = event.target;
        const originalText = sendButton.innerHTML;
        sendButton.disabled = true;
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        
        const response = await fetch(`/api/student-management/students/${studentId}/send-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                type: messageType,
                message: messageText,
                title: messageTitle || undefined
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(`Message sent successfully to ${studentName}`, 'success');
            closeMessageModal();
        } else {
            showNotification(data.message || 'Failed to send message', 'error');
        }
        
        // Restore button
        sendButton.disabled = false;
        sendButton.innerHTML = originalText;
        
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Error sending message. Please try again.', 'error');
    }
};

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('privateMessageModal');
    if (event.target === modal) {
        closeMessageModal();
    }
});
