// Video Gallery Functionality - Matches Photo Gallery Design

class VideoGallery {
    constructor() {
        this.currentIndex = 0;
        this.videos = [];
        this.init();
    }

    init() {
        // Get all video data
        const videosData = document.querySelector('.videos-data');
        if (!videosData) return;

        const videoElements = videosData.querySelectorAll('[data-src]');
        this.videos = Array.from(videoElements).map(el => ({
            src: el.getAttribute('data-src'),
            title: el.getAttribute('data-title')
        }));

        // Setup click handlers for video cards
        this.setupVideoCards();
        
        // Setup navigation arrows
        this.setupNavigation();
        
        // Initialize first video
        this.updateMainDisplay();
    }

    setupVideoCards() {
        const videoCards = document.querySelectorAll('.video-gallery .video-card');
        videoCards.forEach((card, index) => {
            card.setAttribute('data-index', index);
            card.addEventListener('click', () => {
                this.currentIndex = index;
                this.updateMainDisplay();
                this.updateVisibleCards();
            });
        });
    }

    setupNavigation() {
        const prevBtn = document.querySelector('.video-gallery .arrow-btn.prev');
        const nextBtn = document.querySelector('.video-gallery .arrow-btn.next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.navigate(-1));
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.navigate(1));
        }
    }

    navigate(direction) {
        this.currentIndex += direction;
        
        // Loop around
        if (this.currentIndex < 0) {
            this.currentIndex = this.videos.length - 1;
        } else if (this.currentIndex >= this.videos.length) {
            this.currentIndex = 0;
        }

        this.updateMainDisplay();
        this.updateVisibleCards();
    }

    updateMainDisplay() {
        const mainIframe = document.getElementById('main-video-iframe');
        const mainLabel = document.getElementById('main-video-label');

        if (mainIframe && this.videos[this.currentIndex]) {
            mainIframe.src = this.videos[this.currentIndex].src;
        }

        if (mainLabel && this.videos[this.currentIndex]) {
            mainLabel.textContent = this.videos[this.currentIndex].title;
        }
    }

    updateVisibleCards() {
        const container = document.querySelector('.video-gallery .video-cards-container');
        if (!container) return;

        // Clear current cards
        container.innerHTML = '';

        // Show 3 cards: current, next, next+1
        for (let i = 0; i < 3; i++) {
            const index = (this.currentIndex + i) % this.videos.length;
            const video = this.videos[index];

            const card = document.createElement('div');
            card.className = 'video-card';
            card.setAttribute('data-index', index);
            
            // Create thumbnail with play overlay instead of iframe
            card.innerHTML = `
                <div class="card-video video-thumbnail">
                    <iframe src="${video.src}" 
                            allowtransparency="true" 
                            allowfullscreen="true" 
                            frameborder="0" 
                            scrolling="no"
                            style="pointer-events: none;">
                    </iframe>
                    <div class="video-overlay">
                        <i class="fas fa-play-circle"></i>
                    </div>
                </div>
                <div class="card-content">
                    <h4>${video.title}</h4>
                </div>
            `;

            card.addEventListener('click', () => {
                this.currentIndex = index;
                this.updateMainDisplay();
                this.updateVisibleCards();
            });

            container.appendChild(card);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit to ensure the tab content is loaded
    setTimeout(() => {
        new VideoGallery();
    }, 100);
});

// Re-initialize when videos tab is clicked
document.addEventListener('DOMContentLoaded', () => {
    const videosTabButton = document.querySelector('[data-tab="videos"]');
    if (videosTabButton) {
        videosTabButton.addEventListener('click', () => {
            setTimeout(() => {
                new VideoGallery();
            }, 200);
        });
    }
});
