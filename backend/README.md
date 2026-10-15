# 🚀 OUMALYA Backend — API FastAPI & Synchronisation Cloud

Backend complet pour la boutique e-commerce **OUMALYA**, développé avec **FastAPI**, **Clerk Auth**, **Supabase Storage** et **SQLite / PostgreSQL**.

---

## 🌟 Fonctionnalités

1. **Authentification & Sécurité Clerk** :
   - Vérification JWT via les clés publiques Clerk (JWKS).
   - Règle stricte des **2 premiers administrateurs** : seuls les deux premiers utilisateurs connectés via Clerk obtiennent les privilèges administrateur (whitelist persistée). Les suivants sont automatiquement bloqués.
2. **Gestion Complète du Catalogue (CRUD)** :
   - Produits : ajout, modification, suppression, filtrage, pagination.
   - Catégories : gestion des collections (Abayas, Crocs, etc.).
   - Visuels Accueil : personnalisation des diapositives Hero, des cartes de collection et de la bannière promo avec cadrage dynamique.
3. **Commandes & Ventes** :
   - Prise de commande avec notifications et intégration WhatsApp.
   - Suivi des statuts : En attente, Confirmée, En livraison, Livrée, Annulée.
4. **Persistance Permanente Multi-Cloud** :
   - Synchronisation bidirectionnelle automatique avec **Supabase Storage** (`oumalya_catalog.json`).
   - Même en cas de redémarrage complet ou de redéploiement des conteneurs, le catalogue et les visuels restent 100% conservés.
5. **Gestion des Fichiers & Téléversements** :
   - Upload de photos directement vers Supabase Storage CDN (`oumalya-images`).

---

## 📁 Architecture du Backend

```
backend/
├── auth.py              # Middleware Clerk, vérification JWT & whitelist 2 admins
├── catalog_sync.py      # Synchronisation Supabase Storage & restauration automatique
├── database.py          # Session SQLAlchemy & connexion DB
├── Dockerfile           # Conteneurisation Docker
├── main.py              # Point d'entrée FastAPI & configuration CORS
├── models.py            # Modèles SQLAlchemy (Admin, Product, Category, Order, etc.)
├── Procfile             # Configuration pour plateformes PaaS
├── requirements.txt     # Dépendances Python
├── run.py               # Script de lancement local uvicorn
├── schemas.py           # Schémas de validation Pydantic
├── supabase_client.py   # Client Supabase Storage API
├── test_backend.py      # Suite de tests unitaires
└── routers/
    ├── admin.py         # Endpoints gestion des admins et vérification token
    ├── categories.py    # Endpoints CRUD catégories
    ├── homepage.py      # Endpoints personnalisation de la page d'accueil
    ├── orders.py        # Endpoints prise de commande et suivi
    ├── products.py      # Endpoints CRUD produits
    ├── settings.py      # Endpoints configuration boutique
    └── upload.py        # Endpoints téléversement images
```

---

## ⚙️ Configuration (`.env`)

Copiez le fichier `.env.example` vers `.env` et complétez les valeurs :

```bash
cp .env.example .env
```

Variables requises :
* `CLERK_SECRET_KEY` & `CLERK_PUBLISHABLE_KEY`
* `CLERK_JWKS_URL`
* `MAX_ADMINS=2`
* `SUPABASE_URL`
* `SUPABASE_SERVICE_ROLE_KEY`
* `SUPABASE_STORAGE_BUCKET=oumalya-images`

---

## 💻 Lancement Local

```bash
# 1. Créer et activer l'environnement virtuel
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate # Linux / macOS

# 2. Installer les dépendances
pip install -r requirements.txt

# 3. Lancer le serveur FastAPI
python run.py
# ou
uvicorn main:app --reload --port 8000
```

Documentation interactive Swagger disponible localement sur : `http://localhost:8000/docs`
