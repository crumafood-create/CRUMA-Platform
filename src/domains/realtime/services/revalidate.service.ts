'use server';

import 'server-only';

import { revalidatePath }
from 'next/cache';

export async function revalidateDashboard() {

  revalidatePath('/admin');

  revalidatePath('/admin/pedidos');

  revalidatePath('/admin/inventario');
}
