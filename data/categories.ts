export interface CategoryItem {
  id: string;
  name: string;
  label?: string;
  icon?: string;
  image?: string;
  defaultSizes?: string[];
  isDefault?: boolean;
}

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: 'abayas',
    name: 'Abayas & Hijabs',
    label: 'ABAYAS · COLLECTION',
    icon: '👗',
    image: '/images/category-abayas.jpg',
    defaultSizes: ['S', 'M', 'L', 'XL'],
    isDefault: true
  },
  {
    id: 'crocs',
    name: 'Crocs Customisées',
    label: 'CROCS · COLLECTION',
    icon: '👡',
    image: '/images/category-crocs.jpg',
    defaultSizes: ['36', '37', '38', '39', '40', '41'],
    isDefault: true
  }
];
