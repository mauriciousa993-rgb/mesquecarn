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

type ProductWithLegacyMedia = Product & {
  imageUrl?: string;
  image_url?: string;
  imagen?: string;
  video?: string;
  video_url?: string;
  clip?: string;
};

const pickString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
};

const normalizeProduct = (product: ProductWithLegacyMedia): Product => ({
  ...product,
  unit: pickString(product.unit),
  image: pickString(product.image, product.imageUrl, product.image_url, product.imagen),
  videoUrl: pickString(product.videoUrl, product.video, product.video_url, product.clip),
  customization:
    product.customization && Array.isArray(product.customization.groups)
      ? product.customization
      : { enabled: false, groups: [] }
});

export const ProductsProvider = ({ children }: ProductsProviderProps) => {
  const [products, setProducts] = useState<Product[]>(() =>
    catalogData.products.map((product) => normalizeProduct(product as ProductWithLegacyMedia))
  );

  useEffect(() => {
    const cached = loadProducts();
    if (cached && cached.length > 0) {
      setProducts(cached.map((product) => normalizeProduct(product as ProductWithLegacyMedia)));
    }
  }, []);

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  const value = useMemo<ProductsContextValue>(() => {
    const getProductsByCategory = (categoryId: Product['categoryId']) =>
      products.filter((product) => product.active && product.categoryId === categoryId);

    const addProduct = (product: Product) => {
      const normalized = normalizeProduct(product as ProductWithLegacyMedia);
      setProducts((prev) => [...prev, normalized]);
    };

    const updateProduct = (product: Product) => {
      const normalized = normalizeProduct(product as ProductWithLegacyMedia);
      setProducts((prev) => prev.map((item) => (item.id === normalized.id ? normalized : item)));
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

        for (const rawIncoming of incomingProducts) {
          const incoming = normalizeProduct(rawIncoming as ProductWithLegacyMedia);
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
