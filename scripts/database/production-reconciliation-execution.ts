import type { ProductionReconciliationPacket } from './production-reconciliation.ts';
import { EXPECTED_PRODUCTION_PROJECT_REF } from './production-reconciliation.ts';
import type {
  Checkpoint,
  ProductionExecutionPlan,
  ProductionExecutionRequest,
} from './production-reconciliation-execution.types.ts';
import { createProductionSteps } from './production-reconciliation-steps.ts';

export const EXPECTED_PLAN_FINGERPRINT =
  '40ebeaf66ab56d5b8cb675fb0b3b5584d0865c6700e3a49459f78c4faffb3004';
export const EXPECTED_EXECUTION_CONFIRMATION =
  'AUTORIZO_RECONCILIACION_PRODUCTION';
const EXPECTED_SOURCE_EVIDENCE_DATE = '2026-08-18';

const REPAIR_VERSIONS = ['20260801000000', '20260802000000'] as const;
const PENDING_VERSIONS = [
  '20260804000000',
  '20260806000000',
  '20260807000000',
  '20260809000000',
  '20260809010000',
] as const;
const ALL_VERSIONS = [...REPAIR_VERSIONS, ...PENDING_VERSIONS] as const;
function hasExactVersions(
  actual: readonly string[],
  expected: readonly string[],
): boolean {
  return (
    actual.length === expected.length &&
    actual.every((version, index) => version === expected[index])
  );
}
function isAuthorizedPacket(packet: ProductionReconciliationPacket): boolean {
  return (
    packet.mode === 'authorization-required' &&
    packet.projectRef === EXPECTED_PRODUCTION_PROJECT_REF &&
    packet.sourceEvidenceDate === EXPECTED_SOURCE_EVIDENCE_DATE &&
    packet.planFingerprint === EXPECTED_PLAN_FINGERPRINT &&
    packet.remoteWritesAuthorized === false &&
    packet.executionCommand === null &&
    hasExactVersions(packet.repairCandidates, REPAIR_VERSIONS) &&
    hasExactVersions(packet.pendingApplication, PENDING_VERSIONS)
  );
}

function assertAuthorization(
  packet: ProductionReconciliationPacket,
  request: ProductionExecutionRequest,
): void {
  const matchesRequest =
    request.projectRef === EXPECTED_PRODUCTION_PROJECT_REF &&
    request.planFingerprint === EXPECTED_PLAN_FINGERPRINT;

  if (!isAuthorizedPacket(packet) || !matchesRequest) {
    throw new Error('Paquete de Production no autorizado.');
  }

  if (
    request.mode === 'execute' &&
    request.confirmation !== EXPECTED_EXECUTION_CONFIRMATION
  ) {
    throw new Error('Confirmación de ejecución Production inválida.');
  }
}

export function createProductionExecutionPlan(
  packet: ProductionReconciliationPacket,
  request: ProductionExecutionRequest,
): Readonly<ProductionExecutionPlan> {
  assertAuthorization(packet, request);
  const execute = request.mode === 'execute';

  return Object.freeze({
    mode: request.mode,
    projectRef: request.projectRef,
    planFingerprint: request.planFingerprint,
    remoteWritesAuthorized: execute,
    steps: createProductionSteps(execute, REPAIR_VERSIONS),
  });
}

export function assertReconciliationCheckpoint(
  checkpoint: Checkpoint,
  remoteVersions: readonly string[],
): void {
  const expected = {
    before: [],
    'after-first-repair': [REPAIR_VERSIONS[0]],
    'after-repair': REPAIR_VERSIONS,
    'after-push': ALL_VERSIONS,
  }[checkpoint];

  if (!hasExactVersions(remoteVersions, expected)) {
    throw new Error(`Inventario remoto inesperado en ${checkpoint}.`);
  }
}
