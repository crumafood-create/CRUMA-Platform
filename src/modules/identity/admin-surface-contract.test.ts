import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

describe('superficie administrativa', () => {
  it('protege todo el route group desde su layout de servidor', () => {
    const layout = source('../../app/(admin)/layout.tsx');

    expect(layout).not.toContain("'use client'");
    expect(layout).toContain('requireTypedAuthorizedAction(');
    expect(layout).toContain('PERMISSIONS.ADMIN_PANEL_ACCESS');
  });

  it('solo publica enlaces que corresponden a rutas reales', () => {
    const shell = source('../../shared/components/layout/admin-shell.tsx');

    expect(shell).toContain("href: '/sales-orders'");
    expect(shell).toContain("href: '/products'");
    expect(shell).toContain("href: '/customers'");
    expect(shell).not.toContain("href: '/dashboard/");
  });
});
