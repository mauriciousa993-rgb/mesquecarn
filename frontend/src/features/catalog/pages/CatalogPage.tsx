import { useState } from 'react';
import type { CategoryId, Product } from '../../../domain/products/product.types';
import { ProductCard } from '../components/ProductCard';
import { CustomizationModal } from '../../product-detail/components/CustomizationModal';
import { useCart } from '../../../shared/hooks/useCart';
import { useProducts } from '../../../shared/hooks/useProducts';

const categoryLabels: Record<CategoryId, string> = {
  fast_food: 'Comida Rapida',
  liquor: 'Licores',
  meat_cheese: 'Carnes',
  grocery: 'Abarrotes'
};

const CategoryIcon = ({ categoryId }: { categoryId: CategoryId }) => {
  if (categoryId === 'fast_food') return <span aria-hidden="true">✦</span>;
  if (categoryId === 'liquor') return <span aria-hidden="true">◈</span>;
  if (categoryId === 'meat_cheese') return <span aria-hidden="true">◆</span>;
  return <span aria-hidden="true">◉</span>;
};

export const CatalogPage = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('fast_food');
  const [customizing, setCustomizing] = useState<Product | null>(null);
  const { addItem } = useCart();
  const { categories, getProductsByCategory } = useProducts();

  const products = getProductsByCategory(activeCategory);

  const onAddProduct = (product: Product) => {
    if (product.customization.enabled) {
      setCustomizing(product);
      return;
    }

    addItem({
      productId: product.id,
      categoryId: product.categoryId,
      name: product.name,
      basePrice: product.basePrice,
      selectedOptions: []
    });
  };

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-amber-100/15 bg-[#15130f]/80 p-5">
        <p className="text-[11px] uppercase tracking-[0.32em] text-amber-100/65">Menú de autor</p>
        <h2 className="mt-2 font-serif text-4xl text-[#f7efde]">Experiencia gastronómica</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#cfbda3]">
          Elige categoría y combina productos en un solo pedido, con un flujo elegante y rápido.
        </p>
      </header>

      <nav className="grid grid-cols-2 gap-2 md:grid-cols-4" aria-label="Categorias">
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? 'border-amber-100/70 bg-[#f1dfc2] text-[#2f2318]'
                  : 'border-amber-100/15 bg-[#15130f] text-amber-50/80 hover:border-amber-100/35'
              }`}
              onClick={() => setActiveCategory(category.id)}
            >
              <CategoryIcon categoryId={category.id} />
              <span>{categoryLabels[category.id]}</span>
            </button>
          );
        })}
      </nav>

      <div
        className={`grid gap-4 ${
          activeCategory === 'meat_cheese' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
        }`}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAdd={onAddProduct} />
        ))}
      </div>

      {customizing ? <CustomizationModal product={customizing} onClose={() => setCustomizing(null)} /> : null}
    </section>
  );
};
