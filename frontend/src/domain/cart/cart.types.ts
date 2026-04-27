import type { CategoryId } from '../products/product.types';

export interface SelectedOption {
  groupId: string;
  optionId: string;
  label: string;
  priceDelta: number;
}

export interface CartItem {
  lineId: string;
  productId: string;
  categoryId: CategoryId;
  name: string;
  basePrice: number;
  selectedOptions: SelectedOption[];
  qty: number;
  notes?: string;
  lineTotal: number;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export interface AddItemPayload {
  productId: string;
  categoryId: CategoryId;
  name: string;
  basePrice: number;
  selectedOptions: SelectedOption[];
  qty?: number;
  notes?: string;
}

export type CartAction =
  | { type: 'ADD_ITEM'; payload: AddItemPayload }
  | { type: 'UPDATE_QTY'; payload: { lineId: string; qty: number } }
  | { type: 'REMOVE_ITEM'; payload: { lineId: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'HYDRATE_CART'; payload: CartState };
