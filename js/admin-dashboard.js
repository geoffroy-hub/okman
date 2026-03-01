// admin-dashboard-enhanced.js - Dashboard admin amélioré avec édition
(function() {
    'use strict';

    console.log('🚀 Admin Dashboard Enhanced chargé');

    // ============================================
    // VARIABLES GLOBALES
    // ============================================
    let currentEditingBlog = null;

    // ============================================
    // GESTION DES BLOGS AVEC ÉDITION
    // ============================================

    /**
     * Charge et affiche tous les blogs avec options d'édition
     */
    async function loadAllBlogs() {
        const container = document.getElementById('blogsList');
        if (!container) return;

        try {
            const blogs = await SupabaseDB.getBlogs();
            
            if (blogs.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <p style="font-size: 48px; margin-bottom: 20px;">📝</p>
                        <p>Aucun article publié pour le moment.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = '';

            blogs.forEach(blog => {
                const article = document.createElement('div');
                article.className = 'blog-item';
                article.style.cssText = `
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    margin-bottom: 15px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                `;

                const date = new Date(blog.date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                article.innerHTML = `
                    ${blog.image_url ? `
                        <img src="${blog.image_url}" 
                             alt="${blog.title}" 
                             style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;">
                    ` : ''}
                    <h3 style="color: #333; margin-bottom: 10px; font-size: 1.3rem;">${blog.title}</h3>
                    <p style="color: #666; margin-bottom: 10px; font-size: 0.9rem;">
                        📅 ${date} • 📍 ${getSectionLabel(blog.section)}
                    </p>
                    <p style="color: #555; margin-bottom: 15px; line-height: 1.6; white-space: pre-wrap;">
                        ${blog.content.substring(0, 200)}${blog.content.length > 200 ? '...' : ''}
                    </p>
                    <div class="blog-actions" style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="editBlog('${blog.id}')" 
                                style="flex: 1; min-width: 120px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s ease;">
                            ✏️ Modifier
                        </button>
                        <button onclick="deleteBlogConfirm('${blog.id}')" 
                                style="flex: 1; min-width: 120px; padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s ease;">
                            🗑️ Supprimer
                        </button>
                    </div>
                `;

                container.appendChild(article);
            });

            console.log(`✅ ${blogs.length} blogs affichés`);

        } catch (error) {
            console.error('❌ Erreur chargement blogs:', error);
            showStatus('Erreur lors du chargement des articles', 'error');
        }
    }

    /**
     * Obtenir le label d'une section
     */
    function getSectionLabel(section) {
        const labels = {
            'home': '🏠 Accueil',
            'blog-page': '📰 Page Blog',
            'services': '💼 Services',
            'gallery': '🖼️ Galerie'
        };
        return labels[section] || section;
    }

    /**
     * Éditer un blog
     */
    window.editBlog = async function(blogId) {
        try {
            // Récupérer les données du blog
            const blogs = await SupabaseDB.getBlogs();
            const blog = blogs.find(b => b.id === blogId);
            
            if (!blog) {
                showStatus('Article introuvable', 'error');
                return;
            }

            // Stocker l'ID du blog en cours d'édition
            currentEditingBlog = blogId;

            // Passer à l'onglet de création/édition
            document.querySelector('.tab-btn[onclick*="blog"]').click();

            // Remplir le formulaire avec les données existantes
            document.getElementById('blogTitle').value = blog.title;
            document.getElementById('blogContent').value = blog.content;
            document.getElementById('blogSection').value = blog.section;

            // Afficher l'image si elle existe
            if (blog.image_url) {
                const preview = document.getElementById('blogImagePreview');
                if (preview) {
                    preview.innerHTML = `
                        <img src="${blog.image_url}" 
                             style="max-width: 100%; max-height: 300px; border-radius: 8px; margin-top: 10px;">
                        <p style="margin-top: 8px; font-size: 0.9rem; color: #666;">Image actuelle (vous pouvez en télécharger une nouvelle pour la remplacer)</p>
                    `;
                    preview.style.display = 'block';
                }
            }

            // Changer le texte du bouton
            const submitBtn = document.querySelector('#blogForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '✏️ Mettre à jour l\'article';
                submitBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }

            // Ajouter un bouton pour annuler l'édition
            let cancelBtn = document.getElementById('cancel-edit-btn');
            if (!cancelBtn) {
                cancelBtn = document.createElement('button');
                cancelBtn.id = 'cancel-edit-btn';
                cancelBtn.type = 'button';
                cancelBtn.innerHTML = '❌ Annuler la modification';
                cancelBtn.style.cssText = `
                    width: 100%;
                    padding: 12px 24px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    margin-top: 10px;
                    transition: all 0.3s ease;
                `;
                cancelBtn.onclick = cancelEditBlog;
                
                const form = document.getElementById('blogForm');
                form.appendChild(cancelBtn);
            }
            cancelBtn.style.display = 'block';

            showStatus('Mode édition activé - Modifiez les champs et cliquez sur "Mettre à jour"', 'info');
            
            // Scroller vers le formulaire
            document.getElementById('blogForm').scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            console.error('❌ Erreur édition blog:', error);
            showStatus('Erreur lors de l\'édition', 'error');
        }
    };

    /**
     * Annuler l'édition d'un blog
     */
    window.cancelEditBlog = function() {
        currentEditingBlog = null;
        
        // Réinitialiser le formulaire
        document.getElementById('blogForm').reset();
        
        // Réinitialiser le bouton
        const submitBtn = document.querySelector('#blogForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '📝 Publier l\'article';
            submitBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }

        // Cacher le bouton d'annulation
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) {
            cancelBtn.style.display = 'none';
        }

        // Cacher l'aperçu d'image
        const preview = document.getElementById('blogImagePreview');
        if (preview) {
            preview.style.display = 'none';
            preview.innerHTML = '';
        }

        showStatus('Édition annulée', 'info');
    };

    /**
     * Supprimer un blog avec confirmation
     */
    window.deleteBlogConfirm = async function(blogId) {
        if (!confirm('⚠️ Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.')) {
            return;
        }

        try {
            await SupabaseDB.deleteBlog(blogId);
            showStatus('Article supprimé avec succès', 'success');
            await loadAllBlogs();
        } catch (error) {
            console.error('❌ Erreur suppression blog:', error);
            showStatus('Erreur lors de la suppression', 'error');
        }
    };

    /**
     * Soumettre le formulaire de blog (création ou mise à jour)
     */
    async function handleBlogSubmit(e) {
        e.preventDefault();

        const title = document.getElementById('blogTitle').value.trim();
        const content = document.getElementById('blogContent').value.trim();
        const section = document.getElementById('blogSection').value;
        const imageFile = document.getElementById('blogImage').files[0];

        if (!title || !content || !section) {
            showStatus('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        try {
            let imageUrl = null;

            // Upload de l'image si fournie
            if (imageFile) {
                showStatus('Upload de l\'image en cours...', 'info');
                imageUrl = await SupabaseDB.uploadFile(imageFile, 'blog-images');
            } else if (currentEditingBlog) {
                // Si on édite et qu'aucune nouvelle image n'est fournie, garder l'ancienne
                const blogs = await SupabaseDB.getBlogs();
                const existingBlog = blogs.find(b => b.id === currentEditingBlog);
                if (existingBlog) {
                    imageUrl = existingBlog.image_url;
                }
            }

            if (currentEditingBlog) {
                // MISE À JOUR
                showStatus('Mise à jour de l\'article...', 'info');
                
                await SupabaseDB.updateBlog(currentEditingBlog, title, content, section, imageUrl);

                showStatus('✅ Article mis à jour avec succès !', 'success');
                currentEditingBlog = null;
            } else {
                // CRÉATION
                showStatus('Publication de l\'article...', 'info');
                await SupabaseDB.addBlog(title, content, section, imageUrl);
                showStatus('✅ Article publié avec succès !', 'success');
            }

            // Réinitialiser le formulaire
            e.target.reset();
            cancelEditBlog();

            // Recharger la liste
            await loadAllBlogs();

            // Masquer l'aperçu
            const preview = document.getElementById('blogImagePreview');
            if (preview) {
                preview.style.display = 'none';
                preview.innerHTML = '';
            }

        } catch (error) {
            console.error('❌ Erreur:', error);
            showStatus('❌ Erreur lors de l\'opération', 'error');
        }
    }

    /**
     * Aperçu de l'image avant upload
     */
    function handleBlogImagePreview(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('blogImagePreview');
        
        if (!preview) {
            // Créer le conteneur d'aperçu s'il n'existe pas
            const previewDiv = document.createElement('div');
            previewDiv.id = 'blog-image-preview';
            previewDiv.style.marginTop = '15px';
            e.target.parentNode.appendChild(previewDiv);
        }

        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('blogImagePreview').innerHTML = `
                    <img src="${event.target.result}" 
                         style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                    <p style="margin-top: 8px; font-size: 0.9rem; color: #666;">Aperçu de la nouvelle image</p>
                `;
                document.getElementById('blogImagePreview').style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }

    /**
     * Afficher un message de statut
     */
    function showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('status-message') || createStatusDiv();
        
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };

        statusDiv.textContent = message;
        statusDiv.style.background = colors[type] || colors.info;
        statusDiv.style.display = 'block';
        statusDiv.style.opacity = '1';

        setTimeout(() => {
            statusDiv.style.opacity = '0';
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 300);
        }, 5000);
    }

    /**
     * Créer le div de statut s'il n'existe pas
     */
    function createStatusDiv() {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'status-message';
        statusDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: #17a2b8;
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-weight: 600;
            display: none;
            opacity: 0;
            transition: opacity 0.3s ease;
            max-width: 400px;
        `;
        document.body.appendChild(statusDiv);
        return statusDiv;
    }

    // ============================================
    // GESTION DES PHOTOS
    // ============================================

    /**
     * Charge et affiche toutes les photos
     */
    async function loadAllPhotos() {
        const container = document.getElementById('photosList');
        if (!container) return;

        try {
            const photos = await SupabaseDB.getPhotos();
            
            if (photos.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <p style="font-size: 48px; margin-bottom: 20px;">📷</p>
                        <p>Aucune photo pour le moment.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = '';
            
            const grid = document.createElement('div');
            grid.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 20px;
            `;

            photos.forEach(photo => {
                const item = document.createElement('div');
                item.style.cssText = `
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                `;

                item.innerHTML = `
                    <img src="${photo.url}" 
                         alt="${photo.name}" 
                         style="width: 100%; height: 200px; object-fit: cover;">
                    <div style="padding: 15px;">
                        <p style="font-size: 0.9rem; color: #666; margin-bottom: 10px;">
                            📍 ${getSectionLabel(photo.section)}
                        </p>
                        <button onclick="deletePhotoConfirm('${photo.id}')" 
                                style="width: 100%; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                            🗑️ Supprimer
                        </button>
                    </div>
                `;

                grid.appendChild(item);
            });

            container.appendChild(grid);
            console.log(`✅ ${photos.length} photos affichées`);

        } catch (error) {
            console.error('❌ Erreur chargement photos:', error);
        }
    }

    /**
     * Supprimer une photo avec confirmation
     */
    window.deletePhotoConfirm = async function(photoId) {
        if (!confirm('⚠️ Supprimer cette photo ?')) return;

        try {
            await SupabaseDB.deletePhoto(photoId);
            showStatus('Photo supprimée', 'success');
            await loadAllPhotos();
        } catch (error) {
            console.error('❌ Erreur:', error);
            showStatus('Erreur lors de la suppression', 'error');
        }
    };

    // ============================================
    // GESTION DES VIDÉOS
    // ============================================

    /**
     * Charge et affiche toutes les vidéos
     */
    async function loadAllVideos() {
        const container = document.getElementById('videosList');
        if (!container) return;

        try {
            const videos = await SupabaseDB.getVideos();
            
            if (videos.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <p style="font-size: 48px; margin-bottom: 20px;">🎥</p>
                        <p>Aucune vidéo pour le moment.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = '';
            
            const grid = document.createElement('div');
            grid.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 20px;
            `;

            videos.forEach(video => {
                const item = document.createElement('div');
                item.style.cssText = `
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                `;

                item.innerHTML = `
                    <video controls style="width: 100%; height: 200px; object-fit: cover;">
                        <source src="${video.url}" type="${video.type || 'video/mp4'}">
                    </video>
                    <div style="padding: 15px;">
                        <p style="font-size: 0.9rem; color: #666; margin-bottom: 10px;">
                            📍 ${getSectionLabel(video.section)}
                        </p>
                        <button onclick="deleteVideoConfirm('${video.id}')" 
                                style="width: 100%; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                            🗑️ Supprimer
                        </button>
                    </div>
                `;

                grid.appendChild(item);
            });

            container.appendChild(grid);
            console.log(`✅ ${videos.length} vidéos affichées`);

        } catch (error) {
            console.error('❌ Erreur chargement vidéos:', error);
        }
    }

    /**
     * Supprimer une vidéo avec confirmation
     */
    window.deleteVideoConfirm = async function(videoId) {
        if (!confirm('⚠️ Supprimer cette vidéo ?')) return;

        try {
            await SupabaseDB.deleteVideo(videoId);
            showStatus('Vidéo supprimée', 'success');
            await loadAllVideos();
        } catch (error) {
            console.error('❌ Erreur:', error);
            showStatus('Erreur lors de la suppression', 'error');
        }
    };

    // ============================================
    // INITIALISATION
    // ============================================

    /**
     * Attendre que Supabase soit prêt
     */
    function waitForSupabase(callback) {
        if (window.SupabaseDB && window.SupabaseDB.client()) {
            callback();
        } else {
            setTimeout(() => waitForSupabase(callback), 100);
        }
    }

    /**
     * Initialisation au chargement
     */
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📄 DOM chargé');

        waitForSupabase(() => {
            console.log('✅ Supabase prêt');

            // Charger les contenus
            loadAllBlogs();
            loadAllPhotos();
            loadAllVideos();

            // Attacher les événements
            const blogForm = document.getElementById('blogForm');
            if (blogForm) {
                blogForm.addEventListener('submit', handleBlogSubmit);
            }

            const blogImageInput = document.getElementById('blogImage');
            if (blogImageInput) {
                blogImageInput.addEventListener('change', handleBlogImagePreview);
            }

            console.log('✅ Admin Dashboard Enhanced initialisé');
        });
    });

    // Exposer globalement
    window.AdminDashboard = {
        loadBlogs: loadAllBlogs,
        loadPhotos: loadAllPhotos,
        loadVideos: loadAllVideos,
        showStatus: showStatus
    };

})();
