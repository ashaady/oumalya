export interface Product {
  id: string;
  name: string;
  cat: 'crocs' | 'abayas';
  category: 'crocs' | 'abayas';
  label: string;
  catLabel: string;
  price: number;
  color: string;
  sizes: string[];
  desc: string;
  description: string;
  detail: string;
  badges: string;
  badge: string;
  img: string;
  image: string;
  order: number;
}

export const PRODUCTS: Product[] = [
  {
    id: 'crocs-noir',
    name: 'Crocs Hello Kitty Noir',
    cat: 'crocs',
    category: 'crocs',
    label: 'CROCS · COLLECTION',
    catLabel: 'CROCS · COLLECTION',
    price: 15000,
    color: 'Noir',
    sizes: ['36', '37', '38', '39', '40', '41'],
    desc: 'Une paire noire ornée de charms inspirés de Hello Kitty, parfaite pour ajouter une touche de fantaisie au quotidien.',
    description: 'Une paire noire ornée de charms inspirés de Hello Kitty, parfaite pour ajouter une touche de fantaisie au quotidien.',
    detail: 'Sabots avec bride arrière pivotante et ornements décoratifs. Disponibilité des pointures à confirmer lors de la commande.',
    badges: 'Coup de cœur',
    badge: 'Coup de cœur',
    img: '/images/product-crocs-noir.jpg',
    image: '/images/product-crocs-noir.jpg',
    order: 1
  },
  {
    id: 'crocs-rose',
    name: 'Crocs Hello Kitty Rose',
    cat: 'crocs',
    category: 'crocs',
    label: 'CROCS · COLLECTION',
    catLabel: 'CROCS · COLLECTION',
    price: 15000,
    color: 'Rose',
    sizes: ['36', '37', '38', '39', '40', '41'],
    desc: 'Un rose tendre et de petits charms colorés pour une allure fraîche, ludique et confortable.',
    description: 'Un rose tendre et de petits charms colorés pour une allure fraîche, ludique et confortable.',
    detail: 'Sabots roses à bride pivotante avec décorations. Disponibilité des pointures à confirmer lors de la commande.',
    badges: 'Best-seller',
    badge: 'Best-seller',
    img: '/images/product-crocs-rose.jpg',
    image: '/images/product-crocs-rose.jpg',
    order: 2
  },
  {
    id: 'abaya-noire',
    name: 'Abaya Élégante Noire',
    cat: 'abayas',
    category: 'abayas',
    label: 'ABAYAS · COLLECTION',
    catLabel: 'ABAYAS · COLLECTION',
    price: 25000,
    color: 'Noir',
    sizes: ['S', 'M', 'L', 'XL'],
    desc: 'Une silhouette fluide et intemporelle, conçue pour une élégance simple au quotidien.',
    description: 'Une silhouette fluide et intemporelle, conçue pour une élégance simple au quotidien.',
    detail: 'Photographie illustrative. Matière, coupe exacte et tailles disponibles à confirmer avant la commande.',
    badges: 'Élégance',
    badge: 'Élégance',
    img: '/images/product-abaya-noire.jpg',
    image: '/images/product-abaya-noire.jpg',
    order: 3
  },
  {
    id: 'abaya-taupe',
    name: 'Abaya Moderne Taupe',
    cat: 'abayas',
    category: 'abayas',
    label: 'ABAYAS · COLLECTION',
    catLabel: 'ABAYAS · COLLECTION',
    price: 25000,
    color: 'Taupe',
    sizes: ['S', 'M', 'L', 'XL'],
    desc: 'Une abaya ample au coloris taupe délicat pour une garde-robe chic et facile à porter.',
    description: 'Une abaya ample au coloris taupe délicat pour une garde-robe chic et facile à porter.',
    detail: 'Photographie illustrative. Matière, coupe exacte et tailles disponibles à confirmer avant la commande.',
    badges: 'Nouveauté',
    badge: 'Nouveauté',
    img: '/images/product-abaya-taupe.jpg',
    image: '/images/product-abaya-taupe.jpg',
    order: 4
  }
];

export const PRODUCTS_BY_ID = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

export function formatPrice(price: number): string {
  return Number(price || 0).toLocaleString('fr-FR') + ' F';
}
