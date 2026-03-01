// analytics-tracker.js - Suivi des statistiques du site MiraLocks
// BUGS CORRIGÉS : #7 (boucle infinie waitForSupabase), #16 (détection Edge/Chrome)
(function() {
    'use strict';

    
    // BUG 7 FIX : limite de 50 tentatives max (5 secondes) pour éviter boucle infinie
    function waitForSupabase(callback, attempts) {
        attempts = attempts || 0;
        if (window.SupabaseDB && window.SupabaseDB.client()) {
            callback();
        } else if (attempts < 50) {
            setTimeout(() => waitForSupabase(callback, attempts + 1), 100);
        } else {
            console.warn('⚠️ Analytics : Supabase non disponible après 5s, abandon.');
        }
    }

    function getVisitorInfo() {
        const now = new Date();
        return {
            timestamp: now.toISOString(),
            page: window.location.pathname,
            referrer: document.referrer || 'direct',
            user_agent: navigator.userAgent,
            screen_width: window.screen.width,
            screen_height: window.screen.height,
            device_type: getDeviceType(),
            browser: getBrowser(),
            os: getOS()
        };
    }

    function getDeviceType() {
        const width = window.screen.width;
        if (width <= 600) return 'mobile';
        if (width <= 1024) return 'tablet';
        return 'desktop';
    }

    // BUG 16 FIX : Edge détecté AVANT Chrome (Edge contient "Chrome" dans son UA)
    function getBrowser() {
        const ua = navigator.userAgent;
        if (ua.indexOf('Edg') > -1)     return 'Edge';    // ← avant Chrome obligatoirement
        if (ua.indexOf('OPR') > -1)     return 'Opera';   // ← avant Chrome obligatoirement
        if (ua.indexOf('Opera') > -1)   return 'Opera';
        if (ua.indexOf('Firefox') > -1) return 'Firefox';
        if (ua.indexOf('Chrome') > -1)  return 'Chrome';
        if (ua.indexOf('Safari') > -1)  return 'Safari';
        return 'Other';
    }

    // BUG 16 FIX (partiel) : Android avant Linux (Android contient "Linux")
    function getOS() {
        const ua = navigator.userAgent;
        if (ua.indexOf('Android') > -1)                                   return 'Android';
        if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1)        return 'iOS';
        if (ua.indexOf('Windows') > -1)                                   return 'Windows';
        if (ua.indexOf('Mac') > -1)                                       return 'MacOS';
        if (ua.indexOf('Linux') > -1)                                     return 'Linux';
        return 'Other';
    }

    async function trackPageView() {
        try {
            const visitorInfo = getVisitorInfo();
            const supabase = window.SupabaseDB.client();
            const { error } = await supabase.from('analytics_visits').insert([visitorInfo]);
            if (error) console.error('❌ Erreur enregistrement visite:', error);
            else         } catch (error) {
            console.error('❌ Erreur tracking:', error);
        }
    }

    async function trackEvent(eventType, eventData = {}) {
        try {
            const supabase = window.SupabaseDB.client();
            const eventRecord = {
                timestamp: new Date().toISOString(),
                page: window.location.pathname,
                event_type: eventType,
                event_data: eventData,
                device_type: getDeviceType()
            };
            const { error } = await supabase.from('analytics_events').insert([eventRecord]);
            if (error) console.error('❌ Erreur enregistrement événement:', error);
            else         } catch (error) {
            console.error('❌ Erreur tracking event:', error);
        }
    }

    async function getGlobalStats() {
        try {
            const supabase = window.SupabaseDB.client();
            const { count: totalVisits, error: e1 } = await supabase.from('analytics_visits').select('*', { count: 'exact', head: true });
            if (e1) throw e1;
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const { count: todayVisits, error: e2 } = await supabase.from('analytics_visits').select('*', { count: 'exact', head: true }).gte('timestamp', today.toISOString());
            if (e2) throw e2;
            const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
            const { count: weekVisits, error: e3 } = await supabase.from('analytics_visits').select('*', { count: 'exact', head: true }).gte('timestamp', weekAgo.toISOString());
            if (e3) throw e3;
            const { data: deviceData, error: e4 } = await supabase.from('analytics_visits').select('device_type');
            if (e4) throw e4;
            const deviceStats = {
                mobile:  deviceData.filter(d => d.device_type === 'mobile').length,
                tablet:  deviceData.filter(d => d.device_type === 'tablet').length,
                desktop: deviceData.filter(d => d.device_type === 'desktop').length
            };
            const { data: pageData, error: e5 } = await supabase.from('analytics_visits').select('page');
            if (e5) throw e5;
            const pageCounts = {};
            pageData.forEach(item => { pageCounts[item.page] = (pageCounts[item.page] || 0) + 1; });
            const topPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([page, count]) => ({ page, count }));
            return { totalVisits: totalVisits || 0, todayVisits: todayVisits || 0, weekVisits: weekVisits || 0, deviceStats, topPages };
        } catch (error) {
            console.error('❌ Erreur statistiques:', error);
            return null;
        }
    }

    async function getLast30DaysStats() {
        try {
            const supabase = window.SupabaseDB.client();
            const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const { data, error } = await supabase.from('analytics_visits').select('timestamp').gte('timestamp', thirtyDaysAgo.toISOString()).order('timestamp', { ascending: true });
            if (error) throw error;
            const dailyStats = {};
            data.forEach(visit => {
                const date = new Date(visit.timestamp).toISOString().split('T')[0];
                dailyStats[date] = (dailyStats[date] || 0) + 1;
            });
            return Object.entries(dailyStats).map(([date, count]) => ({ date, count })).sort((a, b) => new Date(a.date) - new Date(b.date));
        } catch (error) {
            console.error('❌ Erreur stats 30 jours:', error);
            return [];
        }
    }

    async function getContentStats() {
        try {
            const supabase = window.SupabaseDB.client();
            const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
            const { count: totalPhotos,  error: e1 } = await supabase.from('photos').select('*', { count: 'exact', head: true }); if (e1) throw e1;
            const { count: totalVideos,  error: e2 } = await supabase.from('videos').select('*', { count: 'exact', head: true }); if (e2) throw e2;
            const { count: totalBlogs,   error: e3 } = await supabase.from('blogs').select('*',  { count: 'exact', head: true }); if (e3) throw e3;
            const { count: recentPhotos, error: e4 } = await supabase.from('photos').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()); if (e4) throw e4;
            const { count: recentVideos, error: e5 } = await supabase.from('videos').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()); if (e5) throw e5;
            const { count: recentBlogs,  error: e6 } = await supabase.from('blogs').select('*',  { count: 'exact', head: true }).gte('date', weekAgo.toISOString()); if (e6) throw e6;
            return { totalPhotos: totalPhotos || 0, totalVideos: totalVideos || 0, totalBlogs: totalBlogs || 0, recentPhotos: recentPhotos || 0, recentVideos: recentVideos || 0, recentBlogs: recentBlogs || 0 };
        } catch (error) {
            console.error('❌ Erreur stats contenu:', error);
            return null;
        }
    }

    waitForSupabase(() => {
        if (!window.location.pathname.includes('admin.html')) {
            trackPageView();
        }
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link && link.href) {
                try {
                    const url = new URL(link.href, window.location.origin);
                    if (url.hostname !== window.location.hostname) {
                        trackEvent('external_link_click', { url: link.href, text: link.textContent.trim() });
                    }
                } catch(err) { /* URL invalide, ignorer */ }
            }
        });
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', function() {
                trackEvent('form_submission', { form_id: form.id || 'unknown' });
            });
        });
            });

    window.MiraLocksAnalytics = { trackEvent, getGlobalStats, getLast30DaysStats, getContentStats };
    
})();
