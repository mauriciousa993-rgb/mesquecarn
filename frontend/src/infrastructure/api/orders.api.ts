import type { CartState } from '../../domain/cart/cart.types';
import type { CheckoutFormState, CheckoutSummary } from '../../features/checkout/checkout.types';

const ORDERS_STORAGE_KEY = 'mes-que-carn-orders-v1';

export type OrderStatus = 'new' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled';

export interface OrderRecord {
  id: string;
  createdAt: string;
  status: OrderStatus;
  items: CartState['items'];
  checkout: CheckoutFormState;
  summary: CheckoutSummary;
  whatsappMessage: string;
}

const loadRawOrders = (): OrderRecord[] => {
  const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as OrderRecord[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
};

const saveRawOrders = (orders: OrderRecord[]) => {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
};

const generateOrderId = (): string => {
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `MQC-${Date.now()}-${random}`;
};

export const createOrder = (payload: {
  items: CartState['items'];
  checkout: CheckoutFormState;
  summary: CheckoutSummary;
  whatsappMessage: string;
}): OrderRecord => {
  const newOrder: OrderRecord = {
    id: generateOrderId(),
    createdAt: new Date().toISOString(),
    status: 'new',
    items: payload.items,
    checkout: payload.checkout,
    summary: payload.summary,
    whatsappMessage: payload.whatsappMessage
  };

  const current = loadRawOrders();
  const next = [newOrder, ...current];
  saveRawOrders(next);

  return newOrder;
};

export const getOrders = (): OrderRecord[] => {
  return loadRawOrders().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
};

export const updateOrderStatus = (orderId: string, status: OrderStatus): OrderRecord | null => {
  const current = loadRawOrders();
  let updatedOrder: OrderRecord | null = null;

  const next = current.map((order) => {
    if (order.id !== orderId) {
      return order;
    }

    updatedOrder = { ...order, status };
    return updatedOrder;
  });

  saveRawOrders(next);
  return updatedOrder;
};
