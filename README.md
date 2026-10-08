# OUMALYA CLOTHING — Projet Next.js

Projet e-commerce Next.js (App Router, TypeScript) converti à partir des pages HTML de démonstration, **avec 100% de fidélité visuelle et sans aucun écart de design**.

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
│   └── favoris/page.tsx        # Articles favoris (ex favoris.html)
├── components/
│   └── SubpageLayout.tsx       # Layout partagé pour les sous-pages (header, nav mobile, footer, toast)
├── context/
│   └── CartContext.tsx         # Gestion globale du panier et des favoris (synchro localStorage oumalya_cart_v2 / oumalya_fav_v2)
├── data/
│   └── products.ts             # Données produits (tailles, prix en FCFA, couleurs, badges, descriptions)
├── public/
│   └── images/                 # 12 photographies extraites et optimisées
├── styles/
│   ├── globals.css             # Styles de base et variables globales
│   ├── home.scoped.css         # Styles de la page d'accueil (index.html)
│   ├── boutique.scoped.css     # Styles de la boutique (boutique.html)
│   └── subpages.scoped.css     # Styles des sous-pages (produit, panier, commande, apropos, etc.)
├── _original_html/             # Sauvegarde des fichiers HTML d'origine
├── next.config.js              # Configuration Next.js avec réécriture des URLs .html
└── tsconfig.json               # Configuration TypeScript
```

---

## ✨ Fonctionnalités préservées à l'identique

1. **Zéro écart de design** : Palette de couleurs (`#eb5c8e`, `#101010`, etc.), typographie (`Playfair Display` + `DM Sans`), espacements, animations, boutons arrondis, tiroirs et modales.
2. **Panier réactif partagé** : Synchronisé en temps réel sur toutes les pages via React Context et `localStorage` (`oumalya_cart_v2`).
3. **Favoris persistants** : Sauvegarde locale sous `oumalya_fav_v2`.
4. **Catalogue & Filtres** : Recherche instantanée, filtres par catégorie (Abayas, Crocs, Favoris) et tri (prix, nom).
5. **Aperçu rapide & Fiche produit** : Sélection de pointure/taille, quantité, calcul automatique du total.
6. **Génération de commande WhatsApp** : Formulaire produisant le texte structuré prêt à copier.
7. **Compatibilité des URLs** : Les liens `index.html`, `boutique.html`, etc. continuent de fonctionner automatiquement via des rewrites Next.js.
