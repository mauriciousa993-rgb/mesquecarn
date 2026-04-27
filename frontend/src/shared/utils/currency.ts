export const formatCurrency = (value: number, currency = 'EUR') =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency
  }).format(value);
