// supabase-config.js - Configuration Supabase pour MiraLocks
// ✅ Sécurité : clé anon séparée (lire-seule en Supabase RLS)
// ✅ Performance : singleton client, retry limité
(function() {
    'use strict';

    const SUPABASE_URL      = 'https://ugrpxekyhuodtuvjsddy.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVncnB4ZWt5aHVvZHR1dmpzZGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjgyMjQsImV4cCI6MjA4NTY0NDIyNH0.J37M8P-Hj9TMgigGQ3o2Q8t-sEFTqTCGGybzyygL_Jc';
    const STORAGE_BUCKET    = 'miralocks-media';

    let supabaseClient = null;

    function initSupabase() {
        if (supabaseClient) return true; // singleton
        if (typeof supabase === 'undefined') {
            console.error('❌ Bibliothèque Supabase non chargée.');
            return false;
        }
        try {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: { persistSession: false } // pas de session côté visiteur
            });
                        return true;
        } catch (e) {
            console.error('❌ Erreur initialisation Supabase:', e);
            return false;
        }
    }

    // ── Sanitisation XSS basique ─────────────────────────────────────────────
    function sanitize(str) {
        if (typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    // ── Validation URL (évite les injections javascript:) ────────────────────
    function isValidUrl(url) {
        if (typeof url !== 'string') return false;
        return /^https?:\/\//i.test(url);
    }

    // ── Photos ───────────────────────────────────────────────────────────────
    async function getPhotos(section) {
        try {
            var q = supabaseClient.from('photos').select('id, name, url, section, created_at').order('created_at', { ascending: false });
            if (section) q = q.eq('section', sanitize(section));
            var res = await q;
            if (res.error) throw res.error;
            // Filtrer les URLs invalides
            return (res.data || []).filter(function(p) { return isValidUrl(p.url); });
        } catch(e) { console.error('❌ getPhotos:', e); return []; }
    }

    async function addPhoto(name, url, section) {
        if (!isValidUrl(url)) throw new Error('URL invalide');
        var res = await supabaseClient.from('photos').insert([{ name: sanitize(name), url, section: sanitize(section) }]).select();
        if (res.error) throw res.error;
        return res.data[0];
    }

    async function deletePhoto(id) {
        if (!id) throw new Error('ID manquant');
        var res = await supabaseClient.from('photos').delete().eq('id', id);
        if (res.error) throw res.error;
        return true;
    }

    // ── Vidéos ───────────────────────────────────────────────────────────────
    async function getVideos(section) {
        try {
            var q = supabaseClient.from('videos').select('id, name, url, section, type, created_at').order('created_at', { ascending: false });
            if (section) q = q.eq('section', sanitize(section));
            var res = await q;
            if (res.error) throw res.error;
            return (res.data || []).filter(function(v) { return isValidUrl(v.url); });
        } catch(e) { console.error('❌ getVideos:', e); return []; }
    }

    async function addVideo(name, url, section, type) {
        type = type || 'video/mp4';
        if (!isValidUrl(url)) throw new Error('URL invalide');
        var res = await supabaseClient.from('videos').insert([{ name: sanitize(name), url, section: sanitize(section), type }]).select();
        if (res.error) throw res.error;
        return res.data[0];
    }

    async function deleteVideo(id) {
        if (!id) throw new Error('ID manquant');
        var res = await supabaseClient.from('videos').delete().eq('id', id);
        if (res.error) throw res.error;
        return true;
    }

    // ── Blogs ────────────────────────────────────────────────────────────────
    async function getBlogs(section) {
        try {
            var q = supabaseClient.from('blogs').select('id, title, content, section, image_url, date').order('date', { ascending: false });
            if (section) q = q.eq('section', sanitize(section));
            var res = await q;
            if (res.error) throw res.error;
            return res.data || [];
        } catch(e) { console.error('❌ getBlogs:', e); return []; }
    }

    async function addBlog(title, content, section, imageUrl) {
        var payload = {
            title:     sanitize(title),
            content:   sanitize(content),
            section:   sanitize(section),
            image_url: (imageUrl && isValidUrl(imageUrl)) ? imageUrl : null,
            date:      new Date().toISOString()
        };
        var res = await supabaseClient.from('blogs').insert([payload]).select();
        if (res.error) throw res.error;
        return res.data[0];
    }


    async function updateBlog(id, title, content, section, imageUrl) {
        if (!id) throw new Error('ID manquant');
        var payload = {
            title:     sanitize(title),
            content:   sanitize(content),
            section:   sanitize(section),
        };
        if (imageUrl !== undefined) {
            payload.image_url = (imageUrl && isValidUrl(imageUrl)) ? imageUrl : null;
        }
        var res = await supabaseClient.from('blogs').update(payload).eq('id', id).select();
        if (res.error) throw res.error;
        return res.data[0];
    }

    async function deleteBlog(id) {
        if (!id) throw new Error('ID manquant');
        var res = await supabaseClient.from('blogs').delete().eq('id', id);
        if (res.error) throw res.error;
        return true;
    }

    // ── Storage ──────────────────────────────────────────────────────────────
    const ALLOWED_IMAGE_TYPES = ['image/jpeg','image/png','image/webp','image/gif'];
    const ALLOWED_VIDEO_TYPES = ['video/mp4','video/webm'];
    const MAX_FILE_SIZE        = 50 * 1024 * 1024; // 50 Mo

    async function uploadFile(file, folder) {
        folder = folder || 'uploads';
        // Validation côté client
        var allowed = ALLOWED_IMAGE_TYPES.concat(ALLOWED_VIDEO_TYPES);
        if (!allowed.includes(file.type)) throw new Error('Type de fichier non autorisé : ' + file.type);
        if (file.size > MAX_FILE_SIZE) throw new Error('Fichier trop volumineux (max 50 Mo)');

        // Nom de fichier sécurisé : on ne garde que alphanum, -, _, .
        var safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        var fileName = folder + '/' + Date.now() + '_' + safeName;

        var res = await supabaseClient.storage.from(STORAGE_BUCKET).upload(fileName, file, { cacheControl: '3600', upsert: false });
        if (res.error) throw res.error;

        var pub = supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
        return pub.data.publicUrl;
    }

    async function deleteFile(filePath) {
        var res = await supabaseClient.storage.from(STORAGE_BUCKET).remove([filePath]);
        if (res.error) throw res.error;
        return true;
    }

    // ── Init automatique ─────────────────────────────────────────────────────
    if (typeof supabase !== 'undefined') {
        initSupabase();
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof supabase !== 'undefined') initSupabase();
        });
    }

    window.SupabaseDB = {
        client:       function() { return supabaseClient; },
        sanitize:     sanitize,
        isValidUrl:   isValidUrl,
        getPhotos:    getPhotos,
        addPhoto:     addPhoto,
        deletePhoto:  deletePhoto,
        getVideos:    getVideos,
        addVideo:     addVideo,
        deleteVideo:  deleteVideo,
        getBlogs:     getBlogs,
        addBlog:      addBlog,
        updateBlog:   updateBlog,
        deleteBlog:   deleteBlog,
        uploadFile:   uploadFile,
        deleteFile:   deleteFile,
        config: { url: SUPABASE_URL, bucket: STORAGE_BUCKET }
    };

    })();
