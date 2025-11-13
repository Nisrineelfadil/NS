// Admin Registration System with Credits
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';

let currentAdmin = null;
let myRegistrations = [];
let currentPage = 1;
const itemsPerPage = 20;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize translations
    if (typeof translateMyRegistrationsPage === 'function') {
        translateMyRegistrationsPage();
    }
    
    checkAuth();
    initializeEventListeners();
});

function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin';
        return;
    }
    
    // Decode token to get admin info
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentAdmin = payload;
        
        // Show super admin section if user is super admin
        if (payload.role === 'super_admin') {
            document.getElementById('superAdminSection')?.classList.remove('hidden');
            document.getElementById('superAdminSection').style.display = 'block';
        }
        
        loadDashboard();
    } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('adminToken');
        window.location.href = '/admin';
    }
}

function initializeEventListeners() {
    // Registration form
    const regForm = document.getElementById('adminRegForm');
    if (regForm) {
        regForm.addEventListener('submit', handleRegistration);
    }
    
    // Search and filters
    document.getElementById('searchInput')?.addEventListener('input', debounce(filterRegistrations, 300));
    document.getElementById('courseFilter')?.addEventListener('change', filterRegistrations);
    document.getElementById('dateFrom')?.addEventListener('change', filterRegistrations);
    document.getElementById('dateTo')?.addEventListener('change', filterRegistrations);
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
}

async function loadDashboard() {
    try {
        showLoading();
        await Promise.all([
            loadMyStats(),
            loadMyRegistrations(),
            loadLeaderboard()
        ]);
        hideLoading();
    } catch (error) {
        console.error('Dashboard load error:', error);
        showError('Failed to load dashboard');
        hideLoading();
    }
}

async function loadMyStats() {
    try {
        const response = await fetch(`${API_BASE}/admin-registration/my-stats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        if (data.success) {
            displayStats(data.stats);
        }
    } catch (error) {
        console.error('Load stats error:', error);
    }
}

function displayStats(stats) {
    document.getElementById('totalCredits').textContent = stats.totalCredits || 0;
    document.getElementById('totalRegistrations').textContent = stats.totalRegistrations || 0;
    document.getElementById('monthlyRegistrations').textContent = stats.monthlyRegistrations || 0;
    
    // Display recent transactions
    const transactionsHtml = stats.recentTransactions.map(t => `
        <div class="transaction-item">
            <div class="transaction-info">
                <span class="transaction-type">${t.transactionType}</span>
                <span class="transaction-desc">${t.description}</span>
            </div>
            <div class="transaction-amount ${t.amount > 0 ? 'positive' : 'negative'}">
                ${t.amount > 0 ? '+' : ''}${t.amount}
            </div>
        </div>
    `).join('');
    
    document.getElementById('recentTransactions').innerHTML = transactionsHtml || '<p>No transactions yet</p>';
}

async function loadMyRegistrations(page = 1) {
    try {
        const search = document.getElementById('searchInput')?.value || '';
        const course = document.getElementById('courseFilter')?.value || 'all';
        const dateFrom = document.getElementById('dateFrom')?.value || '';
        const dateTo = document.getElementById('dateTo')?.value || '';
        
        const params = new URLSearchParams({
            page,
            limit: itemsPerPage,
            search,
            course,
            startDate: dateFrom,
            endDate: dateTo
        });
        
        const response = await fetch(`${API_BASE}/admin-registration/my-registrations?${params}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        if (data.success) {
            myRegistrations = data.students;
            displayRegistrations(data.students);
            displayPagination(data.pagination);
        }
    } catch (error) {
        console.error('Load registrations error:', error);
    }
}

function displayRegistrations(students) {
    const tbody = document.getElementById('registrationsTableBody');
    if (!tbody) return;
    
    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No registrations found</td></tr>';
        return;
    }
    
    tbody.innerHTML = students.map(student => `
        <tr>
            <td>${student.fullName}</td>
            <td>${student.cin}</td>
            <td>${student.formationChoisie.join(', ')}</td>
            <td>${student.phoneNumber}</td>
            <td>${new Date(student.submittedAt).toLocaleDateString()}</td>
            <td><span class="credit-badge">${student.creditEarned || 1}</span></td>
            <td>
                <span class="status-badge status-${student.status}">${student.status}</span>
            </td>
        </tr>
    `).join('');
}

function displayPagination(pagination) {
    const container = document.getElementById('pagination');
    if (!container) return;
    
    const { page, pages, total } = pagination;
    
    let html = `<div class="pagination-info">Showing page ${page} of ${pages} (${total} total)</div>`;
    html += '<div class="pagination-buttons">';
    
    if (page > 1) {
        html += `<button onclick="loadMyRegistrations(${page - 1})">Previous</button>`;
    }
    
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) {
        html += `<button class="${i === page ? 'active' : ''}" onclick="loadMyRegistrations(${i})">${i}</button>`;
    }
    
    if (page < pages) {
        html += `<button onclick="loadMyRegistrations(${page + 1})">Next</button>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

async function loadLeaderboard() {
    try {
        const period = document.getElementById('leaderboardPeriod')?.value || 'all';
        
        const response = await fetch(`${API_BASE}/admin-registration/leaderboard?period=${period}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        if (data.success) {
            displayLeaderboard(data.leaderboard);
        }
    } catch (error) {
        console.error('Load leaderboard error:', error);
    }
}

function displayLeaderboard(leaderboard) {
    const tbody = document.getElementById('leaderboardTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = leaderboard.map((admin, index) => `
        <tr class="${admin.adminName === currentAdmin.username ? 'highlight' : ''}">
            <td>${index + 1}</td>
            <td>${admin.adminName}</td>
            <td>${admin.totalRegistrations}</td>
            <td><strong>${admin.totalCredits}</strong></td>
        </tr>
    `).join('');
}

async function handleRegistration(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData();
    const submitBtn = form.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';
        
        // Get all form fields
        const fields = ['fullName', 'dateOfBirth', 'phoneNumber', 'cin', 'city', 'email', 'parentName', 'parentPhone', 'studyLevel'];
        fields.forEach(field => {
            const value = form.elements[field]?.value;
            if (value) formData.append(field, value);
        });
        
        // Handle photo
        const photo = form.elements['photo'].files[0];
        if (photo) {
            formData.append('photo', photo);
        }
        
        // Handle formationChoisie checkboxes
        const formationCheckboxes = form.querySelectorAll('input[name="formationChoisie"]:checked');
        const formationValues = Array.from(formationCheckboxes).map(cb => cb.value);
        if (formationValues.length > 0) {
            formData.append('formationChoisie', JSON.stringify(formationValues));
        }
        
        // Handle filiere checkboxes
        const filiereCheckboxes = form.querySelectorAll('input[name="filiere"]:checked');
        const filiereValues = Array.from(filiereCheckboxes).map(cb => cb.value);
        if (filiereValues.length > 0) {
            formData.append('filiere', JSON.stringify(filiereValues));
        }
        
        const response = await fetch(`${API_BASE}/admin-registration/register`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(data.message);
            form.reset();
            await loadDashboard();
        } else {
            showError(data.message);
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('Registration failed. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register Student';
    }
}

function filterRegistrations() {
    loadMyRegistrations(1);
}

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`${tab}Tab`)?.classList.add('active');
    document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
    
    if (tab === 'leaderboard') {
        loadLeaderboard();
    }
}

function exportToPDF() {
    window.print();
}

function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin';
}

// Mobile menu toggle - exposed globally
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

function showLoading() {
    document.getElementById('loadingOverlay')?.classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay')?.classList.remove('active');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function resetAllCredits() {
    // Double confirmation
    const firstConfirm = confirm('⚠️ WARNING: This will reset ALL admin credits and registrations to ZERO!\n\nAre you absolutely sure?');
    if (!firstConfirm) return;
    
    const secondConfirm = confirm('This action CANNOT be undone!\n\nType YES in the next prompt to confirm.');
    if (!secondConfirm) return;
    
    const finalConfirm = prompt('Type "RESET" (in capital letters) to confirm:');
    if (finalConfirm !== 'RESET') {
        showError('Reset cancelled. You must type RESET exactly.');
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE}/admin-registration/reset-all-credits`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(data.message);
            await loadDashboard();
            await loadLeaderboard();
        } else {
            showError(data.message);
        }
    } catch (error) {
        console.error('Reset error:', error);
        showError('Failed to reset credits. Please try again.');
    } finally {
        hideLoading();
    }
}
