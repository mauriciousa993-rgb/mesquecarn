import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { CategoryId, Product } from '../../../domain/products/product.types';
import type { OrderRecord, OrderStatus } from '../../../infrastructure/api/orders.api';
import { uploadToCloudinary, isCloudinaryConfigured } from '../../../infrastructure/api/cloudinary.api';
import { useProducts } from '../../../shared/hooks/useProducts';
import { useOrders } from '../../../shared/hooks/useOrders';
import { formatCurrency } from '../../../shared/utils/currency';

interface ProductFormState {
  id: string;
  name: string;
  categoryId: CategoryId;
  basePrice: string;
  sku: string;
  stock: string;
  unit: string;
  active: boolean;
  imageUrl: string;
  videoUrl: string;
  fastFoodCustomizable: boolean;
}

type AdminSection = 'products' | 'orders';
type ToastKind = 'success' | 'error' | 'info';

interface ToastState {
  kind: ToastKind;
  text: string;
}

const createEmptyForm = (): ProductFormState => ({
  id: '',
  name: '',
  categoryId: 'fast_food',
  basePrice: '',
  sku: '',
  stock: '0',
  unit: '',
  active: true,
  imageUrl: '',
  videoUrl: '',
  fastFoodCustomizable: true
});

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');

const toProduct = (form: ProductFormState, existingId?: string): Product => {
  const categoryPrefix = form.categoryId.slice(0, 2);
  const generatedId = existingId ?? `${categoryPrefix}_${slugify(form.name)}`;

  const fastFoodCustomization = {
    enabled: true,
    groups: [
      {
        id: 'adiciones',
        label: 'Adiciones',
        type: 'multiple' as const,
        required: false,
        minSelect: 0,
        maxSelect: 5,
        options: [
          { id: 'queso_extra', label: 'Queso extra', priceDelta: 1 },
          { id: 'tocino', label: 'Tocino', priceDelta: 1.5 },
          { id: 'huevo', label: 'Huevo', priceDelta: 1.2 }
        ]
      }
    ]
  };

  return {
    id: generatedId,
    name: form.name.trim(),
    categoryId: form.categoryId,
    basePrice: Number(form.basePrice),
    sku: form.sku.trim().toUpperCase(),
    active: form.active,
    stock: Number(form.stock),
    unit: form.unit.trim() || undefined,
    image: form.imageUrl.trim() || undefined,
    videoUrl: form.videoUrl.trim() || undefined,
    customization:
      form.categoryId === 'fast_food' && form.fastFoodCustomizable
        ? fastFoodCustomization
        : { enabled: false, groups: [] }
  };
};

const orderStatusLabel: Record<OrderStatus, string> = {
  new: 'Nuevo',
  preparing: 'En preparacion',
  on_the_way: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado'
};

const orderStatusClass: Record<OrderStatus, string> = {
  new: 'border-emerald-400/60 text-emerald-300',
  preparing: 'border-amber-400/60 text-amber-300',
  on_the_way: 'border-sky-400/60 text-sky-300',
  delivered: 'border-slate-300/60 text-slate-200',
  cancelled: 'border-rose-400/60 text-rose-300'
};

const customerSummary = (order: OrderRecord): string => {
  if (order.checkout.mode === 'delivery') {
    return `${order.checkout.delivery.address} (${order.checkout.delivery.phone})`;
  }
  return `${order.checkout.pickup.pickupName} - ${order.checkout.pickup.eta}`;
};

const normalizeCategory = (value: unknown): CategoryId | null => {
  const raw = String(value ?? '')
    .toLowerCase()
    .trim();

  if (!raw) return null;
  if (raw === 'fast_food' || raw.includes('rapida') || raw.includes('hamburg')) return 'fast_food';
  if (raw === 'liquor' || raw.includes('licor') || raw.includes('vino') || raw.includes('whisk')) return 'liquor';
  if (raw === 'meat_cheese' || raw.includes('carne') || raw.includes('queso')) return 'meat_cheese';
  if (raw === 'grocery' || raw.includes('abarrote') || raw.includes('tienda')) return 'grocery';
  return null;
};

const toBool = (value: unknown, fallback: boolean): boolean => {
  const raw = String(value ?? '')
    .toLowerCase()
    .trim();
  if (!raw) return fallback;
  return raw === '1' || raw === 'true' || raw === 'si' || raw === 'sí' || raw === 'yes';
};

const toNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const inputClass =
  'w-full rounded-xl border border-amber-100/20 bg-[#16130f] px-3 py-2 text-sm text-[#f7eddc] outline-none placeholder:text-amber-100/35 focus:border-amber-100/45';

const ProductMediaPreview = ({ product }: { product: Product }) => (
  <div className="mt-2 flex flex-wrap gap-2">
    {product.image ? (
      <img src={product.image} alt={product.name} className="h-20 w-24 rounded-lg border border-amber-100/15 object-cover" />
    ) : null}
    {product.videoUrl ? (
      <video src={product.videoUrl} className="h-20 w-32 rounded-lg border border-amber-100/15 object-cover" controls muted />
    ) : null}
  </div>
);

export const AdminPanel = () => {
  const { categories, products, addProduct, updateProduct, upsertProducts, toggleProductActive } = useProducts();
  const { orders, refreshOrders, setOrderStatus, totalPending } = useOrders();
  const formRef = useRef<HTMLFormElement | null>(null);

  const [section, setSection] = useState<AdminSection>('products');
  const [form, setForm] = useState<ProductFormState>(createEmptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<CategoryId | 'all'>('all');
  const [orderFilterStatus, setOrderFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const notify = (kind: ToastKind, text: string) => setToast({ kind, text });

  const filteredProducts = useMemo(() => {
    if (filterCategory === 'all') return products;
    return products.filter((product) => product.categoryId === filterCategory);
  }, [products, filterCategory]);

  const filteredOrders = useMemo(() => {
    if (orderFilterStatus === 'all') return orders;
    return orders.filter((order) => order.status === orderFilterStatus);
  }, [orders, orderFilterStatus]);

  const resetForm = () => {
    setForm(createEmptyForm());
    setEditingId(null);
  };

  const loadProductToForm = (product: Product) => {
    setEditingId(product.id);
    setForm({
      id: product.id,
      name: product.name,
      categoryId: product.categoryId,
      basePrice: String(product.basePrice),
      sku: product.sku,
      stock: String(product.stock),
      unit: product.unit ?? '',
      active: product.active,
      imageUrl: product.image ?? '',
      videoUrl: product.videoUrl ?? '',
      fastFoodCustomizable: product.customization.enabled
    });
    setSection('products');
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) return 'El nombre es obligatorio.';
    if (!form.sku.trim()) return 'El SKU es obligatorio.';
    if (Number.isNaN(Number(form.basePrice)) || Number(form.basePrice) <= 0) return 'El precio debe ser mayor a 0.';
    if (Number.isNaN(Number(form.stock)) || Number(form.stock) < 0) return 'El stock no puede ser negativo.';
    return null;
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const error = validateForm();

    if (error) {
      notify('error', error);
      return;
    }

    const product = toProduct(form, editingId ?? undefined);

    if (!editingId && products.some((item) => item.id === product.id)) {
      notify('error', 'Ya existe un producto con ese nombre/categoria. Cambia el nombre o edita el existente.');
      return;
    }

    if (editingId) {
      updateProduct(product);
      notify('success', 'Producto actualizado correctamente.');
    } else {
      addProduct(product);
      notify('success', 'Producto agregado correctamente.');
    }

    resetForm();
  };

  const uploadMedia = async (file: File, type: 'image' | 'video') => {
    if (!isCloudinaryConfigured()) {
      notify('info', 'Configura Cloudinary en .env para subir archivos.');
      return;
    }

    try {
      if (type === 'image') setIsUploadingImage(true);
      else setIsUploadingVideo(true);

      const result = await uploadToCloudinary(file, type);

      if (type === 'image') {
        setForm((prev) => ({ ...prev, imageUrl: result.secureUrl }));
        notify('success', 'Imagen subida a Cloudinary.');
      } else {
        setForm((prev) => ({ ...prev, videoUrl: result.secureUrl }));
        notify('success', 'Video subido a Cloudinary.');
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Error desconocido';
      notify('error', `No se pudo subir el archivo: ${detail}`);
    } finally {
      setIsUploadingImage(false);
      setIsUploadingVideo(false);
    }
  };

  const handleBulkUpload = async (file: File) => {
    try {
      const xlsx = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = xlsx.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const firstSheet = workbook.Sheets[firstSheetName];
      const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });

      if (rows.length === 0) {
        notify('error', 'El archivo no tiene filas de productos.');
        return;
      }

      const incoming: Product[] = [];

      rows.forEach((row) => {
        const category =
          normalizeCategory(row.categoryId ?? row.category ?? row.categoria ?? row.tipo) ?? 'grocery';
        const name = String(row.name ?? row.nombre ?? '').trim();
        const sku = String(row.sku ?? row.codigo ?? row.code ?? '').trim().toUpperCase();
        const basePrice = toNumber(row.basePrice ?? row.price ?? row.precio, NaN);
        const stock = toNumber(row.stock ?? row.inventario, 0);

        if (!name || !sku || !Number.isFinite(basePrice) || basePrice <= 0) {
          return;
        }

        const providedId = String(row.id ?? '').trim();
        const generatedId = providedId || `${category.slice(0, 2)}_${slugify(name)}`;
        const customizable = toBool(row.customizable ?? row.personalizable, category === 'fast_food');

        incoming.push({
          id: generatedId,
          name,
          categoryId: category,
          basePrice,
          sku,
          active: toBool(row.active ?? row.disponible, true),
          stock,
          unit: String(row.unit ?? row.unidad ?? '').trim() || undefined,
          image: String(row.image ?? row.imageUrl ?? row.imagen ?? '').trim() || undefined,
          videoUrl: String(row.video ?? row.videoUrl ?? row.clip ?? '').trim() || undefined,
          customization:
            category === 'fast_food' && customizable
              ? {
                  enabled: true,
                  groups: [
                    {
                      id: 'adiciones',
                      label: 'Adiciones',
                      type: 'multiple',
                      required: false,
                      minSelect: 0,
                      maxSelect: 5,
                      options: [
                        { id: 'queso_extra', label: 'Queso extra', priceDelta: 1 },
                        { id: 'tocino', label: 'Tocino', priceDelta: 1.5 },
                        { id: 'huevo', label: 'Huevo', priceDelta: 1.2 }
                      ]
                    }
                  ]
                }
              : { enabled: false, groups: [] }
        });
      });

      if (incoming.length === 0) {
        notify('error', 'No se encontraron filas válidas (requiere nombre, SKU y precio > 0).');
        return;
      }

      const result = upsertProducts(incoming);
      notify('success', `Carga masiva completada: ${result.created} creados, ${result.updated} actualizados.`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Error desconocido';
      notify('error', `No se pudo procesar el archivo: ${detail}`);
    }
  };

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-amber-100/15 bg-[#15130f]/80 p-5">
        <p className="text-[11px] uppercase tracking-[0.32em] text-amber-100/65">Gestión Interna</p>
        <h2 className="mt-2 font-serif text-4xl text-[#f7efde]">Panel de Administrador</h2>
        <p className="mt-2 text-sm text-[#cfbda3]">Controla catálogo, multimedia y órdenes en un solo tablero.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSection('products')}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${
              section === 'products'
                ? 'border border-amber-100/60 bg-[#f0dec2] text-[#2d2218]'
                : 'border border-amber-100/20 bg-[#120f0c] text-amber-50/80'
            }`}
          >
            Productos
          </button>
          <button
            type="button"
            onClick={() => setSection('orders')}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${
              section === 'orders'
                ? 'border border-amber-100/60 bg-[#f0dec2] text-[#2d2218]'
                : 'border border-amber-100/20 bg-[#120f0c] text-amber-50/80'
            }`}
          >
            Ordenes ({totalPending})
          </button>
        </div>
      </header>

      {section === 'products' ? (
        <>
          <form ref={formRef} onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-amber-100/15 bg-[#14120e]/85 p-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-amber-100/70">Nombre</label>
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-amber-100/70">SKU</label>
              <input
                value={form.sku}
                onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-amber-100/70">Categoria</label>
              <select
                value={form.categoryId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    categoryId: event.target.value as CategoryId,
                    unit: event.target.value === 'meat_cheese' ? prev.unit || 'kg' : ''
                  }))
                }
                className={inputClass}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-amber-100/70">Precio</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.basePrice}
                onChange={(event) => setForm((prev) => ({ ...prev, basePrice: event.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-amber-100/70">Stock</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-amber-100/70">Unidad (opcional)</label>
              <input
                placeholder="kg, lb, unidad"
                value={form.unit}
                onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-amber-100/70">URL imagen</label>
              <input
                placeholder="https://..."
                value={form.imageUrl}
                onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                className={inputClass}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadMedia(file, 'image');
                }}
                className="mt-2 block w-full text-xs text-amber-100/70"
              />
              <p className="mt-1 text-xs text-amber-100/45">
                {isUploadingImage ? 'Subiendo imagen...' : 'Subida de imagen por Cloudinary'}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs text-amber-100/70">URL video clip</label>
              <input
                placeholder="https://..."
                value={form.videoUrl}
                onChange={(event) => setForm((prev) => ({ ...prev, videoUrl: event.target.value }))}
                className={inputClass}
              />
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadMedia(file, 'video');
                }}
                className="mt-2 block w-full text-xs text-amber-100/70"
              />
              <p className="mt-1 text-xs text-amber-100/45">
                {isUploadingVideo ? 'Subiendo video...' : 'Ideal para Comidas Rapidas'}
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm text-amber-50/90">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
              />
              Producto disponible
            </label>

            {form.categoryId === 'fast_food' ? (
              <label className="flex items-center gap-2 text-sm text-amber-50/90">
                <input
                  type="checkbox"
                  checked={form.fastFoodCustomizable}
                  onChange={(event) => setForm((prev) => ({ ...prev, fastFoodCustomizable: event.target.checked }))}
                />
                Habilitar personalizacion (adiciones)
              </label>
            ) : (
              <div />
            )}

            <div className="md:col-span-2 flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-full border border-amber-100/55 bg-[#f1dfc3] px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#2d2319] hover:bg-[#f7ead6]"
              >
                {editingId ? 'Guardar cambios' : 'Agregar producto'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-amber-100/30 px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-50/80 hover:bg-amber-50/10"
                >
                  Cancelar edicion
                </button>
              ) : null}
              <label className="rounded-full border border-amber-100/30 px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-50/85 hover:bg-amber-50/10">
                Carga masiva Excel
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleBulkUpload(file);
                    }
                    event.currentTarget.value = '';
                  }}
                />
              </label>
            </div>

          </form>

          <section className="rounded-2xl border border-amber-100/15 bg-[#14120e]/85 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-serif text-2xl text-[#f5ebd8]">Productos actuales</h3>
              <select
                value={filterCategory}
                onChange={(event) => setFilterCategory(event.target.value as CategoryId | 'all')}
                className="rounded-xl border border-amber-100/20 bg-[#16130f] px-3 py-2 text-sm text-[#f7eddc]"
              >
                <option value="all">Todas las categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {filteredProducts.map((product) => (
                <article key={product.id} className="rounded-xl border border-amber-100/15 bg-[#0f0d0a] p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-amber-100/50">{product.sku}</p>
                  <h4 className="font-serif text-xl text-[#f5ebd8]">{product.name}</h4>
                  <p className="text-sm text-amber-100/80">
                    {formatCurrency(product.basePrice)} {product.unit ? `/ ${product.unit}` : ''}
                  </p>
                  <p className="text-xs text-amber-100/55">Stock: {product.stock}</p>
                  <p className="text-xs text-amber-100/55">Estado: {product.active ? 'Disponible' : 'Oculto'}</p>

                  <ProductMediaPreview product={product} />

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => loadProductToForm(product)}
                      className="rounded-full border border-amber-100/35 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-amber-50/85 hover:bg-amber-50/10"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleProductActive(product.id)}
                      className="rounded-full border border-amber-100/35 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-amber-50/85 hover:bg-amber-50/10"
                    >
                      {product.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-2xl border border-amber-100/15 bg-[#14120e]/85 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-serif text-2xl text-[#f5ebd8]">Ordenes de clientes</h3>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={orderFilterStatus}
                onChange={(event) => setOrderFilterStatus(event.target.value as OrderStatus | 'all')}
                className="rounded-xl border border-amber-100/20 bg-[#16130f] px-3 py-2 text-sm text-[#f7eddc]"
              >
                <option value="all">Todos los estados</option>
                <option value="new">Nuevo</option>
                <option value="preparing">En preparacion</option>
                <option value="on_the_way">En camino</option>
                <option value="delivered">Entregado</option>
                <option value="cancelled">Cancelado</option>
              </select>
              <button
                type="button"
                onClick={refreshOrders}
                className="rounded-full border border-amber-100/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-50/85 hover:bg-amber-50/10"
              >
                Actualizar
              </button>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <p className="text-sm text-amber-100/60">No hay ordenes registradas para ese filtro.</p>
          ) : null}

          <div className="grid gap-3">
            {filteredOrders.map((order) => (
              <article key={order.id} className="rounded-xl border border-amber-100/15 bg-[#0f0d0a] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-serif text-lg text-[#f5ebd8]">{order.id}</p>
                    <p className="text-xs text-amber-100/55">
                      {new Date(order.createdAt).toLocaleString('es-ES')} |{' '}
                      {order.checkout.mode === 'delivery' ? 'Domicilio' : 'Recoger'}
                    </p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs ${orderStatusClass[order.status]}`}>
                    {orderStatusLabel[order.status]}
                  </span>
                </div>

                <div className="mt-2 space-y-1">
                  <p className="text-xs text-amber-100/75">Cliente: {customerSummary(order)}</p>
                  <p className="text-xs text-amber-100/75">
                    Total: <strong>{formatCurrency(order.summary.total)}</strong>
                  </p>
                  <p className="text-xs text-amber-100/60">Items: {order.items.reduce((acc, item) => acc + item.qty, 0)}</p>
                </div>

                <div className="mt-2 rounded-lg border border-amber-100/15 bg-[#17140f] p-2">
                  <p className="text-xs text-amber-100/55">Detalle del pedido:</p>
                  <ul className="mt-1 space-y-1">
                    {order.items.map((item) => (
                      <li key={item.lineId} className="text-xs text-amber-100/80">
                        {item.qty} x {item.name} ({formatCurrency(item.lineTotal)})
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <select
                    value={order.status}
                    onChange={(event) => setOrderStatus(order.id, event.target.value as OrderStatus)}
                    className="rounded-xl border border-amber-100/20 bg-[#16130f] px-3 py-1 text-xs text-[#f7eddc]"
                  >
                    <option value="new">Nuevo</option>
                    <option value="preparing">En preparacion</option>
                    <option value="on_the_way">En camino</option>
                    <option value="delivered">Entregado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        `https://wa.me/?text=${encodeURIComponent(order.whatsappMessage)}`,
                        '_blank',
                        'noopener,noreferrer'
                      )
                    }
                    className="rounded-full border border-amber-100/35 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-amber-50/85 hover:bg-amber-50/10"
                  >
                    Reabrir WhatsApp
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {toast ? (
        <div className="fixed bottom-5 right-5 z-[60] max-w-sm">
          <div
            className={`rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur ${
              toast.kind === 'success'
                ? 'border-emerald-300/50 bg-emerald-900/70 text-emerald-100'
                : toast.kind === 'error'
                  ? 'border-rose-300/50 bg-rose-900/70 text-rose-100'
                  : 'border-amber-200/50 bg-amber-900/65 text-amber-50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm">{toast.text}</p>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="rounded-full border border-current/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] opacity-80 hover:opacity-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};
