// cookie-banner.js — Bandeau consentement cookies MiraLocks
// BUGS CORRIGÉS : #12 (listener keydown non retiré après clic bouton)
(function () {
  'use strict';

  var CONSENT_KEY = 'miralocks_cookie_consent';
  var CONSENT_VER = '1';

  function hasConsent() {
    try {
      var v = JSON.parse(localStorage.getItem(CONSENT_KEY));
      return v && v.version === CONSENT_VER;
    } catch(e) { return false; }
  }

  function saveConsent(accepted) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        accepted: accepted,
        version:  CONSENT_VER,
        date:     new Date().toISOString()
      }));
    } catch(e) {}
  }

  function removeBanner() {
    var b = document.getElementById('ml-cookie-banner');
    if (b) {
      b.style.transform = 'translateY(100%)';
      b.style.opacity   = '0';
      setTimeout(function(){ if(b.parentNode) b.parentNode.removeChild(b); }, 400);
    }
  }

  function createBanner() {
    if (hasConsent()) return;

    var banner = document.createElement('div');
    banner.id = 'ml-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Consentement cookies');
    banner.setAttribute('aria-live', 'polite');

    banner.innerHTML = [
      '<div class="ml-cookie-inner">',
        '<div class="ml-cookie-text">',
          '<span class="ml-cookie-icon">🍪</span>',
          '<div>',
            '<strong>Ce site utilise des cookies techniques</strong>',
            '<p>Nous utilisons uniquement des cookies essentiels pour mémoriser vos préférences de thème.',
            'Aucun cookie publicitaire ou de suivi externe.</p>',
            '<a href="confidentialite.html">En savoir plus →</a>',
          '</div>',
        '</div>',
        '<div class="ml-cookie-btns">',
          '<button id="ml-cookie-accept" class="ml-btn-accept">✅ Accepter</button>',
          '<button id="ml-cookie-refuse" class="ml-btn-refuse">Refuser</button>',
        '</div>',
      '</div>'
    ].join('');

    var style = document.createElement('style');
    style.textContent = [
      '#ml-cookie-banner {',
        'position: fixed;',
        'bottom: 0; left: 0; right: 0;',
        'z-index: 99990;',
        'background: rgba(12,51,32,0.97);',
        'backdrop-filter: blur(10px);',
        '-webkit-backdrop-filter: blur(10px);',
        'padding: 16px 20px;',
        'box-shadow: 0 -4px 24px rgba(0,0,0,.25);',
        'transform: translateY(100%);',
        'opacity: 0;',
        'transition: transform .4s cubic-bezier(.4,0,.2,1), opacity .4s ease;',
        'border-top: 2px solid var(--gold, #c9a84c);',
      '}',
      '#ml-cookie-banner.visible { transform: translateY(0); opacity: 1; }',
      '.ml-cookie-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; gap: 20px; flex-wrap: wrap; justify-content: space-between; }',
      '.ml-cookie-text { display: flex; align-items: flex-start; gap: 14px; flex: 1; min-width: 250px; }',
      '.ml-cookie-icon { font-size: 1.8rem; flex-shrink: 0; line-height: 1.2; }',
      '.ml-cookie-text strong { color: var(--gold, #c9a84c); font-size: .95rem; display: block; margin-bottom: 4px; }',
      '.ml-cookie-text p { color: rgba(255,255,255,.8); font-size: .82rem; line-height: 1.5; margin: 0 0 6px; }',
      '.ml-cookie-text a { color: var(--gold, #c9a84c); font-size: .82rem; text-decoration: none; }',
      '.ml-cookie-text a:hover { text-decoration: underline; }',
      '.ml-cookie-btns { display: flex; gap: 10px; flex-shrink: 0; flex-wrap: wrap; }',
      '.ml-btn-accept { background: var(--gold, #c9a84c); color: #0c3320; border: none; padding: 10px 22px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: .9rem; transition: all .25s; white-space: nowrap; }',
      '.ml-btn-accept:hover { background: #e8d080; transform: translateY(-1px); }',
      '.ml-btn-refuse { background: transparent; color: rgba(255,255,255,.7); border: 1px solid rgba(255,255,255,.3); padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: .85rem; transition: all .25s; white-space: nowrap; }',
      '.ml-btn-refuse:hover { border-color: rgba(255,255,255,.6); color: #fff; }',
      '@supports (padding: max(0px)) { #ml-cookie-banner { padding-bottom: max(16px, calc(env(safe-area-inset-bottom) + 16px)); } }',
      '@media (max-width: 600px) { .ml-cookie-inner { flex-direction: column; gap: 14px; } .ml-cookie-btns { width: 100%; } .ml-btn-accept, .ml-btn-refuse { flex: 1; text-align: center; } }'
    ].join('');

    document.head.appendChild(style);
    document.body.appendChild(banner);
    setTimeout(function(){ banner.classList.add('visible'); }, 800);

    // BUG 12 FIX : handler Escape stocké pour pouvoir être retiré dans tous les cas
    function escapeHandler(e) {
      if(e.key === 'Escape'){
        saveConsent(false);
        removeBanner();
        document.removeEventListener('keydown', escapeHandler); // ← retiré proprement
      }
    }
    document.addEventListener('keydown', escapeHandler);

    // Bouton accepter — BUG 12 FIX : retire aussi le listener Escape
    document.getElementById('ml-cookie-accept').addEventListener('click', function(){
      saveConsent(true);
      removeBanner();
      document.removeEventListener('keydown', escapeHandler); // ← retiré ici aussi
          });

    // Bouton refuser — BUG 12 FIX : retire aussi le listener Escape
    document.getElementById('ml-cookie-refuse').addEventListener('click', function(){
      saveConsent(false);
      removeBanner();
      document.removeEventListener('keydown', escapeHandler); // ← retiré ici aussi
          });
  }

  window.MiraLocksCookies = {
    reset: function(){
      try { localStorage.removeItem(CONSENT_KEY); } catch(e){}
      location.reload();
    },
    hasConsent: hasConsent
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createBanner);
  } else {
    createBanner();
  }

})();
