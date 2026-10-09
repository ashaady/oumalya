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
├── app/
│   ├── layout.tsx              # Layout racine (polices DM Sans & Playfair Display, Viewport, CartProvider)
│   ├── page.tsx                # Accueil (ex index.html)
│   ├── boutique/page.tsx       # Boutique & filtres (ex boutique.html)
│   ├── produit/page.tsx        # Fiche produit détaillée (ex produit.html?id=...)
│   ├── panier/page.tsx         # Panier d'achat (ex panier.html)
│   ├── commande/page.tsx       # Validation de commande (ex commande.html)
│   ├── apropos/page.tsx        # Notre histoire (ex apropos.html)
│   ├── contact/page.tsx        # Formulaire de contact (ex contact.html)
│   ├── livraison/page.tsx      # Guide livraison & FAQ (ex livraison.html)
│   ├── favoris/page.tsx        # Articles favoris (ex favoris.html)
│   ├── admin/page.tsx          # 👑 Espace d'administration du catalogue
│   └── api/
│       ├── products/route.ts   # API CRUD pour les produits (data/products.json)
│       └── upload/route.ts     # API d'upload d'images vers public/images/uploads/
├── components/
│   └── SubpageLayout.tsx       # Layout partagé pour les sous-pages (header, nav mobile, footer, toast)
├── context/
│   └── CartContext.tsx         # Gestion globale des produits, du panier et des favoris
├── data/
│   ├── products.ts             # Typage et produits de repli
│   └── products.json           # Base de données JSON des produits du catalogue
├── public/
│   └── images/
│       ├── uploads/            # Dossier de stockage des images uploadées
│       └── *.jpg               # 12 photographies d'origine optimisées
├── styles/
│   ├── globals.css             # Styles de base et variables globales
│   ├── home.scoped.css         # Styles de la page d'accueil (index.html)
│   ├── boutique.scoped.css     # Styles de la boutique (boutique.html)
│   ├── subpages.scoped.css     # Styles des sous-pages (produit, panier, commande, apropos, etc.)
│   └── admin.scoped.css        # Styles dédiés au panneau d'administration
├── _original_html/             # Sauvegarde des fichiers HTML d'origine
├── next.config.js              # Configuration Next.js avec réécriture des URLs .html
└── tsconfig.json               # Configuration TypeScript
```
