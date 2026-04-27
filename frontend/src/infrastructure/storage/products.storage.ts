import type { Product } from '../../domain/products/product.types';

const PRODUCTS_STORAGE_KEY = 'mes-que-carn-products-v1';

export const saveProducts = (products: Product[]) => {
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
};

export const loadProducts = (): Product[] | null => {
  const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Product[];
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};
