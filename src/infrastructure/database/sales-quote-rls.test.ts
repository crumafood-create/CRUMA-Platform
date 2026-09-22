import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = () => readFileSync(resolve(
  process.cwd(), 'supabase/migrations/20260914000000_add_sales_quotes.sql',
), 'utf8');

describe('seguridad de cotizaciones', () => {
  it.each(['sales_quotes', 'sales_quote_items'])(
    'habilita RLS y limita lectura de %s al administrador', (table) => {
      const sql = source();
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
      expect(sql).toContain(`CREATE POLICY ${table}_admin_read`);
      expect(sql).toContain('USING (public.is_admin(auth.uid()))');
    },
  );

  it.each(['create_sales_quote', 'add_sales_quote_item', 'transition_sales_quote', 'convert_sales_quote_to_order'])(
    'protege y revoca ejecución amplia de %s', (name) => {
      const sql = source();
      expect(sql).toContain(`FUNCTION public.${name}`);
      expect(sql).toContain('SECURITY DEFINER SET search_path =');
      expect(sql).toContain('public.is_admin(auth.uid())');
      expect(sql).toContain(`REVOKE ALL ON FUNCTION public.${name}`);
    },
  );

  it('bloquea la cotización, recalcula totales y convierte sin duplicados', () => {
    const sql = source();
    expect(sql).toContain('FOR UPDATE');
    expect(sql).toContain('UPDATE public.sales_quotes SET subtotal =');
    expect(sql).toContain('INSERT INTO public.sales_orders');
    expect(sql).toContain('INSERT INTO public.sales_order_items');
    expect(sql).toContain('sales_quotes_sales_order_key');
  });
});
