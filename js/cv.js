// CV Service JavaScript
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
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit CV Request';
            
            // Add success animation
            submitBtn.style.animation = 'pulseGlow 1.5s ease-in-out 3';
            setTimeout(function() {
                submitBtn.style.animation = 'none';
            }, 4500);
        }
    });
}

// Check if CV service is open
async function checkServiceStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/service-status`);
        const data = await response.json();

        if (data.success) {
            const isOpen = data.settings.isCvServiceOpen === true;
            
            console.log('CV Service Status:', {
                isCvServiceOpen: data.settings.isCvServiceOpen,
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
document.getElementById('cvForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('.submit-btn');
    const messageEl = document.getElementById('formMessage');
    const formData = new FormData(e.target);

    // Build request data
    const data = {
        serviceType: 'cv',
        fullName: formData.get('fullName'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        cvDetails: {
            experience: formData.get('experience') || '',
            education: formData.get('education') || '',
            field: formData.get('field') || '',
            notes: formData.get('notes') || ''
        }
    };

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    messageEl.className = 'form-message';
    messageEl.textContent = '';

    try {
        // Create FormData for file upload
        const uploadFormData = new FormData();
        uploadFormData.append('serviceType', data.serviceType);
        uploadFormData.append('fullName', data.fullName);
        uploadFormData.append('phone', data.phone);
        uploadFormData.append('email', data.email);
        uploadFormData.append('cvDetails', JSON.stringify(data.cvDetails));

        // Add file if exists
        const fileInput = document.getElementById('file');
        if (fileInput.files.length > 0) {
            uploadFormData.append('file', fileInput.files[0]);
        }

        const response = await fetch(`${API_BASE_URL}/api/services/upload`, {
            method: 'POST',
            body: uploadFormData
        });

        const result = await response.json();

        if (result.success) {
            // Show success message
            messageEl.className = 'form-message success show';
            messageEl.innerHTML = '<i class="fas fa-check-circle"></i> CV request submitted successfully! We will contact you soon.';

            // Reset form after delay
            setTimeout(() => {
                e.target.reset();
                messageEl.className = 'form-message';
                window.location.href = '/';
            }, 3000);
        } else {
            throw new Error(result.message || 'Submission failed');
        }

    } catch (error) {
        console.error('Submission error:', error);
        messageEl.className = 'form-message error show';
        messageEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Something went wrong. Please try again.';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit CV Request';
    }
});

// Check status on page load
checkServiceStatus();
