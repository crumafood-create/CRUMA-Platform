import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types' // Aquí irán tus tipos generados por el CLI

/**
 * LÓGICA VISUAL/UI - Cliente para Browser Components.
 * Se usa para Auth, Realtime y llamadas desde Client Components.
 */
export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
