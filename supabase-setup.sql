-- ============================================================
-- SUPABASE SETUP — Institut MiraLocks
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase
-- Dashboard > SQL Editor > New query > Coller > Run
-- ============================================================

-- ── 1. Table PHOTOS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS photos (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url         text NOT NULL,
  alt         text,
  service     text,
  featured    boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- ── 2. Table VIDÉOS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS videos (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url         text NOT NULL,
  titre       text,
  description text,
  thumbnail   text,
  created_at  timestamptz DEFAULT now()
);

-- ── 3. Table BLOGS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blogs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  titre       text NOT NULL,
  contenu     text NOT NULL,
  extrait     text,
  image       text,
  categorie   text,
  date        date DEFAULT current_date,
  publie      boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- ── 4. Table PARAMÈTRES DU SITE (thème/couleurs) ────────────
CREATE TABLE IF NOT EXISTS site_settings (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_type  text NOT NULL,
  setting_key   text NOT NULL UNIQUE,
  setting_value text,
  updated_at    timestamptz DEFAULT now()
);

-- Valeurs par défaut des couleurs
INSERT INTO site_settings (setting_type, setting_key, setting_value) VALUES
  ('color', 'color_primary',    '#c9a84c'),
  ('color', 'color_secondary',  '#1a1a1a'),
  ('color', 'color_background', '#f8f8f8'),
  ('color', 'color_text',       '#1a1a1a'),
  ('color', 'color_header_bg',  '#0c3320'),
  ('color', 'color_footer_bg',  '#0c3320')
ON CONFLICT (setting_key) DO NOTHING;

-- ── 5. Table ANALYTICS VISITES ──────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_visits (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp    timestamptz DEFAULT now(),
  page         text,
  referrer     text,
  user_agent   text,
  screen_width integer,
  screen_height integer,
  device_type  text,
  browser      text,
  os           text
);

-- ── 6. Table ANALYTICS ÉVÉNEMENTS ───────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp    timestamptz DEFAULT now(),
  page         text,
  event_type   text,
  event_data   jsonb,
  device_type  text
);

-- ── 7. Row Level Security (RLS) ─────────────────────────────
-- CRITIQUE : activer le RLS sur toutes les tables

ALTER TABLE photos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_visits  ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events  ENABLE ROW LEVEL SECURITY;

-- Lecture publique (anon) : photos, vidéos, blogs publiés, settings
CREATE POLICY "lecture publique photos"
  ON photos FOR SELECT TO anon USING (true);

CREATE POLICY "lecture publique videos"
  ON videos FOR SELECT TO anon USING (true);

CREATE POLICY "lecture blogs publiés"
  ON blogs FOR SELECT TO anon USING (publie = true);

CREATE POLICY "lecture settings"
  ON site_settings FOR SELECT TO anon USING (true);

-- Analytics : écriture publique (visiteurs anonymes)
CREATE POLICY "écriture analytics visites"
  ON analytics_visits FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "écriture analytics events"
  ON analytics_events FOR INSERT TO anon WITH CHECK (true);

-- ADMIN : accès complet pour les utilisateurs authentifiés
CREATE POLICY "admin photos"
  ON photos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admin videos"
  ON videos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admin blogs"
  ON blogs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admin settings"
  ON site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admin analytics visites"
  ON analytics_visits FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin analytics events"
  ON analytics_events FOR SELECT TO authenticated USING (true);

-- ── 8. Storage bucket ───────────────────────────────────────
-- À faire dans Dashboard > Storage > New bucket :
-- Nom : miralocks-media
-- Public : OUI (pour afficher les images)
-- Allowed MIME types : image/jpeg, image/png, image/webp, video/mp4

-- ── 9. Index pour les performances ──────────────────────────
CREATE INDEX IF NOT EXISTS idx_blogs_publie    ON blogs (publie, date DESC);
CREATE INDEX IF NOT EXISTS idx_photos_featured ON photos (featured, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_page     ON analytics_visits (page, timestamp);
CREATE INDEX IF NOT EXISTS idx_visits_ts       ON analytics_visits (timestamp DESC);
