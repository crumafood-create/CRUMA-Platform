import { createHash } from 'node:crypto';

import type { ReconciliationDryRun } from './migration-reconciliation.ts';

export const EXPECTED_PRODUCTION_PROJECT_REF = 'poglpqvmbrfcvtuspvtx';

const EXPECTED_REPAIR = ['20260801000000', '20260802000000'];
const EXPECTED_PENDING = [
  '20260804000000',
  '20260806000000',
  '20260807000000',
  '20260809000000',
  '20260809010000',
];

export interface ProductionReconciliationPacket {
  mode: 'authorization-required';
  projectRef: string;
  sourceEvidenceDate: string;
  planFingerprint: string;
  repairCandidates: readonly string[];
  pendingApplication: readonly string[];
  remoteWritesAuthorized: false;
  executionCommand: null;
}

function hasExactVersions(
  actual: readonly string[],
  expected: readonly string[],
): boolean {
  return (
    actual.length === expected.length &&
    actual.every((version, index) => version === expected[index])
  );
}

function assertApprovedPlan(plan: ReconciliationDryRun): void {
  const matchesApprovedEvidence =
    plan.mode === 'dry-run' &&
    plan.remoteWritesAuthorized === false &&
    hasExactVersions(plan.repairCandidates, EXPECTED_REPAIR) &&
    hasExactVersions(plan.pendingApplication, EXPECTED_PENDING);

  if (!matchesApprovedEvidence) {
    throw new Error(
      'El plan de reconciliación no coincide con la evidencia aprobada.',
    );
  }
}

function fingerprintPlan(plan: ReconciliationDryRun): string {
  return createHash('sha256').update(JSON.stringify(plan)).digest('hex');
}

export function createProductionReconciliationPacket(
  plan: ReconciliationDryRun,
  projectRef: string,
): Readonly<ProductionReconciliationPacket> {
  if (projectRef !== EXPECTED_PRODUCTION_PROJECT_REF) {
    throw new Error('Proyecto Production no verificado.');
  }

  assertApprovedPlan(plan);

  return Object.freeze({
    mode: 'authorization-required',
    projectRef,
    sourceEvidenceDate: plan.sourceEvidenceDate,
    planFingerprint: fingerprintPlan(plan),
    repairCandidates: Object.freeze([...plan.repairCandidates]),
    pendingApplication: Object.freeze([...plan.pendingApplication]),
    remoteWritesAuthorized: false,
    executionCommand: null,
  });
}
