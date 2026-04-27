# Mes que Carn - Frontend

Aplicacion React + TypeScript para minimercado y restaurante con:

- Catalogo por categorias: Comida Rapida, Licores, Carnes y Quesos, Abarrotes.
- Personalizacion para comida rapida (termino, adiciones, etc.).
- Carrito unico para mezclar productos de todas las categorias.
- Persistencia del carrito en `localStorage`.
- UI en Tailwind CSS con portada principal y acceso por boton `Hacer Pedido`.
- Checkout con tabs: `Envio a Domicilio` / `Recoger en Tienda`.
- Generacion de mensaje estructurado para WhatsApp con impuestos.
- Panel de Administrador para agregar/editar/activar productos por categoria.
- Integracion Cloudinary para subir imagenes y video clips de productos.
- Panel de Ordenes en Admin con cambio de estado (`nuevo`, `preparacion`, `en camino`, `entregado`, `cancelado`).
- Carrito visible bajo demanda con boton `Ver carrito`.

## Estructura principal

- `src/domain`: tipos, datos y logica de negocio.
- `src/features`: UI por funcionalidades.
- `src/app/providers/CartProvider.tsx`: estado global del carrito.
- `src/app/providers/ProductsProvider.tsx`: estado global del catalogo editable.
- `src/infrastructure/storage/cart.storage.ts`: persistencia local.
- `src/infrastructure/storage/products.storage.ts`: persistencia de productos del admin.
- `src/infrastructure/api/cloudinary.api.ts`: subida de imagen/video a Cloudinary.
- `src/infrastructure/api/orders.api.ts`: persistencia local y estados de ordenes.
- `src/shared/constants/checkout.constants.ts`: tarifas e impuestos de checkout.
- `src/shared/utils/orderMessage.ts`: formateo de pedido para WhatsApp.

## Scripts

```bash
npm install
npm run dev
npm run build
```

Si `npm` falla en WSL, ejecutalo desde terminal de Windows en esta carpeta.

## Acceso Admin

- La vista admin no aparece como boton en la tienda.
- Accede directamente por URL:
  `http://localhost:5173/admin`

## Variables de entorno

1. Copia `.env.example` a `.env`.
2. Configura:
   `VITE_BACKEND_URL`
   `VITE_CLOUDINARY_FOLDER` (opcional)

## Carga Masiva (Excel/CSV)

- En el panel de productos usa `Carga masiva Excel`.
- Formatos: `.xlsx`, `.xls`, `.csv`.
- Columnas soportadas (minimas recomendadas):
  `name`/`nombre`, `sku`, `price`/`precio`, `categoryId`/`categoria`.
- Opcionales:
  `id`, `stock`, `unit`/`unidad`, `image`/`imageUrl`, `video`/`videoUrl`, `active`, `customizable`.
- Si coincide `id` o `sku`, el producto se actualiza; si no, se crea uno nuevo.
