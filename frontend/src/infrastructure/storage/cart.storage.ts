import type { CartState } from '../../domain/cart/cart.types';

const CART_STORAGE_KEY = 'mes-que-carn-cart-v1';

export const saveCart = (state: CartState) => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
};

export const loadCart = (): CartState | null => {
  const raw = localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as CartState;
    if (!Array.isArray(parsed.items)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};
