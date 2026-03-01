// theme-loader.js — MiraLocks
// BUGS CORRIGÉS : #13 (canal realtime jamais unsubscribe — fuite mémoire)
// CLÉ UNIQUE : 'ml_colors' (partagée entre admin et toutes les pages)
(function () {
'use strict';

var KEY = 'ml_colors';

var CSS_MAP = {
  color_primary:    '--gold',
  color_secondary:  '--black',
  color_background: '--white',
  color_text:       '--text',
  color_muted:      '--muted',
  color_accent:     '--accent',
  color_header_bg:  '--header-bg',
  color_footer_bg:  '--footer-bg'
};

var DEFAULTS = {
  '--gold':'#d4af37','--black':'#1a1a1a','--white':'#f8f8f8',
  '--text':'#1a1a1a','--muted':'#666666','--accent':'#c19d2f',
  '--header-bg':'#1a1a1a','--footer-bg':'#1a1a1a'
};

function apply(vars) {
  var r = document.documentElement;
  Object.keys(vars).forEach(function(k){ r.style.setProperty(k, vars[k]); });
}

function read() {
  try { var v = JSON.parse(localStorage.getItem(KEY)); return v && typeof v === 'object' ? v : null; }
  catch(e){ return null; }
}
function write(vars) {
  try { localStorage.setItem(KEY, JSON.stringify(vars)); } catch(e){}
}

function fromRows(rows) {
  var v = Object.assign({}, DEFAULTS);
  rows.forEach(function(r){
    var k = CSS_MAP[r.setting_key];
    if (k && r.setting_value) v[k] = r.setting_value;
  });
  return v;
}

async function fromSupabase() {
  try {
    var db = window.SupabaseDB && window.SupabaseDB.client();
    if (!db) return null;
    var res = await db.from('site_settings')
      .select('setting_key,setting_value')
      .eq('setting_type','color');
    if (res.error || !res.data || !res.data.length) return null;
    var vars = fromRows(res.data);
    write(vars);
    return vars;
  } catch(e){ return null; }
}

function whenReady(fn, n) {
  if (window.SupabaseDB && window.SupabaseDB.client()) return fn();
  if ((n||0) < 100) setTimeout(function(){ whenReady(fn,(n||0)+1); }, 100);
}

var cached = read();
apply(cached || DEFAULTS);

// BUG 13 FIX : stocker la référence du canal pour pouvoir unsubscribe
var realtimeChannel = null;

whenReady(async function() {
  var fresh = await fromSupabase();
  if (fresh) apply(fresh);

  var db = window.SupabaseDB.client();

  // BUG 13 FIX : désabonnement sur beforeunload pour éviter la fuite mémoire
  realtimeChannel = db
    .channel('ml_colors_rt')
    .on('postgres_changes',
      { event:'*', schema:'public', table:'site_settings', filter:'setting_type=eq.color' },
      function(p) {
        if (!p.new) return;
        var cssVar = CSS_MAP[p.new.setting_key];
        if (!cssVar) return;
        document.documentElement.style.setProperty(cssVar, p.new.setting_value);
        var c = read() || Object.assign({}, DEFAULTS);
        c[cssVar] = p.new.setting_value;
        write(c);
      }
    ).subscribe();

  // Nettoyage propre quand l'utilisateur quitte la page
  window.addEventListener('beforeunload', function() {
    if (realtimeChannel) {
      db.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  });
});

window.MiraLocksTheme = {
  save: function(vars) { apply(vars); write(vars); },
  clear: function() {
    ['ml_colors','miralocks_colors','miralocks_colors_v1',
     'miralocks_theme','miralocks_theme_preview']
    .forEach(function(k){ try{localStorage.removeItem(k);}catch(e){} });
  },
  // BUG 13 FIX : exposer unsubscribe pour usage admin si nécessaire
  unsubscribe: function() {
    if (realtimeChannel && window.SupabaseDB) {
      window.SupabaseDB.client().removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  },
  CSS_MAP: CSS_MAP,
  DEFAULTS: DEFAULTS
};

})();
