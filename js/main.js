document.addEventListener('DOMContentLoaded', function() {
    // 1. Animated Counter Functionality
    const animateCounter = () => {
        const counterElement = document.querySelector('.counter');
        if (!counterElement) return;

        const target = parseInt(counterElement.getAttribute('data-target'));
        const duration = 2000; // Animation duration in ms
        const frameDuration = 1000 / 60; // 60fps
        const totalFrames = Math.round(duration / frameDuration);
        const easeOutQuad = t => t * (2 - t); // Easing function

        let frame = 0;
        const counter = {
            value: 0,
            update: function() {
                frame++;
                const progress = Math.min(frame / totalFrames, 1);
                const easedProgress = easeOutQuad(progress);
                this.value = Math.round(target * easedProgress);
                counterElement.textContent = this.value.toLocaleString();
                
                if (frame < totalFrames) {
                    requestAnimationFrame(counter.update.bind(counter));
                } else {
                    // Add the '+' symbol after counting is complete
                    counterElement.parentElement.classList.add('animate');
                    
                    // Add pulse effect when counter completes
                    setTimeout(() => {
                        counterElement.style.animation = 'pulse 1s ease-in-out';
                        // Remove animation after it completes to allow it to be triggered again
                        setTimeout(() => {
                            counterElement.style.animation = '';
                        }, 1000);
                    }, 500);
                }
            }
        };

        // Start counter when element is in viewport
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    counter.update();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        observer.observe(counterElement);
    };

    // 2. Language Switcher Functionality
    let currentLanguages = {}; // Will store the loaded languages

    const updatePageContent = (translations) => {
        if (!translations) {
            return;
        }
        
        console.log('Updating page content with:', translations);
        
        // Update all elements with data-i18n attributes
        const elementsToTranslate = document.querySelectorAll('[data-i18n]');
        
        elementsToTranslate.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = getNestedTranslation(translations, key);
            
            if (translation) {
                // Handle different types of elements
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else if (element.tagName === 'OPTION') {
                    element.textContent = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });
        
        // Handle placeholder translations separately
        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = getNestedTranslation(translations, key);
            if (translation) {
                element.placeholder = translation;
            }
        });
    };

    // Helper function to get nested translation values
    const getNestedTranslation = (obj, path) => {
        return path.split('.').reduce((current, key) => {
            return current && current[key] ? current[key] : null;
        }, obj);
    };

    const updatePageLanguage = async (langCode) => {
        console.log('Updating language to:', langCode);
        const lang = currentLanguages[langCode];
        
        if (!lang) {
            console.error('Language not found:', langCode);
            return false;
        }

        try {
            // Update page direction for RTL languages
            const htmlElement = document.documentElement;
            const bodyElement = document.body;
            
            if (lang.dir === 'rtl') {
                htmlElement.setAttribute('dir', 'rtl');
                htmlElement.setAttribute('lang', langCode);
                bodyElement.classList.add('rtl');
            } else {
                htmlElement.setAttribute('dir', 'ltr');
                htmlElement.setAttribute('lang', langCode);
                bodyElement.classList.remove('rtl');
            }
            
            // Update content
            if (lang.translations) {
                updatePageContent(lang.translations);
            } else {
                console.error('No translations found for language:', langCode);
            }
            
            // Save preference
            localStorage.setItem('preferredLanguage', langCode);
            
            // Update active state in dropdown
            document.querySelectorAll('.language-option').forEach(opt => {
                opt.classList.remove('active');
                if (opt.getAttribute('data-lang') === langCode) {
                    opt.classList.add('active');
                }
            });
            
            // Close the dropdown
            const languageSelector = document.querySelector('.language-selector');
            const languageDropdown = document.querySelector('.language-dropdown');
            if (languageSelector) {
                languageSelector.classList.remove('active');
            }
            if (languageDropdown) {
                languageDropdown.classList.remove('show');
            }
            
            console.log('Language updated to:', langCode);
            return true;
            
        } catch (error) {
            console.error('Error updating language:', error);
            return false;
        }
    };

    const setupLanguageSwitcher = () => {
        const languageSelector = document.querySelector('.language-selector');
        const languageButton = document.querySelector('.language-button');
        const languageDropdown = document.querySelector('.language-dropdown');
        
        if (!languageSelector || !languageButton || !languageDropdown) {
            console.error('Language switcher elements not found');
            return;
        }
        
        // Toggle dropdown
        languageButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Close portal dropdown if open
            const portalDropdown = document.querySelector('.portal-dropdown');
            const portalButton = document.querySelector('.portal-button');
            if (portalDropdown) portalDropdown.classList.remove('show');
            if (portalButton) portalButton.classList.remove('active');
            
            languageDropdown.classList.toggle('show');
            languageButton.classList.toggle('active');
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!languageSelector.contains(e.target)) {
                languageDropdown.classList.remove('show');
                languageButton.classList.remove('active');
            }
        });
        
        // Use event delegation for language options (works even when dropdown is recreated)
        languageDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            const languageOption = e.target.closest('.language-option');
            if (languageOption) {
                e.preventDefault();
                const lang = languageOption.getAttribute('data-lang');
                if (lang) {
                    console.log('Language selected:', lang);
                    updatePageLanguage(lang);
                }
            }
        });
        
        // Add hover effect to the globe icon
        const globeIcon = languageButton.querySelector('i:first-child');
        if (globeIcon) {
            globeIcon.addEventListener('mouseenter', () => {
                globeIcon.style.transition = 'transform 0.3s ease';
                globeIcon.style.transform = 'rotate(15deg)';
                setTimeout(() => {
                    globeIcon.style.transform = 'rotate(-15deg)';
                    setTimeout(() => {
                        globeIcon.style.transform = 'rotate(0)';
                    }, 150);
                }, 150);
            });
        }
    };

    const initLanguageSwitcher = async () => {
        console.log('Initializing language switcher...');
        
        try {
            // Load languages from JSON
            const response = await fetch('js/languages.json');
            if (!response.ok) throw new Error('Failed to load languages.json');
            
            currentLanguages = await response.json();
            console.log('Languages loaded:', Object.keys(currentLanguages));
            
            // Set up the UI
            setupLanguageSwitcher();
            
            // Set initial language
            const currentLang = localStorage.getItem('preferredLanguage') || 'de';
            
            // Set active class on the current language option
            const languageOptions = document.querySelectorAll('.language-option');
            languageOptions.forEach(option => {
                if (option.getAttribute('data-lang') === currentLang) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
            
            await updatePageLanguage(currentLang);
            
        } catch (error) {
            console.error('Error initializing language switcher:', error);
        }
    };

    // Portal Access Dropdown
    const setupPortalAccess = () => {
        const portalSelector = document.querySelector('.portal-selector');
        const portalButton = document.querySelector('.portal-button');
        const portalDropdown = document.querySelector('.portal-dropdown');
        
        if (!portalSelector || !portalButton || !portalDropdown) {
            console.log('Portal access elements not found');
            return;
        }
        
        // Toggle dropdown
        portalButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Close language dropdown if open
            const langDropdown = document.querySelector('.language-dropdown');
            const langButton = document.querySelector('.language-button');
            if (langDropdown) langDropdown.classList.remove('show');
            if (langButton) langButton.classList.remove('active');
            
            portalDropdown.classList.toggle('show');
            portalButton.classList.toggle('active');
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!portalSelector.contains(e.target)) {
                portalDropdown.classList.remove('show');
                portalButton.classList.remove('active');
            }
        });
        
        console.log('Portal access dropdown initialized');
    };

    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const languageSelector = document.querySelector('.language-selector');
    const languageButton = document.querySelector('.language-button');
    
    // Toggle mobile menu
    if (hamburger && navLinks) {
        let scrollPosition = 0;
        
        const toggleMenu = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            const isActive = !navLinks.classList.contains('active');
            
            if (isActive) {
                // Save current scroll position
                scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
                
                hamburger.classList.add('active');
                navLinks.classList.add('active');
                document.body.classList.add('menu-open');
                
                // Set the body's top position to maintain scroll position
                document.body.style.top = `-${scrollPosition}px`;
            } else {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.classList.remove('menu-open');
                
                // Restore scroll position
                document.body.style.top = '';
                window.scrollTo(0, scrollPosition);
            }
        };
        
        hamburger.addEventListener('click', toggleMenu);
        
        // Add touch event for mobile (using touchend to avoid cancelable issues)
        hamburger.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        }, { passive: false });
        
        // Helper function to close menu properly
        const closeMenu = () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.classList.remove('menu-open');
            document.body.style.top = '';
            window.scrollTo(0, scrollPosition);
        };
        
        // Close menu when clicking on a nav link (but not language switcher)
        document.querySelectorAll('.nav-links > a:not(.language-button)').forEach(link => {
            link.addEventListener('click', (e) => {
                // Only close menu if it's a valid navigation link with a target
                const href = link.getAttribute('href');
                if (href && href.startsWith('#') && href.length > 1) {
                    closeMenu();
                }
            });
        });
        
        // Close menu when clicking on overlay (background)
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') && 
                !navLinks.contains(e.target) && 
                !hamburger.contains(e.target)) {
                closeMenu();
            }
        });
    } else {
        console.error('Hamburger or navLinks not found:', { hamburger, navLinks });
    }
    
    // Language selector is now handled by setupLanguageSwitcher() in initLanguageSwitcher()
    
    // Initialize everything
    animateCounter();
    initLanguageSwitcher();
    setupPortalAccess();
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href.length > 1) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Close mobile menu if open
                    if (hamburger && navLinks) {
                        hamburger.classList.remove('active');
                        navLinks.classList.remove('active');
                        document.body.classList.remove('menu-open');
                    }
                }
            }
        });
    });
    
    // Back to top button
    const backToTopBtn = document.querySelector('.back-to-top');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });
    }

    // Contact Form Submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formSuccess = document.getElementById('formSuccess');
            const formError = document.getElementById('formError');
            const submitBtn = contactForm.querySelector('.btn-send-message');
            
            // Hide previous messages
            formSuccess.style.display = 'none';
            formError.style.display = 'none';
            
            // Get form data
            const formData = {
                fullName: document.getElementById('fullName').value,
                phoneNumber: document.getElementById('phoneNumber').value,
                message: document.getElementById('message').value
            };
            
            // Disable button and show loading
            submitBtn.disabled = true;
            const originalText = submitBtn.querySelector('span').textContent;
            submitBtn.querySelector('span').textContent = 'Sending...';
            
            try {
                // Get reCAPTCHA v3 token
                if (typeof grecaptcha !== 'undefined' && window.RECAPTCHA_SITE_KEY) {
                    try {
                        formData.captchaToken = await grecaptcha.execute(window.RECAPTCHA_SITE_KEY, { action: 'contact' });
                    } catch (_) {}
                }

                // Send to backend API
                const API_BASE_URL = window.location.hostname === 'localhost' 
                    ? 'http://localhost:3000' 
                    : 'https://nisrine-school.vercel.app';
                
                const response = await fetch(`${API_BASE_URL}/api/contact`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Show success message
                    formSuccess.style.display = 'flex';
                    contactForm.reset();
                    
                    // Hide success message after 5 seconds
                    setTimeout(() => {
                        formSuccess.style.display = 'none';
                    }, 5000);
                } else {
                    throw new Error(data.message || 'Failed to send message');
                }
                
            } catch (error) {
                // Show error message
                formError.style.display = 'flex';
                console.error('Form submission error:', error);
                
                // Hide error message after 5 seconds
                setTimeout(() => {
                    formError.style.display = 'none';
                }, 5000);
            } finally {
                // Re-enable button
                submitBtn.disabled = false;
                submitBtn.querySelector('span').textContent = originalText;
            }
        });
    }
});
