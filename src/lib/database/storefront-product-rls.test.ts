import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = () => readFileSync(resolve(
  process.cwd(),
  'supabase/migrations/20260917020000_harden_storefront_catalog.sql',
), 'utf8');

describe('RLS del catálogo público', () => {
  it('aísla la proyección comercial de la tabla operativa de productos', () => {
    const sql = migration();
    expect(sql).toContain('CREATE TABLE public.storefront_products');
    expect(sql).toContain('product_id uuid PRIMARY KEY REFERENCES public.products(id)');
    expect(sql).toContain('price numeric(14,2)');
    expect(sql).toContain('currency text');
    expect(sql).not.toContain('internal_code');
    expect(sql).not.toContain('min_stock');
    expect(sql).not.toContain('unit_cost');
    expect(sql).not.toContain('inventory');
  });

  it('habilita RLS y limita lectura pública a fichas vigentes', () => {
    const sql = migration();
    expect(sql).toContain('ALTER TABLE public.storefront_products ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('CREATE POLICY storefront_products_public_read');
    expect(sql).toContain('TO anon, authenticated');
    expect(sql).toContain('is_published = true');
    expect(sql).toContain('published_at <= now()');
  });

  it('reserva toda escritura a administradores autenticados', () => {
    const sql = migration();
    expect(sql).toContain('CREATE POLICY storefront_products_admin_manage');
    expect(sql).toContain('TO authenticated');
    expect(sql).toContain('public.is_admin(auth.uid())');
    expect(sql).toContain('REVOKE INSERT, UPDATE, DELETE ON public.storefront_products FROM anon');
  });

  it('protege integridad de slug, moneda, publicación y precio', () => {
    const sql = migration();
    expect(sql).toContain('UNIQUE');
    expect(sql).toContain("currency = 'MXN'");
    expect(sql).toContain('price >= 0');
    expect(sql).toContain('is_published = false OR published_at IS NOT NULL');
  });
});
