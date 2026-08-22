import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database/database.generated';

export type ApplicationDatabase = Database;

export type TypedSupabaseClient = SupabaseClient<ApplicationDatabase>;

export type PublicTableName = keyof ApplicationDatabase['public']['Tables'];

export type PublicTableRow<Table extends PublicTableName> =
  ApplicationDatabase['public']['Tables'][Table]['Row'];

export type PublicTableInsert<Table extends PublicTableName> =
  ApplicationDatabase['public']['Tables'][Table]['Insert'];

export type PublicTableUpdate<Table extends PublicTableName> =
  ApplicationDatabase['public']['Tables'][Table]['Update'];
