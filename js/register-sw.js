// register-sw.js — Enregistrement du Service Worker MiraLocks
// À inclure dans toutes les pages HTML (avant </body>)
(function () {
  'use strict';

  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(function (reg) {
        
        // Vérifier les mises à jour
        reg.addEventListener('updatefound', function () {
          var newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', function () {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nouveau contenu disponible — notifier discrètement
              showUpdateNotice();
            }
          });
        });
      })
      .catch(function (err) {
        console.warn('[SW] Échec d\'enregistrement :', err);
      });

    // Écouter les changements de contrôleur (page rechargée avec nouveau SW)
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      window.location.reload();
    });
  });

  function showUpdateNotice() {
    // Bannière discrète de mise à jour
    var notice = document.createElement('div');
    notice.id = 'sw-update-notice';
    notice.innerHTML = [
      '<span>🔄 Une mise à jour du site est disponible.</span>',
      '<button id="sw-update-btn">Actualiser</button>',
      '<button id="sw-dismiss-btn" aria-label="Fermer">✕</button>'
    ].join('');

    var style = document.createElement('style');
    style.textContent = [
      '#sw-update-notice {',
        'position: fixed; top: 16px; left: 50%; transform: translateX(-50%);',
        'z-index: 99999;',
        'background: #0c3320; color: #fff;',
        'padding: 12px 20px; border-radius: 10px;',
        'box-shadow: 0 8px 24px rgba(0,0,0,.3);',
        'display: flex; align-items: center; gap: 14px;',
        'font-size: .9rem; border: 1px solid var(--gold, #c9a84c);',
        'animation: slideDown .4s ease;',
        'white-space: nowrap;',
      '}',
      '@keyframes slideDown { from { opacity:0; transform: translateX(-50%) translateY(-20px); } }',
      '#sw-update-btn {',
        'background: var(--gold, #c9a84c); color: #0c3320;',
        'border: none; padding: 6px 14px; border-radius: 6px;',
        'font-weight: 700; cursor: pointer; font-size: .88rem;',
      '}',
      '#sw-dismiss-btn {',
        'background: none; border: none; color: rgba(255,255,255,.6);',
        'cursor: pointer; font-size: 1rem; padding: 2px 4px;',
      '}',
      '@media (max-width: 480px) {',
        '#sw-update-notice { left: 16px; right: 16px; transform: none; white-space: normal; flex-wrap: wrap; }',
      '}'
    ].join('');

    document.head.appendChild(style);
    document.body.appendChild(notice);

    document.getElementById('sw-update-btn').addEventListener('click', function () {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
    });

    document.getElementById('sw-dismiss-btn').addEventListener('click', function () {
      notice.remove();
    });
  }

})();
