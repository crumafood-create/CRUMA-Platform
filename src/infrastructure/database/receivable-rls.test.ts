import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = () => readFileSync(resolve(process.cwd(), 'supabase/migrations/20260913010000_harden_receivable_payments.sql'), 'utf8');

describe('seguridad de cuentas por cobrar', () => {
  it('restringe las escrituras de ambas tablas', () => {
    const sql = source();
    expect(sql).toContain('accounts_receivable_admin_write');
    expect(sql).toContain('receivable_payments_admin_write');
    expect(sql.match(/public\.is_admin\(auth\.uid\(\)\)/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it('define una RPC atómica, bloquea la cuenta y protege su ejecución', () => {
    const sql = source();
    expect(sql).toContain('FUNCTION public.register_receivable_payment');
    expect(sql).toContain('FOR UPDATE');
    expect(sql).toContain('SECURITY DEFINER SET search_path =');
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.register_receivable_payment');
    expect(sql).toContain('CREATE UNIQUE INDEX');
  });
});
