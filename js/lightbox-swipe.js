// lightbox-swipe.js - Lightbox complet photos + vidéos avec swipe
// Version corrigée : navigation photos→vidéos, sélecteurs adaptés, pas de conflit video-player
(function () {
  'use strict';

  let currentIndex = 0;
  let mediaItems = [];
  let startX = 0;
  let currentX = 0;
  let isDragging = false;

  // ─── CRÉATION DU LIGHTBOX ───────────────────────────────────────────────────
  function createLightbox() {
    if (document.getElementById('lightbox-swipe')) return;

    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox-swipe';
    lightbox.className = 'lightbox-swipe';
    lightbox.innerHTML = `
      <button class="lightbox-close" id="lightbox-close" aria-label="Fermer">✕</button>
      <button class="lightbox-nav lightbox-prev" id="lightbox-prev" aria-label="Précédent">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <button class="lightbox-nav lightbox-next" id="lightbox-next" aria-label="Suivant">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
      <div class="lightbox-media-container" id="lightbox-media-container">
        <div class="lightbox-media-wrapper" id="lightbox-media-wrapper"></div>
      </div>
      <div class="lightbox-counter" id="lightbox-counter">1 / 1</div>
      <div class="lightbox-type-badge" id="lightbox-type-badge"></div>
      <div class="lightbox-swipe-hint" id="lightbox-swipe-hint">⬅️ Swipe pour naviguer ➡️</div>
    `;
    document.body.appendChild(lightbox);

    // Styles intégrés pour le lightbox
    const style = document.createElement('style');
    style.textContent = `
      .lightbox-swipe {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.95);
        z-index: 99999;
        align-items: center;
        justify-content: center;
        flex-direction: column;
      }
      .lightbox-swipe.active { display: flex; }

      .lightbox-close {
        position: absolute;
        top: 16px; right: 20px;
        background: rgba(255,255,255,0.15);
        border: none;
        color: #fff;
        font-size: 24px;
        width: 44px; height: 44px;
        border-radius: 50%;
        cursor: pointer;
        z-index: 10;
        display: flex; align-items: center; justify-content: center;
        transition: background 0.2s;
      }
      .lightbox-close:hover { background: rgba(255,255,255,0.3); }

      .lightbox-nav {
        position: absolute;
        top: 50%; transform: translateY(-50%);
        background: rgba(255,255,255,0.12);
        border: none; color: #fff;
        width: 52px; height: 52px;
        border-radius: 50%;
        cursor: pointer;
        z-index: 10;
        display: flex; align-items: center; justify-content: center;
        transition: background 0.2s;
      }
      .lightbox-nav:hover { background: rgba(255,255,255,0.28); }
      .lightbox-prev { left: 16px; }
      .lightbox-next { right: 16px; }

      .lightbox-media-container {
        width: 100%; height: 100%;
        display: flex; align-items: center; justify-content: center;
        padding: 60px 80px;
        box-sizing: border-box;
        overflow: hidden;
      }
      .lightbox-media-wrapper {
        display: flex; align-items: center; justify-content: center;
        width: 100%; height: 100%;
        transition: transform 0.3s ease;
      }
      .lightbox-media {
        max-width: 100%;
        max-height: 80vh;
        border-radius: 10px;
        object-fit: contain;
        box-shadow: 0 20px 60px rgba(0,0,0,0.6);
      }
      .lightbox-media[controls] { max-height: 75vh; width: 100%; }

      .lightbox-counter {
        position: absolute;
        bottom: 16px; left: 50%;
        transform: translateX(-50%);
        background: rgba(255,255,255,0.15);
        color: #fff;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
      }
      .lightbox-type-badge {
        position: absolute;
        top: 16px; left: 20px;
        background: var(--gold, #d4af37);
        color: #1a1a1a;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .lightbox-swipe-hint {
        position: absolute;
        bottom: 50px;
        left: 50%; transform: translateX(-50%);
        background: rgba(255,255,255,0.1);
        color: rgba(255,255,255,0.7);
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 12px;
        transition: opacity 1s ease;
        pointer-events: none;
      }
      @media (max-width: 767px) {
        .lightbox-media-container { padding: 50px 10px; }
        .lightbox-prev { left: 6px; }
        .lightbox-next { right: 6px; }
        .lightbox-nav { width: 40px; height: 40px; }
      }

      /* Rendre les items cliquables */
      .gallery-item img,
      .gallery-photos img {
        cursor: pointer;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .gallery-item img:hover,
      .gallery-photos img:hover {
        transform: scale(1.03);
        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
      }
      .gallery-item.video { cursor: pointer; }
      .gallery-item.video::after {
        content: '▶';
        position: absolute;
        inset: 0;
        display: flex; align-items: center; justify-content: center;
        font-size: 40px;
        color: rgba(255,255,255,0.9);
        background: rgba(0,0,0,0.3);
        border-radius: inherit;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s;
      }
      .gallery-item.video:hover::after { opacity: 1; }
    `;
    document.head.appendChild(style);
  }

  // ─── COLLECTER TOUS LES MÉDIAS ──────────────────────────────────────────────
  // FIX : sélecteurs élargis pour couvrir toutes les structures HTML possibles
  function collectMediaItems() {
    mediaItems = [];

    // ── Photos : gallery-item img OU img directement dans gallery-photos
    const photoSelectors = [
      '.gallery-photos .gallery-item img',
      '.gallery-photos img',
      '.gallery .gallery-item img'
    ];
    const seenImgs = new Set();
    photoSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(img => {
        if (!seenImgs.has(img)) {
          seenImgs.add(img);
          mediaItems.push({ type: 'image', src: img.src, alt: img.alt || 'Photo MiraLocks', element: img });
        }
      });
    });

    // ── Vidéos : gallery-item.video video OU gallery-videos video
    const videoSelectors = [
      '.gallery-videos .gallery-item video',
      '.gallery-videos video',
      '.gallery .gallery-item.video video',
      '.gallery .gallery-item video'
    ];
    const seenVids = new Set();
    videoSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(vid => {
        if (!seenVids.has(vid)) {
          seenVids.add(vid);
          const source = vid.querySelector('source');
          const src = source ? source.src : vid.src;
          if (src) {
            mediaItems.push({ type: 'video', src, alt: 'Vidéo MiraLocks', element: vid });
          }
        }
      });
    });

        return mediaItems;
  }

  // ─── AFFICHER UN MÉDIA ──────────────────────────────────────────────────────
  function showMedia(index) {
    const wrapper = document.getElementById('lightbox-media-wrapper');
    const counter = document.getElementById('lightbox-counter');
    const badge   = document.getElementById('lightbox-type-badge');
    if (!wrapper || index < 0 || index >= mediaItems.length) return;

    // Arrêter toute vidéo en cours
    wrapper.querySelectorAll('video').forEach(v => { v.pause(); v.currentTime = 0; });

    currentIndex = index;
    const item = mediaItems[index];
    wrapper.innerHTML = '';

    let el;
    if (item.type === 'image') {
      el = document.createElement('img');
      el.src = item.src;
      el.alt = item.alt;
      el.className = 'lightbox-media';
      badge.textContent = '📸 Photo';
    } else {
      el = document.createElement('video');
      el.controls = true;
      el.autoplay = true;
      el.playsInline = true;
      el.className = 'lightbox-media';
      const src = document.createElement('source');
      src.src = item.src;
      src.type = 'video/mp4';
      el.appendChild(src);
      badge.textContent = '🎥 Vidéo';
    }

    wrapper.appendChild(el);
    counter.textContent = `${index + 1} / ${mediaItems.length}`;

    // Afficher/masquer boutons nav
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');
    const show = mediaItems.length > 1;
    prevBtn.style.display = show ? 'flex' : 'none';
    nextBtn.style.display = show ? 'flex' : 'none';
  }

  // ─── OUVRIR / FERMER ────────────────────────────────────────────────────────
  function openLightbox(index) {
    const lb = document.getElementById('lightbox-swipe');
    if (!lb) return;
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
    showMedia(index);

    // Cacher le hint après 3s
    const hint = document.getElementById('lightbox-swipe-hint');
    if (hint) setTimeout(() => { hint.style.opacity = '0'; }, 3000);
  }

  function closeLightbox() {
    const lb = document.getElementById('lightbox-swipe');
    if (!lb) return;
    lb.classList.remove('active');
    document.body.style.overflow = '';
    lb.querySelectorAll('video').forEach(v => { v.pause(); v.currentTime = 0; });

    // Remettre le hint visible pour la prochaine ouverture
    const hint = document.getElementById('lightbox-swipe-hint');
    if (hint) hint.style.opacity = '1';
  }

  // ─── NAVIGATION ─────────────────────────────────────────────────────────────
  function showPrev() { showMedia(currentIndex > 0 ? currentIndex - 1 : mediaItems.length - 1); }
  function showNext() { showMedia(currentIndex < mediaItems.length - 1 ? currentIndex + 1 : 0); }

  // ─── SWIPE TACTILE ──────────────────────────────────────────────────────────
  function onTouchStart(e) {
    startX = e.touches[0].clientX;
    currentX = startX;
    isDragging = true;
  }
  function onTouchMove(e) {
    if (!isDragging) return;
    currentX = e.touches[0].clientX;
    const w = document.getElementById('lightbox-media-wrapper');
    if (w) { w.style.transform = `translateX(${currentX - startX}px)`; w.style.transition = 'none'; }
  }
  function onTouchEnd() {
    if (!isDragging) return;
    isDragging = false;
    const w = document.getElementById('lightbox-media-wrapper');
    const diff = currentX - startX;
    if (w) { w.style.transition = 'transform 0.3s ease'; w.style.transform = 'translateX(0)'; }
    if (Math.abs(diff) > 50) { diff > 0 ? showPrev() : showNext(); }
  }

  // ─── ATTACHER LES LISTENERS SUR LES MÉDIAS ─────────────────────────────────
  function attachMediaListeners() {
    mediaItems.forEach((item, index) => {
      const el = item.element;

      // Pour les vidéos on clique sur le parent .gallery-item pour éviter conflit avec les contrôles natifs
      if (item.type === 'video') {
        const parent = el.closest('.gallery-item');
        if (parent) {
          // Désactiver les contrôles natifs sur la page (ils s'ouvrent dans le lightbox)
          el.controls = false;
          parent.style.cursor = 'pointer';
          parent.style.position = 'relative';
          parent.addEventListener('click', (e) => {
            e.preventDefault();
            openLightbox(index);
          });
        }
      } else {
        el.style.cursor = 'pointer';
        el.addEventListener('click', (e) => { e.preventDefault(); openLightbox(index); });
      }
    });
  }

  // ─── INITIALISATION ─────────────────────────────────────────────────────────
  function init() {
    createLightbox();
    collectMediaItems();
    attachMediaListeners();

    const lb          = document.getElementById('lightbox-swipe');
    const closeBtn    = document.getElementById('lightbox-close');
    const prevBtn     = document.getElementById('lightbox-prev');
    const nextBtn     = document.getElementById('lightbox-next');
    const container   = document.getElementById('lightbox-media-container');

    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });

    lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });

    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('active')) return;
      if (e.key === 'Escape')      closeLightbox();
      if (e.key === 'ArrowLeft')   showPrev();
      if (e.key === 'ArrowRight')  showNext();
    });

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove',  onTouchMove,  { passive: true });
    container.addEventListener('touchend',   onTouchEnd,   { passive: true });

      }

  // BUG 5 FIX : init après chargement Supabase via événement custom
  // content-loader-supabase.js doit dispatcher 'miralocks:content-loaded' quand terminé
  function waitAndInit() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(init, 800));
    } else {
      setTimeout(init, 800);
    }
    // Écouter l'événement de fin de chargement Supabase pour recharger le lightbox
    document.addEventListener('miralocks:content-loaded', function() {
      if (window.MiraLocksLightbox) {
        window.MiraLocksLightbox.reload();
              }
    });
  }
  waitAndInit();

  // API publique
  window.MiraLocksLightbox = {
    reload: () => { collectMediaItems(); attachMediaListeners();  },
    open:   openLightbox,
    close:  closeLightbox
  };

})();
