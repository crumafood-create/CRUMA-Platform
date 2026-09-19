import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

function source(path: string): string {
  return readFileSync(resolve(root, path), 'utf8');
}

function productionSources(directory: string): string[] {
  const absolute = resolve(root, directory);

  return readdirSync(absolute).flatMap((entry) => {
    const path = join(absolute, entry);

    if (statSync(path).isDirectory()) return productionSources(path);

    const relativePath = relative(root, path);
    const extension = extname(path);
    const excluded =
      relativePath.endsWith('.test.ts') ||
      relativePath.endsWith('.test.tsx') ||
      relativePath.endsWith('.stories.tsx') ||
      relativePath.endsWith('.d.ts') ||
      relativePath.endsWith('database.generated.ts');

    return ['.ts', '.tsx'].includes(extension) && !excluded
      ? [relativePath]
      : [];
  });
}

describe('estándares P2 ejecutables', () => {
  it('prohíbe any explícito en código productivo', () => {
    const violations = productionSources('src').filter((path) =>
      /\bany\b|as any|<any>/.test(source(path)),
    );

    expect(violations).toEqual([]);
  });

  it('prohíbe el cliente Supabase servidor sin tipos', () => {
    const violations = productionSources('src').filter((path) =>
      /import\s*\{\s*createClient\s*\}\s*from\s*['"]@\/infrastructure\/integrations\/supabase\/server['"]/.test(
        source(path),
      ),
    );

    expect(violations).toEqual([]);
    expect(source('src/infrastructure/integrations/supabase/server.ts'))
      .not.toContain('function createClient(');
  });

  it('incluye shared y modules en el escaneo de Tailwind', () => {
    const config = source('tailwind.config.ts');

    expect(config).toContain("'./src/**/*.{js,ts,jsx,tsx,mdx}'");
    expect(config).not.toContain("'./src/src/**");
  });

  it('mantiene app como composición en el corte vertical de Dashboard', () => {
    const page = source('src/app/(admin)/dashboard/page.tsx');

    expect(page).toContain('loadDashboardView(');
    expect(page).not.toContain(".from('");
  });

  it('documenta nombres, archivos, errores, logging y pruebas', () => {
    const standards = source('docs/engineering/code-standards.md');

    for (const heading of [
      'Nomenclatura',
      'Archivos y carpetas',
      'Errores',
      'Logging',
      'Pruebas por módulo',
    ]) {
      expect(standards).toContain(`## ${heading}`);
    }
  });
});
