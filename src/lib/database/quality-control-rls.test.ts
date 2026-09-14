import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = () => readFileSync(resolve(
  process.cwd(), 'supabase/migrations/20260914030000_harden_quality_control.sql',
), 'utf8');

describe('seguridad y consistencia de control de calidad', () => {
  it.each([
    'quality_inspections',
    'quality_inspection_items',
    'quality_defects',
    'quality_release_decisions',
  ])('habilita RLS administrativo en %s', (table) => {
    expect(sql()).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    expect(sql()).toContain(`CREATE POLICY ${table}_admin_read`);
    expect(sql()).toContain('USING (public.is_admin(auth.uid()))');
  });

  it('integra calidad con salidas reales de producción', () => {
    const source = sql();
    expect(source).toContain('REFERENCES public.production_outputs(id)');
    expect(source).toContain('ADD COLUMN quality_status text');
    expect(source).not.toContain('production_lots');
    expect(source).not.toContain("auth.jwt() ->> 'role'");
  });

  it('protege las RPC y bloquea registros antes de decidir', () => {
    const source = sql();
    expect(source).toContain('FUNCTION public.record_quality_inspection');
    expect(source).toContain('FUNCTION public.decide_quality_release');
    expect(source).toContain('SECURITY DEFINER SET search_path =');
    expect(source).toContain('public.is_admin(auth.uid())');
    expect(source).toContain('FOR UPDATE');
    expect(source).toContain('REVOKE ALL ON FUNCTION public.record_quality_inspection');
    expect(source).toContain('REVOKE ALL ON FUNCTION public.decide_quality_release');
  });

  it('calcula defectos y conserva decisiones inmutables', () => {
    const source = sql();
    expect(source).toContain('sum(defect.quantity)');
    expect(source).toContain('LEAST(v_sampled_quantity, v_rejected_quantity)');
    expect(source).toContain('INSERT INTO public.quality_release_decisions');
    expect(source).toContain('UNIQUE (inspection_id)');
    expect(source).toContain("inspection.status IS DISTINCT FROM 'passed'");
    expect(source).toContain('UPDATE public.production_outputs');
  });
});
