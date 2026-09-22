import { describe, expect, it } from 'vitest';

import {
  assertEvidenceFingerprint,
  EXPECTED_SCHEMA_DRIFT_FINGERPRINT,
} from '../../../scripts/database/production-reconciliation-evidence';
import {
  assertReconciliationCheckpoint,
  createProductionExecutionPlan,
  EXPECTED_EXECUTION_CONFIRMATION,
  EXPECTED_PLAN_FINGERPRINT,
} from '../../../scripts/database/production-reconciliation-execution';
import {
  EXPECTED_PRODUCTION_PROJECT_REF,
  type ProductionReconciliationPacket,
} from '../../../scripts/database/production-reconciliation';

const packet: ProductionReconciliationPacket = {
  mode: 'authorization-required',
  projectRef: EXPECTED_PRODUCTION_PROJECT_REF,
  sourceEvidenceDate: '2026-08-18',
  planFingerprint: EXPECTED_PLAN_FINGERPRINT,
  repairCandidates: ['20260801000000', '20260802000000'],
  pendingApplication: [
    '20260804000000',
    '20260806000000',
    '20260807000000',
    '20260809000000',
    '20260809010000',
  ],
  remoteWritesAuthorized: false,
  executionCommand: null,
};

const request = {
  mode: 'dry-run' as const,
  projectRef: EXPECTED_PRODUCTION_PROJECT_REF,
  planFingerprint: EXPECTED_PLAN_FINGERPRINT,
};

describe('createProductionExecutionPlan', () => {
  it('mantiene deshabilitadas todas las escrituras en dry-run', () => {
    const plan = createProductionExecutionPlan(packet, request);

    expect(plan.mode).toBe('dry-run');
    expect(plan.remoteWritesAuthorized).toBe(false);
    expect(plan.steps.filter((step) => step.enabled)).toHaveLength(3);
    expect(plan.steps.filter((step) => step.mutatesRemote)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'repair-history-20260801000000',
          enabled: false,
        }),
        expect.objectContaining({
          id: 'repair-history-20260802000000',
          enabled: false,
        }),
        expect.objectContaining({ id: 'push-pending', enabled: false }),
      ]),
    );
  });

  it('exige la confirmación exacta para habilitar escrituras', () => {
    expect(() =>
      createProductionExecutionPlan(packet, {
        ...request,
        mode: 'execute',
      }),
    ).toThrow('Confirmación de ejecución Production inválida.');
  });

  it('habilita la secuencia exacta después de autorizar', () => {
    const plan = createProductionExecutionPlan(packet, {
      ...request,
      mode: 'execute',
      confirmation: EXPECTED_EXECUTION_CONFIRMATION,
    });

    expect(plan.remoteWritesAuthorized).toBe(true);
    expect(plan.steps.map(({ id, enabled }) => [id, enabled])).toEqual([
      ['inventory-before', true],
      ['schema-drift-before', true],
      ['preview-push', true],
      ['repair-history-20260801000000', true],
      ['inventory-after-first-repair', true],
      ['repair-history-20260802000000', true],
      ['inventory-after-repair', true],
      ['push-pending', true],
      ['inventory-after-push', true],
    ]);
    const repairSteps = plan.steps.filter(({ id }) =>
      id.startsWith('repair-history-'),
    );
    expect(repairSteps.map(({ id, args }) => [id, args[2]])).toEqual([
      ['repair-history-20260801000000', '20260801000000'],
      ['repair-history-20260802000000', '20260802000000'],
    ]);
  });

  it.each([
    ['projectRef', 'otro-proyecto'],
    ['planFingerprint', '0'.repeat(64)],
  ] as const)('rechaza %s no autorizado', (field, value) => {
    expect(() =>
      createProductionExecutionPlan(packet, { ...request, [field]: value }),
    ).toThrow('Paquete de Production no autorizado.');
  });

  it.each([
    { ...packet, sourceEvidenceDate: '2026-08-19' },
    { ...packet, repairCandidates: ['20260801000000'] },
  ])('rechaza un paquete alterado aunque conserve el fingerprint', (input) => {
    expect(() => createProductionExecutionPlan(input, request)).toThrow(
      'Paquete de Production no autorizado.',
    );
  });
});

describe('assertReconciliationCheckpoint', () => {
  it.each([
    ['after-first-repair', ['20260801000000']],
    ['after-repair', ['20260801000000', '20260802000000']],
  ] as const)('acepta el inventario exacto en %s', (checkpoint, versions) => {
    expect(
      assertReconciliationCheckpoint(checkpoint, versions),
    ).toBeUndefined();
  });

  it('detiene la ejecución ante cambios remotos inesperados', () => {
    expect(() =>
      assertReconciliationCheckpoint('before', ['20260801000000']),
    ).toThrow('Inventario remoto inesperado en before.');
  });
});

describe('assertEvidenceFingerprint', () => {
  it('acepta únicamente el drift aprobado', () => {
    expect(() =>
      assertEvidenceFingerprint(
        EXPECTED_SCHEMA_DRIFT_FINGERPRINT,
        EXPECTED_SCHEMA_DRIFT_FINGERPRINT,
      ),
    ).not.toThrow();
    expect(() =>
      assertEvidenceFingerprint('0'.repeat(64), EXPECTED_SCHEMA_DRIFT_FINGERPRINT),
    ).toThrow('La evidencia remota cambió desde su aprobación.');
  });
});
