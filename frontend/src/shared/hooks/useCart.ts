import { useContext } from 'react';
import { CartContext } from '../../app/providers/CartProvider';

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
};
