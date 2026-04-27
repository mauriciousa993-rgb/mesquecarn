import type { StoreCatalog } from './product.types';

export const catalogData: StoreCatalog = {
  store: {
    id: 'mes-que-carn',
    name: 'Mes que Carn',
    currency: 'EUR'
  },
  categories: [
    { id: 'fast_food', name: 'Comidas Rapidas' },
    { id: 'liquor', name: 'Licores' },
    { id: 'meat_cheese', name: 'Carnes y Quesos' },
    { id: 'grocery', name: 'Productos de Tienda' }
  ],
  products: [
    {
      id: 'ff_burger_clasica',
      categoryId: 'fast_food',
      name: 'Hamburguesa Clasica',
      basePrice: 8.5,
      sku: 'FF-001',
      active: true,
      stock: 999,
      customization: {
        enabled: true,
        groups: [
          {
            id: 'termino_carne',
            label: 'Termino de la carne',
            type: 'single',
            required: true,
            minSelect: 1,
            maxSelect: 1,
            options: [
              { id: 'poco_hecha', label: 'Poco hecha', priceDelta: 0 },
              { id: 'al_punto', label: 'Al punto', priceDelta: 0 },
              { id: 'hecha', label: 'Hecha', priceDelta: 0 }
            ]
          },
          {
            id: 'adiciones',
            label: 'Adiciones',
            type: 'multiple',
            required: false,
            minSelect: 0,
            maxSelect: 4,
            options: [
              { id: 'queso_extra', label: 'Queso extra', priceDelta: 1 },
              { id: 'tocino', label: 'Tocino', priceDelta: 1.5 },
              { id: 'huevo', label: 'Huevo', priceDelta: 1.2 }
            ]
          }
        ]
      }
    },
    {
      id: 'ff_perro_caliente',
      categoryId: 'fast_food',
      name: 'Perro Caliente',
      basePrice: 6.9,
      sku: 'FF-002',
      active: true,
      stock: 999,
      customization: {
        enabled: true,
        groups: [
          {
            id: 'salsas',
            label: 'Salsas',
            type: 'multiple',
            required: false,
            minSelect: 0,
            maxSelect: 3,
            options: [
              { id: 'ketchup', label: 'Ketchup', priceDelta: 0 },
              { id: 'mostaza', label: 'Mostaza', priceDelta: 0 },
              { id: 'bbq', label: 'BBQ', priceDelta: 0.4 }
            ]
          }
        ]
      }
    },
    {
      id: 'liq_whisky_12',
      categoryId: 'liquor',
      name: 'Whisky 12 anos',
      basePrice: 34.9,
      sku: 'LIQ-012',
      active: true,
      stock: 20,
      customization: { enabled: false, groups: [] }
    },
    {
      id: 'liq_vino_tinto',
      categoryId: 'liquor',
      name: 'Vino Tinto Reserva',
      basePrice: 14.5,
      sku: 'LIQ-019',
      active: true,
      stock: 35,
      customization: { enabled: false, groups: [] }
    },
    {
      id: 'mc_chuleton_res',
      categoryId: 'meat_cheese',
      name: 'Chuleton de Res',
      basePrice: 18,
      sku: 'MC-101',
      unit: 'kg',
      active: true,
      stock: 120,
      customization: { enabled: false, groups: [] }
    },
    {
      id: 'mc_queso_manchego',
      categoryId: 'meat_cheese',
      name: 'Queso Manchego',
      basePrice: 16.5,
      sku: 'MC-202',
      unit: 'kg',
      active: true,
      stock: 80,
      customization: { enabled: false, groups: [] }
    },
    {
      id: 'gr_arroz_1kg',
      categoryId: 'grocery',
      name: 'Arroz 1kg',
      basePrice: 2.2,
      sku: 'GR-301',
      active: true,
      stock: 85,
      customization: { enabled: false, groups: [] }
    },
    {
      id: 'gr_aceite_oliva',
      categoryId: 'grocery',
      name: 'Aceite de Oliva 1L',
      basePrice: 7.9,
      sku: 'GR-312',
      active: true,
      stock: 50,
      customization: { enabled: false, groups: [] }
    }
  ]
};
