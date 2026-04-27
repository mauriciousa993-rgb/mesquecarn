export type CategoryId = 'fast_food' | 'liquor' | 'meat_cheese' | 'grocery';

export type CustomizationType = 'single' | 'multiple';

export interface ProductOption {
  id: string;
  label: string;
  priceDelta: number;
}

export interface ProductCustomizationGroup {
  id: string;
  label: string;
  type: CustomizationType;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  options: ProductOption[];
}

export interface ProductCustomization {
  enabled: boolean;
  groups: ProductCustomizationGroup[];
}

export interface Product {
  id: string;
  categoryId: CategoryId;
  name: string;
  basePrice: number;
  sku: string;
  image?: string;
  videoUrl?: string;
  active: boolean;
  stock: number;
  unit?: string;
  customization: ProductCustomization;
}

export interface Category {
  id: CategoryId;
  name: string;
}

export interface StoreCatalog {
  store: {
    id: string;
    name: string;
    currency: string;
  };
  categories: Category[];
  products: Product[];
}
