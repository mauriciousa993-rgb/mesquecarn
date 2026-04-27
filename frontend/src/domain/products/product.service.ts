import { catalogData } from './products.data';
import type { CategoryId, Product } from './product.types';

export const getCategories = () => catalogData.categories;

export const getProducts = () => catalogData.products.filter((product) => product.active);

export const getProductsByCategory = (categoryId: CategoryId) =>
  getProducts().filter((product) => product.categoryId === categoryId);

export const getProductById = (productId: string): Product | undefined =>
  getProducts().find((product) => product.id === productId);
