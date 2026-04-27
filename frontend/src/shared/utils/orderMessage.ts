import type { CartItem, CartState } from '../../domain/cart/cart.types';
import { CHECKOUT_CONFIG } from '../constants/checkout.constants';
import type { BuildOrderMessageInput, CheckoutFormState } from '../../features/checkout/checkout.types';
import { formatCurrency } from './currency';

const paymentLabel: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia'
};

const formatItem = (item: CartItem, currency: string): string => {
  const options = item.selectedOptions.map((opt) => opt.label).join(', ');
  const optionsLine = options ? ` | Opciones: ${options}` : '';
  const notesLine = item.notes ? ` | Nota: ${item.notes}` : '';
  return `- ${item.qty} x ${item.name} (${formatCurrency(item.lineTotal, currency)})${optionsLine}${notesLine}`;
};

const formatDeliveryData = (checkout: CheckoutFormState): string[] => {
  if (checkout.mode !== 'delivery') {
    return [];
  }

  return [
    `Direccion: ${checkout.delivery.address}`,
    `Barrio: ${checkout.delivery.neighborhood}`,
    `Telefono: ${checkout.delivery.phone}`,
    `Notas repartidor: ${checkout.delivery.courierNotes || 'Ninguna'}`
  ];
};

const formatPickupData = (checkout: CheckoutFormState): string[] => {
  if (checkout.mode !== 'pickup') {
    return [];
  }

  return [
    `Nombre: ${checkout.pickup.pickupName}`,
    `Hora estimada: ${checkout.pickup.eta}`,
    `Metodo de pago: ${paymentLabel[checkout.pickup.paymentMethod]}`
  ];
};

export const buildOrderMessage = ({
  cart,
  checkout,
  summary,
  storeName = CHECKOUT_CONFIG.storeName,
  currency = CHECKOUT_CONFIG.currency
}: BuildOrderMessageInput): string => {
  const itemLines = cart.items.map((item) => formatItem(item, currency));
  const deliveryType = checkout.mode === 'delivery' ? 'Envio a Domicilio' : 'Recoger en Tienda';

  const lines = [
    `Nuevo pedido - ${storeName}`,
    '',
    'Productos:',
    ...itemLines,
    '',
    `Subtotal: ${formatCurrency(summary.subtotal, currency)}`,
    `Envio: ${formatCurrency(summary.deliveryFee, currency)}`,
    `Impuestos (${Math.round(summary.taxRate * 100)}%): ${formatCurrency(summary.taxAmount, currency)}`,
    `Total: ${formatCurrency(summary.total, currency)}`,
    '',
    `Tipo de entrega: ${deliveryType}`,
    ...(checkout.mode === 'delivery' ? formatDeliveryData(checkout) : formatPickupData(checkout))
  ];

  return lines.join('\n');
};

export const buildWhatsAppUrl = (message: string, phone = CHECKOUT_CONFIG.businessWhatsapp): string => {
  const encoded = encodeURIComponent(message);
  if (phone) {
    return `https://wa.me/${phone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
};

export const hasCartItems = (cart: CartState): boolean => cart.items.length > 0;
