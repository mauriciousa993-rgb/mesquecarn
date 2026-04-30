import type { Product } from '../../../domain/products/product.types';
import { useState } from 'react';
import { formatCurrency } from '../../../shared/utils/currency';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

const KG_TO_LB = 2.20462;

export const ProductCard = ({ product, onAdd }: ProductCardProps) => {
  const isFastFood = product.categoryId === 'fast_food';
  const isMeatOrCheese = product.categoryId === 'meat_cheese';
  const lbPrice = isMeatOrCheese ? product.basePrice / KG_TO_LB : 0;
  const [imageFailed, setImageFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const hasImage = Boolean(product.image) && !imageFailed;
  const hasVideo = Boolean(product.videoUrl) && !videoFailed;
  const showImage = hasImage;
  const showVideo = !showImage && hasVideo;

  return (
    <article className="group overflow-hidden rounded-2xl border border-amber-100/20 bg-[#15130f] shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition hover:-translate-y-0.5 hover:border-amber-100/35">
      {showImage ? (
        <img
          src={product.image}
          alt={product.name}
          className="h-44 w-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : showVideo ? (
        <video
          src={product.videoUrl}
          className="h-44 w-full object-cover"
          controls
          muted
          playsInline
          onError={() => setVideoFailed(true)}
        />
      ) : (
        <div className="h-44 w-full bg-[radial-gradient(circle_at_25%_25%,rgba(245,197,117,0.16),transparent_42%),linear-gradient(135deg,#1b1814,#0f0d0b)]" />
      )}

      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-serif text-2xl text-[#f8efdf]">{product.name}</h3>
          <p className="text-[11px] uppercase tracking-[0.2em] text-amber-100/55">{product.sku}</p>
        </div>

        {isMeatOrCheese ? (
          <div className="rounded-xl border border-amber-100/15 bg-[#110f0c] p-3">
            <p className="text-base font-semibold text-[#f5e7d0]">{formatCurrency(product.basePrice)} / kg</p>
            <p className="text-xs text-amber-100/65">{formatCurrency(lbPrice)} / lb</p>
          </div>
        ) : (
          <p className="text-xl font-semibold text-[#f5e5ca]">{formatCurrency(product.basePrice)}</p>
        )}

        {product.stock <= 10 ? <p className="text-xs text-amber-300">Ultimas unidades: {product.stock}</p> : null}

        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-amber-100/20 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-amber-100/70">
            {isFastFood ? 'Fast Food' : isMeatOrCheese ? 'Carnes Premium' : 'Selección'}
          </span>
          <button
            type="button"
            onClick={() => onAdd(product)}
            className="rounded-full border border-amber-100/50 bg-[#f1dfc2] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#2f2419] transition hover:bg-[#f9ecd7]"
          >
            {isFastFood ? 'Personalizar' : 'Agregar'}
          </button>
        </div>
      </div>
    </article>
  );
};
