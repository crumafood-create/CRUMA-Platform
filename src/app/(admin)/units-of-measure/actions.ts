'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import {
  buildUnitOfMeasureInsert,
  buildUnitOfMeasureUpdate,
} from '@/modules/inventory/application/unit-of-measure-contract';
import {
  assertUnitOfMeasureCanBeDeleted,
  assertUnitOfMeasureCodeAvailable,
} from '@/modules/inventory/application/unit-of-measure-repository';

export async function createUnitOfMeasure(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_UNIT_MANAGE,
  );
  const unit = buildUnitOfMeasureInsert(formData);

  await assertUnitOfMeasureCodeAvailable(supabase, unit.code);

  const { error } = await supabase.from('units_of_measure').insert(unit);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/units-of-measure');

  redirect('/units-of-measure');
}

export async function updateUnitOfMeasure(unitId: string, formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_UNIT_MANAGE,
  );
  const unit = buildUnitOfMeasureUpdate(formData, new Date().toISOString());

  if (!unit.code) throw new Error('El campo code es obligatorio.');

  await assertUnitOfMeasureCodeAvailable(supabase, unit.code, unitId);

  const { error } = await supabase
    .from('units_of_measure')
    .update(unit)
    .eq('id', unitId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/units-of-measure');

  redirect('/units-of-measure');
}

export async function deleteUnitOfMeasure(unitId: string) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_UNIT_MANAGE,
  );

  await assertUnitOfMeasureCanBeDeleted(supabase, unitId);

  const { error } = await supabase
    .from('units_of_measure')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', unitId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/units-of-measure');

  redirect('/units-of-measure');
}
