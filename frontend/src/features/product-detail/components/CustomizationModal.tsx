import type { Product } from '../../../domain/products/product.types';
import { formatCurrency } from '../../../shared/utils/currency';
import { useCustomization } from '../hooks/useCustomization';
import { useCart } from '../../../shared/hooks/useCart';

interface CustomizationModalProps {
  product: Product;
  onClose: () => void;
}

export const CustomizationModal = ({ product, onClose }: CustomizationModalProps) => {
  const { addItem } = useCart();
  const { selectedOptions, notes, setNotes, toggleOption, validationErrors } = useCustomization(product);

  const onConfirm = () => {
    if (validationErrors.length > 0) return;

    addItem({
      productId: product.id,
      categoryId: product.categoryId,
      name: product.name,
      basePrice: product.basePrice,
      selectedOptions,
      notes: notes.trim() || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4" role="presentation" onClick={onClose}>
      <section
        className="w-full max-w-2xl rounded-3xl border border-amber-100/20 bg-[#13110d] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.6)]"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-amber-100/15 pb-3">
          <h3 className="font-serif text-3xl text-[#f7ecd9]">Personalizar {product.name}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-amber-100/30 px-3 py-1 text-xs uppercase tracking-[0.1em] text-amber-100/80 hover:bg-amber-50/10"
          >
            Cerrar
          </button>
        </header>

        <div className="mt-4 space-y-4">
          {product.customization.groups.map((group) => (
            <div key={group.id} className="space-y-2">
              <p className="text-sm text-amber-50/90">
                <strong>{group.label}</strong>
                <span className="ml-2 text-amber-100/55">
                  ({group.minSelect}-{group.maxSelect})
                </span>
              </p>

              <div className="grid gap-2">
                {group.options.map((option) => {
                  const isSelected = selectedOptions.some(
                    (item) => item.groupId === group.id && item.optionId === option.id
                  );

                  return (
                    <label
                      key={option.id}
                      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${
                        isSelected
                          ? 'border-amber-100/55 bg-[#f0dfc32b] text-[#f8efde]'
                          : 'border-amber-100/15 bg-[#0f0d0a] text-amber-100/80'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type={group.type === 'single' ? 'radio' : 'checkbox'}
                          name={group.id}
                          checked={isSelected}
                          onChange={() => toggleOption(group, option)}
                          className="h-4 w-4"
                        />
                        {option.label}
                      </span>
                      <span className="text-xs text-amber-100/65">{formatCurrency(option.priceDelta)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <label htmlFor="notes" className="text-sm font-medium text-amber-100/80">
            Notas del pedido
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Sin cebolla, extra salsa, etc."
            className="min-h-20 w-full rounded-xl border border-amber-100/20 bg-[#17140f] p-3 text-sm text-[#f7eddc] outline-none placeholder:text-amber-100/35 focus:border-amber-100/45"
          />
        </div>

        {validationErrors.length > 0 ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-rose-300">
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}

        <footer className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full border border-amber-100/50 bg-[#f1dfc3] px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#2d2319] hover:bg-[#f7ead6]"
          >
            Confirmar y agregar
          </button>
        </footer>
      </section>
    </div>
  );
};
