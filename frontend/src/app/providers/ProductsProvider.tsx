import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { catalogData } from '../../domain/products/products.data';
import type { Category, Product } from '../../domain/products/product.types';
import { fetchCatalog, saveCatalogProducts } from '../../infrastructure/api/products.api';
import { loadProducts, saveProducts } from '../../infrastructure/storage/products.storage';
import { normalizeMediaUrl } from '../../shared/utils/mediaUrl';

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
  image: normalizeMediaUrl(pickString(product.image, product.imageUrl, product.image_url, product.imagen)),
  videoUrl: normalizeMediaUrl(pickString(product.videoUrl, product.video, product.video_url, product.clip)),
  customization:
    product.customization && Array.isArray(product.customization.groups)
      ? product.customization
      : { enabled: false, groups: [] }
});

const normalizeProducts = (products: ProductWithLegacyMedia[]): Product[] => products.map((product) => normalizeProduct(product));

const mergeRemoteWithLocalProducts = (
  remoteProducts: Product[],
  localProducts: Product[]
): { products: Product[]; changed: boolean } => {
  if (localProducts.length === 0) {
    return { products: remoteProducts, changed: false };
  }

  const merged = [...remoteProducts];
  const byId = new Map<string, number>();
  const bySku = new Map<string, number>();
  let changed = false;

  merged.forEach((product, index) => {
    byId.set(product.id, index);
    bySku.set(product.sku.toUpperCase(), index);
  });

  for (const localProduct of localProducts) {
    const index = byId.get(localProduct.id) ?? bySku.get(localProduct.sku.toUpperCase());

    if (index === undefined) {
      merged.push(localProduct);
      const nextIndex = merged.length - 1;
      byId.set(localProduct.id, nextIndex);
      bySku.set(localProduct.sku.toUpperCase(), nextIndex);
      changed = true;
      continue;
    }

    const remoteProduct = merged[index];
    const nextProduct = {
      ...remoteProduct,
      image: remoteProduct.image || localProduct.image,
      videoUrl: remoteProduct.videoUrl || localProduct.videoUrl
    };

    if (nextProduct.image !== remoteProduct.image || nextProduct.videoUrl !== remoteProduct.videoUrl) {
      merged[index] = nextProduct;
      changed = true;
    }
  }

  return { products: merged, changed };
};

export const ProductsProvider = ({ children }: ProductsProviderProps) => {
  const [products, setProducts] = useState<Product[]>(() => normalizeProducts(catalogData.products as ProductWithLegacyMedia[]));

  useEffect(() => {
    let cancelled = false;
    const cached = loadProducts();
    const cachedProducts = cached ? normalizeProducts(cached as ProductWithLegacyMedia[]) : [];

    if (cachedProducts.length > 0) {
      setProducts(cachedProducts);
    }

    const hydrateFromBackend = async () => {
      try {
        const remoteCatalog = await fetchCatalog();
        const remoteProducts = Array.isArray(remoteCatalog.products)
          ? normalizeProducts(remoteCatalog.products as ProductWithLegacyMedia[])
          : [];

        if (remoteProducts.length === 0 && cachedProducts.length > 0) {
          await saveCatalogProducts(cachedProducts);
          if (!cancelled) {
            setProducts(cachedProducts);
          }
          return;
        }

        if (remoteProducts.length > 0) {
          const mergedResult = mergeRemoteWithLocalProducts(remoteProducts, cachedProducts);

          if (mergedResult.changed) {
            await saveCatalogProducts(mergedResult.products);
          }

          if (!cancelled) {
            setProducts(mergedResult.products);
          }
          saveProducts(mergedResult.products);
        }
      } catch (error) {
        console.error('No se pudo sincronizar catalogo con backend.', error);
      }
    };

    void hydrateFromBackend();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  const persistProductsToBackend = useCallback((nextProducts: Product[]) => {
    void saveCatalogProducts(nextProducts).catch((error) => {
      console.error('No se pudo guardar catalogo en backend.', error);
    });
  }, []);

  const value = useMemo<ProductsContextValue>(() => {
    const getProductsByCategory = (categoryId: Product['categoryId']) =>
      products.filter((product) => product.active && product.categoryId === categoryId);

    const addProduct = (product: Product) => {
      const normalized = normalizeProduct(product as ProductWithLegacyMedia);
      setProducts((prev) => {
        const next = [...prev, normalized];
        persistProductsToBackend(next);
        return next;
      });
    };

    const updateProduct = (product: Product) => {
      const normalized = normalizeProduct(product as ProductWithLegacyMedia);
      setProducts((prev) => {
        const next = prev.map((item) => (item.id === normalized.id ? normalized : item));
        persistProductsToBackend(next);
        return next;
      });
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

        persistProductsToBackend(next);
        return next;
      });

      return { created, updated };
    };

    const toggleProductActive = (productId: string) => {
      setProducts((prev) => {
        const next = prev.map((item) => (item.id === productId ? { ...item, active: !item.active } : item));
        persistProductsToBackend(next);
        return next;
      });
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
  }, [persistProductsToBackend, products]);

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
};
