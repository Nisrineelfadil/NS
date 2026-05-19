// CV Service JavaScript
const API_BASE_URL = window.location.origin;

// Multiple Document Upload Management
const MAX_DOCUMENTS = 25;
let currentSlotCount = 1;

function initDocumentUpload() {
    const addMoreBtn = document.getElementById('addMoreBtn');
    const slotsContainer = document.getElementById('documentUploadSlots');
    
    if (!addMoreBtn || !slotsContainer) return;
    
    // Add more button click handler
    addMoreBtn.addEventListener('click', () => {
        if (currentSlotCount >= MAX_DOCUMENTS) return;
        
        currentSlotCount++;
        addDocumentSlot(currentSlotCount);
        updateSlotCounter();
        
        if (currentSlotCount >= MAX_DOCUMENTS) {
            addMoreBtn.disabled = true;
        }
    });
    
    // Initialize first slot's file input handler
    const firstInput = slotsContainer.querySelector('.document-input');
    if (firstInput) {
        firstInput.addEventListener('change', handleFileChange);
    }
    
    updateSlotCounter();
}

function addDocumentSlot(slotNumber) {
    const slotsContainer = document.getElementById('documentUploadSlots');
    
    const slotDiv = document.createElement('div');
    slotDiv.className = 'document-slot';
    slotDiv.dataset.slot = slotNumber;
    
    slotDiv.innerHTML = `
        <div class="slot-header">
            <span class="slot-number">Document ${slotNumber}</span>
            <button type="button" class="remove-slot-btn" onclick="removeDocumentSlot(${slotNumber})">
                <i class="fas fa-times"></i> Remove
            </button>
        </div>
        <input type="file" name="documents[]" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" class="document-input">
    `;
    
    slotsContainer.appendChild(slotDiv);
    
    // Add file change handler
    const input = slotDiv.querySelector('.document-input');
    input.addEventListener('change', handleFileChange);
}

function removeDocumentSlot(slotNumber) {
    const slot = document.querySelector(`.document-slot[data-slot="${slotNumber}"]`);
    if (slot) {
        slot.remove();
        currentSlotCount--;
        renumberSlots();
        updateSlotCounter();
        
        // Re-enable add more button
        const addMoreBtn = document.getElementById('addMoreBtn');
        if (addMoreBtn) {
            addMoreBtn.disabled = false;
        }
    }
}

function renumberSlots() {
    const slots = document.querySelectorAll('.document-slot');
    slots.forEach((slot, index) => {
        const newNumber = index + 1;
        slot.dataset.slot = newNumber;
        const numberSpan = slot.querySelector('.slot-number');
        if (numberSpan) {
            numberSpan.textContent = `Document ${newNumber}`;
        }
        const removeBtn = slot.querySelector('.remove-slot-btn');
        if (removeBtn && newNumber > 1) {
            removeBtn.setAttribute('onclick', `removeDocumentSlot(${newNumber})`);
        }
    });
    currentSlotCount = slots.length;
}

function updateSlotCounter() {
    const counter = document.getElementById('slotCounter');
    if (counter) {
        counter.textContent = `${currentSlotCount} / ${MAX_DOCUMENTS} documents`;
    }
}

function handleFileChange(e) {
    const input = e.target;
    const slot = input.closest('.document-slot');
    
    if (input.files.length > 0) {
        slot.classList.add('has-file');
        
        // Remove existing file name display
        const existingDisplay = slot.querySelector('.file-name-display');
        if (existingDisplay) existingDisplay.remove();
        
        // Add file name display
        const fileNameDiv = document.createElement('div');
        fileNameDiv.className = 'file-name-display';
        fileNameDiv.innerHTML = `<i class="fas fa-file-check"></i> ${input.files[0].name}`;
        slot.appendChild(fileNameDiv);
    } else {
        slot.classList.remove('has-file');
        const existingDisplay = slot.querySelector('.file-name-display');
        if (existingDisplay) existingDisplay.remove();
    }
}

// Make removeDocumentSlot available globally
window.removeDocumentSlot = removeDocumentSlot;

// Initialize document upload on DOM ready
document.addEventListener('DOMContentLoaded', initDocumentUpload);

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
            notes: formData.get('notes') || ''
        }
    };

    // Collect all document files
    const documentInputs = document.querySelectorAll('.document-input');
    const files = [];
    documentInputs.forEach(input => {
        if (input.files.length > 0) {
            files.push(input.files[0]);
        }
    });

    // Validate at least one file is selected
    if (files.length === 0) {
        messageEl.className = 'form-message error show';
        messageEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please upload at least one document.';
        return;
    }

    // Check file sizes (5MB max each)
    const maxSize = 5 * 1024 * 1024;
    for (const file of files) {
        if (file.size > maxSize) {
            messageEl.className = 'form-message error show';
            messageEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> File "${file.name}" is too large. Maximum size is 5MB per file.`;
            return;
        }
    }

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

        // Add all document files
        files.forEach((file, index) => {
            uploadFormData.append('files', file);
        });
        uploadFormData.append('documentCount', files.length);

        // Get reCAPTCHA v3 token
        if (typeof grecaptcha !== 'undefined' && window.RECAPTCHA_SITE_KEY) {
            try {
                const captchaToken = await grecaptcha.execute(window.RECAPTCHA_SITE_KEY, { action: 'cv_service' });
                uploadFormData.append('captchaToken', captchaToken);
            } catch (_) {}
        }

        const response = await fetch(`${API_BASE_URL}/api/services/upload`, {
            method: 'POST',
            body: uploadFormData
        });

        let result;
        try {
            result = await response.json();
        } catch (parseError) {
            if (response.status === 413 || response.status === 400) {
                throw new Error('FILE_TOO_LARGE');
            }
            throw new Error('Server error. Please try again.');
        }

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
            if (result.errorType === 'FILE_TOO_LARGE') {
                throw new Error('FILE_TOO_LARGE');
            }
            throw new Error(result.message || 'Submission failed');
        }

    } catch (error) {
        console.error('Submission error:', error);
        messageEl.className = 'form-message error show';
        let displayMessage = error.message || 'Something went wrong. Please try again.';
        if (error.message === 'FILE_TOO_LARGE') {
            displayMessage = 'One or more files are too large. Maximum file size is 5MB per file.';
        }
        messageEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${displayMessage}`;
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit CV Request';
    }
});

// Check status on page load
checkServiceStatus();
