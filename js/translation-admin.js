// Translation Service Admin Management
// Handles the admin panel for translation requests

let currentTranslationFilter = 'all';
let translationRequests = [];

// Pagination state for translation requests
let translationPendingCurrentPage = 1;
let translationAllCurrentPage = 1;
const TRANSLATION_PER_PAGE = 7;
let currentTranslationAllRequests = [];

// Initialize Translation Admin
function initTranslationAdmin() {
    // Initialize tab switching
    document.querySelectorAll('.translation-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabType = tab.dataset.translationTab;
            switchTranslationTab(tabType);
        });
    });
    
    // Load initial data
    loadTranslationRequests();
}

// Switch between Translation tabs
function switchTranslationTab(tabType) {
    // Update tab buttons
    document.querySelectorAll('.translation-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.translationTab === tabType) {
            tab.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.translation-tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    
    if (tabType === 'pending') {
        document.getElementById('translationPendingTab').classList.add('active');
        document.getElementById('translationPendingTab').style.display = 'block';
        loadPendingTranslations();
    } else if (tabType === 'management') {
        document.getElementById('translationManagementTab').classList.add('active');
        document.getElementById('translationManagementTab').style.display = 'block';
        loadAllTranslations();
    }
}

// Load all translation requests
async function loadTranslationRequests() {
    try {
        const response = await fetch('/api/services?serviceType=translation', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            translationRequests = data.requests || [];
            updateTranslationCounts();
            loadPendingTranslations();
        }
    } catch (error) {
        console.error('Error loading translation requests:', error);
    }
}

// Update translation counts
function updateTranslationCounts() {
    const pending = translationRequests.filter(r => r.status === 'pending').length;
    const inProgress = translationRequests.filter(r => r.status === 'in-progress').length;
    const completed = translationRequests.filter(r => r.status === 'completed').length;
    const total = translationRequests.length;
    
    // Update tab badges
    document.getElementById('translationPendingCount').textContent = pending;
    document.getElementById('translationTotalCount').textContent = total;
    
    // Update status cards
    document.getElementById('translationNewCount').textContent = pending;
    document.getElementById('translationInProgressCount').textContent = inProgress;
    document.getElementById('translationCompletedCount').textContent = completed;
    document.getElementById('translationAllCount').textContent = total;
}

// Load pending translations
function loadPendingTranslations() {
    const pendingRequests = translationRequests.filter(r => r.status === 'pending');
    translationPendingCurrentPage = 1;
    displayPendingTranslations(pendingRequests);
}

// Store pending requests for pagination
let currentTranslationPendingRequests = [];

// Display pending translations in table with pagination
function displayPendingTranslations(requests) {
    const loading = document.getElementById('translationPendingLoading');
    const container = document.getElementById('translationPendingTableContainer');
    const tbody = document.getElementById('translationPendingTableBody');
    
    currentTranslationPendingRequests = requests; // Store for pagination
    
    if (loading) loading.style.display = 'none';
    if (container) container.style.display = 'block';
    
    if (!requests || requests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-light);">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    No pending translation requests
                </td>
            </tr>
        `;
        const paginationContainer = document.getElementById('translationPendingPagination');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(requests.length / TRANSLATION_PER_PAGE);
    const startIndex = (translationPendingCurrentPage - 1) * TRANSLATION_PER_PAGE;
    const endIndex = startIndex + TRANSLATION_PER_PAGE;
    const paginatedRequests = requests.slice(startIndex, endIndex);
    
    tbody.innerHTML = paginatedRequests.map(req => {
        const details = req.translationDetails || {};
        const documentCount = details.documentCount || (details.files ? details.files.length : (details.fileName ? 1 : 0));
        const languages = details.languages || 'Not specified';
        
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
                <span class="language-pair">
                    <i class="fas fa-language"></i> ${formatLanguagePair(languages)}
                </span>
            </td>
            <td>
                <span class="document-count">
                    <i class="fas fa-file-alt"></i> ${documentCount} document${documentCount !== 1 ? 's' : ''}
                </span>
            </td>
            <td>${formatDate(req.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    ${documentCount > 0 ? `
                        <button class="action-btn btn-info btn-sm" onclick="downloadTranslationDocuments('${req._id}')" title="Download Documents">
                            <i class="fas fa-download"></i>
                        </button>
                    ` : ''}
                    <button class="action-btn btn-success btn-sm" onclick="startTranslation('${req._id}')" title="Start Processing">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="action-btn btn-danger btn-sm" onclick="deleteTranslationRequest('${req._id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');
    
    // Display pagination
    displayTranslationPagination('pending', totalPages);
}

// Load all translations for management tab
function loadAllTranslations() {
    let filteredRequests = translationRequests;
    
    if (currentTranslationFilter !== 'all') {
        filteredRequests = translationRequests.filter(r => r.status === currentTranslationFilter);
    }
    
    translationAllCurrentPage = 1;
    displayAllTranslations(filteredRequests);
}

// Display all translations in management table with pagination
function displayAllTranslations(requests) {
    const loading = document.getElementById('translationManagementLoading');
    const container = document.getElementById('translationManagementTableContainer');
    const tbody = document.getElementById('translationManagementTableBody');
    
    currentTranslationAllRequests = requests; // Store for pagination
    
    if (loading) loading.style.display = 'none';
    if (container) container.style.display = 'block';
    
    if (!requests || requests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-light);">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    No translation requests found
                </td>
            </tr>
        `;
        const paginationContainer = document.getElementById('translationAllPagination');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(requests.length / TRANSLATION_PER_PAGE);
    const startIndex = (translationAllCurrentPage - 1) * TRANSLATION_PER_PAGE;
    const endIndex = startIndex + TRANSLATION_PER_PAGE;
    const paginatedRequests = requests.slice(startIndex, endIndex);
    
    tbody.innerHTML = paginatedRequests.map(req => {
        const details = req.translationDetails || {};
        const documentCount = details.documentCount || (details.files ? details.files.length : (details.fileName ? 1 : 0));
        const languages = details.languages || 'Not specified';
        
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
                <span class="language-pair">
                    <i class="fas fa-language"></i> ${formatLanguagePair(languages)}
                </span>
            </td>
            <td>
                <span class="document-count">
                    <i class="fas fa-file-alt"></i> ${documentCount} document${documentCount !== 1 ? 's' : ''}
                </span>
            </td>
            <td>
                <div class="status-dropdown">
                    <select onchange="updateTranslationStatus('${req._id}', this.value)">
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
                        <button class="action-btn btn-info btn-sm" onclick="downloadTranslationDocuments('${req._id}')" title="Download Documents">
                            <i class="fas fa-download"></i>
                        </button>
                    ` : ''}
                    <button class="action-btn btn-danger btn-sm" onclick="deleteTranslationRequest('${req._id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');
    
    // Display pagination
    displayTranslationPagination('all', totalPages);
}

// Display pagination for translation requests
function displayTranslationPagination(tabType, totalPages) {
    const paginationContainer = document.getElementById(tabType === 'pending' ? 'translationPendingPagination' : 'translationAllPagination');
    if (!paginationContainer) return;
    
    const currentPage = tabType === 'pending' ? translationPendingCurrentPage : translationAllCurrentPage;
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="translation-pagination" style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 20px; padding: 15px;">';
    
    // Previous button
    paginationHTML += `
        <button onclick="goToTranslationPage('${tabType}', ${currentPage - 1})" 
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
            <button onclick="goToTranslationPage('${tabType}', 1)" 
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
            <button onclick="goToTranslationPage('${tabType}', ${i})" 
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
            <button onclick="goToTranslationPage('${tabType}', ${totalPages})" 
                    style="min-width: 40px; height: 40px; border: 1px solid #e5e7eb; background: white; border-radius: 8px; cursor: pointer; color: #374151; font-weight: 500;">
                ${totalPages}
            </button>
        `;
    }
    
    // Next button
    paginationHTML += `
        <button onclick="goToTranslationPage('${tabType}', ${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''} 
                style="display: flex; align-items: center; gap: 5px; padding: 8px 16px; border: 1px solid #e5e7eb; background: white; border-radius: 8px; cursor: ${currentPage === totalPages ? 'not-allowed' : 'pointer'}; color: ${currentPage === totalPages ? '#9ca3af' : '#374151'}; font-weight: 500; transition: all 0.2s;">
            Next <i class="fas fa-chevron-right" style="font-size: 12px;"></i>
        </button>
    `;
    
    paginationHTML += '</div>';
    paginationContainer.innerHTML = paginationHTML;
}

// Go to specific page for translation requests
function goToTranslationPage(tabType, page) {
    if (tabType === 'pending') {
        const totalPages = Math.ceil(currentTranslationPendingRequests.length / TRANSLATION_PER_PAGE);
        if (page < 1 || page > totalPages) return;
        translationPendingCurrentPage = page;
        displayPendingTranslations(currentTranslationPendingRequests);
    } else {
        const totalPages = Math.ceil(currentTranslationAllRequests.length / TRANSLATION_PER_PAGE);
        if (page < 1 || page > totalPages) return;
        translationAllCurrentPage = page;
        displayAllTranslations(currentTranslationAllRequests);
    }
}

// Filter translations by status
function filterTranslationsByStatus(status) {
    currentTranslationFilter = status;
    
    // Update active status card
    document.querySelectorAll('.status-card').forEach(card => {
        card.classList.remove('active');
        if (card.dataset.status === status) {
            card.classList.add('active');
        }
    });
    
    loadAllTranslations();
}

// Start processing a translation (change status to in-progress)
async function startTranslation(requestId) {
    await updateTranslationStatus(requestId, 'in-progress');
}

// Update translation status
async function updateTranslationStatus(requestId, newStatus) {
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
            const request = translationRequests.find(r => r._id === requestId);
            if (request) {
                request.status = newStatus;
            }
            updateTranslationCounts();
            loadPendingTranslations();
            loadAllTranslations();
        } else {
            showNotification(data.message || 'Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showNotification('Error updating status', 'error');
    }
}

// Download translation documents
async function downloadTranslationDocuments(requestId) {
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

// Delete translation request
async function deleteTranslationRequest(requestId) {
    if (!confirm('Are you sure you want to delete this translation request?')) {
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
            translationRequests = translationRequests.filter(r => r._id !== requestId);
            updateTranslationCounts();
            loadPendingTranslations();
            loadAllTranslations();
        } else {
            showNotification(data.message || 'Failed to delete request', 'error');
        }
    } catch (error) {
        console.error('Error deleting request:', error);
        showNotification('Error deleting request', 'error');
    }
}

// Helper: Format language pair for display
function formatLanguagePair(languages) {
    if (!languages) return 'Not specified';
    
    const languageMap = {
        'german-arabic': 'DE → AR',
        'arabic-german': 'AR → DE',
        'german-english': 'DE → EN',
        'english-german': 'EN → DE',
        'french-german': 'FR → DE',
        'german-french': 'DE → FR',
        'other': 'Other'
    };
    
    return languageMap[languages] || languages;
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
window.filterTranslationsByStatus = filterTranslationsByStatus;
window.startTranslation = startTranslation;
window.updateTranslationStatus = updateTranslationStatus;
window.downloadTranslationDocuments = downloadTranslationDocuments;
window.deleteTranslationRequest = deleteTranslationRequest;
window.initTranslationAdmin = initTranslationAdmin;
window.loadTranslationRequests = loadTranslationRequests;

// Initialize when Translation service is opened
document.addEventListener('DOMContentLoaded', function() {
    // Will be called when translation service tab is opened
});
