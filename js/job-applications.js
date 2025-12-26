// Job Applications Management
// Enhanced Bewerbungsservice with Ausbildung/Arbeit categories

let currentApplicationType = 'ausbildung';
let currentApplicationId = null;
let searchTimeout = null;
let currentServiceView = 'selection'; // 'selection', 'applying', 'cv', 'translation'

// Pagination state for applications
let ausbildungCurrentPage = 1;
let arbeitCurrentPage = 1;
let allAusbildungApplications = [];
let allArbeitApplications = [];
const APPLICATIONS_PER_PAGE = 7;

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Helper function to show notifications (uses global if available, otherwise console)
function showNotification(message, type = 'info') {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else if (typeof window.showNotificationToast === 'function') {
        window.showNotificationToast(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
        // Fallback: create simple toast
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

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Field labels mapping
const FIELD_LABELS = {
    pflege: 'Pflege (Care/Nursing)',
    verkaufer: 'Verkäufer (Sales)',
    gastronomie: 'Gastronomie (Hotel/Cooking)',
    fleischer: 'Fleischer (Butcher)',
    maurer: 'Maurer (Mason)',
    other: 'Other'
};

// Status labels mapping
const STATUS_LABELS = {
    new: 'New',
    erstgespraech: 'Erstgespräch',
    vorvertrag: 'Vorvertrag',
    interview: 'Interview',
    vertrag: 'Vertrag',
    botschaft: 'Botschaft',
    visum: 'Visum',
    completed: 'Completed',
    cancelled: 'Cancelled'
};

// Status colors
const STATUS_COLORS = {
    new: '#6b7280',
    erstgespraech: '#3b82f6',
    vorvertrag: '#8b5cf6',
    interview: '#f59e0b',
    vertrag: '#10b981',
    botschaft: '#06b6d4',
    visum: '#22c55e',
    completed: '#059669',
    cancelled: '#ef4444'
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initApplyingTabs();
    initJobFieldCards();
    loadServiceTypeCounts();
    initCVDragDrop();
});

// Open a specific service type
function openServiceType(type) {
    currentServiceView = type;
    
    // Hide service type selection
    document.getElementById('serviceTypeSelection').style.display = 'none';
    
    // Hide all service contents
    document.getElementById('applyingServiceContent').style.display = 'none';
    document.getElementById('cvServiceContent').style.display = 'none';
    document.getElementById('translationServiceContent').style.display = 'none';
    
    if (type === 'applying') {
        document.getElementById('applyingServiceContent').style.display = 'block';
        currentApplicationType = 'ausbildung';
        loadJobApplications('ausbildung');
        loadApplicationStats();
    } else if (type === 'cv') {
        document.getElementById('cvServiceContent').style.display = 'block';
        // Initialize and load CV admin
        if (typeof initCVAdmin === 'function') {
            initCVAdmin();
        }
        if (typeof loadCVRequests === 'function') {
            loadCVRequests();
        }
    } else if (type === 'translation') {
        document.getElementById('translationServiceContent').style.display = 'block';
        // Initialize and load translation admin
        if (typeof initTranslationAdmin === 'function') {
            initTranslationAdmin();
        }
        if (typeof loadTranslationRequests === 'function') {
            loadTranslationRequests();
        }
    }
}

// Go back to service type selection
function backToServiceTypes() {
    currentServiceView = 'selection';
    
    // Show service type selection
    document.getElementById('serviceTypeSelection').style.display = 'block';
    
    // Hide all service contents
    document.getElementById('applyingServiceContent').style.display = 'none';
    document.getElementById('cvServiceContent').style.display = 'none';
    document.getElementById('translationServiceContent').style.display = 'none';
    
    // Reload counts
    loadServiceTypeCounts();
}

// Load service type counts for the main cards
async function loadServiceTypeCounts() {
    try {
        // Load job applications stats
        const response = await fetch('/api/job-applications/stats/both', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Include pending review count in total
                const totalApplying = (data.ausbildung?.total || 0) + (data.arbeit?.total || 0) + (data.pendingReview || 0);
                document.getElementById('applyingServiceCount').textContent = totalApplying;
            }
        }
        
        // Load CV and Translation counts from existing services API
        const servicesResponse = await fetch('/api/services/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (servicesResponse.ok) {
            const servicesData = await servicesResponse.json();
            if (servicesData.success) {
                document.getElementById('cvServiceCount').textContent = servicesData.stats?.cv || 0;
                document.getElementById('translationServiceCount').textContent = servicesData.stats?.translation || 0;
            }
        }
    } catch (error) {
        console.error('Error loading service counts:', error);
    }
}

// Initialize Ausbildung/Arbeit tabs within Applying service
function initApplyingTabs() {
    const tabs = document.querySelectorAll('.applying-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabType = tab.dataset.applyingType;
            switchApplyingTab(tabType);
        });
    });
}

// Switch between Pending, Ausbildung and Arbeit tabs
function switchApplyingTab(tabType) {
    // Update tab buttons
    document.querySelectorAll('.applying-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.applyingType === tabType);
    });
    
    // Update content
    document.querySelectorAll('.service-main-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (tabType === 'pending') {
        document.getElementById('pendingContent').classList.add('active');
        loadPendingApplications();
    } else if (tabType === 'ausbildung') {
        document.getElementById('ausbildungContent').classList.add('active');
        currentApplicationType = 'ausbildung';
        loadJobApplications('ausbildung');
    } else if (tabType === 'arbeit') {
        document.getElementById('arbeitContent').classList.add('active');
        currentApplicationType = 'arbeit';
        loadJobApplications('arbeit');
    }
}

// Load pending review applications
async function loadPendingApplications() {
    document.getElementById('pendingLoading').style.display = 'block';
    document.getElementById('pendingTableContainer').style.display = 'none';
    
    try {
        const response = await fetch('/api/job-applications/pending', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayPendingApplications(data.applications);
            document.getElementById('pendingReviewCount').textContent = data.count || 0;
        } else {
            showNotification(data.message || 'Failed to load pending applications', 'error');
        }
    } catch (error) {
        console.error('Error loading pending applications:', error);
        showNotification('Error loading pending applications', 'error');
    }
    
    document.getElementById('pendingLoading').style.display = 'none';
    document.getElementById('pendingTableContainer').style.display = 'block';
}

// Display pending applications in table
function displayPendingApplications(applications) {
    const tbody = document.getElementById('pendingTableBody');
    
    if (!applications || applications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-light);">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    No pending applications to review
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = applications.map(app => {
        const hasDocuments = app.documents && app.documents.length > 0;
        const downloadBtn = hasDocuments 
            ? `<button class="action-btn btn-info btn-sm" onclick="downloadApplicationDocument('${app._id}')" title="Download CV/Documents">
                   <i class="fas fa-download"></i>
               </button>`
            : `<span class="no-docs" title="No documents uploaded"><i class="fas fa-file-excel" style="color: #9ca3af;"></i></span>`;
        
        return `
        <tr>
            <td>
                <div class="applicant-name">${app.fullName}</div>
            </td>
            <td>
                <div class="contact-info">
                    <span><i class="fas fa-phone"></i> ${app.phone}</span>
                    <span><i class="fas fa-envelope"></i> ${app.email}</span>
                </div>
            </td>
            <td>
                <span class="badge badge-info">${app.requestedJobType || 'Not specified'}</span>
            </td>
            <td>
                <span class="notes-preview">${app.notes ? (app.notes.substring(0, 50) + (app.notes.length > 50 ? '...' : '')) : '-'}</span>
            </td>
            <td>${formatDate(app.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    ${downloadBtn}
                    <button class="action-btn btn-success btn-sm" onclick="openReviewModal('${app._id}')" title="Review & Classify">
                        <i class="fas fa-clipboard-check"></i>
                    </button>
                    <button class="action-btn btn-danger btn-sm" onclick="deletePendingApplication('${app._id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');
}

// Open review modal
async function openReviewModal(applicationId) {
    try {
        const response = await fetch(`/api/job-applications/${applicationId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const app = data.application;
            
            // Fill modal with applicant info
            document.getElementById('reviewApplicationId').value = app._id;
            document.getElementById('reviewApplicantName').textContent = app.fullName;
            document.getElementById('reviewApplicantPhone').textContent = app.phone;
            document.getElementById('reviewApplicantEmail').textContent = app.email;
            document.getElementById('reviewRequestedType').textContent = app.requestedJobType || 'Not specified';
            document.getElementById('reviewNotes').textContent = app.notes || 'No notes';
            
            // Reset form fields
            document.getElementById('reviewApplicationType').value = '';
            document.getElementById('reviewJobField').value = '';
            document.getElementById('reviewCustomJobField').value = '';
            document.getElementById('reviewDiplomaType').value = '';
            document.getElementById('reviewDiplomaDetails').value = '';
            document.getElementById('reviewAdminNotes').value = '';
            document.getElementById('reviewCustomFieldGroup').style.display = 'none';
            
            // Show modal
            document.getElementById('reviewApplicationModal').classList.add('active');
        } else {
            showNotification('Failed to load application details', 'error');
        }
    } catch (error) {
        console.error('Error opening review modal:', error);
        showNotification('Error loading application', 'error');
    }
}

// Close review modal
function closeReviewModal() {
    document.getElementById('reviewApplicationModal').classList.remove('active');
}

// Toggle custom field input
function toggleReviewCustomField() {
    const jobField = document.getElementById('reviewJobField').value;
    document.getElementById('reviewCustomFieldGroup').style.display = jobField === 'other' ? 'block' : 'none';
}

// Submit review (approve and classify)
async function submitReview() {
    const applicationId = document.getElementById('reviewApplicationId').value;
    const applicationType = document.getElementById('reviewApplicationType').value;
    const jobField = document.getElementById('reviewJobField').value;
    const customJobField = document.getElementById('reviewCustomJobField').value;
    const diplomaType = document.getElementById('reviewDiplomaType').value;
    const diplomaDetails = document.getElementById('reviewDiplomaDetails').value;
    const notes = document.getElementById('reviewAdminNotes').value;
    
    // Validate
    if (!applicationType || !jobField || !diplomaType) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/job-applications/${applicationId}/review`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({
                applicationType,
                jobField,
                customJobField: jobField === 'other' ? customJobField : undefined,
                diplomaType,
                diplomaDetails,
                notes
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Application approved and classified successfully!', 'success');
            closeReviewModal();
            loadPendingApplications();
            loadApplicationStats();
        } else {
            showNotification(data.message || 'Failed to review application', 'error');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        showNotification('Error submitting review', 'error');
    }
}

// Reject application (delete it)
async function rejectApplication() {
    const applicationId = document.getElementById('reviewApplicationId').value;
    
    if (!confirm('Are you sure you want to reject and delete this application?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/job-applications/${applicationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Application rejected and deleted', 'success');
            closeReviewModal();
            loadPendingApplications();
            loadApplicationStats();
        } else {
            showNotification(data.message || 'Failed to reject application', 'error');
        }
    } catch (error) {
        console.error('Error rejecting application:', error);
        showNotification('Error rejecting application', 'error');
    }
}

// Delete pending application directly
async function deletePendingApplication(applicationId) {
    if (!confirm('Are you sure you want to delete this application?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/job-applications/${applicationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Application deleted', 'success');
            loadPendingApplications();
            loadApplicationStats();
        } else {
            showNotification(data.message || 'Failed to delete application', 'error');
        }
    } catch (error) {
        console.error('Error deleting application:', error);
        showNotification('Error deleting application', 'error');
    }
}

// Download application document
async function downloadApplicationDocument(applicationId) {
    try {
        const response = await fetch(`/api/job-applications/${applicationId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.application.documents && data.application.documents.length > 0) {
            const doc = data.application.documents[0]; // Get first document
            
            // Download from Mega via API
            const downloadResponse = await fetch(`/api/job-applications/${applicationId}/download-document`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (downloadResponse.ok) {
                const blob = await downloadResponse.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = doc.fileName || `document_${applicationId}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
                showNotification('Document downloaded successfully', 'success');
            } else {
                showNotification('Failed to download document', 'error');
            }
        } else {
            showNotification('No documents available for this application', 'error');
        }
    } catch (error) {
        console.error('Error downloading document:', error);
        showNotification('Error downloading document', 'error');
    }
}

// Initialize job field card clicks
function initJobFieldCards() {
    document.querySelectorAll('.job-field-card').forEach(card => {
        card.addEventListener('click', () => {
            const field = card.dataset.field;
            const type = card.closest('.service-main-content').id.replace('Content', '');
            
            // Set filter and load
            document.getElementById(`${type}FieldFilter`).value = field;
            loadJobApplications(type);
        });
    });
}

// Load job applications
async function loadJobApplications(type) {
    const fieldFilter = document.getElementById(`${type}FieldFilter`).value;
    const statusFilter = document.getElementById(`${type}StatusFilter`).value;
    const diplomaFilter = document.getElementById(`${type}DiplomaFilter`).value;
    const search = document.getElementById(`${type}Search`).value;
    
    // Show loading
    document.getElementById(`${type}Loading`).style.display = 'block';
    document.getElementById(`${type}TableContainer`).style.display = 'none';
    
    try {
        let url = `/api/job-applications?applicationType=${type}`;
        if (fieldFilter && fieldFilter !== 'all') url += `&jobField=${fieldFilter}`;
        if (statusFilter && statusFilter !== 'all') url += `&status=${statusFilter}`;
        if (diplomaFilter && diplomaFilter !== 'all') url += `&hasDiploma=${diplomaFilter}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store all applications for pagination
            if (type === 'ausbildung') {
                allAusbildungApplications = data.applications;
                ausbildungCurrentPage = 1;
            } else {
                allArbeitApplications = data.applications;
                arbeitCurrentPage = 1;
            }
            displayApplications(type);
            loadApplicationStats();
        } else {
            showNotification(data.message || 'Failed to load applications', 'error');
        }
    } catch (error) {
        console.error('Error loading applications:', error);
        showNotification('Failed to load applications', 'error');
    } finally {
        document.getElementById(`${type}Loading`).style.display = 'none';
        document.getElementById(`${type}TableContainer`).style.display = 'block';
    }
}

// Display applications in table with pagination
function displayApplications(type) {
    const tbody = document.getElementById(`${type}TableBody`);
    const applications = type === 'ausbildung' ? allAusbildungApplications : allArbeitApplications;
    const currentPage = type === 'ausbildung' ? ausbildungCurrentPage : arbeitCurrentPage;
    
    if (applications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #64748b;">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    No applications found
                </td>
            </tr>
        `;
        // Clear pagination
        const paginationContainer = document.getElementById(`${type}Pagination`);
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(applications.length / APPLICATIONS_PER_PAGE);
    const startIndex = (currentPage - 1) * APPLICATIONS_PER_PAGE;
    const endIndex = startIndex + APPLICATIONS_PER_PAGE;
    const paginatedApps = applications.slice(startIndex, endIndex);
    
    tbody.innerHTML = paginatedApps.map(app => {
        const fieldLabel = app.jobField === 'other' && app.customJobField 
            ? app.customJobField 
            : FIELD_LABELS[app.jobField] || app.jobField;
        
        const diplomaBadge = getDiplomaBadge(app);
        const statusBadge = getStatusBadge(app.status);
        
        return `
            <tr>
                <td>
                    <div class="applicant-name">
                        <strong>${escapeHtml(app.fullName)}</strong>
                        ${app.languageLevel ? `<span class="language-badge">${app.languageLevel}</span>` : ''}
                    </div>
                </td>
                <td>
                    <div class="contact-info">
                        <a href="tel:${app.phone}" class="contact-link"><i class="fas fa-phone"></i> ${escapeHtml(app.phone)}</a>
                        <a href="mailto:${app.email}" class="contact-link"><i class="fas fa-envelope"></i> ${escapeHtml(app.email)}</a>
                    </div>
                </td>
                <td>
                    <span class="field-badge ${app.jobField}">${fieldLabel}</span>
                </td>
                <td>${diplomaBadge}</td>
                <td>${statusBadge}</td>
                <td>${new Date(app.createdAt).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn-small btn-view" onclick="viewApplication('${app._id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn-small btn-edit" onclick="editApplication('${app._id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn-small btn-delete" onclick="deleteApplication('${app._id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Display pagination
    displayApplicationsPagination(type, totalPages);
}

// Display pagination for applications
function displayApplicationsPagination(type, totalPages) {
    const paginationContainer = document.getElementById(`${type}Pagination`);
    if (!paginationContainer) return;
    
    const currentPage = type === 'ausbildung' ? ausbildungCurrentPage : arbeitCurrentPage;
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="services-pagination" style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 20px; padding: 15px;">';
    
    // Previous button
    paginationHTML += `
        <button onclick="goToApplicationsPage('${type}', ${currentPage - 1})" 
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
            <button onclick="goToApplicationsPage('${type}', 1)" 
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
            <button onclick="goToApplicationsPage('${type}', ${i})" 
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
            <button onclick="goToApplicationsPage('${type}', ${totalPages})" 
                    style="min-width: 40px; height: 40px; border: 1px solid #e5e7eb; background: white; border-radius: 8px; cursor: pointer; color: #374151; font-weight: 500;">
                ${totalPages}
            </button>
        `;
    }
    
    // Next button
    paginationHTML += `
        <button onclick="goToApplicationsPage('${type}', ${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''} 
                style="display: flex; align-items: center; gap: 5px; padding: 8px 16px; border: 1px solid #e5e7eb; background: white; border-radius: 8px; cursor: ${currentPage === totalPages ? 'not-allowed' : 'pointer'}; color: ${currentPage === totalPages ? '#9ca3af' : '#374151'}; font-weight: 500; transition: all 0.2s;">
            Next <i class="fas fa-chevron-right" style="font-size: 12px;"></i>
        </button>
    `;
    
    paginationHTML += '</div>';
    paginationContainer.innerHTML = paginationHTML;
}

// Go to specific page for applications
function goToApplicationsPage(type, page) {
    const applications = type === 'ausbildung' ? allAusbildungApplications : allArbeitApplications;
    const totalPages = Math.ceil(applications.length / APPLICATIONS_PER_PAGE);
    
    if (page < 1 || page > totalPages) return;
    
    if (type === 'ausbildung') {
        ausbildungCurrentPage = page;
    } else {
        arbeitCurrentPage = page;
    }
    
    displayApplications(type);
}

// Get diploma badge HTML
function getDiplomaBadge(app) {
    if (app.hasDiploma === null || app.hasDiploma === undefined) {
        return '<span class="diploma-badge not-reviewed"><i class="fas fa-question"></i> Not Reviewed</span>';
    } else if (app.hasDiploma === true || app.diplomaType === 'diploma') {
        return '<span class="diploma-badge has-diploma"><i class="fas fa-graduation-cap"></i> Diploma</span>';
    } else if (app.diplomaType === 'certificate') {
        return '<span class="diploma-badge certificate"><i class="fas fa-certificate"></i> Certificate</span>';
    } else {
        return '<span class="diploma-badge none"><i class="fas fa-times"></i> None</span>';
    }
}

// Get status badge HTML
function getStatusBadge(status) {
    const label = STATUS_LABELS[status] || status;
    const color = STATUS_COLORS[status] || '#6b7280';
    return `<span class="status-badge-app" style="background: ${color}20; color: ${color}; border: 1px solid ${color}40;">${label}</span>`;
}

// Load application statistics
async function loadApplicationStats() {
    try {
        const response = await fetch('/api/job-applications/stats/both', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update Ausbildung counts
            document.getElementById('ausbildungTotalCount').textContent = data.ausbildung.total;
            document.getElementById('ausbildungPflegeCount').textContent = data.ausbildung.byField.pflege || 0;
            document.getElementById('ausbildungVerkauferCount').textContent = data.ausbildung.byField.verkaufer || 0;
            document.getElementById('ausbildungGastronomieCount').textContent = data.ausbildung.byField.gastronomie || 0;
            document.getElementById('ausbildungFleischerCount').textContent = data.ausbildung.byField.fleischer || 0;
            document.getElementById('ausbildungMaurerCount').textContent = data.ausbildung.byField.maurer || 0;
            document.getElementById('ausbildungOtherCount').textContent = data.ausbildung.byField.other || 0;
            
            // Update Arbeit counts
            document.getElementById('arbeitTotalCount').textContent = data.arbeit.total;
            document.getElementById('arbeitPflegeCount').textContent = data.arbeit.byField.pflege || 0;
            document.getElementById('arbeitVerkauferCount').textContent = data.arbeit.byField.verkaufer || 0;
            document.getElementById('arbeitGastronomieCount').textContent = data.arbeit.byField.gastronomie || 0;
            document.getElementById('arbeitFleischerCount').textContent = data.arbeit.byField.fleischer || 0;
            document.getElementById('arbeitMaurerCount').textContent = data.arbeit.byField.maurer || 0;
            document.getElementById('arbeitOtherCount').textContent = data.arbeit.byField.other || 0;
            
            // Update Pending Review count
            document.getElementById('pendingReviewCount').textContent = data.pendingReview || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Debounce search
function debounceSearch(type) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadJobApplications(type);
    }, 300);
}

// Open add application modal
function openAddApplicationModal(type) {
    currentApplicationId = null;
    document.getElementById('applicationId').value = '';
    document.getElementById('applicationTypeInput').value = type;
    document.getElementById('applicationModalTitle').textContent = 
        type === 'ausbildung' ? 'Add Ausbildung Application' : 'Add Arbeit Application';
    
    // Reset form
    document.getElementById('applicationForm').reset();
    document.getElementById('customFieldGroup').style.display = 'none';
    document.getElementById('diplomaDetailsGroup').style.display = 'none';
    
    // Reset CV upload area
    const cvUploadContent = document.querySelector('.cv-upload-content');
    const cvFilePreview = document.getElementById('cvFilePreview');
    if (cvUploadContent) cvUploadContent.style.display = 'flex';
    if (cvFilePreview) cvFilePreview.style.display = 'none';
    
    document.getElementById('jobApplicationModal').classList.add('active');
}

// Close application modal
function closeApplicationModal() {
    document.getElementById('jobApplicationModal').classList.remove('active');
    currentApplicationId = null;
}

// Toggle custom field visibility
function toggleCustomField() {
    const field = document.getElementById('appJobField').value;
    document.getElementById('customFieldGroup').style.display = field === 'other' ? 'block' : 'none';
}

// Toggle diploma details visibility
function toggleDiplomaDetails() {
    const type = document.getElementById('appDiplomaType').value;
    document.getElementById('diplomaDetailsGroup').style.display = 
        (type === 'diploma' || type === 'certificate') ? 'block' : 'none';
}

// Handle CV file selection
function handleCVFileSelect(input) {
    const file = input.files[0];
    if (!file) return;
    processSelectedCVFile(file);
}

// Process selected CV file (used by both click and drag-drop)
function processSelectedCVFile(file) {
    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showNotification('File size exceeds 5MB limit', 'error');
        return false;
    }
    
    // Check file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('Only PDF, DOC, and DOCX files are allowed', 'error');
        return false;
    }
    
    // Show file preview
    document.getElementById('cvFileName').textContent = file.name;
    document.getElementById('cvFileSize').textContent = formatFileSize(file.size);
    document.querySelector('.cv-upload-content').style.display = 'none';
    document.getElementById('cvFilePreview').style.display = 'flex';
    
    // Update icon based on file type
    const iconEl = document.querySelector('.cv-file-icon');
    if (file.type === 'application/pdf') {
        iconEl.className = 'fas fa-file-pdf cv-file-icon';
        iconEl.style.color = '#ef4444';
    } else {
        iconEl.className = 'fas fa-file-word cv-file-icon';
        iconEl.style.color = '#3b82f6';
    }
    
    return true;
}

// Initialize drag and drop for CV upload
function initCVDragDrop() {
    const uploadArea = document.getElementById('cvUploadArea');
    if (!uploadArea) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('drag-over');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('drag-over');
        }, false);
    });
    
    uploadArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const file = files[0];
            if (processSelectedCVFile(file)) {
                // Create a DataTransfer to set the file input
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                document.getElementById('appDocument').files = dataTransfer.files;
            }
        }
    }, false);
}

// Remove selected CV file
function removeCVFile() {
    document.getElementById('appDocument').value = '';
    document.querySelector('.cv-upload-content').style.display = 'flex';
    document.getElementById('cvFilePreview').style.display = 'none';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Save application
async function saveApplication(event) {
    event.preventDefault();
    
    const applicationId = document.getElementById('applicationId').value;
    const applicationType = document.getElementById('applicationTypeInput').value;
    const fileInput = document.getElementById('appDocument');
    const hasFile = fileInput && fileInput.files && fileInput.files.length > 0;
    
    // Show loading state
    const saveBtn = document.getElementById('saveApplicationBtn');
    const originalBtnText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    try {
        let response;
        
        if (applicationId) {
            // Update existing application (JSON)
            const applicationData = {
                fullName: document.getElementById('appFullName').value,
                phone: document.getElementById('appPhone').value,
                email: document.getElementById('appEmail').value,
                applicationType: applicationType,
                jobField: document.getElementById('appJobField').value,
                customJobField: document.getElementById('appCustomField').value,
                languageLevel: document.getElementById('appLanguageLevel').value || null,
                status: document.getElementById('appStatus').value,
                experience: document.getElementById('appExperience').value,
                qualifications: document.getElementById('appQualifications').value,
                notes: document.getElementById('appNotes').value
            };
            
            // Handle diploma
            const diplomaType = document.getElementById('appDiplomaType').value;
            if (diplomaType) {
                applicationData.hasDiploma = diplomaType === 'diploma';
                applicationData.diplomaType = diplomaType;
                applicationData.diplomaDetails = document.getElementById('appDiplomaDetails').value;
            }
            
            response = await fetch(`/api/job-applications/${applicationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(applicationData)
            });
        } else {
            // Create new application (FormData for file upload)
            const formData = new FormData();
            formData.append('fullName', document.getElementById('appFullName').value);
            formData.append('phone', document.getElementById('appPhone').value);
            formData.append('email', document.getElementById('appEmail').value);
            formData.append('applicationType', applicationType);
            formData.append('jobField', document.getElementById('appJobField').value);
            formData.append('customJobField', document.getElementById('appCustomField').value || '');
            formData.append('languageLevel', document.getElementById('appLanguageLevel').value || '');
            formData.append('status', document.getElementById('appStatus').value);
            formData.append('experience', document.getElementById('appExperience').value || '');
            formData.append('qualifications', document.getElementById('appQualifications').value || '');
            formData.append('notes', document.getElementById('appNotes').value || '');
            
            // Handle diploma
            const diplomaType = document.getElementById('appDiplomaType').value;
            if (diplomaType) {
                formData.append('hasDiploma', diplomaType === 'diploma');
                formData.append('diplomaType', diplomaType);
                formData.append('diplomaDetails', document.getElementById('appDiplomaDetails').value || '');
            }
            
            // Add file if selected
            if (hasFile) {
                formData.append('document', fileInput.files[0]);
            }
            
            response = await fetch('/api/job-applications/admin/create', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: formData
            });
        }
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(applicationId ? 'Application updated successfully' : 'Application created successfully', 'success');
            closeApplicationModal();
            loadJobApplications(applicationType);
        } else {
            showNotification(data.message || 'Failed to save application', 'error');
        }
    } catch (error) {
        console.error('Error saving application:', error);
        showNotification('Failed to save application', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalBtnText;
    }
}

// View application details
async function viewApplication(id) {
    currentApplicationId = id;
    
    try {
        const response = await fetch(`/api/job-applications/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const app = data.application;
            
            // Fill basic details
            document.getElementById('detailName').textContent = app.fullName;
            document.getElementById('detailPhone').innerHTML = `<a href="tel:${app.phone}">${app.phone}</a>`;
            document.getElementById('detailEmail').innerHTML = `<a href="mailto:${app.email}">${app.email}</a>`;
            document.getElementById('detailField').textContent = app.jobField === 'other' && app.customJobField 
                ? app.customJobField 
                : FIELD_LABELS[app.jobField] || app.jobField;
            document.getElementById('detailLanguage').textContent = app.languageLevel || 'Not specified';
            document.getElementById('detailDiploma').innerHTML = getDiplomaBadge(app);
            
            // Fill additional details (Experience, Qualifications, Notes)
            document.getElementById('detailExperience').textContent = app.experience || 'Not provided';
            document.getElementById('detailQualifications').textContent = app.qualifications || 'Not provided';
            document.getElementById('detailNotes').textContent = app.notes || 'No notes';
            
            // Show/hide additional details section based on content
            const hasAdditionalInfo = app.experience || app.qualifications || app.notes;
            const additionalSection = document.getElementById('additionalDetailsSection');
            if (additionalSection) {
                additionalSection.style.display = hasAdditionalInfo ? 'block' : 'none';
            }
            
            // Fill documents section
            displayApplicationDocuments(app.documents, id);
            
            // Update status select
            document.getElementById('detailStatusSelect').value = app.status;
            
            // Update pipeline visualization
            updatePipelineVisualization(app.status);
            
            // Fill status history
            displayStatusHistory(app.statusHistory);
            
            // Show modal
            document.getElementById('applicationDetailsModal').classList.add('active');
        } else {
            showNotification(data.message || 'Failed to load application', 'error');
        }
    } catch (error) {
        console.error('Error loading application:', error);
        showNotification('Failed to load application', 'error');
    }
}

// Display application documents
function displayApplicationDocuments(documents, applicationId) {
    const container = document.getElementById('detailDocuments');
    if (!container) return;
    
    if (!documents || documents.length === 0) {
        container.innerHTML = `
            <div class="no-documents">
                <i class="fas fa-folder-open"></i>
                <span>No documents uploaded</span>
            </div>
        `;
        return;
    }
    
    container.innerHTML = documents.map(doc => {
        const fileIcon = doc.fileName?.endsWith('.pdf') ? 'fa-file-pdf' : 
                        (doc.fileName?.endsWith('.doc') || doc.fileName?.endsWith('.docx')) ? 'fa-file-word' : 'fa-file';
        const iconColor = doc.fileName?.endsWith('.pdf') ? '#ef4444' : '#3b82f6';
        const fileSize = doc.fileSize ? formatFileSize(doc.fileSize) : '';
        const uploadDate = doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '';
        
        return `
            <div class="document-item">
                <div class="document-info">
                    <i class="fas ${fileIcon}" style="color: ${iconColor}; font-size: 24px;"></i>
                    <div class="document-details">
                        <span class="document-name">${escapeHtml(doc.fileName || 'Document')}</span>
                        <span class="document-meta">${fileSize}${fileSize && uploadDate ? ' • ' : ''}${uploadDate}</span>
                    </div>
                </div>
                <button class="action-btn btn-info btn-sm" onclick="downloadApplicationDocument('${applicationId}')" title="Download">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        `;
    }).join('');
}

// Update pipeline visualization
function updatePipelineVisualization(currentStatus) {
    const statusOrder = ['new', 'erstgespraech', 'vorvertrag', 'interview', 'vertrag', 'botschaft', 'visum'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    
    document.querySelectorAll('.pipeline-step').forEach((step, index) => {
        const stepStatus = step.dataset.status;
        const stepIndex = statusOrder.indexOf(stepStatus);
        
        step.classList.remove('completed', 'current', 'pending');
        
        if (currentStatus === 'completed') {
            step.classList.add('completed');
        } else if (currentStatus === 'cancelled') {
            step.classList.add('pending');
        } else if (stepIndex < currentIndex) {
            step.classList.add('completed');
        } else if (stepIndex === currentIndex) {
            step.classList.add('current');
        } else {
            step.classList.add('pending');
        }
    });
    
    // Update connectors
    document.querySelectorAll('.pipeline-connector').forEach((connector, index) => {
        connector.classList.remove('completed');
        if (index < currentIndex && currentStatus !== 'cancelled') {
            connector.classList.add('completed');
        }
    });
}

// Display status history
function displayStatusHistory(history) {
    const container = document.getElementById('statusHistory');
    
    if (!history || history.length === 0) {
        container.innerHTML = '<p style="color: #64748b; text-align: center;">No history available</p>';
        return;
    }
    
    container.innerHTML = history.slice().reverse().map(item => `
        <div class="history-item">
            <div class="history-status" style="background: ${STATUS_COLORS[item.status] || '#6b7280'}20; color: ${STATUS_COLORS[item.status] || '#6b7280'};">
                ${STATUS_LABELS[item.status] || item.status}
            </div>
            <div class="history-info">
                <span class="history-date">${new Date(item.changedAt).toLocaleString()}</span>
                ${item.changedByName ? `<span class="history-by">by ${item.changedByName}</span>` : ''}
                ${item.notes ? `<span class="history-notes">${escapeHtml(item.notes)}</span>` : ''}
            </div>
        </div>
    `).join('');
}

// Close application details modal
function closeApplicationDetailsModal() {
    document.getElementById('applicationDetailsModal').classList.remove('active');
    currentApplicationId = null;
}

// Update application status
async function updateApplicationStatus() {
    if (!currentApplicationId) return;
    
    const newStatus = document.getElementById('detailStatusSelect').value;
    
    try {
        const response = await fetch(`/api/job-applications/${currentApplicationId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Status updated successfully', 'success');
            updatePipelineVisualization(newStatus);
            displayStatusHistory(data.application.statusHistory);
            loadJobApplications(currentApplicationType);
        } else {
            showNotification(data.message || 'Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showNotification('Failed to update status', 'error');
    }
}

// Edit application
async function editApplication(id) {
    try {
        const response = await fetch(`/api/job-applications/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const app = data.application;
            
            currentApplicationId = id;
            document.getElementById('applicationId').value = id;
            document.getElementById('applicationTypeInput').value = app.applicationType;
            document.getElementById('applicationModalTitle').textContent = 'Edit Application';
            
            // Fill form
            document.getElementById('appFullName').value = app.fullName;
            document.getElementById('appPhone').value = app.phone;
            document.getElementById('appEmail').value = app.email;
            document.getElementById('appJobField').value = app.jobField;
            document.getElementById('appCustomField').value = app.customJobField || '';
            document.getElementById('appLanguageLevel').value = app.languageLevel || '';
            document.getElementById('appStatus').value = app.status;
            document.getElementById('appExperience').value = app.experience || '';
            document.getElementById('appQualifications').value = app.qualifications || '';
            document.getElementById('appNotes').value = app.notes || '';
            document.getElementById('appDiplomaType').value = app.diplomaType || '';
            document.getElementById('appDiplomaDetails').value = app.diplomaDetails || '';
            
            // Toggle visibility
            toggleCustomField();
            toggleDiplomaDetails();
            
            document.getElementById('jobApplicationModal').classList.add('active');
        } else {
            showNotification(data.message || 'Failed to load application', 'error');
        }
    } catch (error) {
        console.error('Error loading application:', error);
        showNotification('Failed to load application', 'error');
    }
}

// Edit current application from details modal
function editCurrentApplication() {
    if (currentApplicationId) {
        closeApplicationDetailsModal();
        editApplication(currentApplicationId);
    }
}

// Delete application
async function deleteApplication(id) {
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/job-applications/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Application deleted successfully', 'success');
            loadJobApplications(currentApplicationType);
        } else {
            showNotification(data.message || 'Failed to delete application', 'error');
        }
    } catch (error) {
        console.error('Error deleting application:', error);
        showNotification('Failed to delete application', 'error');
    }
}

// Delete current application from details modal
function deleteCurrentApplication() {
    if (currentApplicationId) {
        closeApplicationDetailsModal();
        deleteApplication(currentApplicationId);
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load applications when services tab is activated
function onServicesTabActivated() {
    loadJobApplications('ausbildung');
    loadApplicationStats();
}
