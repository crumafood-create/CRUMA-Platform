'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createUnitOfMeasure(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const code = String(formData.get('code') ?? '').trim().toUpperCase();

  if (!name || !code) throw new Error('Nombre y código son requeridos');

  const supabase = await createClient();

  const { error } = await supabase
    .from('units_of_measure')
    .insert({
      name,
      code,
      is_active: formData.get('is_active') === 'true',
    });

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe una unidad con ese código');
    }
    throw new Error(error.message);
  }

  revalidatePath('/units-of-measure');
  redirect('/units-of-measure');
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateUnitOfMeasure(unitId: string, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const code = String(formData.get('code') ?? '').trim().toUpperCase();

  if (!name || !code) throw new Error('Nombre y código son requeridos');

  const supabase = await createClient();

  const { error } = await supabase
    .from('units_of_measure')
    .update({
      name,
      code,
      is_active:  formData.get('is_active') === 'true',
      updated_at: new Date().toISOString(),
    })
    .eq('id', unitId);

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe una unidad con ese código');
    }
    throw new Error(error.message);
  }

  revalidatePath('/units-of-measure');
  redirect('/units-of-measure');
}

// ─── Delete ───────────────────────────────────────────────────────────────────

// Soft delete: desactiva la unidad en lugar de eliminarla.
// Hard delete fallaría si algún producto la referencia (FK constraint).
export async function deleteUnitOfMeasure(unitId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('units_of_measure')
    .update({
      is_active:  false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', unitId);

  if (error) throw new Error(error.message);

  revalidatePath('/units-of-measure');
  redirect('/units-of-measure');
}
