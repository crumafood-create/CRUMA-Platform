import { describe, expect, it } from 'vitest';

import {
  buildMigrationReconciliationPlan,
  createReconciliationDryRun,
  parseReconciliationManifest,
} from '../../../scripts/database/migration-reconciliation';

const LOCAL_VERSIONS = [
  '20260801000000',
  '20260802000000',
  '20260804000000',
  '20260806000000',
  '20260807000000',
  '20260809000000',
  '20260809010000',
] as const;

describe('buildMigrationReconciliationPlan', () => {
  it('separa versiones representadas de migraciones pendientes', () => {
    expect(
      buildMigrationReconciliationPlan(LOCAL_VERSIONS, [
        '20260801000000',
        '20260802000000',
      ]),
    ).toEqual({
      repairCandidates: ['20260801000000', '20260802000000'],
      pendingApplication: [
        '20260804000000',
        '20260806000000',
        '20260807000000',
        '20260809000000',
        '20260809010000',
      ],
    });
  });

  it('rechaza versiones representadas ausentes en Git', () => {
    expect(() =>
      buildMigrationReconciliationPlan(LOCAL_VERSIONS, ['20260803000000']),
    ).toThrow(
      'Versiones representadas ausentes en Git: 20260803000000',
    );
  });

  it('ordena y elimina duplicados sin mutar las entradas', () => {
    const local = ['20260802000000', '20260801000000', '20260802000000'];
    const represented = ['20260801000000', '20260801000000'];

    expect(buildMigrationReconciliationPlan(local, represented)).toEqual({
      repairCandidates: ['20260801000000'],
      pendingApplication: ['20260802000000'],
    });
    expect(local).toEqual([
      '20260802000000',
      '20260801000000',
      '20260802000000',
    ]);
    expect(represented).toEqual(['20260801000000', '20260801000000']);
  });

  it('conserva la validación de versiones canónicas', () => {
    expect(() =>
      buildMigrationReconciliationPlan(['versión-inválida'], []),
    ).toThrow('Versión de migración inválida: versión-inválida');
  });
});
describe('parseReconciliationManifest', () => {
  const safeManifest = {
    environmentKind: 'disposable',
    remoteWritesAuthorized: false,
    sourceEvidenceDate: '2026-08-18',
    representedVersions: ['20260801000000', '20260802000000'],
  };

  it('acepta únicamente un manifiesto de ensayo sin escrituras remotas', () => {
    expect(parseReconciliationManifest(safeManifest)).toEqual(safeManifest);
  });

  it.each([
    [
      { ...safeManifest, environmentKind: 'production' },
      'El ensayo debe usar un entorno desechable.',
    ],
    [
      { ...safeManifest, remoteWritesAuthorized: true },
      'El ensayo no puede autorizar escrituras remotas.',
    ],
  ])('rechaza manifiestos inseguros: %j', (manifest, message) => {
    expect(() => parseReconciliationManifest(manifest)).toThrow(message);
  });

  it('rechaza versiones representadas que no sean texto', () => {
    expect(() =>
      parseReconciliationManifest({
        ...safeManifest,
        representedVersions: ['20260801000000', 20260802000000],
      }),
    ).toThrow(
      'Las versiones representadas deben ser una colección de texto.',
    );
  });
});

describe('createReconciliationDryRun', () => {
  it('genera un plan determinista sin autorizar escrituras remotas', () => {
    const manifest = parseReconciliationManifest({
      environmentKind: 'disposable',
      remoteWritesAuthorized: false,
      sourceEvidenceDate: '2026-08-18',
      representedVersions: ['20260801000000', '20260802000000'],
    });

    expect(
      createReconciliationDryRun(manifest, [
        '20260804000000',
        '20260801000000',
        '20260802000000',
      ]),
    ).toEqual({
      mode: 'dry-run',
      sourceEvidenceDate: '2026-08-18',
      remoteWritesAuthorized: false,
      repairCandidates: ['20260801000000', '20260802000000'],
      pendingApplication: ['20260804000000'],
    });
  });
});
