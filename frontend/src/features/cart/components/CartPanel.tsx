import { useCart } from '../../../shared/hooks/useCart';
import { formatCurrency } from '../../../shared/utils/currency';
import { CheckoutForm } from '../../checkout/components/CheckoutForm';

const categoryName: Record<string, string> = {
  fast_food: 'Comida Rapida',
  liquor: 'Licores',
  meat_cheese: 'Carnes/Quesos',
  grocery: 'Abarrotes'
};

export const CartPanel = () => {
  const { state, updateQty, removeItem, clearCart } = useCart();

  return (
    <aside className="h-fit rounded-3xl border border-amber-100/20 bg-[#13110d]/85 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur">
      <div className="mb-3 border-b border-amber-100/15 pb-3">
        <p className="text-[11px] uppercase tracking-[0.32em] text-amber-100/55">Reserva</p>
        <h2 className="font-serif text-3xl text-[#f6ecda]">Carrito</h2>
      </div>

      {state.items.length === 0 ? <p className="mt-2 text-sm text-amber-50/60">No hay productos en el carrito.</p> : null}

      <div className="mt-4 space-y-3">
        {state.items.map((item) => (
          <article key={item.lineId} className="rounded-2xl border border-amber-100/15 bg-[#0f0d0a] p-3">
            <div className="space-y-1">
              <strong className="font-serif text-lg text-[#f5ebd8]">{item.name}</strong>
              <p className="text-xs text-amber-100/55">Categoria: {categoryName[item.categoryId] ?? item.categoryId}</p>
              {item.selectedOptions.length > 0 ? (
                <p className="text-xs text-amber-100/55">Opciones: {item.selectedOptions.map((opt) => opt.label).join(', ')}</p>
              ) : null}
              {item.notes ? <p className="text-xs text-amber-100/55">Notas: {item.notes}</p> : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateQty(item.lineId, item.qty - 1)}
                  className="h-8 w-8 rounded-full border border-amber-100/30 text-amber-50/85 transition hover:bg-amber-50/10"
                >
                  -
                </button>
                <span className="w-6 text-center text-sm text-amber-50/90">{item.qty}</span>
                <button
                  type="button"
                  onClick={() => updateQty(item.lineId, item.qty + 1)}
                  className="h-8 w-8 rounded-full border border-amber-100/30 text-amber-50/85 transition hover:bg-amber-50/10"
                >
                  +
                </button>
              </div>

              <strong className="text-[#f8e7cb]">{formatCurrency(item.lineTotal)}</strong>
              <button
                type="button"
                onClick={() => removeItem(item.lineId)}
                className="rounded-full border border-amber-100/25 px-2.5 py-1 text-[11px] uppercase tracking-[0.08em] text-amber-100/80 hover:bg-amber-50/10"
              >
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 space-y-1 border-t border-amber-100/15 pt-3 text-sm text-amber-50/80">
        <p>
          Subtotal: <strong className="text-[#f9ecd6]">{formatCurrency(state.subtotal)}</strong>
        </p>
        <p>
          Total: <strong className="text-[#f9ecd6]">{formatCurrency(state.total)}</strong>
        </p>
      </div>

      <button
        type="button"
        onClick={clearCart}
        disabled={state.items.length === 0}
        className="mt-4 w-full rounded-full border border-amber-100/45 bg-[#f0dfc4] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#2b2118] transition hover:bg-[#f8ebd8] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Vaciar carrito
      </button>

      <CheckoutForm cart={state} />
    </aside>
  );
};
