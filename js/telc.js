// TELC Management JavaScript
// Handles all TELC exam candidate management functionality
// All functions are defined globally for onclick handlers

(function() {
    'use strict';
    
    const API_BASE_URL = window.location.origin;
    let telcMonths = [];
    let telcCandidates = [];
    let telcTemplates = {};
    let currentTemplateCategory = 'passed';
    let selectedResultsMonth = null;
    let debounceTimer = null;

    // ============================================
    // INITIALIZATION
    // ============================================

    document.addEventListener('DOMContentLoaded', function() {
        // Initialize TELC navigation cards
        initTelcNavigation();
        initTemplatesTabs();
        populateYearDropdowns();
        
        // Load data when TELC tab is shown
        const telcMenuItem = document.querySelector('[data-tab="telc"]');
        if (telcMenuItem) {
            telcMenuItem.addEventListener('click', function() {
                loadTelcData();
                showTelcHome();
            });
        }
    });
    
    // Populate year dropdowns dynamically (current year -2 to +7)
    function populateYearDropdowns() {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 2;
        const endYear = currentYear + 7;
        
        const yearDropdowns = ['telcYearFilter', 'telcYearSelect'];
        
        yearDropdowns.forEach(id => {
            const select = document.getElementById(id);
            if (!select) return;
            
            select.innerHTML = '';
            for (let year = startYear; year <= endYear; year++) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                if (year === currentYear) option.selected = true;
                select.appendChild(option);
            }
        });
    }

    // Initialize navigation card clicks
    function initTelcNavigation() {
        const navCards = document.querySelectorAll('.telc-nav-card');
        navCards.forEach(card => {
            card.addEventListener('click', function() {
                const section = this.dataset.telcNav;
                showTelcSection(section);
            });
        });
    }

    // Show TELC home (nav cards)
    function showTelcHome() {
        // Hide all sections
        document.querySelectorAll('.telc-section').forEach(s => s.style.display = 'none');
        // Show nav cards
        const navCards = document.querySelector('.telc-nav-cards');
        if (navCards) navCards.style.display = 'grid';
    }

    // Show specific TELC section
    function showTelcSection(section) {
        // Hide nav cards
        const navCards = document.querySelector('.telc-nav-cards');
        if (navCards) navCards.style.display = 'none';
        
        // Hide all sections
        document.querySelectorAll('.telc-section').forEach(s => s.style.display = 'none');
        
        // Show selected section
        const sectionMap = {
            'planning': 'telcPlanningSection',
            'candidates': 'telcCandidatesSection',
            'results': 'telcResultsSection',
            'settings': 'telcSettingsSection'
        };
        
        const sectionId = sectionMap[section];
        if (sectionId) {
            const sectionEl = document.getElementById(sectionId);
            if (sectionEl) sectionEl.style.display = 'block';
        }
        
        // Load data for the section
        if (section === 'planning') loadTelcMonths();
        if (section === 'candidates') loadTelcCandidates();
        if (section === 'results') loadResultsMonthOptions();
        if (section === 'settings') loadTelcTemplates();
    }

    // Make navigation functions global
    window.showTelcHome = showTelcHome;
    window.showTelcSection = showTelcSection;

function initTemplatesTabs() {
    const templateTabs = document.querySelectorAll('.template-tab');
    templateTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.dataset.template;
            
            templateTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            currentTemplateCategory = category;
            displayTemplate(category);
        });
    });
}

// ============================================
// DATA LOADING
// ============================================

async function loadTelcData() {
    await Promise.all([
        loadTelcSettings(),
        loadTelcStats(),
        loadTelcMonths()
    ]);
}

async function loadTelcSettings() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/telc/settings`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('telcRegistrationToggle').checked = data.settings.isTelcRegistrationOpen;
            document.getElementById('telcSuperAdminEmail').value = data.settings.telcSuperAdminEmail || '';
            document.getElementById('telcAutoOverflow').checked = data.settings.telcAutoOverflow;
        }
    } catch (error) {
        console.error('Error loading TELC settings:', error);
    }
}

async function loadTelcStats() {
    try {
        const year = document.getElementById('telcYearFilter')?.value || new Date().getFullYear();
        const response = await fetch(`${API_BASE_URL}/api/telc/stats?year=${year}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('telcTotalCandidates').textContent = data.stats.yearCandidates || 0;
            document.getElementById('telcPassedCount').textContent = data.stats.results?.passed || 0;
            document.getElementById('telcFailedCount').textContent = data.stats.results?.failed || 0;
            document.getElementById('telcPartialCount').textContent = data.stats.results?.partial || 0;
        }
    } catch (error) {
        console.error('Error loading TELC stats:', error);
    }
}

async function loadTelcMonths() {
    const grid = document.getElementById('telcMonthsGrid');
    const loading = document.getElementById('telcMonthsLoading');
    
    if (loading) loading.style.display = 'block';
    
    try {
        const year = document.getElementById('telcYearFilter')?.value || new Date().getFullYear();
        const response = await fetch(`${API_BASE_URL}/api/telc/months?year=${year}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        if (loading) loading.style.display = 'none';
        
        if (data.success) {
            telcMonths = data.months;
            renderMonthsGrid(data.months);
            updateMonthDropdowns();
        }
    } catch (error) {
        console.error('Error loading TELC months:', error);
        if (loading) loading.style.display = 'none';
        if (grid) grid.innerHTML = '<p class="error">Error loading months</p>';
    }
}

function renderMonthsGrid(months) {
    const grid = document.getElementById('telcMonthsGrid');
    if (!grid) return;
    
    if (months.length === 0) {
        grid.innerHTML = `
            <div class="telc-empty-state">
                <i class="fas fa-calendar-plus"></i>
                <p>No exam months created for this year</p>
                <button class="action-btn btn-success" onclick="openCreateMonthModal()">
                    <i class="fas fa-plus"></i> Create First Month
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = months.map(month => `
        <div class="telc-month-card ${month.isLocked ? 'locked' : ''} ${month.isAtCapacity ? 'at-capacity' : ''}">
            <div class="month-header">
                <h3>${month.label}</h3>
                <div class="month-status">
                    ${month.isLocked ? '<span class="badge locked"><i class="fas fa-lock"></i> Locked</span>' : ''}
                    ${!month.isOpen ? '<span class="badge closed"><i class="fas fa-times-circle"></i> Closed</span>' : ''}
                    ${month.reserveUnlocked ? '<span class="badge reserve"><i class="fas fa-unlock"></i> Reserve</span>' : ''}
                </div>
            </div>
            <div class="month-capacity">
                <div class="capacity-bar">
                    <div class="capacity-fill ${month.capacityPercentage >= 100 ? 'full' : month.capacityPercentage >= 80 ? 'warning' : ''}" 
                         style="width: ${Math.min(month.capacityPercentage, 100)}%"></div>
                </div>
                <div class="capacity-text">
                    <span>${month.currentCount} / ${month.effectiveCapacity}</span>
                    <span>${month.capacityPercentage}%</span>
                </div>
            </div>
            <div class="month-stats">
                <div class="stat"><i class="fas fa-check-circle green"></i> ${month.stats?.passed || 0}</div>
                <div class="stat"><i class="fas fa-times-circle red"></i> ${month.stats?.failed || 0}</div>
                <div class="stat"><i class="fas fa-adjust orange"></i> ${month.stats?.partial || 0}</div>
                <div class="stat"><i class="fas fa-envelope blue"></i> ${month.stats?.emailsSent || 0}</div>
            </div>
            <div class="month-actions">
                <button class="action-btn btn-sm btn-info" onclick="editMonth('${month._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                ${!month.reserveUnlocked && month.isMainCapacityReached ? `
                    <button class="action-btn btn-sm btn-warning" onclick="unlockReserve('${month._id}')" title="Unlock Reserve">
                        <i class="fas fa-unlock"></i>
                    </button>
                ` : ''}
                ${!month.isLocked ? `
                    <button class="action-btn btn-sm btn-danger" onclick="lockMonth('${month._id}')" title="Lock Month">
                        <i class="fas fa-lock"></i>
                    </button>
                ` : ''}
                ${localStorage.getItem('isSuperAdmin') === 'true' ? `
                    <button class="action-btn btn-sm btn-danger" onclick="deleteMonth('${month._id}', '${month.label}')" title="Delete Month">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

async function loadTelcCandidates() {
    const tbody = document.getElementById('telcCandidatesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="9" class="loading">Loading candidates...</td></tr>';
    
    try {
        const params = new URLSearchParams();
        
        const monthFilter = document.getElementById('telcCandidateMonthFilter')?.value;
        const levelFilter = document.getElementById('telcCandidateLevelFilter')?.value;
        const resultFilter = document.getElementById('telcCandidateResultFilter')?.value;
        const search = document.getElementById('telcCandidateSearch')?.value;
        
        if (monthFilter) params.append('examMonth', monthFilter);
        if (levelFilter) params.append('examLevel', levelFilter);
        if (resultFilter) params.append('resultCategory', resultFilter === 'null' ? '' : resultFilter);
        if (search) params.append('search', search);
        
        const response = await fetch(`${API_BASE_URL}/api/telc/candidates?${params}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            telcCandidates = data.candidates;
            renderCandidatesTable(data.candidates);
        }
    } catch (error) {
        console.error('Error loading candidates:', error);
        tbody.innerHTML = '<tr><td colspan="9" class="error">Error loading candidates</td></tr>';
    }
}

function renderCandidatesTable(candidates) {
    const tbody = document.getElementById('telcCandidatesTableBody');
    if (!tbody) return;
    
    if (candidates.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty">No candidates found</td></tr>';
        return;
    }
    
    tbody.innerHTML = candidates.map(c => `
        <tr>
            <td><strong>${c.fullName}</strong></td>
            <td>${c.email}</td>
            <td>${c.phoneNumber}</td>
            <td><span class="level-badge ${c.examLevel}">${c.examLevel}</span></td>
            <td>${c.examMonthLabel || '-'}</td>
            <td>${getResultBadge(c.resultCategory)}</td>
            <td>${c.hasCertificate ? '<i class="fas fa-check-circle green"></i>' : '<i class="fas fa-times-circle gray"></i>'}</td>
            <td>${c.emailSent ? '<i class="fas fa-check-circle green"></i>' : '<i class="fas fa-times-circle gray"></i>'}</td>
            <td class="actions">
                <button class="action-btn btn-xs btn-info" onclick="editCandidate('${c._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn btn-xs btn-warning" onclick="openSetResultModal('${c._id}')" title="Set Result">
                    <i class="fas fa-clipboard-check"></i>
                </button>
                ${(c.resultCategory === 'passed' || c.resultCategory === 'partial') ? `
                    <button class="action-btn btn-xs btn-success" onclick="openUploadCertModal('${c._id}')" title="Upload Certificate">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                ` : ''}
                <button class="action-btn btn-xs btn-secondary" onclick="openMoveModal('${c._id}')" title="Move">
                    <i class="fas fa-exchange-alt"></i>
                </button>
                <button class="action-btn btn-xs btn-danger" onclick="deleteCandidate('${c._id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getResultBadge(result) {
    if (!result) return '<span class="result-badge pending">Pending</span>';
    const badges = {
        passed: '<span class="result-badge passed"><i class="fas fa-check"></i> Passed</span>',
        failed: '<span class="result-badge failed"><i class="fas fa-times"></i> Failed</span>',
        partial: '<span class="result-badge partial"><i class="fas fa-adjust"></i> Partial</span>'
    };
    return badges[result] || '<span class="result-badge pending">Pending</span>';
}

// ============================================
// SETTINGS
// ============================================

async function saveTelcSettings() {
    try {
        const settings = {
            isTelcRegistrationOpen: document.getElementById('telcRegistrationToggle').checked,
            telcSuperAdminEmail: document.getElementById('telcSuperAdminEmail').value,
            telcAutoOverflow: document.getElementById('telcAutoOverflow').checked
        };
        
        const response = await fetch(`${API_BASE_URL}/api/telc/settings`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Settings saved successfully!');
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Error saving settings');
    }
}

// ============================================
// MONTH MANAGEMENT
// ============================================

function openCreateMonthModal() {
    document.getElementById('telcMonthForm').reset();
    document.getElementById('telcMonthId').value = '';
    document.getElementById('telcMonthModalTitle').textContent = 'Create Exam Month';
    document.getElementById('telcMonthModal').classList.add('active');
}

async function editMonth(monthId) {
    const month = telcMonths.find(m => m._id === monthId);
    if (!month) {
        alert('Month not found');
        return;
    }
    
    // Populate form with existing data
    document.getElementById('telcMonthId').value = monthId;
    document.getElementById('telcMonthSelect').value = month.month;
    document.getElementById('telcYearSelect').value = month.year;
    document.getElementById('telcExamDate').value = month.examDate ? month.examDate.split('T')[0] : '';
    document.getElementById('telcMaxCapacity').value = month.maxCapacity || 150;
    document.getElementById('telcEmergencyReserve').value = month.emergencyReserve || 50;
    document.getElementById('telcMonthNotes').value = month.notes || '';
    
    document.getElementById('telcMonthModalTitle').textContent = 'Edit Exam Month';
    document.getElementById('telcMonthModal').classList.add('active');
}

function closeTelcMonthModal() {
    document.getElementById('telcMonthModal').classList.remove('active');
    document.getElementById('telcMonthId').value = '';
}

async function saveTelcMonth(event) {
    event.preventDefault();
    
    const monthId = document.getElementById('telcMonthId').value;
    const isEdit = !!monthId;
    
    try {
        const monthData = {
            month: parseInt(document.getElementById('telcMonthSelect').value),
            year: parseInt(document.getElementById('telcYearSelect').value),
            examDate: document.getElementById('telcExamDate').value || null,
            maxCapacity: parseInt(document.getElementById('telcMaxCapacity').value) || 150,
            emergencyReserve: parseInt(document.getElementById('telcEmergencyReserve').value) || 50,
            notes: document.getElementById('telcMonthNotes').value
        };
        
        const url = isEdit ? `${API_BASE_URL}/api/telc/months/${monthId}` : `${API_BASE_URL}/api/telc/months`;
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(monthData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeTelcMonthModal();
            loadTelcMonths();
            alert(isEdit ? 'Month updated successfully!' : 'Month created successfully!');
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error saving month:', error);
        alert('Error saving month');
    }
}

async function unlockReserve(monthId) {
    if (!confirm('Are you sure you want to unlock the emergency reserve for this month?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/telc/months/${monthId}/unlock-reserve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadTelcMonths();
            alert('Reserve unlocked successfully!');
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error unlocking reserve:', error);
        alert('Error unlocking reserve');
    }
}

async function lockMonth(monthId) {
    if (!confirm('Are you sure you want to lock this month? This action cannot be undone.')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/telc/months/${monthId}/lock`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadTelcMonths();
            alert('Month locked successfully!');
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error locking month:', error);
        alert('Error locking month');
    }
}

async function deleteMonth(monthId, monthLabel) {
    if (!confirm(`Are you sure you want to delete "${monthLabel}"?\n\nThis will permanently delete the month and all associated candidates. This action cannot be undone.`)) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/telc/months/${monthId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadTelcMonths();
            loadTelcData();
            alert('Month deleted successfully!');
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error deleting month:', error);
        alert('Error deleting month');
    }
}

// ============================================
// CANDIDATE MANAGEMENT
// ============================================

function updateMonthDropdowns() {
    const dropdowns = [
        'telcCandidateMonthFilter',
        'telcCandidateMonth',
        'telcResultsMonthSelect',
        'moveTargetMonth'
    ];
    
    dropdowns.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        
        const currentValue = select.value;
        const isFilter = id.includes('Filter') || id === 'telcResultsMonthSelect';
        
        select.innerHTML = isFilter ? '<option value="">All Months</option>' : '';
        
        telcMonths.forEach(month => {
            const option = document.createElement('option');
            option.value = month._id;
            option.textContent = `${month.label} (${month.currentCount}/${month.effectiveCapacity})`;
            if (month.isLocked) option.textContent += ' [Locked]';
            select.appendChild(option);
        });
        
        if (currentValue) select.value = currentValue;
    });
}

function openAddCandidateModal() {
    document.getElementById('telcCandidateForm').reset();
    document.getElementById('telcCandidateId').value = '';
    document.getElementById('telcCandidateModalTitle').textContent = 'Add Candidate';
    updateMonthDropdowns();
    document.getElementById('telcCandidateModal').classList.add('active');
}

function closeTelcCandidateModal() {
    document.getElementById('telcCandidateModal').classList.remove('active');
}

async function editCandidate(candidateId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/telc/candidates/${candidateId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            const c = data.candidate;
            document.getElementById('telcCandidateId').value = c._id;
            document.getElementById('telcCandidateName').value = c.fullName;
            document.getElementById('telcCandidateCin').value = c.cin || '';
            document.getElementById('telcCandidateEmail').value = c.email;
            document.getElementById('telcCandidatePhone').value = c.phoneNumber;
            document.getElementById('telcCandidateLevel').value = c.examLevel;
            document.getElementById('telcCandidateCity').value = c.city || '';
            document.getElementById('telcCandidatePayment').value = c.paymentStatus || 'pending';
            document.getElementById('telcCandidateNotes').value = c.notes || '';
            
            updateMonthDropdowns();
            document.getElementById('telcCandidateMonth').value = c.examMonth._id || c.examMonth;
            
            document.getElementById('telcCandidateModalTitle').textContent = 'Edit Candidate';
            document.getElementById('telcCandidateModal').classList.add('active');
        }
    } catch (error) {
        console.error('Error loading candidate:', error);
        alert('Error loading candidate');
    }
}

async function saveTelcCandidate(event) {
    event.preventDefault();
    
    const candidateId = document.getElementById('telcCandidateId').value;
    const isEdit = !!candidateId;
    
    try {
        const candidateData = {
            fullName: document.getElementById('telcCandidateName').value,
            cin: document.getElementById('telcCandidateCin').value,
            email: document.getElementById('telcCandidateEmail').value,
            phoneNumber: document.getElementById('telcCandidatePhone').value,
            examLevel: document.getElementById('telcCandidateLevel').value,
            examMonthId: document.getElementById('telcCandidateMonth').value,
            city: document.getElementById('telcCandidateCity').value,
            paymentStatus: document.getElementById('telcCandidatePayment').value,
            notes: document.getElementById('telcCandidateNotes').value
        };
        
        const url = isEdit 
            ? `${API_BASE_URL}/api/telc/candidates/${candidateId}`
            : `${API_BASE_URL}/api/telc/candidates`;
        
        const response = await fetch(url, {
            method: isEdit ? 'PUT' : 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(candidateData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeTelcCandidateModal();
            loadTelcCandidates();
            loadTelcStats();
            loadTelcMonths();
            alert(isEdit ? 'Candidate updated!' : 'Candidate added!');
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error saving candidate:', error);
        alert('Error saving candidate');
    }
}

async function deleteCandidate(candidateId) {
    if (!confirm('Are you sure you want to delete this candidate?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/telc/candidates/${candidateId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadTelcCandidates();
            loadTelcStats();
            loadTelcMonths();
            alert('Candidate deleted!');
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error deleting candidate:', error);
        alert('Error deleting candidate');
    }
}

// ============================================
// RESULT MANAGEMENT
// ============================================

function openSetResultModal(candidateId) {
    const candidate = telcCandidates.find(c => c._id === candidateId);
    if (!candidate) return;
    
    document.getElementById('resultCandidateId').value = candidateId;
    document.getElementById('resultCandidateName').textContent = candidate.fullName;
    document.getElementById('resultCandidateLevel').textContent = candidate.examLevel;
    document.getElementById('resultCandidateMonth').textContent = candidate.examMonthLabel;
    
    document.getElementById('resultCategory').value = candidate.resultCategory || 'passed';
    document.getElementById('resultNotes').value = candidate.resultNotes || '';
    
    togglePartialFields();
    
    document.getElementById('telcResultModal').classList.add('active');
}

function closeTelcResultModal() {
    document.getElementById('telcResultModal').classList.remove('active');
}

function togglePartialFields() {
    const category = document.getElementById('resultCategory').value;
    document.getElementById('partialResultFields').style.display = category === 'partial' ? 'block' : 'none';
}

async function saveTelcResult(event) {
    event.preventDefault();
    
    const candidateId = document.getElementById('resultCandidateId').value;
    const category = document.getElementById('resultCategory').value;
    
    try {
        const resultData = {
            resultCategory: category,
            resultNotes: document.getElementById('resultNotes').value
        };
        
        if (category === 'partial') {
            resultData.schriftlich = document.getElementById('resultSchriftlich').value;
            resultData.muendlich = document.getElementById('resultMuendlich').value;
        }
        
        const response = await fetch(`${API_BASE_URL}/api/telc/candidates/${candidateId}/result`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(resultData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeTelcResultModal();
            loadTelcCandidates();
            loadTelcStats();
            alert('Result saved!');
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error saving result:', error);
        alert('Error saving result');
    }
}

// ============================================
// CERTIFICATE MANAGEMENT
// ============================================

let selectedCertFile = null;

function openUploadCertModal(candidateId) {
    const candidate = telcCandidates.find(c => c._id === candidateId);
    if (!candidate) return;
    
    document.getElementById('certCandidateId').value = candidateId;
    document.getElementById('certCandidateName').textContent = candidate.fullName;
    document.getElementById('certCandidateLevel').textContent = candidate.examLevel;
    document.getElementById('certCandidateResult').textContent = candidate.resultCategory;
    
    selectedCertFile = null;
    document.getElementById('certFile').value = '';
    document.getElementById('certFilePreview').style.display = 'none';
    document.querySelector('.cert-upload-content').style.display = 'flex';
    
    document.getElementById('telcCertificateModal').classList.add('active');
}

function closeTelcCertificateModal() {
    document.getElementById('telcCertificateModal').classList.remove('active');
    selectedCertFile = null;
}

function handleCertFileSelect(input) {
    const file = input.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
        alert('Please select a PDF file');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
    }
    
    selectedCertFile = file;
    document.getElementById('certFileName').textContent = file.name;
    document.getElementById('certFilePreview').style.display = 'flex';
    document.querySelector('.cert-upload-content').style.display = 'none';
}

function removeCertFile() {
    selectedCertFile = null;
    document.getElementById('certFile').value = '';
    document.getElementById('certFilePreview').style.display = 'none';
    document.querySelector('.cert-upload-content').style.display = 'flex';
}

async function uploadTelcCertificate(event) {
    event.preventDefault();
    
    if (!selectedCertFile) {
        alert('Please select a certificate file');
        return;
    }
    
    const candidateId = document.getElementById('certCandidateId').value;
    
    try {
        // Convert file to base64
        const base64 = await fileToBase64(selectedCertFile);
        
        const response = await fetch(`${API_BASE_URL}/api/telc/candidates/${candidateId}/certificate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                certificateData: base64,
                filename: selectedCertFile.name
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeTelcCertificateModal();
            loadTelcCandidates();
            alert('Certificate uploaded!');
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error uploading certificate:', error);
        alert('Error uploading certificate');
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

// ============================================
// MOVE CANDIDATE
// ============================================

function openMoveModal(candidateId) {
    const candidate = telcCandidates.find(c => c._id === candidateId);
    if (!candidate) return;
    
    document.getElementById('moveCandidateId').value = candidateId;
    document.getElementById('moveCandidateName').textContent = candidate.fullName;
    document.getElementById('moveCurrentMonth').textContent = candidate.examMonthLabel;
    document.getElementById('moveReason').value = '';
    
    updateMonthDropdowns();
    
    // Remove current month from options
    const select = document.getElementById('moveTargetMonth');
    const currentMonthId = candidate.examMonth._id || candidate.examMonth;
    for (let option of select.options) {
        if (option.value === currentMonthId) {
            option.remove();
            break;
        }
    }
    
    document.getElementById('telcMoveModal').classList.add('active');
}

function closeTelcMoveModal() {
    document.getElementById('telcMoveModal').classList.remove('active');
}

async function moveTelcCandidate(event) {
    event.preventDefault();
    
    const candidateId = document.getElementById('moveCandidateId').value;
    const toMonthId = document.getElementById('moveTargetMonth').value;
    const reason = document.getElementById('moveReason').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/telc/candidates/${candidateId}/move`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ toMonthId, reason })
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeTelcMoveModal();
            loadTelcCandidates();
            loadTelcMonths();
            alert('Candidate moved successfully!');
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error moving candidate:', error);
        alert('Error moving candidate');
    }
}

// ============================================
// RESULTS DISTRIBUTION
// ============================================

function loadResultsMonthOptions() {
    updateMonthDropdowns();
}

async function loadResultsForMonth() {
    const monthId = document.getElementById('telcResultsMonthSelect').value;
    const categoriesDiv = document.getElementById('telcResultsCategories');
    
    if (!monthId) {
        categoriesDiv.style.display = 'none';
        return;
    }
    
    selectedResultsMonth = monthId;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/telc/months/${monthId}/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            const stats = data.month.stats;
            const ready = data.readyForEmail;
            
            document.getElementById('telcPassedCategoryCount').textContent = stats.passed || 0;
            document.getElementById('telcFailedCategoryCount').textContent = stats.failed || 0;
            document.getElementById('telcPartialCategoryCount').textContent = stats.partial || 0;
            
            document.getElementById('telcPassedReadyEmail').textContent = ready.passed || 0;
            document.getElementById('telcFailedReadyEmail').textContent = ready.failed || 0;
            document.getElementById('telcPartialReadyEmail').textContent = ready.partial || 0;
            
            // For passed and partial, show certificate count
            // This would need additional API data
            
            categoriesDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading results stats:', error);
    }
}

async function sendBulkEmails(category) {
    if (!selectedResultsMonth) {
        alert('Please select a month first');
        return;
    }
    
    const categoryNames = { passed: 'passed', failed: 'failed', partial: 'partial pass' };
    if (!confirm(`Are you sure you want to send emails to ALL ${categoryNames[category]} candidates?`)) return;
    
    const btn = document.getElementById(`send${category.charAt(0).toUpperCase() + category.slice(1)}EmailsBtn`);
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/telc/months/${selectedResultsMonth}/send-bulk-emails`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ category })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`Emails sent!\nSent: ${data.sent}\nFailed: ${data.failed}`);
            loadResultsForMonth();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error sending emails:', error);
        alert('Error sending emails');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fas fa-paper-plane"></i> Send All ${category.charAt(0).toUpperCase() + category.slice(1)} Emails`;
        }
    }
}

// ============================================
// EMAIL TEMPLATES
// ============================================

async function loadTelcTemplates() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/telc/templates`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            telcTemplates = {};
            data.templates.forEach(t => {
                telcTemplates[t.category] = t;
            });
            displayTemplate(currentTemplateCategory);
        }
    } catch (error) {
        console.error('Error loading templates:', error);
    }
}

function displayTemplate(category) {
    const template = telcTemplates[category];
    if (template) {
        document.getElementById('telcTemplateSubject').value = template.subject;
        document.getElementById('telcTemplateBody').value = template.body;
    } else {
        document.getElementById('telcTemplateSubject').value = '';
        document.getElementById('telcTemplateBody').value = '';
    }
}

async function saveTelcTemplate() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/telc/templates/${currentTemplateCategory}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                subject: document.getElementById('telcTemplateSubject').value,
                body: document.getElementById('telcTemplateBody').value
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            telcTemplates[currentTemplateCategory] = data.template;
            alert('Template saved!');
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error saving template:', error);
        alert('Error saving template');
    }
}

async function resetTelcTemplate() {
    if (!confirm('Reset this template to default? Your changes will be lost.')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/telc/templates/${currentTemplateCategory}/reset`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            telcTemplates[currentTemplateCategory] = data.template;
            displayTemplate(currentTemplateCategory);
            alert('Template reset to default!');
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error resetting template:', error);
        alert('Error resetting template');
    }
}

function previewTelcTemplate() {
    const subject = document.getElementById('telcTemplateSubject').value;
    const body = document.getElementById('telcTemplateBody').value;
    
    // Replace placeholders with sample data
    const sampleData = {
        '{{candidateName}}': 'Max Mustermann',
        '{{examLevel}}': 'B1',
        '{{examMonth}}': 'January 2025',
        '{{schriftlichResult}}': 'Bestanden',
        '{{muendlichResult}}': 'Nicht bestanden',
        '{{schoolName}}': 'Nisrine School',
        '{{schoolPhone}}': '+212 6XX XXX XXX',
        '{{schoolEmail}}': 'contact@nisrineschool.com'
    };
    
    let previewBody = body;
    for (const [placeholder, value] of Object.entries(sampleData)) {
        previewBody = previewBody.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    }
    
    const previewWindow = window.open('', '_blank', 'width=600,height=800');
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Email Preview - ${subject}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .subject { background: #f0f0f0; padding: 10px; margin-bottom: 20px; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="subject"><strong>Subject:</strong> ${subject.replace(/{{(\w+)}}/g, (m, k) => sampleData[`{{${k}}}`] || m)}</div>
            ${previewBody}
        </body>
        </html>
    `);
}

// ============================================
// UTILITIES
// ============================================

function debounceSearch(func, delay) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(func, delay);
}

// Make functions globally available
window.loadTelcMonths = loadTelcMonths;
window.refreshTelcMonths = async function(btn) {
    const icon = btn.querySelector('i');
    icon.classList.add('fa-spin');
    btn.disabled = true;
    
    await loadTelcMonths();
    await loadTelcStats();
    
    icon.classList.remove('fa-spin');
    btn.disabled = false;
};
window.loadTelcCandidates = loadTelcCandidates;
window.openCreateMonthModal = openCreateMonthModal;
window.editMonth = editMonth;
window.closeTelcMonthModal = closeTelcMonthModal;
window.saveTelcMonth = saveTelcMonth;
window.unlockReserve = unlockReserve;
window.lockMonth = lockMonth;
window.deleteMonth = deleteMonth;
window.openAddCandidateModal = openAddCandidateModal;
window.closeTelcCandidateModal = closeTelcCandidateModal;
window.editCandidate = editCandidate;
window.saveTelcCandidate = saveTelcCandidate;
window.deleteCandidate = deleteCandidate;
window.openSetResultModal = openSetResultModal;
window.closeTelcResultModal = closeTelcResultModal;
window.togglePartialFields = togglePartialFields;
window.saveTelcResult = saveTelcResult;
window.openUploadCertModal = openUploadCertModal;
window.closeTelcCertificateModal = closeTelcCertificateModal;
window.handleCertFileSelect = handleCertFileSelect;
window.removeCertFile = removeCertFile;
window.uploadTelcCertificate = uploadTelcCertificate;
window.openMoveModal = openMoveModal;
window.closeTelcMoveModal = closeTelcMoveModal;
window.moveTelcCandidate = moveTelcCandidate;
window.loadResultsForMonth = loadResultsForMonth;
window.sendBulkEmails = sendBulkEmails;
window.saveTelcSettings = saveTelcSettings;
window.saveTelcTemplate = saveTelcTemplate;
window.resetTelcTemplate = resetTelcTemplate;
window.previewTelcTemplate = previewTelcTemplate;
window.debounceSearch = debounceSearch;

})(); // End of IIFE
