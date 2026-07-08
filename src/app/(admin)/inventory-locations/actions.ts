'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

function toSlug(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-');
}

// ============================================================================
// CREAR
// ============================================================================

export async function createInventoryLocation(
  formData: FormData,
) {
  const supabase =
    await createClient();

  const slug = toSlug(
    formData.get('slug')?.toString() ?? '',
  );

  const name =
    formData
      .get('name')
      ?.toString()
      .trim() ?? '';

  const description =
    formData
      .get('description')
      ?.toString()
      .trim() || null;

  const zone =
    formData
      .get('zone')
      ?.toString()
      .trim() ?? '';

  const aisle = Number(
    formData.get('aisle') ?? 0,
  );

  const rack = Number(
    formData.get('rack') ?? 0,
  );

  const level = Number(
    formData.get('level') ?? 0,
  );

  const position = Number(
    formData.get('position') ?? 0,
  );

  const is_active =
    formData.get('is_active') === 'on';

  if (!slug) {
    throw new Error(
      'Código requerido.',
    );
  }

  if (!name) {
    throw new Error(
      'Nombre requerido.',
    );
  }

  if (!zone) {
    throw new Error(
      'Zona requerida.',
    );
  }

  const {
    data: exists,
  } = await supabase
    .from(
      'inventory_locations',
    )
    .select('id')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle();

  if (exists) {
    throw new Error(
      'Ya existe una ubicación con ese código.',
    );
  }

  const { error } =
    await supabase
      .from(
        'inventory_locations',
      )
      .insert({
        slug,
        name,
        description,
        zone,
        aisle,
        rack,
        level,
        position,
        is_active,
      });

  if (error) {
    throw new Error(
      error.message,
    );
  }

  revalidatePath(
    '/inventory-locations',
  );

  redirect(
    '/inventory-locations',
  );
}

// ============================================================================
// ACTUALIZAR
// ============================================================================

export async function updateInventoryLocation(
  id: string,
  formData: FormData,
) {
  const supabase =
    await createClient();

  const slug = toSlug(
    formData.get('slug')?.toString() ?? '',
  );

  const name =
    formData
      .get('name')
      ?.toString()
      .trim() ?? '';

  const description =
    formData
      .get('description')
      ?.toString()
      .trim() || null;

  const zone =
    formData
      .get('zone')
      ?.toString()
      .trim() ?? '';

  const aisle = Number(
    formData.get('aisle') ?? 0,
  );

  const rack = Number(
    formData.get('rack') ?? 0,
  );

  const level = Number(
    formData.get('level') ?? 0,
  );

  const position = Number(
    formData.get('position') ?? 0,
  );

  const is_active =
    formData.get('is_active') === 'on';

  const {
    data: duplicated,
  } = await supabase
    .from(
      'inventory_locations',
    )
    .select('id')
    .eq('slug', slug)
    .neq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (duplicated) {
    throw new Error(
      'El código ya existe.',
    );
  }

  const { error } =
    await supabase
      .from(
        'inventory_locations',
      )
      .update({
        slug,
        name,
        description,
        zone,
        aisle,
        rack,
        level,
        position,
        is_active,
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', id);

  if (error) {
    throw new Error(
      error.message,
    );
  }

  revalidatePath(
    '/inventory-locations',
  );

  redirect(
    '/inventory-locations',
  );
}

// ============================================================================
// ELIMINAR (SOFT DELETE)
// ============================================================================

export async function deleteInventoryLocation(
  id: string,
) {
  const supabase =
    await createClient();

  const { error } =
    await supabase
      .from(
        'inventory_locations',
      )
      .update({
        deleted_at:
          new Date().toISOString(),
      })
      .eq('id', id);

  if (error) {
    throw new Error(
      error.message,
    );
  }

  revalidatePath(
    '/inventory-locations',
  );
}
