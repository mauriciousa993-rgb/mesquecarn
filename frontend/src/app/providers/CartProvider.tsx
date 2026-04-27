import { createContext, useEffect, useMemo, useReducer } from 'react';
import { cartReducer, INITIAL_CART_STATE } from '../../domain/cart/cart.reducer';
import type { AddItemPayload, CartAction, CartState } from '../../domain/cart/cart.types';
import { getCartItemsCount } from '../../domain/cart/cart.selectors';
import { loadCart, saveCart } from '../../infrastructure/storage/cart.storage';

interface CartContextValue {
  state: CartState;
  itemsCount: number;
  addItem: (payload: AddItemPayload) => void;
  updateQty: (lineId: string, qty: number) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextValue | undefined>(undefined);

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [state, dispatch] = useReducer(cartReducer, INITIAL_CART_STATE);

  useEffect(() => {
    const cached = loadCart();
    if (cached) {
      dispatch({ type: 'HYDRATE_CART', payload: cached });
    }
  }, []);

  useEffect(() => {
    saveCart(state);
  }, [state]);

  const onDispatch = (action: CartAction) => dispatch(action);

  const value = useMemo<CartContextValue>(() => {
    const addItem = (payload: AddItemPayload) => onDispatch({ type: 'ADD_ITEM', payload });
    const updateQty = (lineId: string, qty: number) =>
      onDispatch({ type: 'UPDATE_QTY', payload: { lineId, qty } });
    const removeItem = (lineId: string) => onDispatch({ type: 'REMOVE_ITEM', payload: { lineId } });
    const clearCart = () => onDispatch({ type: 'CLEAR_CART' });

    return {
      state,
      itemsCount: getCartItemsCount(state),
      addItem,
      updateQty,
      removeItem,
      clearCart
    };
  }, [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
