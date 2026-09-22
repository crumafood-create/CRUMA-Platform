import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = () => readFileSync(resolve(
  process.cwd(), 'supabase/migrations/20260914020000_harden_production_costs.sql',
), 'utf8');

describe('seguridad y consistencia de costos de producción', () => {
  it.each(['production_costs', 'production_cost_history'])(
    'limita lectura de %s al administrador', (table) => {
      const sql = source();
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
      expect(sql).toContain(`CREATE POLICY ${table}_admin_read`);
      expect(sql).toContain('USING (public.is_admin(auth.uid()))');
    },
  );

  it('congela costo unitario y total en el consumo real', () => {
    const sql = source();
    expect(sql).toContain('ALTER TABLE public.production_order_consumptions');
    expect(sql).toContain('ADD COLUMN unit_cost');
    expect(sql).toContain('ADD COLUMN total_cost');
    expect(sql).toContain('raw_material_lots lot');
    expect(sql).toContain('production_consumption_cost_check');
    expect(sql).toContain('NEW.unit_cost := OLD.unit_cost');
  });

  it('protege la RPC y bloquea la orden antes de calcular', () => {
    const sql = source();
    expect(sql).toContain('FUNCTION public.calculate_production_cost');
    expect(sql).toContain('SECURITY DEFINER SET search_path =');
    expect(sql).toContain('public.is_admin(auth.uid())');
    expect(sql).toContain('FOR UPDATE');
    expect(sql).toContain("production_status IS DISTINCT FROM 'completed'");
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.calculate_production_cost');
  });

  it('calcula desde snapshots, registra historial y actualiza salidas', () => {
    const sql = source();
    expect(sql).toContain('sum(consumption.total_cost)');
    expect(sql).toContain('INSERT INTO public.production_cost_history');
    expect(sql).toContain('ON CONFLICT (production_order_id) DO UPDATE');
    expect(sql).toContain('UPDATE public.production_orders');
    expect(sql).toContain('UPDATE public.production_outputs');
  });
});
