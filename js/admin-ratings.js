// Admin Ratings Management with Smooth Animations
(function() {
    'use strict';

    const API_BASE_URL = window.location.origin;
    let authToken = localStorage.getItem('adminToken');
    
    // Translation helper function
    function t(key) {
        const lang = localStorage.getItem('adminLanguage') || 'de';
        const translations = {
            de: {
                accept: 'Akzeptieren',
                reject: 'Ablehnen',
                approved: 'Genehmigt',
                delete: 'Löschen'
            },
            en: {
                accept: 'Accept',
                reject: 'Reject',
                approved: 'Approved',
                delete: 'Delete'
            },
            fr: {
                accept: 'Accepter',
                reject: 'Rejeter',
                approved: 'Approuvé',
                delete: 'Supprimer'
            },
            ar: {
                accept: 'قبول',
                reject: 'رفض',
                approved: 'موافق عليه',
                delete: 'حذف'
            }
        };
        return translations[lang]?.[key] || translations['en'][key] || key;
    }
    
    // Pagination state
    const ITEMS_PER_PAGE = 6;
    let pendingPage = 1;
    let approvedPage = 1;
    let allPendingRatings = [];
    let allApprovedRatings = [];

    // Initialize when ratings tab is opened
    document.addEventListener('DOMContentLoaded', function() {
        // Check if we're on the ratings tab
        const ratingsMenuItem = document.querySelector('[data-tab="ratings"]');
        if (ratingsMenuItem) {
            ratingsMenuItem.addEventListener('click', function() {
                loadRatings();
            });
        }
        
        // Re-render ratings when language changes
        document.querySelectorAll('.language-option').forEach(option => {
            option.addEventListener('click', function() {
                // Re-render ratings if we have data loaded
                if (allPendingRatings.length > 0 || allApprovedRatings.length > 0) {
                    setTimeout(() => {
                        displayPendingRatings();
                        displayApprovedRatings();
                    }, 100);
                }
            });
        });
    });

    // Load all ratings
    window.loadRatings = async function() {
        try {
            showLoading();
            
            const response = await fetch(`${API_BASE_URL}/api/ratings/admin/all`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch ratings');
            }

            const data = await response.json();
            
            if (data.success) {
                updateStats(data.stats);
                allPendingRatings = data.ratings.filter(r => r.status === 'pending');
                allApprovedRatings = data.ratings.filter(r => r.status === 'approved');
                
                // Reset to page 1 when loading fresh data
                pendingPage = 1;
                approvedPage = 1;
                
                displayPendingRatings();
                displayApprovedRatings();
            }
        } catch (error) {
            console.error('Error loading ratings:', error);
            showError('Failed to load ratings. Please try again.');
        } finally {
            hideLoading();
        }
    };

    // Update statistics
    function updateStats(stats) {
        document.getElementById('pendingRatings').textContent = stats.pending || 0;
        document.getElementById('approvedRatings').textContent = stats.approved || 0;
        document.getElementById('averageRating').textContent = stats.averageRating || '0.0';
        document.getElementById('totalRatings').textContent = stats.total || 0;
    }

    // Display pending ratings with pagination
    function displayPendingRatings(slideDirection = null) {
        const container = document.getElementById('pendingRatingsContainer');
        const noDataDiv = document.getElementById('noPendingRatings');

        if (allPendingRatings.length === 0) {
            container.style.display = 'none';
            noDataDiv.style.display = 'flex';
            return;
        }

        noDataDiv.style.display = 'none';
        container.style.display = 'block';
        
        // Calculate pagination
        const totalPages = Math.ceil(allPendingRatings.length / ITEMS_PER_PAGE);
        const startIndex = (pendingPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageRatings = allPendingRatings.slice(startIndex, endIndex);
        
        // Display ratings grid
        const gridHtml = `
            <div class="ratings-container ${slideDirection ? 'slide-' + slideDirection : ''}">
                ${pageRatings.map(rating => createRatingCard(rating, true)).join('')}
            </div>
        `;
        
        // Display pagination controls
        const paginationHtml = totalPages > 1 ? createPaginationControls(pendingPage, totalPages, 'pending') : '';
        
        container.innerHTML = gridHtml + paginationHtml;
    }

    // Display approved ratings with pagination
    function displayApprovedRatings(slideDirection = null) {
        const container = document.getElementById('approvedRatingsContainer');
        const noDataDiv = document.getElementById('noApprovedRatings');

        if (allApprovedRatings.length === 0) {
            container.style.display = 'none';
            noDataDiv.style.display = 'flex';
            return;
        }

        noDataDiv.style.display = 'none';
        container.style.display = 'block';
        
        // Calculate pagination
        const totalPages = Math.ceil(allApprovedRatings.length / ITEMS_PER_PAGE);
        const startIndex = (approvedPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageRatings = allApprovedRatings.slice(startIndex, endIndex);
        
        // Display ratings grid
        const gridHtml = `
            <div class="ratings-container ${slideDirection ? 'slide-' + slideDirection : ''}">
                ${pageRatings.map(rating => createRatingCard(rating, false)).join('')}
            </div>
        `;
        
        // Display pagination controls
        const paginationHtml = totalPages > 1 ? createPaginationControls(approvedPage, totalPages, 'approved') : '';
        
        container.innerHTML = gridHtml + paginationHtml;
    }
    
    // Create pagination controls
    function createPaginationControls(currentPage, totalPages, type) {
        const startItem = ((currentPage - 1) * ITEMS_PER_PAGE) + 1;
        const endItem = Math.min(currentPage * ITEMS_PER_PAGE, type === 'pending' ? allPendingRatings.length : allApprovedRatings.length);
        const totalItems = type === 'pending' ? allPendingRatings.length : allApprovedRatings.length;
        
        // Generate page number buttons
        let pageButtons = '';
        for (let i = 1; i <= totalPages; i++) {
            pageButtons += `
                <button class="pagination-page-btn ${i === currentPage ? 'active' : ''}" 
                        onclick="changePage('${type}', ${i})">
                    ${i}
                </button>
            `;
        }
        
        return `
            <div class="pagination-controls">
                <div class="pagination-info">
                    Showing ${startItem}-${endItem} of ${totalItems}
                </div>
                <div class="pagination-buttons">
                    ${pageButtons}
                </div>
            </div>
        `;
    }
    
    // Change page with animation
    window.changePage = async function(type, newPage) {
        const container = type === 'pending' 
            ? document.getElementById('pendingRatingsContainer')
            : document.getElementById('approvedRatingsContainer');
        
        const currentPage = type === 'pending' ? pendingPage : approvedPage;
        const slideDirection = newPage > currentPage ? 'left' : 'right';
        
        // Add slide-out animation
        const ratingsContainer = container.querySelector('.ratings-container');
        if (ratingsContainer) {
            ratingsContainer.classList.add('slide-out-' + (slideDirection === 'left' ? 'left' : 'right'));
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Update page and display with slide-in animation
        if (type === 'pending') {
            pendingPage = newPage;
            displayPendingRatings(slideDirection === 'left' ? 'in-right' : 'in-left');
        } else {
            approvedPage = newPage;
            displayApprovedRatings(slideDirection === 'left' ? 'in-right' : 'in-left');
        }
        
        // Scroll to top of section
        const section = container.parentElement;
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Create rating card HTML
    function createRatingCard(rating, isPending) {
        const stars = generateStars(rating.stars);
        const date = formatDate(rating.submittedAt);
        
        return `
            <div class="admin-rating-card" id="rating-${rating._id}" data-rating-id="${rating._id}">
                <div class="rating-card-header">
                    <div class="rating-user-info">
                        <div class="rating-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div>
                            <h4>${escapeHtml(rating.name)}</h4>
                            <div class="rating-stars">${stars}</div>
                        </div>
                    </div>
                    <div class="rating-date">
                        <i class="fas fa-calendar-alt"></i>
                        ${date}
                    </div>
                </div>
                <div class="rating-card-body">
                    <p class="rating-comment">${escapeHtml(rating.comment)}</p>
                </div>
                <div class="rating-card-footer" style="display: flex; align-items: center; gap: 10px; justify-content: flex-start;">
                    ${isPending ? `
                        <button class="action-btn btn-success" onclick="approveRating('${rating._id}')">
                            <i class="fas fa-check"></i> ${t('accept')}
                        </button>
                        <button class="action-btn btn-danger" onclick="deleteRating('${rating._id}')">
                            <i class="fas fa-times"></i> ${t('reject')}
                        </button>
                    ` : `
                        <span class="status-badge status-approved" style="display: inline-flex; align-items: center;">
                            <i class="fas fa-check-circle"></i> ${t('approved')}
                        </span>
                        <button class="action-btn btn-danger btn-sm" onclick="deleteRating('${rating._id}')">
                            <i class="fas fa-trash"></i> ${t('delete')}
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    // Approve rating with smooth animation
    window.approveRating = async function(ratingId) {
        const card = document.getElementById(`rating-${ratingId}`);
        if (!card) return;

        try {
            // Disable buttons
            const buttons = card.querySelectorAll('button');
            buttons.forEach(btn => btn.disabled = true);

            const response = await fetch(`${API_BASE_URL}/api/ratings/admin/${ratingId}/approve`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to approve rating');
            }

            const data = await response.json();

            if (data.success) {
                // Add success animation class
                card.classList.add('rating-approved-animation');
                
                // Wait for animation to complete
                await new Promise(resolve => setTimeout(resolve, 600));
                
                // Slide out animation
                card.style.animation = 'slideOutRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
                
                // Wait for slide out to complete
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Reload ratings to update both sections
                await loadRatings();
                
                // Show success message
                showSuccessMessage('Rating approved successfully!');
                
                // Refresh website ratings if function exists
                if (typeof window.refreshApprovedRatings === 'function') {
                    window.refreshApprovedRatings();
                }
            }
        } catch (error) {
            console.error('Error approving rating:', error);
            showError('Failed to approve rating. Please try again.');
            // Re-enable buttons on error
            const buttons = card.querySelectorAll('button');
            buttons.forEach(btn => btn.disabled = false);
        }
    };

    // Delete rating with animation
    window.deleteRating = async function(ratingId) {
        if (!confirm('Are you sure you want to delete this rating? This action cannot be undone.')) {
            return;
        }

        const card = document.getElementById(`rating-${ratingId}`);
        if (!card) return;

        try {
            // Disable buttons
            const buttons = card.querySelectorAll('button');
            buttons.forEach(btn => btn.disabled = true);

            const response = await fetch(`${API_BASE_URL}/api/ratings/admin/${ratingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete rating');
            }

            const data = await response.json();

            if (data.success) {
                // Add delete animation
                card.style.animation = 'fadeOutScale 0.4s ease forwards';
                
                // Wait for animation to complete
                await new Promise(resolve => setTimeout(resolve, 400));
                
                // Remove card
                card.remove();
                
                // Reload ratings to update stats
                await loadRatings();
                
                showSuccessMessage('Rating deleted successfully!');
            }
        } catch (error) {
            console.error('Error deleting rating:', error);
            showError('Failed to delete rating. Please try again.');
            // Re-enable buttons on error
            const buttons = card.querySelectorAll('button');
            buttons.forEach(btn => btn.disabled = false);
        }
    };

    // Generate star icons
    function generateStars(count) {
        let stars = '';
        for (let i = 0; i < 5; i++) {
            if (i < count) {
                stars += '<i class="fas fa-star filled"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        return stars;
    }

    // Format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('en-US', options);
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Show loading state
    function showLoading() {
        document.getElementById('pendingRatingsLoading').style.display = 'block';
        document.getElementById('approvedRatingsLoading').style.display = 'block';
        document.getElementById('pendingRatingsContainer').style.display = 'none';
        document.getElementById('approvedRatingsContainer').style.display = 'none';
        document.getElementById('noPendingRatings').style.display = 'none';
        document.getElementById('noApprovedRatings').style.display = 'none';
    }

    // Hide loading state
    function hideLoading() {
        document.getElementById('pendingRatingsLoading').style.display = 'none';
        document.getElementById('approvedRatingsLoading').style.display = 'none';
    }

    // Show success message
    function showSuccessMessage(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification success';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Show error message
    function showError(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification error';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

})();
