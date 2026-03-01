// dynamic-colors.js — MiraLocks
// BUGS CORRIGÉS : #4 (clé localStorage incohérente — lit maintenant ml_colors EN PREMIER,
//                       compatible avec theme-loader.js qui écrit dans ml_colors)
// Applique les couleurs AVANT le rendu (zéro flash)
(function () {
  'use strict';

  // BUG 4 FIX : ml_colors en premier (clé unifiée écrite par theme-loader.js)
  // Les anciennes clés sont gardées en fallback pour compatibilité
  var keys = ['ml_colors', 'miralocks_colors', 'miralocks_colors_v1'];

  for (var i = 0; i < keys.length; i++) {
    try {
      var raw = localStorage.getItem(keys[i]);
      if (!raw) continue;
      var p = JSON.parse(raw);
      // ml_colors stocke directement {--gold: ...}
      // miralocks_colors peut stocker {cssVars: {...}} ou {colors: {...}}
      var vars = (keys[i] === 'ml_colors') ? p : (p.cssVars || p.colors || p || null);
      if (!vars || typeof vars !== 'object') continue;
      var root = document.documentElement;
      Object.keys(vars).forEach(function (k) {
        if (k.startsWith('--')) {
          root.style.setProperty(k, vars[k]);
        }
      });
      break; // appliqué, on arrête
    } catch (e) {}
  }

  // Nettoyer les anciennes clés conflictuelles
  try { localStorage.removeItem('miralocks_theme_preview'); } catch (e) {}
})();
