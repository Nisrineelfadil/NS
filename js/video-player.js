// Video Player System for Student Success Stories
class VideoPlayer {
    constructor() {
        this.currentVideoIndex = 0;
        this.videoCards = [];
        this.mainPlayer = document.getElementById('main-video-player');
        this.mainLabel = document.getElementById('main-video-label');
        this.mobilePlayer = document.getElementById('mobile-video-player');
        this.mobileTitle = document.getElementById('mobile-video-title');
        this.mobileMainVideo = document.querySelector('.mobile-main-video');
        this.isMobile = window.innerWidth <= 480;
        this.idleTimer = null;
        this.mobileEventsBound = false;
        this.idleMs = 15000; // 15 seconds
        this.init();
    }

    init() {
        this.loadVideoCards();
        this.setupVideoCards();
        this.setupMobileNavigation();
        this.setupResponsiveListener();
        this.bindMobilePlayerEvents();
    }

    loadVideoCards() {
        this.videoCards = Array.from(document.querySelectorAll('.video-card[data-video]'));
    }

    setupVideoCards() {
        this.videoCards.forEach((card, index) => {
            card.addEventListener('click', () => {
                const videoSrc = card.getAttribute('data-video');
                const videoTitle = card.querySelector('.card-content h4')?.textContent || 
                                 card.querySelector('.video-overlay-title')?.textContent || 
                                 'Video';
                
                this.currentVideoIndex = index;
                this.playVideo(videoSrc, videoTitle, index);
            });
        });
    }

    setupMobileNavigation() {
        const prevBtn = document.getElementById('mobile-prev-btn');
        const nextBtn = document.getElementById('mobile-next-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.navigateVideo(-1));
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.navigateVideo(1));
        }
    }

    navigateVideo(direction) {
        const newIndex = this.currentVideoIndex + direction;
        
        if (newIndex >= 0 && newIndex < this.videoCards.length) {
            this.currentVideoIndex = newIndex;
            const card = this.videoCards[newIndex];
            const videoSrc = card.getAttribute('data-video');
            const videoTitle = card.querySelector('.card-content h4')?.textContent || 
                             card.querySelector('.video-overlay-title')?.textContent || 
                             'Video';
            
            this.playVideo(videoSrc, videoTitle, newIndex);
        }
    }

    playVideo(videoSrc, title, index) {
        if (this.isMobile && this.mobilePlayer) {
            // Mobile: Show expandable main card
            this.playMobileVideo(videoSrc, title, index);
        } else if (this.mainPlayer) {
            // Desktop: Play in main display
            this.playDesktopVideo(videoSrc, title);
        }
    }

    playMobileVideo(videoSrc, title, index) {
        // Update selected state
        this.videoCards.forEach((card, i) => {
            card.classList.toggle('selected', i === index);
        });

        // Show mobile main video card
        if (this.mobileMainVideo) {
            this.mobileMainVideo.classList.add('active');
            this.mobileMainVideo.classList.remove('closing');
        }

        // Stop current video
        this.mobilePlayer.pause();
        this.mobilePlayer.currentTime = 0;

        // Update video source
        const source = this.mobilePlayer.querySelector('source');
        if (source) {
            source.src = videoSrc;
            this.mobilePlayer.load();
        }

        // Update title
        if (this.mobileTitle) {
            this.mobileTitle.textContent = title;
        }

        // Update navigation buttons
        this.updateMobileNavButtons();

        // Play video immediately
        setTimeout(() => {
            this.mobilePlayer.play().catch(err => {
                console.log('Autoplay prevented:', err);
            });
        }, 100);

        // Scroll to main video card
        setTimeout(() => {
            if (this.mobileMainVideo) {
                this.mobileMainVideo.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 150);

        // Reset idle watch when a new video starts
        this.resetIdleWatch();
    }

    playDesktopVideo(videoSrc, title) {
        // Stop current video
        this.mainPlayer.pause();
        this.mainPlayer.currentTime = 0;

        // Update video source
        const source = this.mainPlayer.querySelector('source');
        if (source) {
            source.src = videoSrc;
            this.mainPlayer.load();
        }

        // Update label
        if (this.mainLabel) {
            this.mainLabel.textContent = title;
        }

        // Play the video
        setTimeout(() => {
            this.mainPlayer.play().catch(err => {
                console.log('Autoplay prevented:', err);
            });
        }, 100);
    }

    updateMobileNavButtons() {
        const prevBtn = document.getElementById('mobile-prev-btn');
        const nextBtn = document.getElementById('mobile-next-btn');

        if (prevBtn) {
            prevBtn.disabled = this.currentVideoIndex === 0;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentVideoIndex === this.videoCards.length - 1;
        }
    }

    setupResponsiveListener() {
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 480;
        });
    }

    // Bind mobile player activity to manage idle timeout
    bindMobilePlayerEvents() {
        if (!this.mobilePlayer || this.mobileEventsBound) return;

        const reset = () => this.resetIdleWatch();

        // Any user interaction or playback progress resets the idle timer
        ['play', 'timeupdate', 'seeking', 'volumechange', 'ratechange', 'click', 'touchstart'].forEach(evt => {
            this.mobilePlayer.addEventListener(evt, reset, { passive: true });
        });

        // When paused, start countdown to collapse
        this.mobilePlayer.addEventListener('pause', () => {
            // If video ended, we'll collapse immediately in 'ended' handler
            if (this.mobilePlayer.ended) return;
            this.startIdleCountdown();
        });

        // When ended, collapse right away
        this.mobilePlayer.addEventListener('ended', () => {
            this.closeMobileMain();
        });

        // Also reset timer if user interacts anywhere inside the mobile card
        if (this.mobileMainVideo) {
            this.mobileMainVideo.addEventListener('touchstart', reset, { passive: true });
            this.mobileMainVideo.addEventListener('mousemove', reset, { passive: true });
        }

        this.mobileEventsBound = true;
    }

    startIdleCountdown() {
        this.clearIdleWatch();
        this.idleTimer = setTimeout(() => {
            // Only collapse if still paused/not playing
            if (this.mobilePlayer && this.mobilePlayer.paused && !this.mobilePlayer.seeking) {
                this.closeMobileMain();
            }
        }, this.idleMs);
    }

    resetIdleWatch() {
        this.clearIdleWatch();
        // Only arm idle timer if player is paused at the moment
        if (this.mobilePlayer && this.mobilePlayer.paused) {
            this.startIdleCountdown();
        }
    }

    clearIdleWatch() {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }

    closeMobileMain() {
        // Stop playback
        if (this.mobilePlayer) {
            try { this.mobilePlayer.pause(); } catch (_) {}
        }
        this.clearIdleWatch();

        // Animate out and hide
        if (this.mobileMainVideo) {
            this.mobileMainVideo.classList.add('closing');
            const onAnimEnd = () => {
                this.mobileMainVideo.classList.remove('active');
                this.mobileMainVideo.classList.remove('closing');
                this.mobileMainVideo.removeEventListener('animationend', onAnimEnd);
            };
            this.mobileMainVideo.addEventListener('animationend', onAnimEnd);
        }

        // Clear selected state on thumbnails
        this.videoCards.forEach(card => card.classList.remove('selected'));
    }
}

// Initialize Video Player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VideoPlayer();
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoPlayer;
}
