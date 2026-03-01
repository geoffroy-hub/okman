// hamburger-menu.js - Version unique et consolidée pour MiraLocks
// Remplace : hamburger-menu.js + hamburger-menu-fixed.js
(function () {
  'use strict';

  function init() {
    const btn     = document.getElementById('hamburger-btn');
    const nav     = document.getElementById('main-nav');
    const overlay = document.getElementById('nav-overlay');
    const body    = document.body;

    if (!btn || !nav || !overlay) return;

    let open = false;

    function openMenu() {
      open = true;
      btn.classList.add('active');
      nav.classList.add('active');
      overlay.classList.add('active');
      body.style.overflow = 'hidden';
      btn.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
      open = false;
      btn.classList.remove('active');
      nav.classList.remove('active');
      overlay.classList.remove('active');
      body.style.overflow = '';
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      open ? closeMenu() : openMenu();
    });

    overlay.addEventListener('click', closeMenu);

    nav.querySelectorAll('a').forEach(link =>
      link.addEventListener('click', () => setTimeout(closeMenu, 120))
    );

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && open) closeMenu();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 767 && open) closeMenu();
    });
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
