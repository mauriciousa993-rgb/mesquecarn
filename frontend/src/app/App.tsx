import { useMemo, useState } from 'react';
import { CartPanel } from '../features/cart/components/CartPanel';
import { CatalogPage } from '../features/catalog/pages/CatalogPage';
import { AdminPanel } from '../features/admin/components/AdminPanel';
import { useCart } from '../shared/hooks/useCart';

const isAdminRoute = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const normalized = window.location.pathname.replace(/\/+$/, '');
  const adminQuery = new URLSearchParams(window.location.search).get('admin');
  const adminHash = window.location.hash.replace(/^#/, '').trim().toLowerCase();

  return normalized.endsWith('/admin') || adminQuery === '1' || adminHash === 'admin';
};

export const App = () => {
  const [startOrder, setStartOrder] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { itemsCount } = useCart();

  const adminMode = useMemo(() => isAdminRoute(), []);

  if (adminMode) {
    return (
      <main className="min-h-screen bg-[#090806] px-4 py-6 text-[#f7efe2] md:px-6">
        <section className="mx-auto w-full max-w-7xl rounded-3xl border border-amber-100/20 bg-[#11100d]/80 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur">
          <AdminPanel />
        </section>
      </main>
    );
  }

  if (!startOrder) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#090806] text-[#f9f3ea]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(245,197,117,0.18),transparent_42%),radial-gradient(circle_at_80%_80%,rgba(158,96,42,0.18),transparent_42%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-30 [background:linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.06)_45%,transparent_65%)]" />

        <section className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-8 px-6 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:px-10">
          <div className="space-y-8">
            <p className="text-xs uppercase tracking-[0.45em] text-amber-200/70">Més que Carn</p>
            <h1 className="max-w-xl font-serif text-5xl leading-[1.05] text-[#f7efe2] md:text-7xl">
              Sabor artesanal, servicio impecable.
            </h1>
            <p className="max-w-xl text-base text-[#d6c7b2] md:text-lg">
              Descubre una experiencia gastronómica moderna para pedidos de comida rápida premium, carnes seleccionadas,
              licores y tienda gourmet.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                className="rounded-full border border-amber-200/70 bg-amber-100 px-8 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#2c1f14] transition hover:bg-[#fff1d8]"
                onClick={() => setStartOrder(true)}
              >
                Hacer Pedido
              </button>
              <span className="text-sm text-amber-100/70">Abierto ahora • Delivery & Pick-up</span>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-amber-100/20 bg-[#11100d]/85 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.55)] backdrop-blur">
              <div className="rounded-[1.6rem] border border-amber-100/15 bg-gradient-to-b from-[#1a1712] to-[#0e0d0b] p-6">
                <div className="mb-8 flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.32em] text-amber-100/70">Welcome</p>
                  <span className="rounded-full border border-amber-100/20 px-3 py-1 text-xs text-amber-50/80">4.9★</span>
                </div>

                <div className="space-y-3">
                  <h2 className="font-serif text-4xl text-[#f6eee0]">¡Bienvenido!</h2>
                  <p className="text-sm text-[#cfbfa8]">Haz tu pedido en segundos y recibe calidad de restaurante.</p>
                </div>

                <button
                  type="button"
                  className="mt-8 w-full rounded-2xl border border-amber-100/35 bg-[#efe2cb] px-5 py-3 text-sm font-semibold text-[#2f2318] transition hover:bg-[#f7ead4]"
                  onClick={() => setStartOrder(true)}
                >
                  Hacer Pedido →
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090806] px-4 py-6 text-[#f7efe2] md:px-6">
      <div className="mx-auto mb-5 flex w-full max-w-7xl items-center justify-between rounded-2xl border border-amber-100/20 bg-[#11100d]/80 px-4 py-3 backdrop-blur">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-amber-100/65">Més que Carn</p>
          <h1 className="font-serif text-2xl text-[#f8efe0]">Restaurant & Market</h1>
        </div>

        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="rounded-full border border-amber-100/60 bg-[#f0dec2] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#2d2218]"
        >
          Ver carrito ({itemsCount})
        </button>
      </div>

      <div className="mx-auto w-full max-w-7xl">
        <section className="rounded-3xl border border-amber-100/20 bg-[#11100d]/75 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur">
          <CatalogPage />
        </section>
      </div>

      {cartOpen ? (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" role="presentation" onClick={() => setCartOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md overflow-auto border-l border-amber-100/20 bg-[#090806] p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="rounded-full border border-amber-100/35 px-3 py-1 text-[11px] uppercase tracking-[0.1em] text-amber-50/85 hover:bg-amber-50/10"
              >
                Cerrar
              </button>
            </div>
            <CartPanel />
          </div>
        </div>
      ) : null}
    </main>
  );
};
