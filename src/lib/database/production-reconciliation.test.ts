import { describe, expect, it } from 'vitest';

import {
  createProductionReconciliationPacket,
  EXPECTED_PRODUCTION_PROJECT_REF,
} from '../../../scripts/database/production-reconciliation';

const dryRun = {
  mode: 'dry-run' as const,
  sourceEvidenceDate: '2026-08-18',
  remoteWritesAuthorized: false as const,
  repairCandidates: ['20260801000000', '20260802000000'],
  pendingApplication: [
    '20260804000000',
    '20260806000000',
    '20260807000000',
    '20260809000000',
    '20260809010000',
  ],
};

describe('createProductionReconciliationPacket', () => {
  it('prepara evidencia sin autorizar ni construir una escritura remota', () => {
    const packet = createProductionReconciliationPacket(
      dryRun,
      EXPECTED_PRODUCTION_PROJECT_REF,
    );

    expect(packet).toMatchObject({
      mode: 'authorization-required',
      projectRef: EXPECTED_PRODUCTION_PROJECT_REF,
      remoteWritesAuthorized: false,
      executionCommand: null,
      repairCandidates: dryRun.repairCandidates,
      pendingApplication: dryRun.pendingApplication,
    });
    expect(packet.planFingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  it('copia las versiones para no mutar el plan aprobado', () => {
    const packet = createProductionReconciliationPacket(
      dryRun,
      EXPECTED_PRODUCTION_PROJECT_REF,
    );

    expect(packet.repairCandidates).not.toBe(dryRun.repairCandidates);
    expect(packet.pendingApplication).not.toBe(dryRun.pendingApplication);
  });

  it.each([
    ['', 'Proyecto Production no verificado.'],
    ['otro-proyecto', 'Proyecto Production no verificado.'],
  ])('rechaza project ref %j', (projectRef, message) => {
    expect(() =>
      createProductionReconciliationPacket(dryRun, projectRef),
    ).toThrow(message);
  });
});
