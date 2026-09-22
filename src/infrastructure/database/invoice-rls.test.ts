import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = () => readFileSync(resolve(
  process.cwd(), 'supabase/migrations/20260913020000_add_commercial_invoicing.sql',
), 'utf8');

describe('seguridad de facturación comercial', () => {
  it.each(['sales_invoices', 'sales_invoice_items'])(
    'habilita RLS y reserva lectura y escritura de %s al administrador', (table) => {
      const sql = source();
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
      expect(sql).toContain(`CREATE POLICY ${table}_admin_read`);
      expect(sql).toContain('USING (public.is_admin(auth.uid()))');
      expect(sql).not.toContain(`CREATE POLICY ${table}_authenticated_read`);
    },
  );

  it.each(['issue_sales_invoice', 'cancel_sales_invoice'])(
    'protege la RPC %s, fija search_path y revoca ejecución amplia', (name) => {
      const sql = source();
      expect(sql).toContain(`FUNCTION public.${name}`);
      expect(sql).toContain('SECURITY DEFINER SET search_path =');
      expect(sql).toContain('public.is_admin(auth.uid())');
      expect(sql).toContain(`REVOKE ALL ON FUNCTION public.${name}`);
    },
  );

  it('bloquea el pedido y la cuenta, copia partidas y evita doble facturación', () => {
    const sql = source();
    expect(sql).toContain('FROM public.sales_orders');
    expect(sql).toContain('FOR UPDATE');
    expect(sql).toContain('FROM public.accounts_receivable');
    expect(sql).toContain('INSERT INTO public.sales_invoice_items');
    expect(sql).toContain('sales_invoices_sales_order_key');
  });

  it('mantiene el estado de la factura sincronizado con cobranza', () => {
    const sql = source();
    expect(sql).toContain('sync_sales_invoice_status');
    expect(sql).toContain("WHEN 'partial' THEN 'partial'");
    expect(sql).toContain("WHEN 'paid' THEN 'paid'");
  });
});
