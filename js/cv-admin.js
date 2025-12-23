// CV Service Admin Management
// Handles the admin panel for CV requests

let currentCVFilter = 'all';
let cvRequests = [];

// Pagination state for CV requests
let cvPendingCurrentPage = 1;
let cvAllCurrentPage = 1;
const CV_PER_PAGE = 7;

// Initialize CV Admin
function initCVAdmin() {
    // Initialize tab switching
    document.querySelectorAll('.cv-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabType = tab.dataset.cvTab;
            switchCVTab(tabType);
        });
    });
    
    // Load initial data
    loadCVRequests();
}

// Switch between CV tabs
function switchCVTab(tabType) {
    // Update tab buttons
    document.querySelectorAll('.cv-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.cvTab === tabType) {
            tab.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.cv-tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    
    if (tabType === 'pending') {
        document.getElementById('cvPendingTab').classList.add('active');
        document.getElementById('cvPendingTab').style.display = 'block';
        loadPendingCV();
    } else if (tabType === 'management') {
        document.getElementById('cvManagementTab').classList.add('active');
        document.getElementById('cvManagementTab').style.display = 'block';
        loadAllCV();
    }
}

// Load all CV requests
async function loadCVRequests() {
    try {
        const response = await fetch('/api/services?serviceType=cv', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            cvRequests = data.requests || [];
            updateCVCounts();
            loadPendingCV();
        }
    } catch (error) {
        console.error('Error loading CV requests:', error);
    }
}

// Update CV counts
function updateCVCounts() {
    const pending = cvRequests.filter(r => r.status === 'pending').length;
    const inProgress = cvRequests.filter(r => r.status === 'in-progress').length;
    const completed = cvRequests.filter(r => r.status === 'completed').length;
    const total = cvRequests.length;
    
    // Update tab badges
    const pendingCountEl = document.getElementById('cvPendingCount');
    const totalCountEl = document.getElementById('cvTotalCount');
    if (pendingCountEl) pendingCountEl.textContent = pending;
    if (totalCountEl) totalCountEl.textContent = total;
    
    // Update status cards
    const newCountEl = document.getElementById('cvNewCount');
    const inProgressCountEl = document.getElementById('cvInProgressCount');
    const completedCountEl = document.getElementById('cvCompletedCount');
    const allCountEl = document.getElementById('cvAllCount');
    
    if (newCountEl) newCountEl.textContent = pending;
    if (inProgressCountEl) inProgressCountEl.textContent = inProgress;
    if (completedCountEl) completedCountEl.textContent = completed;
    if (allCountEl) allCountEl.textContent = total;
}

// Load pending CV requests
function loadPendingCV() {
    const pendingRequests = cvRequests.filter(r => r.status === 'pending');
    cvPendingCurrentPage = 1;
    displayPendingCV(pendingRequests);
}

// Display pending CV in table with pagination
function displayPendingCV(requests) {
    const loading = document.getElementById('cvPendingLoading');
    const container = document.getElementById('cvPendingTableContainer');
    const tbody = document.getElementById('cvPendingTableBody');
    
    if (loading) loading.style.display = 'none';
    if (container) container.style.display = 'block';
    
    if (!requests || requests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-light);">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    No pending CV requests
                </td>
            </tr>
        `;
        // Clear pagination
        const paginationContainer = document.getElementById('cvPendingPagination');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(requests.length / CV_PER_PAGE);
    const startIndex = (cvPendingCurrentPage - 1) * CV_PER_PAGE;
    const endIndex = startIndex + CV_PER_PAGE;
    const paginatedRequests = requests.slice(startIndex, endIndex);
    
    tbody.innerHTML = paginatedRequests.map(req => {
        const details = req.cvDetails || {};
        const documentCount = details.documentCount || (details.files ? details.files.length : (details.fileName ? 1 : 0));
        const notes = details.notes || '-';
        
        return `
        <tr>
            <td>
                <div class="applicant-name">${escapeHtml(req.fullName)}</div>
            </td>
            <td>
                <div class="contact-info">
                    <span><i class="fas fa-phone"></i> ${escapeHtml(req.phone)}</span>
                    <span><i class="fas fa-envelope"></i> ${escapeHtml(req.email)}</span>
                </div>
            </td>
            <td>
                <span class="document-count">
                    <i class="fas fa-file-alt"></i> ${documentCount} document${documentCount !== 1 ? 's' : ''}
                </span>
            </td>
            <td>
                <span class="notes-preview">${notes.length > 50 ? notes.substring(0, 50) + '...' : notes}</span>
            </td>
            <td>${formatDate(req.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    ${documentCount > 0 ? `
                        <button class="action-btn btn-info btn-sm" onclick="downloadCVDocuments('${req._id}')" title="Download Documents">
                            <i class="fas fa-download"></i>
                        </button>
                    ` : ''}
                    <button class="action-btn btn-success btn-sm" onclick="startCV('${req._id}')" title="Start Processing">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="action-btn btn-danger btn-sm" onclick="deleteCVRequest('${req._id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');
    
    // Display pagination
    displayCVPagination('pending', requests, totalPages);
}

// Load all CV for management tab
function loadAllCV() {
    let filteredRequests = cvRequests;
    
    if (currentCVFilter !== 'all') {
        filteredRequests = cvRequests.filter(r => r.status === currentCVFilter);
    }
    
    cvAllCurrentPage = 1;
    displayAllCV(filteredRequests);
}

// Store filtered requests for pagination navigation
let currentCVAllRequests = [];
let currentCVPendingRequests = [];

// Display all CV in management table with pagination
function displayAllCV(requests) {
    const loading = document.getElementById('cvManagementLoading');
    const container = document.getElementById('cvManagementTableContainer');
    const tbody = document.getElementById('cvManagementTableBody');
    
    currentCVAllRequests = requests; // Store for pagination
    
    if (loading) loading.style.display = 'none';
    if (container) container.style.display = 'block';
    
    if (!requests || requests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-light);">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    No CV requests found
                </td>
            </tr>
        `;
        // Clear pagination
        const paginationContainer = document.getElementById('cvAllPagination');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(requests.length / CV_PER_PAGE);
    const startIndex = (cvAllCurrentPage - 1) * CV_PER_PAGE;
    const endIndex = startIndex + CV_PER_PAGE;
    const paginatedRequests = requests.slice(startIndex, endIndex);
    
    tbody.innerHTML = paginatedRequests.map(req => {
        const details = req.cvDetails || {};
        const documentCount = details.documentCount || (details.files ? details.files.length : (details.fileName ? 1 : 0));
        
        return `
        <tr>
            <td>
                <div class="applicant-name">${escapeHtml(req.fullName)}</div>
            </td>
            <td>
                <div class="contact-info">
                    <span><i class="fas fa-phone"></i> ${escapeHtml(req.phone)}</span>
                    <span><i class="fas fa-envelope"></i> ${escapeHtml(req.email)}</span>
                </div>
            </td>
            <td>
                <span class="document-count">
                    <i class="fas fa-file-alt"></i> ${documentCount} document${documentCount !== 1 ? 's' : ''}
                </span>
            </td>
            <td>
                <div class="status-dropdown">
                    <select onchange="updateCVStatus('${req._id}', this.value)">
                        <option value="pending" ${req.status === 'pending' ? 'selected' : ''}>🕐 New</option>
                        <option value="in-progress" ${req.status === 'in-progress' ? 'selected' : ''}>🔄 In Progress</option>
                        <option value="completed" ${req.status === 'completed' ? 'selected' : ''}>✅ Finished</option>
                    </select>
                </div>
            </td>
            <td>${formatDate(req.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    ${documentCount > 0 ? `
                        <button class="action-btn btn-info btn-sm" onclick="downloadCVDocuments('${req._id}')" title="Download Documents">
                            <i class="fas fa-download"></i>
                        </button>
                    ` : ''}
                    <button class="action-btn btn-danger btn-sm" onclick="deleteCVRequest('${req._id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');
    
    // Display pagination
    displayCVPagination('all', requests, totalPages);
}

// Display pagination for CV requests
function displayCVPagination(tabType, requests, totalPages) {
    const paginationContainer = document.getElementById(tabType === 'pending' ? 'cvPendingPagination' : 'cvAllPagination');
    if (!paginationContainer) return;
    
    const currentPage = tabType === 'pending' ? cvPendingCurrentPage : cvAllCurrentPage;
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="cv-pagination" style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 20px; padding: 15px;">';
    
    // Previous button
    paginationHTML += `
        <button onclick="goToCVPage('${tabType}', ${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''} 
                style="display: flex; align-items: center; gap: 5px; padding: 8px 16px; border: 1px solid #e5e7eb; background: white; border-radius: 8px; cursor: ${currentPage === 1 ? 'not-allowed' : 'pointer'}; color: ${currentPage === 1 ? '#9ca3af' : '#374151'}; font-weight: 500; transition: all 0.2s;">
            <i class="fas fa-chevron-left" style="font-size: 12px;"></i> Previous
        </button>
    `;
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page + ellipsis
    if (startPage > 1) {
        paginationHTML += `
            <button onclick="goToCVPage('${tabType}', 1)" 
                    style="min-width: 40px; height: 40px; border: 1px solid #e5e7eb; background: white; border-radius: 8px; cursor: pointer; color: #374151; font-weight: 500;">
                1
            </button>
        `;
        if (startPage > 2) {
            paginationHTML += '<span style="color: #9ca3af; padding: 0 5px;">...</span>';
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === currentPage;
        paginationHTML += `
            <button onclick="goToCVPage('${tabType}', ${i})" 
                    style="min-width: 40px; height: 40px; border: ${isActive ? 'none' : '1px solid #e5e7eb'}; background: ${isActive ? 'linear-gradient(135deg, #FFCC00 0%, #FF9500 100%)' : 'white'}; border-radius: 8px; cursor: pointer; color: ${isActive ? '#1f2937' : '#374151'}; font-weight: ${isActive ? '700' : '500'}; box-shadow: ${isActive ? '0 2px 8px rgba(255, 149, 0, 0.3)' : 'none'};">
                ${i}
            </button>
        `;
    }
    
    // Last page + ellipsis
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += '<span style="color: #9ca3af; padding: 0 5px;">...</span>';
        }
        paginationHTML += `
            <button onclick="goToCVPage('${tabType}', ${totalPages})" 
                    style="min-width: 40px; height: 40px; border: 1px solid #e5e7eb; background: white; border-radius: 8px; cursor: pointer; color: #374151; font-weight: 500;">
                ${totalPages}
            </button>
        `;
    }
    
    // Next button
    paginationHTML += `
        <button onclick="goToCVPage('${tabType}', ${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''} 
                style="display: flex; align-items: center; gap: 5px; padding: 8px 16px; border: 1px solid #e5e7eb; background: white; border-radius: 8px; cursor: ${currentPage === totalPages ? 'not-allowed' : 'pointer'}; color: ${currentPage === totalPages ? '#9ca3af' : '#374151'}; font-weight: 500; transition: all 0.2s;">
            Next <i class="fas fa-chevron-right" style="font-size: 12px;"></i>
        </button>
    `;
    
    paginationHTML += '</div>';
    paginationContainer.innerHTML = paginationHTML;
}

// Go to specific page for CV requests
function goToCVPage(tabType, page) {
    if (tabType === 'pending') {
        const pendingRequests = cvRequests.filter(r => r.status === 'pending');
        const totalPages = Math.ceil(pendingRequests.length / CV_PER_PAGE);
        if (page < 1 || page > totalPages) return;
        cvPendingCurrentPage = page;
        displayPendingCV(pendingRequests);
    } else {
        const totalPages = Math.ceil(currentCVAllRequests.length / CV_PER_PAGE);
        if (page < 1 || page > totalPages) return;
        cvAllCurrentPage = page;
        displayAllCV(currentCVAllRequests);
    }
}

// Filter CV by status
function filterCVByStatus(status) {
    currentCVFilter = status;
    
    // Update active status card
    document.querySelectorAll('.cv-status-cards .status-card').forEach(card => {
        card.classList.remove('active');
        if (card.dataset.status === status) {
            card.classList.add('active');
        }
    });
    
    loadAllCV();
}

// Start processing a CV (change status to in-progress)
async function startCV(requestId) {
    await updateCVStatus(requestId, 'in-progress');
}

// Update CV status
async function updateCVStatus(requestId, newStatus) {
    try {
        const response = await fetch(`/api/services/${requestId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Status updated successfully', 'success');
            // Update local data
            const request = cvRequests.find(r => r._id === requestId);
            if (request) {
                request.status = newStatus;
            }
            updateCVCounts();
            loadPendingCV();
            loadAllCV();
        } else {
            showNotification(data.message || 'Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showNotification('Error updating status', 'error');
    }
}

// Download CV documents
async function downloadCVDocuments(requestId) {
    try {
        showNotification('Preparing download...', 'info');
        
        const response = await fetch(`/api/services/${requestId}/download-documents`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'documents.zip';
            
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match) filename = match[1];
            }
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            
            showNotification('Documents downloaded successfully', 'success');
        } else {
            const data = await response.json();
            showNotification(data.message || 'Failed to download documents', 'error');
        }
    } catch (error) {
        console.error('Error downloading documents:', error);
        showNotification('Error downloading documents', 'error');
    }
}

// Delete CV request
async function deleteCVRequest(requestId) {
    if (!confirm('Are you sure you want to delete this CV request?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/services/${requestId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Request deleted successfully', 'success');
            // Remove from local data
            cvRequests = cvRequests.filter(r => r._id !== requestId);
            updateCVCounts();
            loadPendingCV();
            loadAllCV();
        } else {
            showNotification(data.message || 'Failed to delete request', 'error');
        }
    } catch (error) {
        console.error('Error deleting request:', error);
        showNotification('Error deleting request', 'error');
    }
}

// Helper: Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Helper: Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper: Show notification (uses global if available)
function showNotification(message, type = 'info') {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else if (typeof window.showNotificationToast === 'function') {
        window.showNotificationToast(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Make functions globally available
window.filterCVByStatus = filterCVByStatus;
window.startCV = startCV;
window.updateCVStatus = updateCVStatus;
window.downloadCVDocuments = downloadCVDocuments;
window.deleteCVRequest = deleteCVRequest;
window.initCVAdmin = initCVAdmin;
window.loadCVRequests = loadCVRequests;

// Initialize when CV service is opened
document.addEventListener('DOMContentLoaded', function() {
    // Will be called when CV service tab is opened
});
