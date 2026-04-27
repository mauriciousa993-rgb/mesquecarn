import { createContext, useEffect, useMemo, useState } from 'react';
import { catalogData } from '../../domain/products/products.data';
import type { Category, Product } from '../../domain/products/product.types';
import { loadProducts, saveProducts } from '../../infrastructure/storage/products.storage';

interface ProductsContextValue {
  categories: Category[];
  products: Product[];
  getProductsByCategory: (categoryId: Product['categoryId']) => Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  upsertProducts: (incomingProducts: Product[]) => { created: number; updated: number };
  toggleProductActive: (productId: string) => void;
}

export const ProductsContext = createContext<ProductsContextValue | undefined>(undefined);

interface ProductsProviderProps {
  children: React.ReactNode;
}

export const ProductsProvider = ({ children }: ProductsProviderProps) => {
  const [products, setProducts] = useState<Product[]>(catalogData.products);

  useEffect(() => {
    const cached = loadProducts();
    if (cached && cached.length > 0) {
      setProducts(cached);
    }
  }, []);

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  const value = useMemo<ProductsContextValue>(() => {
    const getProductsByCategory = (categoryId: Product['categoryId']) =>
      products.filter((product) => product.active && product.categoryId === categoryId);

    const addProduct = (product: Product) => {
      setProducts((prev) => [...prev, product]);
    };

    const updateProduct = (product: Product) => {
      setProducts((prev) => prev.map((item) => (item.id === product.id ? product : item)));
    };

    const upsertProducts = (incomingProducts: Product[]) => {
      let created = 0;
      let updated = 0;

      setProducts((prev) => {
        const next = [...prev];
        const byId = new Map<string, number>();
        const bySku = new Map<string, number>();

        next.forEach((product, index) => {
          byId.set(product.id, index);
          bySku.set(product.sku.toUpperCase(), index);
        });

        for (const incoming of incomingProducts) {
          const existingById = byId.get(incoming.id);
          const existingBySku = bySku.get(incoming.sku.toUpperCase());
          const existingIndex = existingById ?? existingBySku;

          if (existingIndex !== undefined) {
            next[existingIndex] = incoming;
            updated += 1;
            byId.set(incoming.id, existingIndex);
            bySku.set(incoming.sku.toUpperCase(), existingIndex);
          } else {
            next.push(incoming);
            const newIndex = next.length - 1;
            created += 1;
            byId.set(incoming.id, newIndex);
            bySku.set(incoming.sku.toUpperCase(), newIndex);
          }
        }

        return next;
      });

      return { created, updated };
    };

    const toggleProductActive = (productId: string) => {
      setProducts((prev) =>
        prev.map((item) => (item.id === productId ? { ...item, active: !item.active } : item))
      );
    };

    return {
      categories: catalogData.categories,
      products,
      getProductsByCategory,
      addProduct,
      updateProduct,
      upsertProducts,
      toggleProductActive
    };
  }, [products]);

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
};
