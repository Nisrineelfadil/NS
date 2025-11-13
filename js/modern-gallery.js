// Modern Gallery - 3 Cards + Main Display
class ModernGallery {
    constructor() {
        this.photos = [];
        this.currentIndex = 0;
        this.selectedPhotoIndex = 0;
        this.autoplayInterval = null;
        this.init();
    }

    init() {
        this.loadPhotosData();
        this.setupEventListeners();
        this.updateDisplay();
        this.startAutoplay();
    }

    loadPhotosData() {
        const photosData = document.querySelectorAll('.photos-data div');
        this.photos = Array.from(photosData).map(item => ({
            src: item.getAttribute('data-src'),
            title: item.getAttribute('data-title')
        }));
    }

    setupEventListeners() {
        const prevBtn = document.querySelector('.arrow-btn.prev');
        const nextBtn = document.querySelector('.arrow-btn.next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previous());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.next());
        }

        this.setupCardClickListeners();

        // Instagram link
        const instagramLink = document.querySelector('.instagram-link');
        if (instagramLink) {
            instagramLink.addEventListener('click', () => {
                window.open('https://www.instagram.com/nisrinegermanschool/', '_blank');
            });
        }
    }

    next() {
        this.resetAutoplay();
        const itemsPerPage = 3; // Always show 3 items at a time
        if (this.currentIndex + itemsPerPage < this.photos.length) {
            this.currentIndex += itemsPerPage;
            this.updateDisplay(false); // Don't reset main photo
        }
    }

    previous() {
        this.resetAutoplay();
        if (this.currentIndex > 0) {
            const itemsPerPage = 3; // Always show 3 items at a time
            this.currentIndex = Math.max(0, this.currentIndex - itemsPerPage);
            this.updateDisplay(false); // Don't reset main photo
        }
    }

    selectPhoto(index) {
        this.resetAutoplay();
        if (index >= 0 && index < this.photos.length) {
            this.selectedPhotoIndex = index;
            this.updateMainDisplay(this.selectedPhotoIndex);

            // Update active class on cards
            document.querySelectorAll('.gallery-card').forEach(card => {
                const cardIndex = this.currentIndex + parseInt(card.getAttribute('data-index'));
                if (cardIndex === this.selectedPhotoIndex) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
        }
    }

    startAutoplay() {
        this.autoplayInterval = setInterval(() => {
            this.selectedPhotoIndex = (this.selectedPhotoIndex + 1) % this.photos.length;
            
            // If the selected photo moves out of the current 3-card view, update the view
            if (this.selectedPhotoIndex < this.currentIndex || this.selectedPhotoIndex >= this.currentIndex + 3) {
                this.currentIndex = Math.floor(this.selectedPhotoIndex / 3) * 3;
                this.updateDisplay(true);
            } else {
                this.updateMainDisplay(this.selectedPhotoIndex);
            }
        }, 3000); // Change image every 3 seconds
    }

    resetAutoplay() {
        clearInterval(this.autoplayInterval);
        this.startAutoplay();
    }

    updateDisplay(updateMainPhoto = true) {
        this.updateThreeCards();
        if (updateMainPhoto) {
            this.updateMainDisplay(this.currentIndex);
        }
        this.updateButtons();
        this.setupCardClickListeners(); // Re-attach listeners after update
    }

    setupCardClickListeners() {
        document.querySelectorAll('.gallery-card').forEach(card => {
            // Remove old listener to prevent duplicates
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);

            newCard.addEventListener('click', () => {
                const cardIndex = this.currentIndex + parseInt(newCard.getAttribute('data-index'));
                this.selectPhoto(cardIndex);
            });
        });
    }

    updateThreeCards() {
        const cards = document.querySelectorAll('.gallery-card');
        const itemsToShow = 3; // Always show 3 items
        
        cards.forEach((card, index) => {
            const photoIndex = this.currentIndex + index;
            
            if (index < itemsToShow && photoIndex < this.photos.length) {
                const photo = this.photos[photoIndex];
                const img = card.querySelector('img');
                const label = card.querySelector('.card-label');
                
                if (img) {
                    img.src = photo.src;
                    img.alt = photo.title;
                }
                if (label) {
                    label.textContent = photo.title;
                }
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    updateMainDisplay(index) {
        const photo = this.photos[index];
        if (!photo) return;

        const mainImg = document.getElementById('main-display-img');
        const mainLabel = document.getElementById('main-card-label');

        if (mainImg) {
            mainImg.style.opacity = '0';
            setTimeout(() => {
                mainImg.src = photo.src;
                mainImg.alt = photo.title;
                mainImg.style.opacity = '1';
            }, 250);
        }

        if (mainLabel) {
            mainLabel.textContent = photo.title;
        }
    }

    updateButtons() {
        const prevBtn = document.querySelector('.arrow-btn.prev');
        const nextBtn = document.querySelector('.arrow-btn.next');
        const itemsPerPage = 3; // Always 3 items per page

        if (prevBtn) {
            prevBtn.style.opacity = this.currentIndex > 0 ? '1' : '0.5';
            prevBtn.style.pointerEvents = this.currentIndex > 0 ? 'auto' : 'none';
        }

        if (nextBtn) {
            const hasMore = this.currentIndex + itemsPerPage < this.photos.length;
            nextBtn.style.opacity = hasMore ? '1' : '0.5';
            nextBtn.style.pointerEvents = hasMore ? 'auto' : 'none';
        }
    }
}

// Video Gallery Class
class VideoGallery {
    constructor() {
        this.videos = [];
        this.currentIndex = 0;
        this.init();
    }

    init() {
        this.loadVideosData();
        this.setupEventListeners();
        this.updateDisplay();
    }

    loadVideosData() {
        const videoCards = document.querySelectorAll('.video-cards-container .video-card');
        this.videos = Array.from(videoCards).map((card, index) => ({
            element: card,
            index: index
        }));
    }

    setupEventListeners() {
        const videoGallery = document.querySelector('.video-gallery');
        if (!videoGallery) return;

        const prevBtn = videoGallery.querySelector('.arrow-btn.prev');
        const nextBtn = videoGallery.querySelector('.arrow-btn.next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previous());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.next());
        }
    }

    next() {
        const itemsPerPage = 3; // Always show 3 items at a time
        if (this.currentIndex + itemsPerPage < this.videos.length) {
            this.currentIndex += itemsPerPage;
            this.updateDisplay();
        }
    }

    previous() {
        if (this.currentIndex > 0) {
            const itemsPerPage = 3; // Always show 3 items at a time
            this.currentIndex = Math.max(0, this.currentIndex - itemsPerPage);
            this.updateDisplay();
        }
    }

    updateDisplay() {
        const itemsToShow = 3; // Always show 3 items

        this.videos.forEach((video, index) => {
            const shouldShow = index >= this.currentIndex && index < this.currentIndex + itemsToShow;
            video.element.style.display = shouldShow ? 'block' : 'none';
        });

        this.updateButtons();
    }

    updateButtons() {
        const videoGallery = document.querySelector('.video-gallery');
        if (!videoGallery) return;

        const prevBtn = videoGallery.querySelector('.arrow-btn.prev');
        const nextBtn = videoGallery.querySelector('.arrow-btn.next');
        const itemsPerPage = 3; // Always 3 items per page

        if (prevBtn) {
            prevBtn.style.opacity = this.currentIndex > 0 ? '1' : '0.5';
            prevBtn.style.pointerEvents = this.currentIndex > 0 ? 'auto' : 'none';
        }

        if (nextBtn) {
            const hasMore = this.currentIndex + itemsPerPage < this.videos.length;
            nextBtn.style.opacity = hasMore ? '1' : '0.5';
            nextBtn.style.pointerEvents = hasMore ? 'auto' : 'none';
        }
    }
}

// Initialize Modern Gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ModernGallery();
    new VideoGallery();
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModernGallery, VideoGallery };
}
