import type { StoreCatalog } from '../../domain/products/product.types';
import { apiClient } from './client';

export const fetchCatalog = async (): Promise<StoreCatalog> => {
  return apiClient.get<StoreCatalog>('/api/catalog');
};
