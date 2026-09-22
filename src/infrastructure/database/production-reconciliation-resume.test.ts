import { describe, expect, it } from 'vitest';

import {
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
  mode: 'execute' as const,
  projectRef: EXPECTED_PRODUCTION_PROJECT_REF,
  planFingerprint: EXPECTED_PLAN_FINGERPRINT,
  confirmation: EXPECTED_EXECUTION_CONFIRMATION,
  resumeFrom: 'after-first-repair' as const,
};

describe('reanudación protegida de reconciliación Production', () => {
  it('verifica el checkpoint autorizado antes de reanudar', () => {
    const plan = createProductionExecutionPlan(packet, request);
    const inventory = plan.steps.find(({ id }) => id === 'inventory-before');

    expect(plan.resumeFrom).toBe('after-first-repair');
    expect(inventory?.checkpoint).toBe('after-first-repair');
  });

  it('omite únicamente la reparación ya aplicada', () => {
    const plan = createProductionExecutionPlan(packet, request);

    expect(plan.steps.map(({ id, enabled }) => [id, enabled])).toEqual([
      ['inventory-before', true],
      ['schema-drift-before', true],
      ['preview-push', true],
      ['repair-history-20260801000000', false],
      ['inventory-after-first-repair', true],
      ['repair-history-20260802000000', true],
      ['inventory-after-repair', true],
      ['push-pending', true],
      ['inventory-after-push', true],
    ]);
  });

  it('mantiene deshabilitadas las escrituras al simular una reanudación', () => {
    const plan = createProductionExecutionPlan(packet, {
      ...request,
      mode: 'dry-run',
    });

    expect(plan.remoteWritesAuthorized).toBe(false);
    expect(plan.steps.filter(({ enabled }) => enabled)).toHaveLength(3);
    expect(plan.steps.filter(({ mutatesRemote }) => mutatesRemote)).toEqual(
      expect.arrayContaining([expect.objectContaining({ enabled: false })]),
    );
  });
});
