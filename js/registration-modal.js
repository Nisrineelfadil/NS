// Registration Modal System
class RegistrationModal {
    constructor() {
        this.modal = null;
        this.overlay = null;
        this.currentView = 'main';
        this.init();
    }

    async init() {
        this.createModal();
        this.attachEventListeners();
        await this.checkServiceAvailability();
    }

    async checkServiceAvailability() {
        try {
            const response = await fetch('/api/admin/service-status');
            const data = await response.json();
            
            if (data.success) {
                this.serviceSettings = data.settings;
                const settings = data.settings;
                
                // Get service cards
                const cvCard = document.querySelector('.other-service-card[data-service="cv"]');
                const applyingCard = document.querySelector('.other-service-card[data-service="bewerbung"]');
                const translationCard = document.querySelector('.other-service-card[data-service="translation"]');
                
                // Reset all cards first (remove previous closed badges)
                [cvCard, applyingCard, translationCard].forEach(card => {
                    if (card) {
                        card.classList.remove('service-closed');
                        card.style.opacity = '1';
                        card.style.cursor = 'pointer';
                        const badge = card.querySelector('.closed-badge');
                        if (badge) badge.remove();
                    }
                });
                
                // Apply closed state if needed
                if (cvCard && settings.isCvServiceOpen === false) {
                    cvCard.classList.add('service-closed');
                    cvCard.style.opacity = '0.5';
                    cvCard.style.cursor = 'not-allowed';
                    const badge = document.createElement('div');
                    badge.className = 'closed-badge';
                    badge.textContent = 'Closed';
                    badge.style.cssText = 'position: absolute; top: 10px; right: 10px; background: #ef4444; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;';
                    cvCard.style.position = 'relative';
                    cvCard.appendChild(badge);
                }
                
                if (applyingCard && settings.isApplyingServiceOpen === false) {
                    applyingCard.classList.add('service-closed');
                    applyingCard.style.opacity = '0.5';
                    applyingCard.style.cursor = 'not-allowed';
                    const badge = document.createElement('div');
                    badge.className = 'closed-badge';
                    badge.textContent = 'Closed';
                    badge.style.cssText = 'position: absolute; top: 10px; right: 10px; background: #ef4444; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;';
                    applyingCard.style.position = 'relative';
                    applyingCard.appendChild(badge);
                }
                
                if (translationCard && settings.isTranslationServiceOpen === false) {
                    translationCard.classList.add('service-closed');
                    translationCard.style.opacity = '0.5';
                    translationCard.style.cursor = 'not-allowed';
                    const badge = document.createElement('div');
                    badge.className = 'closed-badge';
                    badge.textContent = 'Closed';
                    badge.style.cssText = 'position: absolute; top: 10px; right: 10px; background: #ef4444; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;';
                    translationCard.style.position = 'relative';
                    translationCard.appendChild(badge);
                }
                
                console.log('Service availability checked:', {
                    cv: settings.isCvServiceOpen,
                    applying: settings.isApplyingServiceOpen,
                    translation: settings.isTranslationServiceOpen
                });
            }
        } catch (error) {
            console.error('Error checking service availability:', error);
        }
    }

    createModal() {
        // Create modal HTML structure
        const modalHTML = `
            <div class="registration-modal-overlay" id="registrationModal">
                <!-- Magical floating particles -->
                <div class="magic-particles">
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                </div>
                <div class="registration-modal">
                    <div class="modal-header">
                        <h2 id="modalTitle">Choose Registration Type</h2>
                        <button class="modal-close" id="modalClose">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <!-- Main Selection View -->
                        <div class="modal-view active" id="mainView">
                            <div class="service-selection">
                                <div class="service-option" data-service="courses">
                                    <div class="service-icon">
                                        <i class="fas fa-graduation-cap"></i>
                                    </div>
                                    <h3>Register for Courses</h3>
                                    <p>German Language, French, English & more</p>
                                </div>
                                <div class="service-option" data-service="other">
                                    <div class="service-icon">
                                        <i class="fas fa-briefcase"></i>
                                    </div>
                                    <h3>Other Services</h3>
                                    <p>CV, Bewerbung, Translation & more</p>
                                </div>
                            </div>
                        </div>

                        <!-- Other Services View -->
                        <div class="modal-view" id="otherServicesView">
                            <div class="other-services-grid">
                                <div class="other-service-card" data-service="cv">
                                    <div class="service-icon">
                                        <i class="fas fa-file-alt"></i>
                                    </div>
                                    <h4>CV Service</h4>
                                    <p>Professional CV creation and optimization</p>
                                </div>
                                <div class="other-service-card" data-service="bewerbung">
                                    <div class="service-icon">
                                        <i class="fas fa-briefcase"></i>
                                    </div>
                                    <h4>Applying Service</h4>
                                    <p>Job application assistance (Bewerbung)</p>
                                </div>
                                <div class="other-service-card" data-service="translation">
                                    <div class="service-icon">
                                        <i class="fas fa-language"></i>
                                    </div>
                                    <h4>Translation Service</h4>
                                    <p>Document translation services</p>
                                </div>
                            </div>
                            <button class="back-button" data-back="main">
                                <i class="fas fa-arrow-left"></i>
                                Back
                            </button>
                        </div>

                        <!-- CV Service Form -->
                        <div class="modal-view" id="cvServiceView">
                            <button class="back-button" data-back="other">
                                <i class="fas fa-arrow-left"></i>
                                Back to Services
                            </button>
                            <form class="service-form" id="cvForm">
                                <div class="form-group">
                                    <label for="cvFullName">
                                        <i class="fas fa-user"></i> Full Name *
                                    </label>
                                    <input type="text" id="cvFullName" name="fullName" required>
                                </div>
                                <div class="form-group">
                                    <label for="cvPhone">
                                        <i class="fas fa-phone"></i> Phone Number *
                                    </label>
                                    <input type="tel" id="cvPhone" name="phone" required>
                                </div>
                                <div class="form-group">
                                    <label for="cvEmail">
                                        <i class="fas fa-envelope"></i> Email *
                                    </label>
                                    <input type="email" id="cvEmail" name="email" required>
                                </div>
                                <div class="form-group">
                                    <label for="cvFile">
                                        <i class="fas fa-upload"></i> Upload Your Information (PDF, DOCX) *
                                    </label>
                                    <input type="file" id="cvFile" name="file" accept=".pdf,.doc,.docx" required>
                                </div>
                                <button type="submit" class="submit-btn">
                                    <i class="fas fa-paper-plane"></i>
                                    Submit CV Request
                                </button>
                                <div class="form-message" id="cvMessage"></div>
                            </form>
                        </div>

                        <!-- Bewerbung Service Form -->
                        <div class="modal-view" id="bewerbungServiceView">
                            <button class="back-button" data-back="other">
                                <i class="fas fa-arrow-left"></i>
                                Back to Services
                            </button>
                            <form class="service-form" id="bewerbungForm">
                                <div class="form-group">
                                    <label for="bewFullName">
                                        <i class="fas fa-user"></i> Full Name *
                                    </label>
                                    <input type="text" id="bewFullName" name="fullName" required>
                                </div>
                                <div class="form-group">
                                    <label for="bewPhone">
                                        <i class="fas fa-phone"></i> Phone Number *
                                    </label>
                                    <input type="tel" id="bewPhone" name="phone" required>
                                </div>
                                <div class="form-group">
                                    <label for="bewEmail">
                                        <i class="fas fa-envelope"></i> Email *
                                    </label>
                                    <input type="email" id="bewEmail" name="email" required>
                                </div>
                                <div class="form-group">
                                    <label for="bewJobType">
                                        <i class="fas fa-briefcase"></i> Choose Job Type *
                                    </label>
                                    <select id="bewJobType" name="jobType" required>
                                        <option value="">Select job type...</option>
                                        <option value="nursing">Nursing (Krankenpflege)</option>
                                        <option value="geriatric">Geriatric Care (Altenpflege)</option>
                                        <option value="hotel">Hotel & Hospitality</option>
                                        <option value="restaurant">Restaurant & Cuisine</option>
                                        <option value="it">IT & Technology</option>
                                        <option value="social">Social Work</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="bewCV">
                                        <i class="fas fa-upload"></i> Upload Your CV *
                                    </label>
                                    <input type="file" id="bewCV" name="cv" accept=".pdf,.doc,.docx" required>
                                </div>
                                <button type="submit" class="submit-btn">
                                    <i class="fas fa-paper-plane"></i>
                                    Submit Application Request
                                </button>
                                <div class="form-message" id="bewerbungMessage"></div>
                            </form>
                        </div>

                        <!-- Translation Service Form -->
                        <div class="modal-view" id="translationServiceView">
                            <button class="back-button" data-back="other">
                                <i class="fas fa-arrow-left"></i>
                                Back to Services
                            </button>
                            <form class="service-form" id="translationForm">
                                <div class="form-group">
                                    <label for="transFullName">
                                        <i class="fas fa-user"></i> Full Name *
                                    </label>
                                    <input type="text" id="transFullName" name="fullName" required>
                                </div>
                                <div class="form-group">
                                    <label for="transPhone">
                                        <i class="fas fa-phone"></i> Phone Number *
                                    </label>
                                    <input type="tel" id="transPhone" name="phone" required>
                                </div>
                                <div class="form-group">
                                    <label for="transEmail">
                                        <i class="fas fa-envelope"></i> Email *
                                    </label>
                                    <input type="email" id="transEmail" name="email" required>
                                </div>
                                <div class="form-group">
                                    <label for="transLanguages">
                                        <i class="fas fa-language"></i> Translation Direction *
                                    </label>
                                    <select id="transLanguages" name="languages" required>
                                        <option value="">Select translation direction...</option>
                                        <option value="ar-de">Arabic to German</option>
                                        <option value="de-ar">German to Arabic</option>
                                        <option value="ar-en">Arabic to English</option>
                                        <option value="en-ar">English to Arabic</option>
                                        <option value="ar-fr">Arabic to French</option>
                                        <option value="fr-ar">French to Arabic</option>
                                        <option value="de-en">German to English</option>
                                        <option value="en-de">English to German</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="transFile">
                                        <i class="fas fa-upload"></i> Upload Document to Translate *
                                    </label>
                                    <input type="file" id="transFile" name="file" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" required>
                                </div>
                                <button type="submit" class="submit-btn">
                                    <i class="fas fa-paper-plane"></i>
                                    Submit Translation Request
                                </button>
                                <div class="form-message" id="translationMessage"></div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Append to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        this.modal = document.getElementById('registrationModal');
        this.overlay = this.modal;
    }

    attachEventListeners() {
        // Close modal
        const closeBtn = document.getElementById('modalClose');
        closeBtn.addEventListener('click', () => this.close());

        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
                this.close();
            }
        });

        // Main service selection
        document.querySelectorAll('.service-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const service = e.currentTarget.dataset.service;
                if (service === 'courses') {
                    // Redirect to existing registration page with modal flag
                    window.location.href = '/register?from=modal';
                } else if (service === 'other') {
                    this.showView('otherServicesView', 'Choose a Service');
                }
            });
        });

        // Other services selection
        document.querySelectorAll('.other-service-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Check if service is closed
                if (e.currentTarget.classList.contains('service-closed')) {
                    const service = e.currentTarget.dataset.service;
                    this.showServiceClosedMessage(service);
                    return;
                }
                const service = e.currentTarget.dataset.service;
                this.showServiceForm(service);
            });
        });

        // Back buttons
        document.querySelectorAll('.back-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const backTo = e.currentTarget.dataset.back;
                if (backTo === 'main') {
                    this.showView('mainView', 'Choose Registration Type');
                } else if (backTo === 'other') {
                    this.showView('otherServicesView', 'Choose a Service');
                }
            });
        });

        // Form submissions
        this.attachFormHandlers();
    }

    attachFormHandlers() {
        // CV Form
        const cvForm = document.getElementById('cvForm');
        cvForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit(cvForm, 'CV Service', 'cvMessage');
        });

        // Bewerbung Form
        const bewerbungForm = document.getElementById('bewerbungForm');
        bewerbungForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit(bewerbungForm, 'Bewerbung Service', 'bewerbungMessage');
        });

        // Translation Form
        const translationForm = document.getElementById('translationForm');
        translationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit(translationForm, 'Translation Service', 'translationMessage');
        });
    }

    async handleFormSubmit(form, serviceName, messageId) {
        const submitBtn = form.querySelector('.submit-btn');
        const messageEl = document.getElementById(messageId);
        
        // Get form data
        const formData = new FormData(form);
        
        // Determine service type
        let serviceType = '';
        if (serviceName === 'CV Service') {
            serviceType = 'cv';
        } else if (serviceName === 'Bewerbung Service') {
            serviceType = 'applying';
        } else if (serviceName === 'Translation Service') {
            serviceType = 'translation';
        }
        
        // Build request data
        const data = {
            serviceType: serviceType,
            fullName: formData.get('fullName'),
            phone: formData.get('phone'),
            email: formData.get('email')
        };

        // Add service-specific fields
        if (serviceType === 'cv') {
            data.cvDetails = {
                experience: formData.get('experience') || '',
                education: formData.get('education') || '',
                field: formData.get('field') || '',
                notes: formData.get('notes') || ''
            };
            // Add file info if uploaded
            const fileInput = form.querySelector('input[type="file"]');
            if (fileInput && fileInput.files.length > 0) {
                data.cvDetails.fileName = fileInput.files[0].name;
                data.cvDetails.fileSize = fileInput.files[0].size;
            }
        } else if (serviceType === 'applying') {
            data.applyingDetails = {
                jobType: formData.get('jobType') || '',
                targetCompany: formData.get('targetCompany') || '',
                deadline: formData.get('deadline') || '',
                notes: formData.get('notes') || ''
            };
            // Add file info if uploaded
            const fileInput = form.querySelector('input[type="file"]');
            if (fileInput && fileInput.files.length > 0) {
                data.applyingDetails.fileName = fileInput.files[0].name;
                data.applyingDetails.fileSize = fileInput.files[0].size;
            }
        } else if (serviceType === 'translation') {
            data.translationDetails = {
                languages: formData.get('languages') || '',
                documentType: formData.get('documentType') || '',
                pageCount: formData.get('pageCount') || '',
                deadline: formData.get('deadline') || '',
                notes: formData.get('notes') || ''
            };
            // Add file info if uploaded
            const fileInput = form.querySelector('input[type="file"]');
            if (fileInput && fileInput.files.length > 0) {
                data.translationDetails.fileName = fileInput.files[0].name;
                data.translationDetails.fileSize = fileInput.files[0].size;
            }
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        messageEl.className = 'form-message';
        messageEl.textContent = '';

        // Submit to API with file upload
        try {
            console.log('Submitting service request with file...');
            
            // Create FormData for file upload
            const uploadFormData = new FormData();
            uploadFormData.append('serviceType', data.serviceType);
            uploadFormData.append('fullName', data.fullName);
            uploadFormData.append('phone', data.phone);
            uploadFormData.append('email', data.email);
            
            // Add service-specific details
            if (data.cvDetails) {
                uploadFormData.append('cvDetails', JSON.stringify(data.cvDetails));
            }
            if (data.applyingDetails) {
                uploadFormData.append('applyingDetails', JSON.stringify(data.applyingDetails));
            }
            if (data.translationDetails) {
                uploadFormData.append('translationDetails', JSON.stringify(data.translationDetails));
            }
            
            // Add file if exists
            const fileInput = form.querySelector('input[type="file"]');
            if (fileInput && fileInput.files.length > 0) {
                uploadFormData.append('file', fileInput.files[0]);
            }
            
            const response = await fetch('/api/services/upload', {
                method: 'POST',
                body: uploadFormData
            });

            const result = await response.json();

            if (result.success) {
                // Show success message
                messageEl.className = 'form-message success show';
                messageEl.innerHTML = '<i class="fas fa-check-circle"></i> Request submitted successfully! We will contact you soon.';

                // Reset form after delay
                setTimeout(() => {
                    form.reset();
                    messageEl.className = 'form-message';
                    this.close();
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
            submitBtn.classList.remove('loading');
        }
    }

    showServiceClosedMessage(service) {
        // Close modal and redirect to service page with closed status
        this.close();
        
        const servicePages = {
            'cv': '/cv.html',
            'bewerbung': '/apply.html',
            'translation': '/translate.html'
        };
        
        // Redirect to service page - it will check status and show closed message
        window.location.href = servicePages[service] || '/';
    }

    showServiceForm(service) {
        // Close modal and redirect to service page
        this.close();
        
        const servicePages = {
            'cv': '/cv.html',
            'bewerbung': '/apply.html',
            'translation': '/translate.html'
        };
        
        window.location.href = servicePages[service] || '/';
    }

    showView(viewId, title) {
        // Hide all views
        document.querySelectorAll('.modal-view').forEach(view => {
            view.classList.remove('active');
        });

        // Show selected view
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add('active');
        }

        // Update title
        const titleEl = document.getElementById('modalTitle');
        if (titleEl) {
            titleEl.textContent = title;
        }

        this.currentView = viewId;
    }

    async open() {
        // Check service availability every time modal opens
        await this.checkServiceAvailability();
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset to main view after animation
        setTimeout(() => {
            this.showView('mainView', 'Choose Registration Type');
        }, 300);
    }
}

// Initialize modal when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const registrationModal = new RegistrationModal();

    // Attach to all register buttons
    const registerButtons = document.querySelectorAll('[href="/register"]');
    registerButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            registrationModal.open();
        });
    });

    // Check if we should reopen modal (coming back from /register)
    if (sessionStorage.getItem('reopenModal') === 'true') {
        sessionStorage.removeItem('reopenModal');
        setTimeout(() => {
            registrationModal.open();
        }, 300);
    }

    // Make it globally accessible
    window.registrationModal = registrationModal;
});
