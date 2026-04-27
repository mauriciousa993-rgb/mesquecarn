import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRoutes } from './app/routes';
import { CartProvider } from './app/providers/CartProvider';
import { ProductsProvider } from './app/providers/ProductsProvider';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ProductsProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </ProductsProvider>
  </React.StrictMode>
);
