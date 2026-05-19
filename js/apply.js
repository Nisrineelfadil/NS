// Applying Service JavaScript
const API_BASE_URL = window.location.origin;

// Instagram Follow Flow
let followClicked = false;
let confirmationAllowed = false;

const followBtn = document.getElementById('followBtn');
const confirmBtn = document.getElementById('confirmBtn');
const submitBtn = document.getElementById('submitBtn');

// When user clicks "Follow on Instagram"
if (followBtn) {
    followBtn.addEventListener('click', function() {
        if (!followClicked) {
            followClicked = true;
            
            // Add delay before enabling confirmation button (2.5 seconds)
            setTimeout(function() {
                confirmationAllowed = true;
                confirmBtn.disabled = false;
                confirmBtn.classList.add('enabled');
                confirmBtn.style.animation = 'pulseGlow 2s ease-in-out infinite';
            }, 2500);
        }
    });
}

// When user clicks "I followed"
if (confirmBtn) {
    confirmBtn.addEventListener('click', function() {
        if (confirmationAllowed && !confirmBtn.classList.contains('confirmed')) {
            // Mark as confirmed
            confirmBtn.classList.remove('enabled');
            confirmBtn.classList.add('confirmed');
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fas fa-heart"></i> Thank you! ❤️';
            confirmBtn.style.animation = 'none';
            
            // Unlock submit button
            submitBtn.disabled = false;
            submitBtn.classList.remove('locked');
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Application Request';
            
            // Add success animation
            submitBtn.style.animation = 'pulseGlow 1.5s ease-in-out 3';
            setTimeout(function() {
                submitBtn.style.animation = 'none';
            }, 4500);
        }
    });
}

// Check if Applying service is open
async function checkServiceStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/service-status`);
        const data = await response.json();

        if (data.success) {
            const isOpen = data.settings.isApplyingServiceOpen === true;
            
            console.log('Applying Service Status:', {
                isApplyingServiceOpen: data.settings.isApplyingServiceOpen,
                isOpen: isOpen
            });

            if (!isOpen) {
                // Show closed message
                document.getElementById('serviceForm').style.display = 'none';
                document.getElementById('closedMessage').classList.add('active');

                // Update contact info
                if (data.settings.contactPhone) {
                    document.getElementById('contactPhone').textContent = data.settings.contactPhone;
                    document.getElementById('contactPhoneLink').href = 'tel:' + data.settings.contactPhone.replace(/\s/g, '');
                }
            } else {
                // Show form
                document.getElementById('serviceForm').style.display = 'block';
                document.getElementById('closedMessage').classList.remove('active');
            }
        }
    } catch (error) {
        console.error('Error checking service status:', error);
    }
}

// Handle form submission
document.getElementById('applyForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('.submit-btn');
    const messageEl = document.getElementById('formMessage');
    const formData = new FormData(e.target);

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    messageEl.className = 'form-message';
    messageEl.textContent = '';

    try {
        // Check file size before uploading (5MB limit)
        const fileInput = document.getElementById('file');
        if (fileInput.files.length > 0) {
            const fileSize = fileInput.files[0].size;
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (fileSize > maxSize) {
                throw new Error('FILE_TOO_LARGE');
            }
        }

        // Create FormData for file upload to new job applications API
        const uploadFormData = new FormData();
        uploadFormData.append('fullName', formData.get('fullName'));
        uploadFormData.append('phone', formData.get('phone'));
        uploadFormData.append('email', formData.get('email'));
        uploadFormData.append('requestedJobType', formData.get('jobType') || 'Not specified');
        uploadFormData.append('notes', formData.get('notes') || '');

        // Add file if exists
        if (fileInput.files.length > 0) {
            uploadFormData.append('document', fileInput.files[0]);
        }

        // Get reCAPTCHA v3 token
        if (typeof grecaptcha !== 'undefined' && window.RECAPTCHA_SITE_KEY) {
            try {
                const captchaToken = await grecaptcha.execute(window.RECAPTCHA_SITE_KEY, { action: 'job_application' });
                uploadFormData.append('captchaToken', captchaToken);
            } catch (_) {}
        }

        // Submit to new job applications public endpoint
        const response = await fetch(`${API_BASE_URL}/api/job-applications/public`, {
            method: 'POST',
            body: uploadFormData
        });

        // Try to parse JSON response
        let result;
        try {
            result = await response.json();
        } catch (parseError) {
            // If JSON parsing fails, check status code
            if (response.status === 413 || response.status === 400) {
                throw new Error('FILE_TOO_LARGE');
            }
            throw new Error('Server error. Please try again.');
        }

        if (result.success) {
            // Show success message
            messageEl.className = 'form-message success show';
            messageEl.innerHTML = '<i class="fas fa-check-circle"></i> Application submitted successfully! Our team will review it and contact you soon.';

            // Reset form after delay
            setTimeout(() => {
                e.target.reset();
                messageEl.className = 'form-message';
                window.location.href = '/';
            }, 3000);
        } else {
            // Show specific error message from server
            let errorMessage = result.message || 'Submission failed';
            
            // Check for file too large error
            if (result.errorType === 'FILE_TOO_LARGE') {
                throw new Error('FILE_TOO_LARGE');
            } else if (result.errorType === 'UPLOAD_ERROR') {
                errorMessage = result.message || 'File upload failed. Please try again with a different file.';
            }
            
            throw new Error(errorMessage);
        }

    } catch (error) {
        console.error('Submission error:', error);
        messageEl.className = 'form-message error show';
        
        // Check for file too large error
        let displayMessage = error.message || 'Something went wrong. Please try again.';
        if (error.message === 'FILE_TOO_LARGE') {
            displayMessage = 'The file you uploaded is too large. Maximum file size is 5MB. Please upload a smaller file.';
        }
        
        messageEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${displayMessage}`;
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Application Request';
    }
});

// Check status on page load
checkServiceStatus();
