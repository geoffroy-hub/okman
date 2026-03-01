// content-loader-supabase.js - Charge le contenu depuis Supabase
// ✅ Sécurité : sanitisation XSS sur tous les contenus injectés
(function() {
    'use strict';

    // ── Sanitisation HTML (évite les injections XSS) ─────────────────────────
    function esc(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
    }

    // ── Validation URL (accepte uniquement http/https) ───────────────────────
    function isValidUrl(url) {
        return typeof url === 'string' && /^https?:\/\//i.test(url);
    }

    // ── Supprimer le loader de chargement ────────────────────────────────────
    function removeLoader(galleryElement) {
        var loader = galleryElement.querySelector('.gallery-loading');
        if (loader) loader.remove();
    }

    // ── Chargement photos ─────────────────────────────────────────────────────
    async function loadPhotosInGallery(galleryElement, section) {
        if (!galleryElement) return;
        try {
            var photos = await SupabaseDB.getPhotos(section);

            // Si pas de photos pour cette section, essayer sans filtre (toutes sections)
            if (photos.length === 0 && section) {
                console.warn('⚠️ Aucune photo pour section "' + section + '", chargement de toutes les photos…');
                photos = await SupabaseDB.getPhotos(null);
            }

            // Supprimer le spinner
            removeLoader(galleryElement);

            if (photos.length === 0) {
                // Fallback visuel si vraiment aucune photo
                galleryElement.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted,#5a7a66)">' +
                    '<div style="font-size:36px;margin-bottom:10px">📸</div>' +
                    '<p>Les photos arrivent bientôt…</p>' +
                    '<a href="rendezvous.html" class="cta" style="margin-top:16px;display:inline-block">Prendre rendez-vous</a>' +
                    '</div>';
                return;
            }

            photos.forEach(function(photo) {
                if (!isValidUrl(photo.url)) return;
                var wrapper = document.createElement('div');
                wrapper.className = 'gallery-item';
                var img = document.createElement('img');
                img.src    = photo.url;
                img.alt    = esc(photo.name || 'Photo MiraLocks');
                img.loading = 'lazy';
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.5s ease';
                img.onload  = function() { setTimeout(function() { img.style.opacity = '1'; }, 100); };
                img.onerror = function() { wrapper.style.display = 'none'; };
                wrapper.appendChild(img);
                galleryElement.appendChild(wrapper);
            });
            
            // Recharger le lightbox si disponible pour inclure les nouvelles photos
            if (window.MiraLocksLightbox && typeof window.MiraLocksLightbox.reload === 'function') {
                setTimeout(function() { window.MiraLocksLightbox.reload(); }, 300);
            }
        } catch(e) {
            removeLoader(galleryElement);
            console.error('❌ loadPhotosInGallery:', e);
        }
    }

    // ── Chargement vidéos ─────────────────────────────────────────────────────
    async function loadVideosInGallery(galleryElement, section) {
        if (!galleryElement) return;
        try {
            var videos = await SupabaseDB.getVideos(section);
            if (videos.length === 0 && section) videos = await SupabaseDB.getVideos(null);
            removeLoader(galleryElement);
            if (videos.length === 0) return;
            videos.forEach(function(video) {
                if (!isValidUrl(video.url)) return;
                var wrapper = document.createElement('div');
                wrapper.className = 'gallery-item video';
                var videoEl = document.createElement('video');
                videoEl.preload    = 'metadata';
                videoEl.playsInline = true;
                videoEl.setAttribute('controlslist', 'nodownload');
                videoEl.style.opacity    = '0';
                videoEl.style.transition = 'opacity 0.5s ease';
                var source = document.createElement('source');
                source.src  = video.url;
                source.type = /^video\/(mp4|webm)$/.test(video.type) ? video.type : 'video/mp4';
                videoEl.appendChild(source);
                videoEl.addEventListener('loadeddata', function() {
                    setTimeout(function() { videoEl.style.opacity = '1'; }, 100);
                });
                wrapper.appendChild(videoEl);
                galleryElement.appendChild(wrapper);
            });
                    } catch(e) { console.error('❌ loadVideosInGallery:', e); }
    }

    // ── Chargement articles blog ──────────────────────────────────────────────
    async function loadBlogPosts(container, section, limit) {
        if (!container) return;
        try {
            var blogs = await SupabaseDB.getBlogs(section);
            if (limit && limit > 0) blogs = blogs.slice(0, limit);
            if (blogs.length === 0) return;
            container.innerHTML = '';
            blogs.forEach(function(blog, index) {
                var article = document.createElement('article');
                article.className = 'card fade-in';
                article.style.cssText = 'margin-bottom:20px;opacity:0;transform:translateY(20px);transition:all 0.5s ease';

                var date = new Date(blog.date).toLocaleDateString('fr-FR', { year:'numeric', month:'long', day:'numeric' });

                // Image : uniquement si URL valide
                var imgHtml = '';
                if (blog.image_url && isValidUrl(blog.image_url)) {
                    imgHtml = '<img src="' + esc(blog.image_url) + '" alt="' + esc(blog.title) + '" style="width:100%;max-height:300px;object-fit:cover;border-radius:8px;margin-bottom:15px" loading="lazy">';
                }

                // Contenu : on utilise textContent pour sécuriser
                article.innerHTML = imgHtml +
                    '<h3>' + esc(blog.title) + '</h3>' +
                    '<p class="muted" style="font-size:14px;margin:8px 0">📅 ' + esc(date) + '</p>';

                var contentP = document.createElement('p');
                contentP.style.cssText = 'margin-top:12px;white-space:pre-wrap';
                contentP.textContent = blog.content; // textContent = sécurisé
                article.appendChild(contentP);

                container.appendChild(article);
                setTimeout(function() {
                    article.style.opacity   = '1';
                    article.style.transform = 'translateY(0)';
                }, index * 100);
            });
                    } catch(e) { console.error('❌ loadBlogPosts:', e); }
    }

    // ── Fonctions par page ────────────────────────────────────────────────────
    async function loadHomePageContent() {
        // Photos : chercher d'abord section 'home', puis 'gallery', puis toutes
        var homePhotos = document.querySelector('.gallery-photos');
        if (homePhotos) {
            var photos = await SupabaseDB.getPhotos('home');
            if (photos.length === 0) photos = await SupabaseDB.getPhotos('gallery');
            if (photos.length === 0) photos = await SupabaseDB.getPhotos(null);

            // Supprimer le spinner
            var loader = homePhotos.querySelector('.gallery-loading');
            if (loader) loader.remove();

            if (photos.length > 0) {
                // Limiter à 8 photos max sur l'accueil
                photos.slice(0, 8).forEach(function(photo) {
                    if (!isValidUrl(photo.url)) return;
                    var wrapper = document.createElement('div');
                    wrapper.className = 'gallery-item';
                    var img = document.createElement('img');
                    img.src = photo.url;
                    img.alt = esc(photo.name || 'Photo MiraLocks');
                    img.loading = 'lazy';
                    img.style.opacity = '0';
                    img.style.transition = 'opacity 0.5s ease';
                    img.onload  = function() { setTimeout(function(){ img.style.opacity='1'; }, 80); };
                    img.onerror = function() { wrapper.style.display = 'none'; };
                    wrapper.appendChild(img);
                    homePhotos.appendChild(wrapper);
                });
                                // Recharger le lightbox
                if (window.MiraLocksLightbox) setTimeout(function(){ window.MiraLocksLightbox.reload(); }, 400);
            } else {
                homePhotos.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted,#5a7a66)">' +
                    '<div style="font-size:36px;margin-bottom:10px">📸</div>' +
                    '<p>Les photos arrivent bientôt…</p>' +
                    '<a href="gallery.html" class="cta" style="margin-top:16px;display:inline-block">Voir la galerie →</a>' +
                    '</div>';
            }
        }

        var homeVideos = document.querySelector('.gallery-videos');
        if (homeVideos) await loadVideosInGallery(homeVideos, 'home');

        var blogSection = document.getElementById('home-blog-section');
        if (blogSection) {
            var blogContainer = blogSection.querySelector('div');
            if (blogContainer) {
                await loadBlogPosts(blogContainer, 'home', 3);
                blogSection.style.display = blogContainer.children.length > 0 ? 'block' : 'none';
            }
        }
    }

    async function loadGalleryPageContent() {
        var photosGallery = document.querySelector('.gallery-photos');
        if (photosGallery) await loadPhotosInGallery(photosGallery, 'gallery');
        var videosGallery = document.querySelector('.gallery-videos');
        if (videosGallery) await loadVideosInGallery(videosGallery, 'gallery');
    }

    async function loadServicesPageContent() {
        var servicesGallery = document.querySelector('#services-gallery');
        if (servicesGallery) {
            await loadPhotosInGallery(servicesGallery, 'services');
            await loadVideosInGallery(servicesGallery, 'services');
        }
    }

    async function loadBlogPageContent() {
        // ── Cibler le slot Supabase uniquement, jamais le container entier ──────
        // Le container #blog-posts-container contient des articles permanents (HTML)
        // On injecte les articles Supabase UNIQUEMENT dans #blog-supabase-slot
        var supabaseSlot = document.getElementById('blog-supabase-slot');
        if (!supabaseSlot) {
            // Fallback : si la structure ancienne est encore là, on fait rien pour ne pas écraser
            console.warn('⚠️ #blog-supabase-slot introuvable — articles permanents préservés');
            return;
        }
        try {
            var blogs = await SupabaseDB.getBlogs('blog-page');
            if (!blogs || blogs.length === 0) {
                supabaseSlot.style.display = 'none'; // slot vide, on le masque proprement
                return;
            }
            supabaseSlot.innerHTML = ''; // vider uniquement le slot Supabase
            supabaseSlot.style.display = 'grid';
            blogs.forEach(function(blog, index) {
                var article = document.createElement('article');
                article.className = 'card fade-in';
                article.setAttribute('data-blog-id', blog.id);
                article.style.cssText = 'display:flex;flex-direction:column;opacity:0;transform:translateY(20px);transition:all 0.5s ease';
                var date = new Date(blog.date).toLocaleDateString('fr-FR', { year:'numeric', month:'long', day:'numeric' });
                var imgHtml = '';
                if (blog.image_url && isValidUrl(blog.image_url)) {
                    imgHtml = '<img src="' + esc(blog.image_url) + '" alt="' + esc(blog.title) + '" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;margin-bottom:14px" loading="lazy">';
                }
                article.innerHTML = imgHtml +
                    '<p class="muted" style="font-size:.82rem;margin-bottom:6px">🗓️ ' + esc(date) + '</p>' +
                    '<h3 style="margin-bottom:10px">' + esc(blog.title) + '</h3>';
                var contentP = document.createElement('p');
                contentP.className = 'muted';
                contentP.style.cssText = 'flex:1;line-height:1.75;white-space:pre-wrap';
                contentP.textContent = blog.content;
                article.appendChild(contentP);
                supabaseSlot.appendChild(article);
                setTimeout(function() {
                    article.style.opacity = '1';
                    article.style.transform = 'translateY(0)';
                }, index * 100);
            });
                    } catch(e) {
            console.error('❌ loadBlogPageContent:', e);
        }
    }

    // ── Attendre Supabase ─────────────────────────────────────────────────────
    // Protection boucle infinie : max 60 tentatives (6 secondes)
    function waitForSupabase(callback, attempts) {
        attempts = attempts || 0;
        if (window.SupabaseDB && window.SupabaseDB.client()) {
            callback();
        } else if (attempts < 60) {
            setTimeout(function() { waitForSupabase(callback, attempts + 1); }, 100);
        } else {
            console.warn('⚠️ ContentLoader : Supabase non disponible après 6s — contenu statique affiché.');
        }
    }

    // ── Initialisation ────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function() {
        waitForSupabase(function() {
            var page = window.location.pathname.split('/').pop() || 'index.html';
            setTimeout(async function() {
                if (page === 'index.html' || page === '' || page === '/') {
                    await loadHomePageContent();
                } else if (page === 'gallery.html') {
                    await loadGalleryPageContent();
                } else if (page === 'services.html') {
                    await loadServicesPageContent();
                } else if (page === 'blog.html') {
                    await loadBlogPageContent();
                }
            }, 200);
        });
    });

    window.MiraLocksContent = {
        loadPhotos:    loadPhotosInGallery,
        loadVideos:    loadVideosInGallery,
        loadBlogs:     loadBlogPosts,
        reloadHome:    loadHomePageContent,
        reloadGallery: loadGalleryPageContent,
        reloadServices:loadServicesPageContent,
        reloadBlog:    loadBlogPageContent
    };

    // BUG 5 FIX : dispatcher un événement custom quand le contenu est chargé
    // lightbox-swipe.js écoute cet événement pour se recharger automatiquement
    function dispatchContentLoaded() {
        document.dispatchEvent(new CustomEvent('miralocks:content-loaded'));
    }
    // Exposer pour usage interne
    window.MiraLocksContent.dispatchLoaded = dispatchContentLoaded;
})();
