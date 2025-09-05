/**
 * BCFSleuth Landing Page JavaScript
 * Handles interactive functionality and animations
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
  initializeNavigation();
  initializeAnimations();
  initializeDemoAnimation();
  initializeScrollEffects();
  initializeBCFCarousel();
});

/**
 * Initialize navigation functionality
 */
function initializeNavigation() {
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (mobileToggle && navLinks) {
    // Mobile menu toggle
    mobileToggle.addEventListener('click', function () {
      navLinks.classList.toggle('mobile-open');
      mobileToggle.classList.toggle('active');
    });

    // Close mobile menu when clicking on links
    const navLinkItems = navLinks.querySelectorAll('.nav-link');
    navLinkItems.forEach((link) => {
      link.addEventListener('click', function () {
        navLinks.classList.remove('mobile-open');
        mobileToggle.classList.remove('active');
      });
    });
  }

  // Smooth scrolling for anchor links
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        const navHeight = document.querySelector('.navbar').offsetHeight;
        const targetPosition = targetElement.offsetTop - navHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      }
    });
  });
}

/**
 * Initialize scroll-based animations and effects
 */
function initializeAnimations() {
  // Intersection Observer for fade-in animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);

  // Observe elements for animation
  const animateElements = document.querySelectorAll(
    '.feature-card, .workflow-step, .community-option, .start-option'
  );
  animateElements.forEach((el) => {
    observer.observe(el);
  });

  // Add CSS classes for animations
  addAnimationStyles();
}

/**
 * Add CSS animation styles dynamically
 */
function addAnimationStyles() {
  const style = document.createElement('style');
  style.textContent = `
        .feature-card,
        .workflow-step,
        .community-option,
        .start-option {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s ease;
        }
        
        .feature-card.animate-in,
        .workflow-step.animate-in,
        .community-option.animate-in,
        .start-option.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* Mobile menu styles */
        @media (max-width: 768px) {
            .nav-links {
                position: fixed;
                top: 100%;
                left: 0;
                right: 0;
                background: rgba(255, 255, 255, 0.98);
                backdrop-filter: blur(10px);
                flex-direction: column;
                padding: 2rem;
                border-top: 1px solid rgba(0, 0, 0, 0.1);
                transform: translateY(-100%);
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .nav-links.mobile-open {
                transform: translateY(0);
                opacity: 1;
                visibility: visible;
            }
            
            .mobile-menu-toggle.active span:nth-child(1) {
                transform: rotate(45deg) translate(5px, 5px);
            }
            
            .mobile-menu-toggle.active span:nth-child(2) {
                opacity: 0;
            }
            
            .mobile-menu-toggle.active span:nth-child(3) {
                transform: rotate(-45deg) translate(7px, -6px);
            }
        }
    `;
  document.head.appendChild(style);
}

/**
 * Initialize demo animation sequence
 */
function initializeDemoAnimation() {
  const demoSteps = document.querySelectorAll('.processing-steps .step');
  const demoControls = document.querySelectorAll('.demo-controls .control');

  if (demoSteps.length === 0) return;

  let currentStep = 0;
  const stepDuration = 2000; // 2 seconds per step

  function animateStep() {
    // Remove active class from all steps and controls
    demoSteps.forEach((step) => step.classList.remove('active'));
    demoControls.forEach((control) => control.classList.remove('active'));

    // Add active class to current step and control
    if (demoSteps[currentStep]) {
      demoSteps[currentStep].classList.add('active');
    }
    if (demoControls[0]) {
      // Keep first control active as an indicator
      demoControls[0].classList.add('active');
    }

    // Move to next step
    currentStep = (currentStep + 1) % demoSteps.length;
  }

  // Start animation
  animateStep();
  setInterval(animateStep, stepDuration);
}

/**
 * Initialize scroll effects for navbar and other elements
 */
function initializeScrollEffects() {
  const navbar = document.querySelector('.navbar');
  let lastScrollY = window.scrollY;

  window.addEventListener(
    'scroll',
    function () {
      const currentScrollY = window.scrollY;

      // Navbar background opacity based on scroll
      if (navbar) {
        if (currentScrollY > 50) {
          navbar.style.background = 'rgba(255, 255, 255, 0.98)';
          navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
          navbar.style.background = 'rgba(255, 255, 255, 0.95)';
          navbar.style.boxShadow = 'none';
        }
      }

      // Update last scroll position
      lastScrollY = currentScrollY;
    },
    { passive: true }
  );

  // Parallax effect for hero section
  const hero = document.querySelector('.hero');
  const heroVisual = document.querySelector('.bcf-preview-card');

  if (hero && heroVisual) {
    window.addEventListener(
      'scroll',
      function () {
        const scrolled = window.pageYOffset;
        const heroHeight = hero.offsetHeight;
        const scrollPercent = scrolled / heroHeight;

        if (scrollPercent <= 1) {
          // Subtle parallax movement
          heroVisual.style.transform = `
                    perspective(1000px) 
                    rotateY(-5deg) 
                    rotateX(5deg) 
                    translateY(${scrolled * 0.1}px)
                `;
        }
      },
      { passive: true }
    );
  }
}

/**
 * Initialize BCF carousel functionality with lightbox
 */
function initializeBCFCarousel() {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');
  const slidesContainer = document.querySelector('.carousel-slides');

  // Lightbox elements
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxDescription = document.getElementById('lightbox-description');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');

  if (!slides.length) return;

  let currentSlide = 0;
  let currentLightboxSlide = 0;
  const totalSlides = slides.length;

  // Slide data for lightbox
  const slideData = [
    {
      src: 'BCFSleuth_V01_Phase3c_Advanced Preview.png',
      title: 'Advanced Preview',
      description:
        'Comprehensive data tables with filtering, sorting, and detailed BCF topic information',
    },
    {
      src: 'BCFSleuth_V02_Phase1_Image_Viewer.png',
      title: 'Image Management',
      description:
        'Professional image viewer with bulk download, PDF reports, and lightbox functionality',
    },
    {
      src: 'BCFSleuth_V02_Phase2_Analytics.png',
      title: 'Visual Analytics',
      description:
        'Interactive charts and dashboard with status distribution, priority analysis, and custom reports',
    },
  ];

  function showSlide(index) {
    slides.forEach((slide) => slide.classList.remove('active'));
    dots.forEach((dot) => dot.classList.remove('active'));

    slides[index].classList.add('active');
    dots[index].classList.add('active');

    slidesContainer.style.transform = `translateX(-${index * 100}%)`;
    currentSlide = index;
  }

  function nextSlide() {
    const next = (currentSlide + 1) % totalSlides;
    showSlide(next);
  }

  function prevSlide() {
    const prev = (currentSlide - 1 + totalSlides) % totalSlides;
    showSlide(prev);
  }

  // Lightbox functions
  function openLightbox(slideIndex) {
    currentLightboxSlide = slideIndex;
    updateLightboxContent();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
  }

  function updateLightboxContent() {
    const slide = slideData[currentLightboxSlide];
    lightboxImage.src = slide.src;
    lightboxImage.alt = slide.description;
    lightboxTitle.textContent = slide.title;
    lightboxDescription.textContent = slide.description;
  }

  function nextLightboxSlide() {
    currentLightboxSlide = (currentLightboxSlide + 1) % totalSlides;
    updateLightboxContent();
  }

  function prevLightboxSlide() {
    currentLightboxSlide =
      (currentLightboxSlide - 1 + totalSlides) % totalSlides;
    updateLightboxContent();
  }

  // Event listeners for carousel
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);
  if (prevBtn) prevBtn.addEventListener('click', prevSlide);

  // Dot navigation
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => showSlide(index));
  });

  // Click on images to open lightbox
  slides.forEach((slide, index) => {
    const img = slide.querySelector('img');
    if (img) {
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => openLightbox(index));
    }
  });

  // Lightbox event listeners
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxNext) lightboxNext.addEventListener('click', nextLightboxSlide);
  if (lightboxPrev) lightboxPrev.addEventListener('click', prevLightboxSlide);

  // Close lightbox when clicking outside the image
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }

  // Auto-advance carousel every 5 seconds
  setInterval(nextSlide, 5000);

  // Keyboard navigation for both carousel and lightbox
  document.addEventListener('keydown', (e) => {
    if (lightbox.classList.contains('active')) {
      // Lightbox is open
      if (e.key === 'ArrowLeft') prevLightboxSlide();
      if (e.key === 'ArrowRight') nextLightboxSlide();
      if (e.key === 'Escape') closeLightbox();
    } else {
      // Regular carousel navigation
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    }
  });
}

/**
 * Utility function to add staggered animation delays
 */
function addStaggeredAnimations() {
  const featureCards = document.querySelectorAll('.feature-card');
  const workflowSteps = document.querySelectorAll('.workflow-step');

  // Add staggered delays to feature cards
  featureCards.forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.1}s`;
  });

  // Add staggered delays to workflow steps
  workflowSteps.forEach((step, index) => {
    step.style.transitionDelay = `${index * 0.15}s`;
  });
}

/**
 * Initialize performance monitoring and analytics
 */
function initializeAnalytics() {
  // Track page load performance
  window.addEventListener('load', function () {
    if ('performance' in window) {
      const loadTime =
        performance.timing.loadEventEnd - performance.timing.navigationStart;
      console.log(`Page loaded in ${loadTime}ms`);

      // You can send this data to analytics service
      // trackEvent('page_load_time', loadTime);
    }
  });

  // Track scroll depth
  let maxScrollDepth = 0;
  window.addEventListener(
    'scroll',
    function () {
      const scrollDepth = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) *
          100
      );
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;

        // Track significant scroll milestones
        if (maxScrollDepth >= 25 && maxScrollDepth < 50) {
          console.log('User scrolled 25% of page');
        } else if (maxScrollDepth >= 50 && maxScrollDepth < 75) {
          console.log('User scrolled 50% of page');
        } else if (maxScrollDepth >= 75) {
          console.log('User scrolled 75% of page');
        }
      }
    },
    { passive: true }
  );
}

/**
 * Error handling and fallbacks
 */
function initializeErrorHandling() {
  // Global error handler
  window.addEventListener('error', function (e) {
    console.error('JavaScript error:', e.error);
    // Gracefully handle errors without breaking the page
  });

  // Handle image loading errors
  const images = document.querySelectorAll('img');
  images.forEach((img) => {
    img.addEventListener('error', function () {
      this.style.display = 'none';
      console.warn('Failed to load image:', this.src);
    });
  });
}

/**
 * Accessibility enhancements
 */
function initializeAccessibility() {
  // Add keyboard navigation support
  const focusableElements = document.querySelectorAll(
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  // Enhance focus visibility
  focusableElements.forEach((element) => {
    element.addEventListener('focus', function () {
      this.style.outline = '2px solid #3b82f6';
      this.style.outlineOffset = '2px';
    });

    element.addEventListener('blur', function () {
      this.style.outline = '';
      this.style.outlineOffset = '';
    });
  });

  // Add skip link functionality
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'skip-link';
  skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: #3b82f6;
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 1001;
        transition: top 0.3s;
    `;

  skipLink.addEventListener('focus', function () {
    this.style.top = '6px';
  });

  skipLink.addEventListener('blur', function () {
    this.style.top = '-40px';
  });

  document.body.insertBefore(skipLink, document.body.firstChild);

  // Add main content id for skip link
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    heroSection.id = 'main-content';
  }
}

/**
 * Initialize all functionality
 */
function initializeAll() {
  addStaggeredAnimations();
  initializeAnalytics();
  initializeErrorHandling();
  initializeAccessibility();
}

// Initialize additional functionality after DOM load
document.addEventListener('DOMContentLoaded', initializeAll);

/**
 * Lazy loading for performance
 */
function initializeLazyLoading() {
  if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver(function (
      entries,
      observer
    ) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach((img) => imageObserver.observe(img));
  }
}

// Initialize lazy loading
initializeLazyLoading();
