import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260919010000_add_business_reporting.sql'),
  'utf8',
);

describe('seguridad y vistas de analítica P5', () => {
  it('usa vistas con permisos del invocador', () => {
    expect(sql.match(/security_invoker\s*=\s*true/gi)).toHaveLength(3);
    expect(sql).toContain('business_sales_by_line');
    expect(sql).toContain('business_inventory_by_sku');
    expect(sql).toContain('business_production_rates');
  });

  it('solo permite insertar eventos propios y revoca acceso anónimo', () => {
    expect(sql).toContain('REVOKE ALL ON TABLE public.analytics_events FROM anon');
    expect(sql).toMatch(/WITH CHECK\s*\(user_id = \(SELECT auth\.uid\(\)\)\)/i);
    expect(sql).toContain('TO authenticated');
  });
});
