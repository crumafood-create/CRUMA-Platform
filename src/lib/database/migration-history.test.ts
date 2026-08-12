import { describe, expect, it } from 'vitest';

import {
  compareMigrationVersions,
  parseRemoteVersions,
} from '../../../scripts/database/migration-history';

describe('parseRemoteVersions', () => {
  it('extrae versiones remotas únicas y ordenadas', () => {
    const input = [
      ' Local         | Remote         | Time (UTC)',
      '20260802000000 | 20260802000000 | now',
      '               | 20260801000000 | before',
      '               | 20260802000000 | duplicate',
    ].join('\n');

    expect(parseRemoteVersions(input)).toEqual([
      '20260801000000',
      '20260802000000',
    ]);
  });

  it.each([null, undefined])('rechaza entradas nulas: %s', (input) => {
    expect(() => parseRemoteVersions(input)).toThrow(
      'El inventario remoto debe ser texto.',
    );
  });

  it('acepta texto vacío como inventario sin versiones', () => {
    expect(parseRemoteVersions('')).toEqual([]);
  });

  it('ignora caracteres especiales y filas malformadas', () => {
    expect(parseRemoteVersions('🔥 | <script>alert(1)</script> | ñ')).toEqual([]);
  });

  it('ignora valores que exceden catorce dígitos', () => {
    expect(parseRemoteVersions(' | 999999999999999 | overflow')).toEqual([]);
  });
});

describe('compareMigrationVersions', () => {
  it('clasifica versiones compartidas, locales y remotas', () => {
    expect(
      compareMigrationVersions(
        ['20260801000000', '20260802000000'],
        ['20260712000000', '20260801000000'],
      ),
    ).toEqual({
      shared: ['20260801000000'],
      localOnly: ['20260802000000'],
      remoteOnly: ['20260712000000'],
    });
  });

  it('acepta colecciones vacías', () => {
    expect(compareMigrationVersions([], [])).toEqual({
      shared: [],
      localOnly: [],
      remoteOnly: [],
    });
  });

  it.each([
    [null, []],
    [undefined, []],
    [[], null],
    [[], undefined],
  ])('rechaza colecciones inválidas', (local, remote) => {
    expect(() => compareMigrationVersions(local, remote)).toThrow(
      'Las versiones deben ser colecciones.',
    );
  });

  it.each([
    ['carácter-especial'],
    ['999999999999999'],
  ])('rechaza versiones inválidas: %s', (version) => {
    expect(() => compareMigrationVersions([version], [])).toThrow(
      `Versión de migración inválida: ${version}`,
    );
  });

  it('elimina duplicados sin mutar las colecciones originales', () => {
    const local = ['20260802000000', '20260802000000'];
    const remote = ['20260801000000'];

    expect(compareMigrationVersions(local, remote)).toEqual({
      shared: [],
      localOnly: ['20260802000000'],
      remoteOnly: ['20260801000000'],
    });
    expect(local).toEqual(['20260802000000', '20260802000000']);
    expect(remote).toEqual(['20260801000000']);
  });
});
