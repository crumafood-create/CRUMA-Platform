import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260918010000_harden_demand_forecasts.sql',
  ),
  'utf8',
);

describe('RLS de pronósticos de demanda', () => {
  it('retira acceso anónimo y conserva privilegios explícitos para autenticados', () => {
    expect(migration).toContain(
      'REVOKE ALL ON TABLE public.demand_forecasts FROM anon',
    );
    expect(migration).toContain(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.demand_forecasts TO authenticated',
    );
  });

  it.each(['SELECT', 'INSERT', 'UPDATE', 'DELETE'])(
    'define una política administrativa para %s',
    (operation) => {
      expect(migration).toContain(`FOR ${operation}`);
      expect(migration).toContain("role = 'admin'");
    },
  );
});
