import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = () => readFileSync(resolve(
  process.cwd(), 'supabase/migrations/20260914040000_harden_production_lots.sql',
), 'utf8');

describe('seguridad y consistencia de lotes producidos', () => {
  it.each([
    'product_lots',
    'production_lot_traceability',
    'picking_lot_allocations',
  ])('habilita lectura administrativa y bloquea escritura directa en %s', (table) => {
    expect(migration()).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    expect(migration()).toContain(`CREATE POLICY ${table}_admin_read`);
    expect(migration()).toContain('USING (public.is_admin(auth.uid()))');
  });

  it('vincula un lote con una única salida aprobada', () => {
    const sql = migration();
    expect(sql).toContain('production_output_id uuid');
    expect(sql).toContain('REFERENCES public.production_outputs(id)');
    expect(sql).toContain('UNIQUE (production_output_id)');
    expect(sql).toContain("quality_status IS DISTINCT FROM 'released'");
    expect(sql).toContain("production_status IS DISTINCT FROM 'completed'");
    expect(sql).toContain('FOR UPDATE');
  });

  it('crea inventario y trazabilidad en una transacción protegida', () => {
    const sql = migration();
    expect(sql).toContain('FUNCTION public.release_production_output_to_inventory');
    expect(sql).toContain('SECURITY DEFINER SET search_path =');
    expect(sql).toContain('INSERT INTO public.product_lots');
    expect(sql).toContain('INSERT INTO public.production_lot_traceability');
    expect(sql).toContain('INSERT INTO public.inventory_movements');
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.release_production_output_to_inventory');
  });

  it('endurece FEFO, vencimiento y distribución entre lotes', () => {
    const sql = migration();
    expect(sql).toContain('security_invoker = true');
    expect(sql).toContain("product_lot.status = 'available'");
    expect(sql).toContain('product_lot.expiration_date >= CURRENT_DATE');
    expect(sql).toContain('LEAST(product_lot.quantity, remaining_quantity)');
    expect(sql).toContain('INSERT INTO public.picking_lot_allocations');
    expect(sql).toContain("WHEN product_lot.quantity - allocated_quantity = 0 THEN 'depleted'");
  });
});
