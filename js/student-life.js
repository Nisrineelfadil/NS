// Student Life Section - Tabs and Video Carousel Functionality

class StudentLife {
    constructor() {
        this.init();
    }

    init() {
        this.setupTabs();
        this.setupPhotosSlider();
        this.setupVideosSlider();
        this.setupMobileTouch();
        this.setupVideoThumbnails();
        this.setupGalleryCards();
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        const tabSwitcher = document.querySelector('.tab-switcher');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked button and corresponding content
                button.classList.add('active');
                document.getElementById(`${targetTab}-tab`).classList.add('active');
                
                // Toggle switcher class for sliding animation
                if (tabSwitcher) {
                    if (targetTab === 'videos') {
                        tabSwitcher.classList.add('videos-active');
                    } else {
                        tabSwitcher.classList.remove('videos-active');
                    }
                }
                
                // Add smooth transition effect
                const activeContent = document.getElementById(`${targetTab}-tab`);
                activeContent.style.opacity = '0';
                activeContent.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    activeContent.style.opacity = '1';
                    activeContent.style.transform = 'translateY(0)';
                }, 50);
            });
        });
    }

    setupPhotosSlider() {
        const slider = document.querySelector('.photos-slider');
        const prevBtn = document.querySelector('.photos-nav.prev');
        const nextBtn = document.querySelector('.photos-nav.next');
        const dots = document.querySelectorAll('.photos-dot');
        
        if (!slider || !prevBtn || !nextBtn) return;

        let currentSlide = 0;
        const totalSlides = document.querySelectorAll('.photos-slide').length;

        const updateSlider = () => {
            const translateX = -currentSlide * 100;
            slider.style.transform = `translateX(${translateX}%)`;
            
            // Update dots
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentSlide);
            });
        };

        const nextSlide = () => {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateSlider();
        };

        const prevSlide = () => {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateSlider();
        };

        // Navigation buttons
        nextBtn.addEventListener('click', nextSlide);
        prevBtn.addEventListener('click', prevSlide);

        // Dots navigation
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentSlide = index;
                updateSlider();
            });
        });

        // Auto-play (optional)
        let autoPlayInterval;
        const startAutoPlay = () => {
            autoPlayInterval = setInterval(nextSlide, 4000); // 4 seconds for smoother experience
        };

        const stopAutoPlay = () => {
            clearInterval(autoPlayInterval);
        };

        // Start auto-play
        startAutoPlay();
        
        // Initialize dots based on actual number of slides
        if (dots.length !== totalSlides) {
            console.log(`Photos: ${totalSlides} slides, ${dots.length} dots`);
        }

        // Pause auto-play on hover
        const sliderContainer = document.querySelector('.photos-slider-container');
        if (sliderContainer) {
            sliderContainer.addEventListener('mouseenter', stopAutoPlay);
            sliderContainer.addEventListener('mouseleave', startAutoPlay);
        }

        // Pause auto-play when user interacts
        [prevBtn, nextBtn, ...dots].forEach(element => {
            element.addEventListener('click', () => {
                stopAutoPlay();
                setTimeout(startAutoPlay, 3000); // Resume after 3 seconds
            });
        });

        // Touch/swipe support for mobile
        this.setupPhotosSwipe(slider, nextSlide, prevSlide);
    }

    setupPhotosSwipe(slider, nextSlide, prevSlide) {
        let startX = 0;
        let startY = 0;
        let distX = 0;
        let distY = 0;
        let threshold = 100; // Minimum distance for swipe
        let restraint = 100; // Maximum distance perpendicular to swipe direction
        let allowedTime = 300; // Maximum time allowed to travel that distance
        let startTime = 0;

        slider.addEventListener('touchstart', (e) => {
            const touchObj = e.changedTouches[0];
            startX = touchObj.pageX;
            startY = touchObj.pageY;
            startTime = new Date().getTime();
        }, { passive: true });

        slider.addEventListener('touchend', (e) => {
            const touchObj = e.changedTouches[0];
            distX = touchObj.pageX - startX;
            distY = touchObj.pageY - startY;
            const elapsedTime = new Date().getTime() - startTime;

            if (elapsedTime <= allowedTime) {
                if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
                    if (distX > 0) {
                        prevSlide(); // Swipe right - previous slide
                    } else {
                        nextSlide(); // Swipe left - next slide
                    }
                }
            }
        }, { passive: true });
    }

    setupVideosSlider() {
        const slider = document.querySelector('.videos-slider');
        const prevBtn = document.querySelector('.videos-nav.prev');
        const nextBtn = document.querySelector('.videos-nav.next');
        const dots = document.querySelectorAll('.videos-dot');
        
        if (!slider || !prevBtn || !nextBtn) return;

        let currentSlide = 0;
        const totalSlides = document.querySelectorAll('.videos-slide').length;

        const updateSlider = () => {
            const translateX = -currentSlide * 100;
            slider.style.transform = `translateX(${translateX}%)`;
            
            // Update dots
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentSlide);
            });
        };

        const nextSlide = () => {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateSlider();
        };

        const prevSlide = () => {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateSlider();
        };

        // Navigation buttons
        nextBtn.addEventListener('click', nextSlide);
        prevBtn.addEventListener('click', prevSlide);

        // Dots navigation
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentSlide = index;
                updateSlider();
            });
        });

        // Touch/swipe support for mobile
        this.setupVideosSwipe(slider, nextSlide, prevSlide);
    }

    setupVideosSwipe(slider, nextSlide, prevSlide) {
        let startX = 0;
        let startY = 0;
        let distX = 0;
        let distY = 0;
        let threshold = 100;
        let restraint = 100;
        let allowedTime = 300;
        let startTime = 0;

        slider.addEventListener('touchstart', (e) => {
            const touchObj = e.changedTouches[0];
            startX = touchObj.pageX;
            startY = touchObj.pageY;
            startTime = new Date().getTime();
        }, { passive: true });

        slider.addEventListener('touchend', (e) => {
            const touchObj = e.changedTouches[0];
            distX = touchObj.pageX - startX;
            distY = touchObj.pageY - startY;
            const elapsedTime = new Date().getTime() - startTime;

            if (elapsedTime <= allowedTime) {
                if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
                    if (distX > 0) {
                        prevSlide();
                    } else {
                        nextSlide();
                    }
                }
            }
        }, { passive: true });
    }

    setupMobileTouch() {
        // Mobile touch functionality is now handled in setupPhotosSwipe
        // Videos are embedded iframes that handle their own interactions
        console.log('Mobile touch support initialized for photos slider');
    }

    setupVideoThumbnails() {
        const videoThumbs = document.querySelectorAll('.video-thumb-btn');
        const mainVideo = document.getElementById('mainVideo');
        
        if (!mainVideo || videoThumbs.length === 0) return;

        videoThumbs.forEach(thumb => {
            thumb.addEventListener('click', () => {
                const videoSrc = thumb.getAttribute('data-video');
                const posterSrc = thumb.getAttribute('data-poster');
                
                if (videoSrc) {
                    // Update main video source
                    mainVideo.src = videoSrc;
                    mainVideo.poster = posterSrc || '';
                    mainVideo.load();
                    
                    // Update active state
                    videoThumbs.forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                }
            });
        });
    }

    setupGalleryCards() {
        const galleryCards = document.querySelectorAll('.gallery-card');
        const featuredImage = document.getElementById('featuredImage');
        const featuredLabel = document.getElementById('featuredLabel');
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        
        if (galleryCards.length === 0) return;

        // All images data
        const images = [
            { src: 'Img/1.webp', label: 'Certificate Achievement', i18n: 'students.card1' },
            { src: 'Img/3.webp', label: 'Nursing Training', i18n: 'students.card3' },
            { src: 'Img/4.webp', label: 'Hotel Training', i18n: 'students.card4' },
            { src: 'Img/5.webp', label: 'Student Success', i18n: 'students.card5' },
            { src: 'Img/6.webp', label: 'Language Practice', i18n: 'students.card6' },
            { src: 'Img/7.webp', label: 'Cultural Exchange', i18n: 'students.card7' },
            { src: 'Img/8.webp', label: 'Graduation Day', i18n: 'students.card8' },
            { src: 'Img/9.webp', label: 'Career Start', i18n: 'students.card9' }
        ];

        let currentStartIndex = 0;

        // Update cards display
        const updateCards = () => {
            galleryCards.forEach((card, i) => {
                const imgIndex = (currentStartIndex + i) % images.length;
                const img = card.querySelector('img');
                const label = card.querySelector('.card-label');
                
                if (img) img.src = images[imgIndex].src;
                if (label) label.textContent = images[imgIndex].label;
                card.setAttribute('data-index', imgIndex);
            });
        };

        // Click on card to show in featured
        galleryCards.forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.getAttribute('data-index'));
                if (featuredImage) featuredImage.src = images[index].src;
                if (featuredLabel) featuredLabel.textContent = images[index].label;
            });
        });

        // Navigation arrows
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentStartIndex = (currentStartIndex - 1 + images.length) % images.length;
                updateCards();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentStartIndex = (currentStartIndex + 1) % images.length;
                updateCards();
            });
        }
    }

    trackVideoView(title) {
        // Optional: Add analytics tracking for video views
        console.log(`Video viewed: ${title}`);
        
        // Example: Google Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'video_view', {
                'event_category': 'Student Life',
                'event_label': title
            });
        }
    }

    // Method to add new photos dynamically
    addPhoto(src, alt, title) {
        const photosGrid = document.querySelector('.photos-grid');
        if (!photosGrid) return;

        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.innerHTML = `
            <img src="${src}" alt="${alt}" loading="lazy">
            ${title ? `<div class="photo-title">${title}</div>` : ''}
        `;
        
        photosGrid.appendChild(photoItem);
    }

    // Method to add new videos dynamically
    addVideo(url, thumbnailSrc, title) {
        const videosContainer = document.querySelector('.videos-container');
        if (!videosContainer) return;

        const videoItem = document.createElement('div');
        videoItem.className = 'video-item';
        videoItem.setAttribute('data-url', url);
        videoItem.innerHTML = `
            <div class="video-thumbnail">
                <img src="${thumbnailSrc}" alt="${title}" loading="lazy">
                <div class="play-button">
                    <i class="fas fa-play"></i>
                </div>
            </div>
            <div class="video-title">${title}</div>
        `;
        
        videosContainer.appendChild(videoItem);
        
        // Re-setup click event for new video
        videoItem.addEventListener('click', () => {
            window.open(url, '_blank', 'noopener,noreferrer');
            this.trackVideoClick(title, url);
        });
        
        // Update navigation visibility
        this.updateCarouselNavigation();
    }
}

// Initialize Student Life functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StudentLife();
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudentLife;
}
