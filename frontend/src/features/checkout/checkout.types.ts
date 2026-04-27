import type { CartState } from '../../domain/cart/cart.types';

export type CheckoutMode = 'delivery' | 'pickup';

export type PickupPaymentMethod = 'cash' | 'transfer';

export interface DeliveryFormData {
  address: string;
  neighborhood: string;
  phone: string;
  courierNotes: string;
}

export interface PickupFormData {
  pickupName: string;
  eta: string;
  paymentMethod: PickupPaymentMethod;
}

export interface CheckoutFormState {
  mode: CheckoutMode;
  delivery: DeliveryFormData;
  pickup: PickupFormData;
}

export interface CheckoutSummary {
  subtotal: number;
  deliveryFee: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface BuildOrderMessageInput {
  cart: CartState;
  checkout: CheckoutFormState;
  summary: CheckoutSummary;
  storeName?: string;
  currency?: string;
}
