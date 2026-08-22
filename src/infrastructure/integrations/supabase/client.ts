import { createBrowserClient } from '@supabase/ssr';

import { getPublicSupabaseConfiguration } from './configuration';
import type { ApplicationDatabase } from './database.types';

export function createClient() {
  const { url, anonymousKey } = getPublicSupabaseConfiguration();

  return createBrowserClient<ApplicationDatabase>(url, anonymousKey);
}
