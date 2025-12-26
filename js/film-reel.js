/**
 * Film Reel - Student Life Section
 * Handles tab switching, film strip animation, and video selection
 * Two separate experiences: Photos (archive) / Videos (story)
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // ========================================
    // TAB SWITCHING
    // ========================================
    const tabs = document.querySelectorAll('.cinema-tab');
    const panels = document.querySelectorAll('.cinema-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            // Update tab states
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update panel states
            panels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === targetTab + '-panel') {
                    panel.classList.add('active');
                }
            });
            
            // Pause video when switching to photos tab
            if (targetTab === 'photos') {
                const mainVideo = document.getElementById('mainVideo');
                if (mainVideo) mainVideo.pause();
            }
        });
    });
    
    // ========================================
    // PHOTOS TAB - Film Strip Animation
    // ========================================
    const filmstrip = document.getElementById('photoFilmstrip');
    
    if (filmstrip) {
        // Pause animation on hover
        filmstrip.addEventListener('mouseenter', function() {
            this.style.animationPlayState = 'paused';
        });
        
        filmstrip.addEventListener('mouseleave', function() {
            this.style.animationPlayState = 'running';
        });
        
        // Touch support for mobile
        filmstrip.addEventListener('touchstart', function() {
            this.style.animationPlayState = 'paused';
        }, { passive: true });
        
        filmstrip.addEventListener('touchend', function() {
            const self = this;
            setTimeout(function() {
                self.style.animationPlayState = 'running';
            }, 3000);
        }, { passive: true });
    }
    
    // ========================================
    // VIDEOS TAB - Video Selection
    // ========================================
    const videoThumbs = document.querySelectorAll('.video-thumb');
    const mainVideo = document.getElementById('mainVideo');
    const leftSideFrame = document.querySelector('.video-side-frame.left img');
    const rightSideFrame = document.querySelector('.video-side-frame.right img');
    
    videoThumbs.forEach(function(thumb, index) {
        thumb.addEventListener('click', function() {
            const videoSrc = this.dataset.video;
            const posterSrc = this.dataset.poster;
            
            // Update active state
            videoThumbs.forEach(function(t) {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            // Update main video
            if (mainVideo) {
                mainVideo.src = videoSrc;
                mainVideo.poster = posterSrc;
                mainVideo.load();
            }
            
            // Update side frames (show adjacent thumbnails)
            const thumbsArray = Array.from(videoThumbs);
            const prevIndex = index > 0 ? index - 1 : thumbsArray.length - 1;
            const nextIndex = index < thumbsArray.length - 1 ? index + 1 : 0;
            
            if (leftSideFrame) {
                leftSideFrame.src = thumbsArray[prevIndex].dataset.poster;
            }
            if (rightSideFrame) {
                rightSideFrame.src = thumbsArray[nextIndex].dataset.poster;
            }
        });
    });
    
    // ========================================
    // ACCESSIBILITY
    // ========================================
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        if (filmstrip) {
            filmstrip.style.animation = 'none';
        }
    }
    
    // Keyboard navigation for tabs
    tabs.forEach(function(tab, index) {
        tab.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                const nextIndex = e.key === 'ArrowRight' 
                    ? (index + 1) % tabs.length 
                    : (index - 1 + tabs.length) % tabs.length;
                tabs[nextIndex].focus();
                tabs[nextIndex].click();
            }
        });
    });
});
