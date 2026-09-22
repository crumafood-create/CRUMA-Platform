import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();
const criticalRoutes = [
  'src/app/(admin)/dashboard/loading.tsx',
  'src/app/(admin)/sales-orders/loading.tsx',
  'src/app/(admin)/inventory-stock/loading.tsx',
  'src/app/(admin)/production-orders/loading.tsx',
  'src/app/(storefront)/catalogo/loading.tsx',
];

describe('resiliencia de rutas críticas', () => {
  it.each(criticalRoutes)('%s define feedback inmediato de carga', (path) => {
    expect(existsSync(resolve(root, path))).toBe(true);
  });

  it('los límites principales no filtran mensajes técnicos', () => {
    for (const path of ['src/app/error.tsx', 'src/app/(admin)/error.tsx']) {
      expect(readFileSync(resolve(root, path), 'utf8')).not.toContain('error.message');
    }
  });

  it('mantiene autorización de servidor en el grupo administrativo', () => {
    const layout = readFileSync(resolve(root, 'src/app/(admin)/layout.tsx'), 'utf8');
    expect(layout).toContain('PERMISSIONS.ADMIN_PANEL_ACCESS');
    expect(layout).toContain("redirect('/login')");
  });
});
