// Ratings functionality for Nisrine School website
(function() {
    'use strict';

    const API_BASE_URL = window.location.origin;

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initRatingForm();
        loadApprovedRatings();
        initStarRating();
    });

    // Initialize star rating interaction
    function initStarRating() {
        const stars = document.querySelectorAll('.star-rating .star');
        const starInputs = document.querySelectorAll('.star-rating input[type="radio"]');

        stars.forEach((star, index) => {
            star.addEventListener('click', function() {
                const input = this.previousElementSibling;
                if (input && input.type === 'radio') {
                    input.checked = true;
                    updateStarDisplay();
                }
            });

            star.addEventListener('mouseenter', function() {
                highlightStars(index + 1);
            });
        });

        const starRatingContainer = document.querySelector('.star-rating');
        if (starRatingContainer) {
            starRatingContainer.addEventListener('mouseleave', updateStarDisplay);
        }

        starInputs.forEach(input => {
            input.addEventListener('change', updateStarDisplay);
        });
    }

    function highlightStars(count) {
        const stars = document.querySelectorAll('.star-rating .star i');
        stars.forEach((starIcon, index) => {
            if (index < count) {
                starIcon.classList.remove('far');
                starIcon.classList.add('fas');
                starIcon.parentElement.classList.add('active');
            } else {
                starIcon.classList.remove('fas');
                starIcon.classList.add('far');
                starIcon.parentElement.classList.remove('active');
            }
        });
    }

    function updateStarDisplay() {
        const checkedInput = document.querySelector('.star-rating input[type="radio"]:checked');
        if (checkedInput) {
            const value = parseInt(checkedInput.value);
            highlightStars(value);
        } else {
            highlightStars(0);
        }
    }

    // Initialize rating form submission
    function initRatingForm() {
        const form = document.getElementById('ratingForm');
        if (!form) return;

        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = {
                name: document.getElementById('ratingName').value.trim(),
                stars: document.querySelector('.star-rating input[type="radio"]:checked')?.value,
                comment: document.getElementById('ratingComment').value.trim()
            };

            // Validation
            if (!formData.name || !formData.stars || !formData.comment) {
                showError('Please fill in all required fields');
                return;
            }

            if (formData.comment.length < 10) {
                showError('Please provide a comment with at least 10 characters');
                return;
            }

            // Disable submit button
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

            try {
                // Get reCAPTCHA v3 token
                if (typeof grecaptcha !== 'undefined' && window.RECAPTCHA_SITE_KEY) {
                    try {
                        formData.captchaToken = await grecaptcha.execute(window.RECAPTCHA_SITE_KEY, { action: 'rating' });
                    } catch (_) {}
                }

                const response = await fetch(`${API_BASE_URL}/api/ratings/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showSuccess(data.message || 'Thank you for your feedback!');
                    form.reset();
                    updateStarDisplay();
                } else {
                    showError(data.message || 'Failed to submit rating. Please try again.');
                }
            } catch (error) {
                console.error('Error submitting rating:', error);
                showError('Network error. Please check your connection and try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // Load and display approved ratings
    async function loadApprovedRatings() {
        const grid = document.getElementById('approvedRatingsGrid');
        if (!grid) return;

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);
            const response = await fetch(`${API_BASE_URL}/api/ratings/approved`, { signal: controller.signal });
            clearTimeout(timeout);
            const data = await response.json();

            if (response.ok && data.success && data.ratings.length > 0) {
                displayRatings(data.ratings);
            } else {
                grid.innerHTML = `
                    <div class="no-ratings">
                        <i class="fas fa-star"></i>
                        <p>No reviews yet. Be the first to share your experience!</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading ratings:', error);
            grid.innerHTML = `
                <div class="error-loading-ratings">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load reviews. Please try again later.</p>
                </div>
            `;
        }
    }

    // Display ratings in infinite scrolling carousel
    function displayRatings(ratings) {
        const grid = document.getElementById('approvedRatingsGrid');
        if (!grid) return;

        // Split ratings into two rows for alternating scroll directions
        const midPoint = Math.ceil(ratings.length / 2);
        const row1Ratings = ratings.slice(0, midPoint);
        const row2Ratings = ratings.slice(midPoint);

        // Create rating card HTML
        const createCard = (rating) => `
            <div class="rating-card">
                <div class="rating-card-header">
                    <div class="rating-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="rating-info">
                        <h4 class="rating-name">${escapeHtml(rating.name)}</h4>
                        <div class="rating-stars">
                            ${generateStars(rating.stars)}
                        </div>
                    </div>
                </div>
                <div class="rating-card-body">
                    <p class="rating-comment">${escapeHtml(rating.comment)}</p>
                </div>
                <div class="rating-card-footer">
                    <span class="rating-date">
                        <i class="fas fa-calendar-alt"></i>
                        ${formatDate(rating.submittedAt)}
                    </span>
                </div>
            </div>
        `;

        // Create carousel rows with duplicated content for seamless loop
        const row1Content = row1Ratings.map(createCard).join('');
        const row2Content = row2Ratings.map(createCard).join('');

        grid.innerHTML = `
            <div class="carousel-row scroll-left">
                <div class="carousel-track">
                    ${row1Content}
                    ${row1Content}
                    ${row1Content}
                </div>
            </div>
            <div class="carousel-row scroll-right">
                <div class="carousel-track">
                    ${row2Content}
                    ${row2Content}
                    ${row2Content}
                </div>
            </div>
        `;

        // Pause animation on hover
        const carouselRows = grid.querySelectorAll('.carousel-row');
        carouselRows.forEach(row => {
            row.addEventListener('mouseenter', () => {
                row.style.animationPlayState = 'paused';
            });
            row.addEventListener('mouseleave', () => {
                row.style.animationPlayState = 'running';
            });
        });
    }

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
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Show success message
    function showSuccess(message) {
        const successDiv = document.getElementById('ratingSuccess');
        const errorDiv = document.getElementById('ratingError');
        
        if (errorDiv) errorDiv.style.display = 'none';
        
        if (successDiv) {
            const messageSpan = successDiv.querySelector('span');
            if (messageSpan) {
                messageSpan.textContent = message;
            }
            successDiv.style.display = 'flex';
            
            // Scroll to message
            successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            // Hide after 5 seconds
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 5000);
        }
    }

    // Show error message
    function showError(message) {
        const errorDiv = document.getElementById('ratingError');
        const successDiv = document.getElementById('ratingSuccess');
        
        if (successDiv) successDiv.style.display = 'none';
        
        if (errorDiv) {
            const messageSpan = document.getElementById('ratingErrorText');
            if (messageSpan) {
                messageSpan.textContent = message;
            }
            errorDiv.style.display = 'flex';
            
            // Scroll to message
            errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            // Hide after 5 seconds
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    // Make loadApprovedRatings available globally for admin panel refresh
    window.refreshApprovedRatings = loadApprovedRatings;

})();
