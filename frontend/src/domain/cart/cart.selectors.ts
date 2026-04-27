import type { CartState } from './cart.types';

export const getCartItemsCount = (state: CartState): number =>
  state.items.reduce((acc, item) => acc + item.qty, 0);
