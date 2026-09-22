import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = () => readFileSync(resolve(
  process.cwd(), 'supabase/migrations/20260914010000_harden_purchase_requisition_approvals.sql',
), 'utf8');

describe('seguridad de requisiciones y aprobaciones', () => {
  it.each(['purchase_requisitions', 'purchase_requisition_items', 'approvals'])(
    'limita %s al administrador mediante RLS', (table) => {
      const sql = source();
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
      expect(sql).toContain(`CREATE POLICY ${table}_admin_read`);
      expect(sql).toContain('USING (public.is_admin(auth.uid()))');
    },
  );

  it.each([
    'create_purchase_requisition_from_mrp',
    'submit_purchase_requisition',
    'decide_approval',
    'convert_purchase_requisition_to_orders',
    'create_purchase_approvals',
  ])('protege y revoca ejecución amplia de %s', (name) => {
    const sql = source();
    expect(sql).toContain(`FUNCTION public.${name}`);
    expect(sql).toContain('SECURITY DEFINER SET search_path =');
    expect(sql).toContain('public.is_admin(auth.uid())');
    expect(sql).toContain(`REVOKE ALL ON FUNCTION public.${name}`);
  });

  it('bloquea decisiones y evita aprobaciones pendientes duplicadas', () => {
    const sql = source();
    expect(sql).toContain('FOR UPDATE');
    expect(sql).toContain('approvals_pending_reference_key');
    expect(sql).toContain("approval.status IS DISTINCT FROM 'pending'");
    expect(sql).toContain("p_decision NOT IN ('approved', 'rejected')");
  });

  it('crea la requisición MRP y sus partidas en una sola transacción', () => {
    const sql = source();
    expect(sql).toContain('pg_advisory_xact_lock');
    expect(sql).toContain('INSERT INTO public.purchase_requisitions');
    expect(sql).toContain('INSERT INTO public.purchase_requisition_items');
    expect(sql).toContain('public.mrp_requirements');
  });

  it('agrupa la conversión por proveedor y conserva el vínculo de origen', () => {
    const sql = source();
    expect(sql).toContain('purchase_requisition_id');
    expect(sql).toContain('GROUP BY material.preferred_supplier_id');
    expect(sql).toContain('INSERT INTO public.purchase_orders');
    expect(sql).toContain('INSERT INTO public.purchase_order_items');
    expect(sql).toContain('purchase_orders_requisition_supplier_key');
  });
});
