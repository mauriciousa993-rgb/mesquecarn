import type { AddItemPayload, CartAction, CartItem, CartState } from './cart.types';

export const INITIAL_CART_STATE: CartState = {
  items: [],
  subtotal: 0,
  deliveryFee: 0,
  total: 0
};

const round2 = (value: number) => Math.round(value * 100) / 100;

const createLineId = (payload: AddItemPayload): string => {
  const sortedOptions = [...payload.selectedOptions]
    .map((opt) => `${opt.groupId}:${opt.optionId}`)
    .sort()
    .join('|');
  const notes = payload.notes?.trim() ?? '';
  return `${payload.productId}__${sortedOptions}__${notes}`;
};

const calculateLineTotal = (item: Pick<CartItem, 'basePrice' | 'selectedOptions' | 'qty'>): number => {
  const optionsTotal = item.selectedOptions.reduce((acc, opt) => acc + opt.priceDelta, 0);
  return round2((item.basePrice + optionsTotal) * item.qty);
};

const recalculateTotals = (state: Omit<CartState, 'subtotal' | 'total'>): CartState => {
  const subtotal = round2(state.items.reduce((acc, item) => acc + item.lineTotal, 0));
  return {
    ...state,
    subtotal,
    total: round2(subtotal + state.deliveryFee)
  };
};

export const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'HYDRATE_CART':
      return action.payload;
    case 'ADD_ITEM': {
      const qty = action.payload.qty && action.payload.qty > 0 ? action.payload.qty : 1;
      const lineId = createLineId(action.payload);

      const existing = state.items.find((item) => item.lineId === lineId);

      let updatedItems: CartItem[];

      if (existing) {
        updatedItems = state.items.map((item) => {
          if (item.lineId !== lineId) {
            return item;
          }
          const updatedQty = item.qty + qty;
          const updatedItem: CartItem = {
            ...item,
            qty: updatedQty,
            lineTotal: calculateLineTotal({
              basePrice: item.basePrice,
              selectedOptions: item.selectedOptions,
              qty: updatedQty
            })
          };
          return updatedItem;
        });
      } else {
        const newItem: CartItem = {
          lineId,
          productId: action.payload.productId,
          categoryId: action.payload.categoryId,
          name: action.payload.name,
          basePrice: action.payload.basePrice,
          selectedOptions: action.payload.selectedOptions,
          qty,
          notes: action.payload.notes,
          lineTotal: calculateLineTotal({
            basePrice: action.payload.basePrice,
            selectedOptions: action.payload.selectedOptions,
            qty
          })
        };
        updatedItems = [...state.items, newItem];
      }

      return recalculateTotals({ ...state, items: updatedItems });
    }
    case 'UPDATE_QTY': {
      const { lineId, qty } = action.payload;
      const sanitizedQty = Math.max(0, qty);

      const updatedItems = state.items
        .map((item) => {
          if (item.lineId !== lineId) {
            return item;
          }
          if (sanitizedQty === 0) {
            return null;
          }
          return {
            ...item,
            qty: sanitizedQty,
            lineTotal: calculateLineTotal({
              basePrice: item.basePrice,
              selectedOptions: item.selectedOptions,
              qty: sanitizedQty
            })
          };
        })
        .filter((item): item is CartItem => item !== null);

      return recalculateTotals({ ...state, items: updatedItems });
    }
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter((item) => item.lineId !== action.payload.lineId);
      return recalculateTotals({ ...state, items: updatedItems });
    }
    case 'CLEAR_CART':
      return INITIAL_CART_STATE;
    default:
      return state;
  }
};
