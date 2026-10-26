import { expect, it, vi } from 'vitest';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { AuthorizationError } from '@/modules/identity/guards/authorization-error';
import { createProduct, createProductForForm } from './actions';

const { authorize } = vi.hoisted(() => ({ authorize: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/modules/identity/guards/action.guard', () => ({ requireTypedAuthorizedAction: authorize }));

it('devuelve solo el mensaje del alta al formulario y conserva autorización y redirección', async () => {
  const form = new FormData();
  form.set('name', 'Pan integral');
  form.set('slug', 'pan-integral');
  form.set('internal_code', 'SKU-001');
  const cases = [
    ['23505', 'products_slug_key', 'Ya existe un producto con ese slug.'],
    ['23505', 'products_internal_code_key', 'Ya existe un producto con ese código interno.'],
    ['XX000', 'products', 'No se pudo registrar el producto.'],
  ] as const;
  for (const [code, constraint, message] of cases) {
    const error = { code, message: `database failure "${constraint}"`, details: 'Detalle privado.' };
    authorize.mockResolvedValue({ supabase: { from: () => ({ insert: async () => ({ error }) }) } });
    await expect(createProductForForm(form)).resolves.toEqual({ error: message });
  }
  const denied = new AuthorizationError('permission_missing', 'Sin permiso.');
  authorize.mockRejectedValue(denied);
  await expect(createProductForForm(form)).rejects.toBe(denied);

  const redirectSignal = new Error('NEXT_REDIRECT');
  authorize.mockResolvedValue({ supabase: { from: () => ({ insert: async () => ({ error: null }) }) } });
  vi.mocked(redirect).mockImplementationOnce(() => { throw redirectSignal; });
  await expect(createProductForForm(form)).rejects.toBe(redirectSignal);
});

it('traduce rechazos de unicidad sin invalidar ni redirigir y conserva la causa interna', async () => {
  const cases = [
    ['23505', 'products_slug_key', 'Ya existe un producto con ese slug.'],
    ['23505', 'products_internal_code_key', 'Ya existe un producto con ese código interno.'],
    ['XX000', 'products', 'No se pudo registrar el producto.'],
  ] as const;
  for (const [code, constraint, message] of cases) {
    vi.clearAllMocks();
    const error = { code, message: `database failure "${constraint}"`, details: 'Detalles internos del proveedor.' };
    const insert = vi.fn().mockResolvedValue({ error });
    authorize.mockResolvedValue({ supabase: { from: vi.fn(() => ({ insert })) } });
    const form = new FormData();
    form.set('name', 'Pan integral');
    form.set('slug', 'pan-integral');
    form.set('internal_code', 'SKU-001');

    await expect(createProduct(form)).rejects.toMatchObject({ message, cause: error });
    expect(insert).toHaveBeenCalledOnce();
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  }
});

it('envía el producto validado al guardado e invalida el catálogo antes de redirigir', async () => {
  vi.clearAllMocks();
  const insert = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn(() => ({ insert }));
  authorize.mockResolvedValue({ supabase: { from } });
  const form = new FormData();
  form.set('name', ' Pan integral ');
  form.set('slug', ' pan-integral ');
  form.set('status', 'archived');
  form.set('min_stock', '12');

  await createProduct(form);

  expect(from).toHaveBeenCalledExactlyOnceWith('products');
  expect(insert).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
    name: 'Pan integral', slug: 'pan-integral', status: 'archived', min_stock: 12, internal_code: null,
  }));
  expect(revalidatePath).toHaveBeenCalledExactlyOnceWith('/products');
  expect(redirect).toHaveBeenCalledExactlyOnceWith('/products');
  expect(insert.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(revalidatePath).mock.invocationCallOrder[0]!);
  expect(vi.mocked(revalidatePath).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(redirect).mock.invocationCallOrder[0]!);
});

it('rechaza campos incompletos y clasificación inválida antes de insertar el producto', async () => {
  const cases: [Record<string, string | null>, string][] = [
    [{ name: null }, 'El campo name es obligatorio.'],
    [{ name: '' }, 'El campo name es obligatorio.'],
    [{ name: '   ' }, 'El campo name es obligatorio.'],
    [{ slug: null }, 'El campo slug es obligatorio.'],
    [{ slug: '' }, 'El campo slug es obligatorio.'],
    [{ slug: '   ' }, 'El campo slug es obligatorio.'],
    [{ category_id: 'category-1' }, 'Categoría y familia deben seleccionarse juntas.'],
    [{ family_id: 'family-1' }, 'Categoría y familia deben seleccionarse juntas.'],
    [{ category_id: 'category-1', family_id: 'family-1' }, 'La familia no pertenece a la categoría seleccionada.'],
  ];
  for (const [values, message] of cases) {
    const insert = vi.fn();
    const query = {
      select: () => query,
      eq: () => query,
      is: () => query,
      single: async () => ({ data: { id: 'family-1', category_id: 'category-2' }, error: null }),
      insert,
    };
    authorize.mockResolvedValue({ supabase: { from: vi.fn(() => query) } });
    const form = new FormData();
    form.set('name', 'Pan integral');
    form.set('slug', 'pan-integral');
    for (const [field, value] of Object.entries(values)) {
      if (value === null) form.delete(field);
      else form.set(field, value);
    }

    await expect(createProduct(form), JSON.stringify(values)).rejects.toThrow(message);
    expect(insert, JSON.stringify(values)).not.toHaveBeenCalled();
  }
});
