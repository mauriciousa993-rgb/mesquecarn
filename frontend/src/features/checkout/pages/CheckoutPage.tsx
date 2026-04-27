import type { CartState } from '../../../domain/cart/cart.types';
import { CheckoutForm } from '../components/CheckoutForm';

interface CheckoutPageProps {
  cart: CartState;
}

export const CheckoutPage = ({ cart }: CheckoutPageProps) => {
  return <CheckoutForm cart={cart} />;
};
