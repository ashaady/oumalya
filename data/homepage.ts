export interface HomeSlide {
  id: string;
  eyebrow: string;
  top: string;
  accent: string;
  desc: string;
  image: string;
  buttonText: string;
  buttonLink: string;
}

export interface HomeCategoryCard {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
}

export interface HomePromoBanner {
  title: string;
  desc: string;
  image: string;
  buttonText: string;
  buttonLink: string;
}

export interface HomePageSettings {
  slides: HomeSlide[];
  categoryCards: HomeCategoryCard[];
  promoBanner: HomePromoBanner;
}

export const DEFAULT_HOMEPAGE_SETTINGS: HomePageSettings = {
  slides: [
    {
      id: 'slide-1',
      eyebrow: 'NOUVELLE COLLECTION',
      top: 'Élégance',
      accent: 'au quotidien',
      desc: 'Des abayas modernes et des Crocs tendance pour un style qui vous ressemble.',
      image: '/images/hero-abaya-pink.jpg',
      buttonText: 'Découvrir la collection',
      buttonLink: '/boutique'
    },
    {
      id: 'slide-2',
      eyebrow: 'LA COLLECTION ABAYAS',
      top: 'La beauté',
      accent: 'en toute simplicité',
      desc: 'Découvrez des pièces élégantes et confortables à porter chaque jour.',
      image: '/images/hero-abaya-pink.jpg',
      buttonText: 'Voir les abayas',
      buttonLink: '/boutique?categorie=abayas'
    },
    {
      id: 'slide-3',
      eyebrow: 'NOTRE UNIVERS',
      top: 'Style &',
      accent: 'douceur',
      desc: 'Des essentiels féminins sélectionnés avec soin pour vous.',
      image: '/images/hero-abaya-pink.jpg',
      buttonText: 'Nos créations',
      buttonLink: '/boutique'
    }
  ],
  categoryCards: [
    {
      id: 'abayas',
      title: 'Abayas',
      subtitle: 'Élégance, confort et modernité',
      image: '/images/category-abayas.jpg',
      link: '/boutique?categorie=abayas'
    },
    {
      id: 'crocs',
      title: 'Crocs',
      subtitle: 'Confort et style au quotidien',
      image: '/images/category-crocs.jpg',
      link: '/boutique?categorie=crocs'
    }
  ],
  promoBanner: {
    title: 'Confort & Élégance',
    desc: 'Découvrez notre sélection de Crocs tendance pour toutes les occasions.',
    image: '/images/promo-crocs.jpg',
    buttonText: 'Découvrir les Crocs',
    buttonLink: '/boutique?categorie=crocs'
  }
};
