import { createBrowserClient } from '@supabase/ssr';

import { getPublicSupabaseConfiguration } from './configuration';
import type { ApplicationDatabase } from './database.types';

let clientInstance: ReturnType<typeof createBrowserClient<ApplicationDatabase>> | undefined;

/**
 * Crea o reutiliza la instancia del cliente Supabase para el navegador (Singleton)
 */
export function createClient() {
  if (clientInstance) return clientInstance;

  const { url, anonymousKey } = getPublicSupabaseConfiguration();

  if (!url || !anonymousKey) {
    throw new Error('Las variables de entorno públicas de Supabase no están configuradas correctamente.');
  }

  clientInstance = createBrowserClient<ApplicationDatabase>(url, anonymousKey);

  return clientInstance;
}
