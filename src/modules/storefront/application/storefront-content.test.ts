import { describe, expect, it } from 'vitest';

import {
  storefrontCategories,
  storefrontPromises,
} from './storefront-content';

describe('contenido comercial público', () => {
  it('publica las cuatro líneas principales sin duplicar rutas', () => {
    expect(storefrontCategories.map((category) => category.slug)).toEqual([
      'tequenos',
      'empanadas',
      'discos',
      'masas',
    ]);
    expect(new Set(storefrontCategories.map((category) => category.href)).size)
      .toBe(storefrontCategories.length);
  });

  it('distingue la propuesta para hogares y negocios', () => {
    expect(storefrontPromises).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: 'Para compartir' }),
        expect.objectContaining({ title: 'Para tu negocio' }),
        expect.objectContaining({ title: 'Hecho en Toluca' }),
      ]),
    );
  });

  it('evita publicar precios o disponibilidad no confirmados', () => {
    const serialized = JSON.stringify(storefrontCategories);
    expect(serialized).not.toMatch(/precio|\$|disponible ahora/i);
  });
});
