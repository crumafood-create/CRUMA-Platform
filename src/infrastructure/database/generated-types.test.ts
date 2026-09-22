import { describe, expect, it } from 'vitest';

import {
  assertGeneratedDatabaseTypes,
  assertGeneratedTypesAreCurrent,
  CANONICAL_DATABASE_TYPES_PATH,
  createLocalTypeGenerationArgs,
  createLocalTypeGenerationEnvironment,
  normalizeGeneratedDatabaseTypes,
} from '../../../scripts/database/generated-types';

const validTypes = [
  'export type Json = string | null',
  '',
  'export type Database = {',
  '  public: { Tables: {} }',
  '}',
].join('\n');

describe('contrato canónico de tipos Supabase', () => {
  it('define una única ubicación versionada para los tipos', () => {
    expect(CANONICAL_DATABASE_TYPES_PATH).toBe(
      'src/types/database/database.generated.ts',
    );
  });

  it('genera exclusivamente desde el esquema public de Supabase local', () => {
    expect(createLocalTypeGenerationArgs()).toEqual([
      'exec',
      'supabase',
      'gen',
      'types',
      'typescript',
      '--local',
      '--schema',
      'public',
      '--network-id',
      'cruma-supabase-local',
    ]);
  });

  it('retira credenciales remotas del proceso de generación', () => {
    const environment = createLocalTypeGenerationEnvironment({
      NODE_ENV: 'test',
      PATH: '/usr/bin',
      SUPABASE_ACCESS_TOKEN: 'sbp_secret',
      SUPABASE_DB_PASSWORD: 'secret',
      DATABASE_URL: 'postgresql://remote',
      PRODUCTION_DATABASE_URL: 'postgresql://production',
    });

    expect(environment).toEqual({ NODE_ENV: 'test', PATH: '/usr/bin' });
  });

  it('normaliza finales de línea y conserva un único salto final', () => {
    expect(normalizeGeneratedDatabaseTypes(`${validTypes}\r\n`)).toBe(
      `${validTypes}\n`,
    );
  });

  it('acepta un contrato TypeScript generado completo', () => {
    expect(assertGeneratedDatabaseTypes(validTypes)).toBeUndefined();
  });

  it.each(['', 'export type Json = string', 'export type Database = {}'])(
    'rechaza contratos vacíos o incompletos: %j',
    (input) => {
      expect(() => assertGeneratedDatabaseTypes(input)).toThrow(
        'Los tipos Supabase generados son inválidos o incompletos.',
      );
    },
  );

  it.each([
    `${validTypes}\n// sbp_leaked`,
    `${validTypes}\n// postgresql://remote`,
  ])('rechaza evidencia con secretos o conexiones remotas', (input) => {
    expect(() => assertGeneratedDatabaseTypes(input)).toThrow(
      'Los tipos Supabase generados contienen información sensible.',
    );
  });
});

describe('verificación de freshness de tipos Supabase', () => {
  it('acepta tipos versionados idénticos al esquema local', () => {
    expect(() =>
      assertGeneratedTypesAreCurrent(validTypes, `${validTypes}\n`),
    ).not.toThrow();
  });

  it('rechaza tipos versionados desactualizados', () => {
    expect(() =>
      assertGeneratedTypesAreCurrent(validTypes, `${validTypes}\n// cambio`),
    ).toThrow('Los tipos Supabase están desactualizados.');
  });
});
