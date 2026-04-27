import type { CartState } from '../../domain/cart/cart.types';
import type { CheckoutMode, CheckoutSummary } from '../../features/checkout/checkout.types';
import { CHECKOUT_CONFIG } from '../constants/checkout.constants';

const round2 = (value: number) => Math.round(value * 100) / 100;

export const calculateCheckoutSummary = (
  cart: CartState,
  mode: CheckoutMode,
  options?: { deliveryFee?: number; taxRate?: number; applyTax?: boolean }
): CheckoutSummary => {
  const deliveryFee = mode === 'delivery' ? options?.deliveryFee ?? CHECKOUT_CONFIG.deliveryFee : 0;
  const applyTax = options?.applyTax ?? CHECKOUT_CONFIG.applyTax;
  const taxRate = applyTax ? options?.taxRate ?? CHECKOUT_CONFIG.taxRate : 0;

  const taxableBase = cart.subtotal + deliveryFee;
  const taxAmount = round2(taxableBase * taxRate);
  const total = round2(taxableBase + taxAmount);

  return {
    subtotal: round2(cart.subtotal),
    deliveryFee: round2(deliveryFee),
    taxRate,
    taxAmount,
    total
  };
};
