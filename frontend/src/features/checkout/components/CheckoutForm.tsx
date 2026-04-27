import { useMemo, useState } from 'react';
import type { CartState } from '../../../domain/cart/cart.types';
import type { CheckoutFormState, CheckoutMode } from '../checkout.types';
import { calculateCheckoutSummary } from '../../../shared/utils/orderSummary';
import { buildOrderMessage, buildWhatsAppUrl, hasCartItems } from '../../../shared/utils/orderMessage';
import { formatCurrency } from '../../../shared/utils/currency';
import { createOrder } from '../../../infrastructure/api/orders.api';
import { useCart } from '../../../shared/hooks/useCart';

interface CheckoutFormProps {
  cart: CartState;
}

type ValidationErrors = Partial<Record<string, string>>;

const initialCheckoutState: CheckoutFormState = {
  mode: 'delivery',
  delivery: {
    address: '',
    neighborhood: '',
    phone: '',
    courierNotes: ''
  },
  pickup: {
    pickupName: '',
    eta: '',
    paymentMethod: 'cash'
  }
};

const isValidPhone = (value: string) => /^[0-9+\s()-]{7,20}$/.test(value.trim());

const validate = (state: CheckoutFormState): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (state.mode === 'delivery') {
    if (!state.delivery.address.trim()) errors.address = 'Ingresa la direccion exacta.';
    if (!state.delivery.neighborhood.trim()) errors.neighborhood = 'Ingresa el barrio.';
    if (!state.delivery.phone.trim()) errors.phone = 'Ingresa telefono de contacto.';
    else if (!isValidPhone(state.delivery.phone)) errors.phone = 'Telefono invalido.';
  }

  if (state.mode === 'pickup') {
    if (!state.pickup.pickupName.trim()) errors.pickupName = 'Ingresa nombre de quien recoge.';
    if (!state.pickup.eta.trim()) errors.eta = 'Ingresa hora estimada de llegada.';
    if (!state.pickup.paymentMethod) errors.paymentMethod = 'Selecciona metodo de pago.';
  }

  return errors;
};

const fieldClass =
  'w-full rounded-xl border border-amber-100/20 bg-[#16130f] px-3 py-2 text-sm text-[#f7eddc] outline-none placeholder:text-amber-100/35 focus:border-amber-100/45';

export const CheckoutForm = ({ cart }: CheckoutFormProps) => {
  const { clearCart } = useCart();
  const [form, setForm] = useState<CheckoutFormState>(initialCheckoutState);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [checkoutMessage, setCheckoutMessage] = useState('');

  const summary = useMemo(() => calculateCheckoutSummary(cart, form.mode), [cart, form.mode]);

  const setMode = (mode: CheckoutMode) => {
    setForm((prev) => ({ ...prev, mode }));
    setErrors({});
  };

  const submitOrder = () => {
    if (!hasCartItems(cart)) return;

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const message = buildOrderMessage({ cart, checkout: form, summary });
    createOrder({ items: cart.items, checkout: form, summary, whatsappMessage: message });
    window.open(buildWhatsAppUrl(message), '_blank', 'noopener,noreferrer');

    clearCart();
    setForm(initialCheckoutState);
    setErrors({});
    setCheckoutMessage('Pedido registrado. Ya puedes verlo en el panel admin.');
  };

  return (
    <section className="mt-4 rounded-2xl border border-amber-100/15 bg-[#0f0d0a] p-4">
      <h3 className="font-serif text-2xl text-[#f7ecda]">Checkout</h3>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-amber-100/15 bg-[#17140f] p-1">
        <button
          type="button"
          onClick={() => setMode('delivery')}
          className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] ${
            form.mode === 'delivery' ? 'bg-[#f1dfc3] text-[#2d2319]' : 'text-amber-100/70 hover:bg-amber-100/10'
          }`}
        >
          Domicilio
        </button>
        <button
          type="button"
          onClick={() => setMode('pickup')}
          className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] ${
            form.mode === 'pickup' ? 'bg-[#f1dfc3] text-[#2d2319]' : 'text-amber-100/70 hover:bg-amber-100/10'
          }`}
        >
          Recoger
        </button>
      </div>

      {form.mode === 'delivery' ? (
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-amber-100/70">Direccion exacta</label>
            <input
              type="text"
              value={form.delivery.address}
              onChange={(event) => setForm((prev) => ({ ...prev, delivery: { ...prev.delivery, address: event.target.value } }))}
              className={fieldClass}
              placeholder="Calle, numero, piso"
            />
            {errors.address ? <p className="mt-1 text-xs text-rose-300">{errors.address}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-xs text-amber-100/70">Barrio</label>
            <input
              type="text"
              value={form.delivery.neighborhood}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, delivery: { ...prev.delivery, neighborhood: event.target.value } }))
              }
              className={fieldClass}
              placeholder="Nombre del barrio"
            />
            {errors.neighborhood ? <p className="mt-1 text-xs text-rose-300">{errors.neighborhood}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-xs text-amber-100/70">Telefono</label>
            <input
              type="tel"
              value={form.delivery.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, delivery: { ...prev.delivery, phone: event.target.value } }))}
              className={fieldClass}
              placeholder="+34 600 000 000"
            />
            {errors.phone ? <p className="mt-1 text-xs text-rose-300">{errors.phone}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-xs text-amber-100/70">Notas para repartidor</label>
            <textarea
              value={form.delivery.courierNotes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, delivery: { ...prev.delivery, courierNotes: event.target.value } }))
              }
              className={`${fieldClass} min-h-20`}
              placeholder="Porteria, referencias, etc."
            />
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-amber-100/70">Nombre de quien recoge</label>
            <input
              type="text"
              value={form.pickup.pickupName}
              onChange={(event) => setForm((prev) => ({ ...prev, pickup: { ...prev.pickup, pickupName: event.target.value } }))}
              className={fieldClass}
              placeholder="Nombre y apellido"
            />
            {errors.pickupName ? <p className="mt-1 text-xs text-rose-300">{errors.pickupName}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-xs text-amber-100/70">Hora estimada de llegada</label>
            <input
              type="time"
              value={form.pickup.eta}
              onChange={(event) => setForm((prev) => ({ ...prev, pickup: { ...prev.pickup, eta: event.target.value } }))}
              className={fieldClass}
            />
            {errors.eta ? <p className="mt-1 text-xs text-rose-300">{errors.eta}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-xs text-amber-100/70">Metodo de pago</label>
            <select
              value={form.pickup.paymentMethod}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  pickup: { ...prev.pickup, paymentMethod: event.target.value === 'transfer' ? 'transfer' : 'cash' }
                }))
              }
              className={fieldClass}
            >
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
            </select>
            {errors.paymentMethod ? <p className="mt-1 text-xs text-rose-300">{errors.paymentMethod}</p> : null}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-amber-100/15 bg-[#17140f] p-3 text-sm text-amber-50/85">
        <h4 className="mb-2 font-serif text-lg text-[#f5ead8]">Resumen</h4>
        <p>
          Subtotal: <strong className="text-[#faedd7]">{formatCurrency(summary.subtotal)}</strong>
        </p>
        <p>
          {form.mode === 'delivery' ? 'Envio a domicilio' : 'Recoger en tienda'}:{' '}
          <strong className="text-[#faedd7]">{formatCurrency(summary.deliveryFee)}</strong>
        </p>
        <p>
          Impuestos ({Math.round(summary.taxRate * 100)}%):{' '}
          <strong className="text-[#faedd7]">{formatCurrency(summary.taxAmount)}</strong>
        </p>
        <p className="mt-1 text-base">
          Total final: <strong className="text-[#fff2de]">{formatCurrency(summary.total)}</strong>
        </p>
      </div>

      <button
        type="button"
        onClick={submitOrder}
        disabled={!hasCartItems(cart)}
        className="mt-4 w-full rounded-full border border-amber-100/50 bg-[#f1dfc3] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#2a2017] transition hover:bg-[#f7ead6] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Confirmar y enviar por WhatsApp
      </button>

      {checkoutMessage ? <p className="mt-2 text-xs text-emerald-300">{checkoutMessage}</p> : null}
    </section>
  );
};
