-- ========================================================
-- OUMALYA CLOTHING - SUPABASE POSTGRESQL SCHEMA
-- Projet : jufenigdvmpjwguyjwqw (https://jufenigdvmpjwguyjwqw.supabase.co)
-- ========================================================

-- 1. Table des Administrateurs autorisés (Restriction aux 2 premiers)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255),
    first_name VARCHAR(128),
    last_name VARCHAR(128),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_clerk ON public.admin_users(clerk_user_id);

-- 2. Table des Catégories de produits
CREATE TABLE IF NOT EXISTS public.categories (
    id VARCHAR(128) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    label VARCHAR(255),
    icon VARCHAR(64) DEFAULT '✨',
    image TEXT,
    default_sizes JSONB DEFAULT '["Standard"]'::jsonb,
    is_default BOOLEAN DEFAULT FALSE,
    order_num INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des Produits du Catalogue
CREATE TABLE IF NOT EXISTS public.products (
    id VARCHAR(128) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cat VARCHAR(100) NOT NULL DEFAULT 'abayas',
    category VARCHAR(100) NOT NULL DEFAULT 'abayas',
    label VARCHAR(255),
    cat_label VARCHAR(255),
    price INTEGER NOT NULL DEFAULT 15000 CHECK (price >= 0),
    color VARCHAR(100) DEFAULT 'Noir',
    sizes JSONB DEFAULT '["S", "M", "L", "XL"]'::jsonb,
    desc_text TEXT,
    description TEXT,
    detail TEXT,
    badges VARCHAR(100) DEFAULT 'Nouveauté',
    badge VARCHAR(100) DEFAULT 'Nouveauté',
    img TEXT,
    image TEXT,
    order_num INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_order ON public.products(order_num ASC);
CREATE INDEX IF NOT EXISTS idx_products_cat ON public.products(cat);

-- 4. Table des Commandes Clients
CREATE TABLE IF NOT EXISTS public.orders (
    id VARCHAR(128) PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    customer_prenom VARCHAR(100),
    customer_nom VARCHAR(100),
    customer_telephone VARCHAR(100),
    customer_ville VARCHAR(100),
    customer_adresse VARCHAR(255),
    customer_livraison VARCHAR(100) DEFAULT 'Livraison à domicile',
    customer_note TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal INTEGER NOT NULL DEFAULT 0,
    delivery_fee INTEGER NOT NULL DEFAULT 2000,
    total INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 5. Table des Paramètres de la Boutique
CREATE TABLE IF NOT EXISTS public.settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL
);

-- 6. Insertion des Catégories initiales si la table est vide
INSERT INTO public.categories (id, name, label, icon, image, default_sizes, is_default, order_num)
VALUES 
    ('abayas', 'Abayas & Hijabs', 'ABAYAS · COLLECTION', '👗', '/images/category-abayas.jpg', '["S", "M", "L", "XL"]'::jsonb, TRUE, 1),
    ('crocs', 'Crocs Customisées', 'CROCS · COLLECTION', '👡', '/images/category-crocs.jpg', '["36", "37", "38", "39", "40", "41"]'::jsonb, TRUE, 2)
ON CONFLICT (id) DO NOTHING;

-- 7. Insertion des Produits initiaux du catalogue
INSERT INTO public.products (id, name, cat, category, label, cat_label, price, color, sizes, desc_text, description, detail, badges, badge, img, image, order_num)
VALUES
    ('crocs-noir', 'Crocs Hello Kitty Noir', 'crocs', 'crocs', 'CROCS · COLLECTION', 'CROCS · COLLECTION', 15000, 'Noir', '["36", "37", "38", "39", "40", "41"]'::jsonb, 'Une paire noire ornée de charms inspirés de Hello Kitty, parfaite pour ajouter une touche de fantaisie au quotidien.', 'Une paire noire ornée de charms inspirés de Hello Kitty, parfaite pour ajouter une touche de fantaisie au quotidien.', 'Sabots avec bride arrière pivotante et ornements décoratifs. Disponibilité des pointures à confirmer lors de la commande.', 'Coup de cœur', 'Coup de cœur', '/images/product-crocs-noir.jpg', '/images/product-crocs-noir.jpg', 1),
    ('crocs-rose', 'Crocs Hello Kitty Rose', 'crocs', 'crocs', 'CROCS · COLLECTION', 'CROCS · COLLECTION', 15000, 'Rose', '["36", "37", "38", "39", "40", "41"]'::jsonb, 'Un rose tendre et de petits charms colorés pour une allure fraîche, ludique et confortable.', 'Un rose tendre et de petits charms colorés pour une allure fraîche, ludique et confortable.', 'Sabots roses à bride pivotante avec décorations. Disponibilité des pointures à confirmer lors de la commande.', 'Best-seller', 'Best-seller', '/images/product-crocs-rose.jpg', '/images/product-crocs-rose.jpg', 2),
    ('abaya-noire', 'Abaya Élégante Noire', 'abayas', 'abayas', 'ABAYAS · COLLECTION', 'ABAYAS · COLLECTION', 25000, 'Noir', '["S", "M", "L", "XL"]'::jsonb, 'Une silhouette fluide et intemporelle, conçue pour une élégance simple au quotidien.', 'Une silhouette fluide et intemporelle, conçue pour une élégance simple au quotidien.', 'Photographie illustrative. Matière, coupe exacte et tailles disponibles à confirmer avant la commande.', 'Élégance', 'Élégance', '/images/product-abaya-noire.jpg', '/images/product-abaya-noire.jpg', 3),
    ('abaya-taupe', 'Abaya Moderne Taupe', 'abayas', 'abayas', 'ABAYAS · COLLECTION', 'ABAYAS · COLLECTION', 25000, 'Taupe', '["S", "M", "L", "XL"]'::jsonb, 'Une abaya ample au coloris taupe délicat pour une garde-robe chic et facile à porter.', 'Une abaya ample au coloris taupe délicat pour une garde-robe chic et facile à porter.', 'Photographie illustrative. Matière, coupe exacte et tailles disponibles à confirmer avant la commande.', 'Nouveauté', 'Nouveauté', '/images/product-abaya-taupe.jpg', '/images/product-abaya-taupe.jpg', 4)
ON CONFLICT (id) DO NOTHING;

-- 8. Insertion des paramètres par défaut
INSERT INTO public.settings (key, value)
VALUES
    ('storePhone', '"78 599 91 86"'::jsonb),
    ('storeEmail', '"contact@oumalya.sn"'::jsonb),
    ('dakarFee', '2000'::jsonb),
    ('banlieueFee', '3000'::jsonb),
    ('regionFee', '5000'::jsonb),
    ('announcement', '"Livraison express à Dakar en 24h & expédition sécurisée dans toutes les régions du Sénégal"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 9. Politiques de Sécurité Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour le catalogue et les catégories
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);

-- Création de commandes ouverte à tous les clients
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);

-- Toutes permissions réservées pour service_role (Backend FastAPI)
CREATE POLICY "Service role all products" ON public.products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role all categories" ON public.categories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role all orders" ON public.orders FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role all settings" ON public.settings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role all admins" ON public.admin_users FOR ALL USING (auth.role() = 'service_role');
