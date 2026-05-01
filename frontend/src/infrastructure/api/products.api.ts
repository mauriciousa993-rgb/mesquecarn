import type { Product, StoreCatalog } from '../../domain/products/product.types';
import { apiClient } from './client';

export const fetchCatalog = async (): Promise<StoreCatalog> => {
  return apiClient.get<StoreCatalog>('/api/catalog');
};

export const saveCatalogProducts = async (products: Product[]): Promise<StoreCatalog> => {
  return apiClient.put<StoreCatalog>('/api/catalog', { products });
};
