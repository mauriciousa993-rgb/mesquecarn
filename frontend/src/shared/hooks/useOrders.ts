import { useCallback, useMemo, useState } from 'react';
import { createOrder, getOrders, type OrderRecord, type OrderStatus, updateOrderStatus } from '../../infrastructure/api/orders.api';
import type { CartState } from '../../domain/cart/cart.types';
import type { CheckoutFormState, CheckoutSummary } from '../../features/checkout/checkout.types';

export const useOrders = () => {
  const [orders, setOrders] = useState<OrderRecord[]>(() => getOrders());

  const refreshOrders = useCallback(() => {
    setOrders(getOrders());
  }, []);

  const registerOrder = useCallback(
    (payload: {
      cart: CartState;
      checkout: CheckoutFormState;
      summary: CheckoutSummary;
      whatsappMessage: string;
    }) => {
      createOrder({
        items: payload.cart.items,
        checkout: payload.checkout,
        summary: payload.summary,
        whatsappMessage: payload.whatsappMessage
      });
      refreshOrders();
    },
    [refreshOrders]
  );

  const setOrderStatus = useCallback(
    (orderId: string, status: OrderStatus) => {
      updateOrderStatus(orderId, status);
      refreshOrders();
    },
    [refreshOrders]
  );

  const totalPending = useMemo(
    () => orders.filter((order) => order.status === 'new' || order.status === 'preparing').length,
    [orders]
  );

  return {
    orders,
    refreshOrders,
    registerOrder,
    setOrderStatus,
    totalPending
  };
};
