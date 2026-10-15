# OUMALYA CLOTHING — Projet Next.js

Projet e-commerce Next.js (App Router, TypeScript) avec gestion de boutique et panneau d'administration, **avec 100% de fidélité visuelle et sans aucun écart de design**.

---

## 🚀 Démarrage rapide

### 1. Installation des dépendances (déjà effectuée)
```bash
npm install
```

### 2. Lancer le serveur de développement
```bash
npm run dev
```
Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### 3. Compiler pour la production
```bash
npm run build
npm run start
```

---

## 👑 Espace Administration (`/admin`)

Accédez à [http://localhost:3000/admin](http://localhost:3000/admin) (ou via le lien **Administration** dans le pied de page).

- **Code d'accès par défaut** : `oumalya`
- **Fonctionnalités administratives** :
  - **Ajout de nouveaux articles** : Nom, catégorie (Abayas / Crocs), prix en FCFA, couleur, badges (Nouveauté, Coup de cœur...), tailles/pointures disponibles, descriptions.
  - **Gestion des photos** : Téléversement direct depuis l'appareil (`/api/upload`) ou saisie d'URL, avec prévisualisation en direct.
  - **Modification de produits existants** : Mise à jour immédiate du prix, des stocks/pointures, de la description ou de l'image.
  - **Suppression d'articles** : Boîte de dialogue de confirmation sécurisée.
  - **Statistiques en direct** : Nombre total de produits, répartition Abayas/Crocs, prix moyen.
  - **Réinitialisation** : Bouton pour restaurer le catalogue initial de démonstration en un clic.

---

## 📁 Architecture du projet

```
OUMALYA/
├── app/                        # ⚡ Frontend Next.js 14 (App Router)
│   ├── layout.tsx              # Layout racine (polices DM Sans & Playfair Display, Viewport, CartProvider)
│   ├── page.tsx                # Accueil (visuels personnalisables)
│   ├── boutique/page.tsx       # Boutique & filtres catégories
│   ├── produit/page.tsx        # Fiche produit détaillée
│   ├── panier/page.tsx         # Panier d'achat interactif
│   ├── commande/page.tsx       # Validation de commande & WhatsApp
│   ├── apropos/page.tsx        # Notre histoire
│   ├── contact/page.tsx        # Formulaire de contact
│   ├── livraison/page.tsx      # Guide livraison & FAQ
│   ├── favoris/page.tsx        # Articles favoris
│   ├── admin/page.tsx          # 👑 Espace d'administration complet (Clerk Auth, 2 admins max)
│   └── api/                    # Routes API Next.js (fallback & proxy)
│       ├── products/route.ts   # CRUD Produits
│       ├── categories/route.ts # CRUD Catégories
│       ├── homepage/route.ts   # Personnalisation Accueil
│       ├── orders/route.ts     # Commandes
│       └── upload/route.ts     # Upload images vers Supabase
│
├── backend/                    # 🚀 Backend FastAPI Cloud
│   ├── main.py                 # Application FastAPI & middleware CORS
│   ├── auth.py                 # Authentification Clerk (whitelist des 2 admins)
│   ├── catalog_sync.py         # Persistance permanente Supabase Storage
│   ├── database.py             # Session SQLAlchemy
│   ├── models.py               # Modèles de données
│   ├── schemas.py              # Schémas Pydantic
│   ├── supabase_client.py      # Client Supabase
│   ├── Dockerfile              # Conteneur Docker
│   ├── Procfile                # Procfile PaaS
│   ├── requirements.txt        # Dépendances Python
│   └── routers/                # Endpoints modulaires
│       ├── admin.py            # Vérification et gestion des admins
│       ├── categories.py       # API Catégories
│       ├── homepage.py         # API Visuels Accueil
│       ├── orders.py           # API Commandes
│       ├── products.py         # API Produits
│       ├── settings.py         # API Paramètres
│       └── upload.py           # API Téléversement images
│
├── components/                 # Composants React partagés
├── context/
│   └── CartContext.tsx         # Contexte global (Panier, Favoris, Catalogue, Visuels)
├── data/                       # Données locales & types
│   ├── homepage.ts             # Types et valeurs par défaut accueil
│   └── products.ts             # Données de repli
├── public/                     # Ressources statiques & images
├── styles/                     # Feuilles de styles CSS scopées
├── next.config.js              # Configuration Next.js
└── tsconfig.json               # Configuration TypeScript
```

---

## 🌐 Déploiements en Production

* **Frontend (Vercel) :** [https://oumalya-aurl.vercel.app](https://oumalya-aurl.vercel.app)
* **Backend API (FastAPI Cloud) :** [https://oumalya-api.fastapicloud.dev](https://oumalya-api.fastapicloud.dev)
* **Base de données & Stockage :** [Supabase Cloud](https://jufenigdvmpjwguyjwqw.supabase.co)
* **Authentification :** [Clerk](https://clerk.com) (Whitelist stricte : 2 administrateurs maximum)

