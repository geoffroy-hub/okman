// modern-interactions.js — MiraLocks
// ✅ Animation d'intro "MiraLocks" SUPPRIMÉE
// ✅ Vieux lightbox interne SUPPRIMÉ (géré par lightbox-swipe.js)
// ✅ Optimisé pour tous les appareils
(function () {
  'use strict';

  // ─── HEADER : effet au scroll ───────────────────────────────────────────────
  function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          header.classList.toggle('scrolled', window.pageYOffset > 80);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // ─── BARRE DE PROGRESSION AU SCROLL — SUPPRIMÉE ────────────────────────────
  function initScrollProgress() {
    // Désactivée : suppression de la barre de défilement en haut de page
  }

  // ─── SMOOTH SCROLL ancres #hash ────────────────────────────────────────────
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          window.scrollTo({ top: target.offsetTop - 100, behavior: 'smooth' });
        }
      });
    });
  }

  // ─── APPARITION AU SCROLL — désactivé mobile pour perf ─────────────────────
  function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;
    if (window.innerWidth <= 767) return;
    if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.card, .gallery-section').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(28px)';
      el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
      obs.observe(el);
    });
  }

  // ─── LAZY IMAGES fade ───────────────────────────────────────────────────────
  function initLazyImages() {
    if (!('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const img = e.target;
          img.style.transition = 'opacity 0.4s ease';
          img.addEventListener('load', () => { img.style.opacity = '1'; }, { once: true });
          if (img.complete) img.style.opacity = '1';
          obs.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      img.style.opacity = '0';
      obs.observe(img);
    });
  }

  // ─── VALIDATION FORMULAIRES ─────────────────────────────────────────────────
  function initForms() {
    document.querySelectorAll('input[required], textarea[required], select[required]').forEach(f => {
      f.addEventListener('blur', function () {
        this.style.borderColor = this.value.trim() ? 'var(--gold,#d4af37)' : '#ef4444';
      });
      f.addEventListener('input', function () {
        if (this.value.trim()) this.style.borderColor = 'var(--gold,#d4af37)';
      });
    });
  }

  // ─── TILT CARDS — desktop uniquement ────────────────────────────────────────
  function initCardTilt() {
    if (window.innerWidth <= 1024) return;
    if (window.matchMedia('(hover:none)').matches) return;
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('mousemove', function (e) {
        const r = this.getBoundingClientRect();
        const x = (e.clientX - r.left  - r.width  / 2) / 14;
        const y = (e.clientY - r.top   - r.height / 2) / 14;
        this.style.transform = 'perspective(900px) rotateX(' + (-y) + 'deg) rotateY(' + x + 'deg) translateY(-6px)';
      });
      card.addEventListener('mouseleave', function () { this.style.transform = ''; });
    });
  }

  // ─── CURSEUR CUSTOM — DÉSACTIVÉ ─────────────────────────────────────────────
  // Supprimé : on utilise le curseur natif du navigateur
  function initCustomCursor() {}

  // ─── INIT ───────────────────────────────────────────────────────────────────
  function init() {
    initHeaderScroll();
    initScrollProgress();
    initSmoothScroll();
    initScrollReveal();
    initLazyImages();
    initForms();
    initCardTilt();
    initCustomCursor();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();

  window.MiraLocksModern = { reinit: init };
})();
