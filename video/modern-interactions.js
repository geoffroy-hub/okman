// modern-interactions.js - Animations et interactions modernes pour MiraLocks
(function() {
  'use strict';

  console.log('🎨 Modern Interactions initialisé');

  // ============================================
  // SCROLL ANIMATIONS
  // ============================================
  
  // Observer pour les animations au scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const animationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        animationObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observer les éléments
  function observeElements() {
    const elements = document.querySelectorAll('.card, .gallery img, .gallery video, section');
    elements.forEach((el, index) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      animationObserver.observe(el);
    });
  }

  // ============================================
  // HEADER SCROLL EFFECT
  // ============================================
  
  let lastScroll = 0;
  const header = document.querySelector('.header');
  
  function handleHeaderScroll() {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  }

  // ============================================
  // PARALLAX EFFECT
  // ============================================
  
  function handleParallax() {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.hero, .gallery img, .gallery video');
    
    parallaxElements.forEach((element, index) => {
      const speed = 0.5;
      const yPos = -(scrolled * speed);
      
      if (element.classList.contains('hero')) {
        element.style.transform = `translateY(${yPos * 0.3}px)`;
      }
    });
  }

  // ============================================
  // SMOOTH SCROLL
  // ============================================
  
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        
        if (target) {
          const offsetTop = target.offsetTop - 100;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // ============================================
  // IMAGE LAZY LOADING & FADE IN
  // ============================================
  
  function lazyLoadImages() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.style.opacity = '0';
          img.style.transition = 'opacity 0.5s ease';
          
          img.onload = () => {
            img.style.opacity = '1';
          };
          
          imageObserver.unobserve(img);
        }
      });
    });
    
    images.forEach(img => imageObserver.observe(img));
  }

  // ============================================
  // GALLERY LIGHTBOX EFFECT
  // ============================================
  
  function initGalleryLightbox() {
    const galleryImages = document.querySelectorAll('.gallery img, .gallery-photos img');
    
    galleryImages.forEach(img => {
      img.style.cursor = 'pointer';
      
      img.addEventListener('click', function() {
        createLightbox(this.src, this.alt);
      });
    });
  }

  function createLightbox(src, alt) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-backdrop"></div>
      <div class="lightbox-content">
        <img src="${src}" alt="${alt}">
        <button class="lightbox-close" aria-label="Fermer">×</button>
      </div>
    `;
    
    // Styles
    const style = document.createElement('style');
    style.textContent = `
      .lightbox {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
      }
      
      .lightbox-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        backdrop-filter: blur(10px);
      }
      
      .lightbox-content {
        position: relative;
        max-width: 90%;
        max-height: 90%;
        z-index: 1;
        animation: scaleIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      .lightbox-content img {
        max-width: 100%;
        max-height: 90vh;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      }
      
      .lightbox-close {
        position: absolute;
        top: -40px;
        right: -40px;
        width: 50px;
        height: 50px;
        border: none;
        background: rgba(212, 175, 55, 0.9);
        color: #000;
        font-size: 32px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 300;
        line-height: 1;
      }
      
      .lightbox-close:hover {
        transform: rotate(90deg) scale(1.1);
        background: #d4af37;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.8);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      @media (max-width: 767px) {
        .lightbox-close {
          top: -50px;
          right: 10px;
        }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';
    
    // Fermer au clic
    lightbox.querySelector('.lightbox-backdrop').addEventListener('click', () => {
      closeLightbox(lightbox);
    });
    
    lightbox.querySelector('.lightbox-close').addEventListener('click', () => {
      closeLightbox(lightbox);
    });
    
    // Fermer avec ESC
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeLightbox(lightbox);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  function closeLightbox(lightbox) {
    lightbox.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
      lightbox.remove();
      document.body.style.overflow = '';
    }, 300);
  }

  // ============================================
  // FORM ENHANCEMENTS
  // ============================================
  
  function enhanceForms() {
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      // Ajouter animation au focus
      input.addEventListener('focus', function() {
        this.parentElement?.classList.add('focused');
      });
      
      input.addEventListener('blur', function() {
        this.parentElement?.classList.remove('focused');
      });
      
      // Validation en temps réel
      if (input.hasAttribute('required')) {
        input.addEventListener('blur', function() {
          if (!this.value.trim()) {
            this.style.borderColor = '#ef4444';
          } else {
            this.style.borderColor = '#d4af37';
          }
        });
      }
    });
  }

  // ============================================
  // CARDS TILT EFFECT (Desktop uniquement)
  // ============================================
  
  function initCardTilt() {
    if (window.innerWidth <= 768) return; // Désactiver sur mobile
    
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
      card.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
      });
      
      card.addEventListener('mouseleave', function() {
        this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
      });
    });
  }

  // ============================================
  // CURSOR CUSTOM (Desktop uniquement)
  // ============================================
  
  function initCustomCursor() {
    if (window.innerWidth <= 768) return;
    
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);
    
    const style = document.createElement('style');
    style.textContent = `
      .custom-cursor {
        width: 20px;
        height: 20px;
        border: 2px solid #d4af37;
        border-radius: 50%;
        position: fixed;
        pointer-events: none;
        z-index: 10000;
        transition: transform 0.1s ease, opacity 0.3s ease;
        opacity: 0;
      }
      
      .custom-cursor.active {
        opacity: 1;
        transform: scale(1.5);
        background: rgba(212, 175, 55, 0.2);
      }
    `;
    document.head.appendChild(style);
    
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX - 10 + 'px';
      cursor.style.top = e.clientY - 10 + 'px';
      cursor.style.opacity = '1';
    });
    
    document.addEventListener('mouseleave', () => {
      cursor.style.opacity = '0';
    });
    
    // Agrandir sur les éléments cliquables
    const clickables = document.querySelectorAll('a, button, input, .card, .gallery img');
    clickables.forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('active'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
    });
  }

  // ============================================
  // LOADING ANIMATION
  // ============================================
  
  function showLoadingAnimation() {
    const loader = document.createElement('div');
    loader.className = 'page-loader';
    loader.innerHTML = `
      <div class="loader-content">
        <div class="loader-spinner"></div>
        <p>MiraLocks</p>
      </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      .page-loader {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeOut 0.5s ease 1s forwards;
      }
      
      .loader-content {
        text-align: center;
      }
      
      .loader-spinner {
        width: 60px;
        height: 60px;
        border: 4px solid rgba(212, 175, 55, 0.2);
        border-top-color: #d4af37;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 20px;
      }
      
      .loader-content p {
        font-size: 24px;
        font-weight: 700;
        background: linear-gradient(135deg, #d4af37 0%, #f4d77e 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-family: Georgia, serif;
        letter-spacing: 0.1em;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      @keyframes fadeOut {
        to {
          opacity: 0;
          visibility: hidden;
        }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(loader);
    
    setTimeout(() => {
      loader.remove();
    }, 1500);
  }

  // ============================================
  // SCROLL PROGRESS BAR
  // ============================================
  
  function initScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);
    
    const style = document.createElement('style');
    style.textContent = `
      .scroll-progress {
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, #d4af37 0%, #f4d77e 100%);
        z-index: 10001;
        transform-origin: left;
        transform: scaleX(0);
        transition: transform 0.1s ease;
      }
    `;
    document.head.appendChild(style);
    
    window.addEventListener('scroll', () => {
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (window.scrollY / windowHeight);
      progressBar.style.transform = `scaleX(${scrolled})`;
      progressBar.style.width = '100%';
    });
  }

  // ============================================
  // INTERSECTION ANIMATIONS
  // ============================================
  
  function initIntersectionAnimations() {
    const sections = document.querySelectorAll('section');
    
    sections.forEach((section, index) => {
      section.style.opacity = '0';
      section.style.transform = 'translateY(50px)';
      section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      section.style.transitionDelay = `${index * 0.1}s`;
    });
    
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          sectionObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    sections.forEach(section => sectionObserver.observe(section));
  }

  // ============================================
  // INITIALISATION
  // ============================================
  
  function init() {
    console.log('🎨 Initialisation des interactions modernes...');
    
    // Loading animation
    showLoadingAnimation();
    
    // Attendre que le DOM soit chargé
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAll);
    } else {
      initAll();
    }
  }

  function initAll() {
    // Scroll effects
    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    window.addEventListener('scroll', handleParallax, { passive: true });
    
    // Initialiser les fonctionnalités
    observeElements();
    initSmoothScroll();
    lazyLoadImages();
    initGalleryLightbox();
    enhanceForms();
    initCardTilt();
    initCustomCursor();
    initScrollProgress();
    initIntersectionAnimations();
    
    console.log('✅ Toutes les interactions modernes sont actives');
  }

  // Lancer l'initialisation
  init();

  // Exposer certaines fonctions publiquement
  window.MiraLocksModern = {
    reinitAnimations: observeElements,
    createLightbox: createLightbox
  };

})();
