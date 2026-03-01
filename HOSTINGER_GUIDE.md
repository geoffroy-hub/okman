# 🚀 Guide déploiement Hostinger — Institut MiraLocks

## Ce dont vous avez besoin
- Un compte Hostinger (plan Web Hosting ou Premium)
- Votre nom de domaine (ex: miralocks.com ou miralocks.tg)
- L'accès à hPanel (tableau de bord Hostinger)
- Les fichiers du site prêts sur votre ordinateur

---

## ÉTAPE 1 — Préparer vos fichiers sur votre ordinateur

Organisez vos fichiers exactement comme ceci :

```
📁 miralocks/
├── 📄 index.html
├── 📄 services.html
├── 📄 gallery.html
├── 📄 rendezvous.html
├── 📄 contact.html
├── 📄 about.html
├── 📄 blog.html
├── 📄 faq.html
├── 📄 avis.html
├── 📄 404.html
├── 📄 offline.html
├── 📄 mentions-legales.html
├── 📄 confidentialite.html
├── 📄 manifest.json
├── 📄 robots.txt
├── 📄 sitemap.xml
├── 📄 sw.js
├── 📄 .htaccess          ← fichier caché, très important !
├── 📁 assets/
│   ├── 🖼️ logo.png        ← votre vrai logo ici
│   ├── 🖼️ logo-192.png
│   ├── 🖼️ logo-512.png
│   ├── 🖼️ favicon.ico
│   ├── 🖼️ favicon-16.png
│   ├── 🖼️ favicon-32.png
│   ├── 🖼️ apple-touch-icon.png
│   └── 🖼️ equipe.jpg      ← votre photo équipe ici
├── 📁 css/
│   ├── styles.css
│   └── optimize.css
├── 📁 js/
│   ├── supabase-config.js
│   ├── main.js
│   └── (tous les autres .js)
└── 📁 video/
    ├── locks5.mp4
    └── locks6.mp4
```

---

## ÉTAPE 2 — Activer SSL sur Hostinger

1. Connectez-vous sur **hpanel.hostinger.com**
2. Allez dans **Hébergement** → cliquez sur votre hébergement
3. Dans le menu gauche : **SSL** → **Gérer**
4. Cliquez **Activer** sur le certificat **Let's Encrypt** (gratuit)
5. Attendez 2–5 minutes que le certificat s'installe
6. ✅ Votre HTTPS est actif

---

## ÉTAPE 3 — Uploader les fichiers via le Gestionnaire de fichiers

### Méthode A : Gestionnaire de fichiers Hostinger (recommandée)

1. Dans hPanel → **Gestionnaire de fichiers**
2. Ouvrez le dossier **public_html** (c'est la racine de votre site)
3. Supprimez les fichiers existants (`index.html` par défaut de Hostinger, etc.)
4. Cliquez **Téléverser** → sélectionnez tous vos fichiers
5. Uploadez aussi les dossiers `assets/`, `css/`, `js/`, `video/`

> ⚠️ Le fichier `.htaccess` est caché sur Windows/Mac. Dans le Gestionnaire de fichiers Hostinger, activez "Afficher les fichiers cachés" pour le voir une fois uploadé.

### Méthode B : FTP avec FileZilla (pour les gros fichiers vidéo)

```
Hôte     : votre-domaine.com  (ou l'IP FTP dans hPanel)
Nom      : votre identifiant FTP (dans hPanel → FTP)
Mot de passe : votre mot de passe FTP
Port     : 21
```

1. Téléchargez **FileZilla** (gratuit) sur filezilla-project.org
2. Connexion avec les infos ci-dessus
3. À droite : naviguez vers `public_html/`
4. À gauche : sélectionnez tous vos fichiers locaux
5. Drag & drop vers la droite
6. Attendez la fin du transfert (les vidéos peuvent prendre du temps)

---

## ÉTAPE 4 — Vérifier que .htaccess fonctionne

1. Allez sur votre site en HTTP : `http://votre-domaine.com`
2. Il doit automatiquement rediriger vers `https://votre-domaine.com`
3. Si ça ne redirige pas → dans hPanel → **Hébergement avancé** → vérifiez que **mod_rewrite** est activé

---

## ÉTAPE 5 — Configurer Supabase

1. Ouvrez **supabase.com** → votre projet
2. Menu gauche → **SQL Editor** → **New query**
3. Copiez TOUT le contenu du fichier `supabase-setup.sql`
4. Collez dans l'éditeur → cliquez **Run**
5. Vérifiez que "Success" apparaît pour chaque table

---

## ÉTAPE 6 — Mettre à jour les URLs dans le sitemap

Si votre domaine est différent de `www.miralocks.com`, modifiez `sitemap.xml` :

Remplacez TOUTES les occurrences de :
```
https://www.miralocks.com
```
Par votre vrai domaine :
```
https://votre-domaine.com
```

Faites pareil dans `robots.txt` (ligne Sitemap:).

---

## ÉTAPE 7 — Checklist finale

```
☐ SSL Let's Encrypt activé dans hPanel
☐ Tous les fichiers uploadés dans public_html/
☐ .htaccess présent (vérifier avec "afficher fichiers cachés")
☐ Dossiers assets/, css/, js/, video/ uploadés
☐ Votre vrai logo dans assets/logo.png
☐ supabase-setup.sql exécuté
☐ Test HTTPS : https://votre-domaine.com fonctionne
☐ Test 404 : https://votre-domaine.com/pagedqui-nexiste-pas → page 404
☐ Test mobile : ouvert sur téléphone
☐ Soumettre sitemap.xml sur Google Search Console
```

---

## ⚠️ Problèmes fréquents sur Hostinger

| Problème | Solution |
|---|---|
| Page blanche après upload | Vérifier que `index.html` est bien dans `public_html/` (pas dans un sous-dossier) |
| HTTPS ne redirige pas | Dans hPanel → SSL → Forcer HTTPS → Activer |
| `.htaccess` ignoré | Dans hPanel → Hébergement avancé → activer mod_rewrite |
| Vidéos ne chargent pas | Elles sont trop grosses pour le gestionnaire de fichiers → utiliser FTP |
| Supabase ne répond pas | Vérifier l'URL et la clé dans `js/supabase-config.js` |
| Erreur 403 sur les assets | Vérifier les permissions : assets/ doit être en 755, fichiers en 644 |

---

## 📞 Support Hostinger

- Chat live 24h/24 sur hpanel.hostinger.com
- Centre d'aide : support.hostinger.com
