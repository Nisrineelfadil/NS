document.addEventListener('DOMContentLoaded', function() {
    const slider = document.querySelector('.student-slider');
    const dotsContainer = document.querySelector('.slider-dots');
    const prevBtn = document.querySelector('.slider-nav.prev');
    const nextBtn = document.querySelector('.slider-nav.next');
    
    if (!slider) return;
    
    // Simple image array - just the image sources
    const images = [
        'Img/1.webp', 'Img/2.webp', 'Img/3.webp', 'Img/4.webp', 'Img/5.webp',
        'Img/6.webp', 'Img/7.webp', 'Img/8.webp', 'Img/9.webp', 'Img/10.webp',
        'Img/11.webp', 'Img/12.webp', 'Img/13.webp', 'Img/14.webp', 'Img/15.webp'
    ];
    
    let currentSlide = 0;
    let slidesPerView = 3;
    
    // Responsive slides per view
    function updateSlidesPerView() {
        if (window.innerWidth <= 768) {
            slidesPerView = 1;
        } else if (window.innerWidth <= 992) {
            slidesPerView = 2;
        } else {
            slidesPerView = 3;
        }
    }
    
    // Create slider HTML
    function createSlider() {
        slider.innerHTML = '';
        if (dotsContainer) dotsContainer.innerHTML = '';
        
        // Create all slides
        images.forEach((src, index) => {
            const slide = document.createElement('div');
            slide.className = 'student-slide';
            
            const img = document.createElement('img');
            img.src = src;
            img.alt = `Student ${index + 1}`;
            img.className = 'student-image';
            
            slide.appendChild(img);
            slider.appendChild(slide);
        });
        
        // Create dots
        if (dotsContainer) {
            const totalDots = Math.ceil(images.length / slidesPerView);
            for (let i = 0; i < totalDots; i++) {
                const dot = document.createElement('button');
                dot.className = 'slider-dot';
                dot.addEventListener('click', () => goToSlide(i));
                dotsContainer.appendChild(dot);
            }
        }
        
        updateSlider();
    }
    
    // Update slider display
    function updateSlider() {
        const slides = slider.querySelectorAll('.student-slide');
        const dots = dotsContainer ? dotsContainer.querySelectorAll('.slider-dot') : [];
        const totalSlides = Math.ceil(images.length / slidesPerView);
        
        // Ensure currentSlide is within bounds
        currentSlide = Math.max(0, Math.min(currentSlide, totalSlides - 1));
        
        // Hide all slides
        slides.forEach(slide => slide.style.display = 'none');
        
        // Show current slides
        const startIndex = currentSlide * slidesPerView;
        const endIndex = Math.min(startIndex + slidesPerView, images.length);
        
        for (let i = startIndex; i < endIndex; i++) {
            if (slides[i]) {
                slides[i].style.display = 'block';
            }
        }
        
        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
        
        // Update buttons
        if (prevBtn) prevBtn.disabled = currentSlide === 0;
        if (nextBtn) nextBtn.disabled = currentSlide >= totalSlides - 1;
    }
    
    // Navigation functions
    function goToSlide(index) {
        currentSlide = index;
        updateSlider();
    }
    
    function nextSlide() {
        const totalSlides = Math.ceil(images.length / slidesPerView);
        if (currentSlide < totalSlides - 1) {
            currentSlide++;
            updateSlider();
        }
    }
    
    function prevSlide() {
        if (currentSlide > 0) {
            currentSlide--;
            updateSlider();
        }
    }
    
    // Event listeners
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'ArrowRight') nextSlide();
    });
    
    // Handle resize
    window.addEventListener('resize', () => {
        updateSlidesPerView();
        currentSlide = 0;
        updateSlider();
    });
    
    // Initialize
    updateSlidesPerView();
    createSlider();
});
