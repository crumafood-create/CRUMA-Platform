import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const middleware = readFileSync(
  resolve(process.cwd(), 'src/middleware.ts'),
  'utf8',
);

describe('renovación de sesión', () => {
  it('renueva la sesión antes de resolver rutas dinámicas', () => {
    expect(middleware).toContain('updateSession(request)');
    expect(middleware).not.toContain('protectedRoutes');
  });

  it('excluye únicamente recursos estáticos del matcher', () => {
    expect(middleware).toContain('_next/static');
    expect(middleware).toContain('_next/image');
    expect(middleware).toContain('favicon.ico');
  });
});
