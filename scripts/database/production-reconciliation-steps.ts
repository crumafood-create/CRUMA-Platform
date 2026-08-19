import { EXPECTED_SCHEMA_DRIFT_FINGERPRINT } from './production-reconciliation-evidence.ts';
import type {
  Checkpoint,
  ProductionExecutionStep,
} from './production-reconciliation-execution.types.ts';

function createStep(
  id: string,
  args: readonly string[],
  mutatesRemote: boolean,
  enabled: boolean,
  checkpoint?: Checkpoint,
  evidenceFingerprint?: string,
): ProductionExecutionStep {
  return Object.freeze({
    id,
    args: Object.freeze([...args]),
    mutatesRemote,
    enabled,
    ...(checkpoint ? { checkpoint } : {}),
    ...(evidenceFingerprint ? { evidenceFingerprint } : {}),
  });
}

function createPreflightSteps(): readonly ProductionExecutionStep[] {
  return [
    createStep('inventory-before', ['migration', 'list', '--linked'], false, true, 'before'),
    createStep(
      'schema-drift-before',
      ['db', 'diff', '--linked', '--schema', 'public'],
      false,
      true,
      undefined,
      EXPECTED_SCHEMA_DRIFT_FINGERPRINT,
    ),
    createStep('preview-push', ['db', 'push', '--linked', '--dry-run'], false, true),
  ];
}

function createMutationSteps(
  execute: boolean,
  repairVersions: readonly string[],
): readonly ProductionExecutionStep[] {
  return [
    createStep(
      'repair-history',
      ['migration', 'repair', ...repairVersions, '--status', 'applied', '--linked', '--yes'],
      true,
      execute,
    ),
    createStep('inventory-after-repair', ['migration', 'list', '--linked'], false, execute, 'after-repair'),
    createStep('push-pending', ['db', 'push', '--linked', '--yes'], true, execute),
    createStep('inventory-after-push', ['migration', 'list', '--linked'], false, execute, 'after-push'),
  ];
}

export function createProductionSteps(
  execute: boolean,
  repairVersions: readonly string[],
): readonly ProductionExecutionStep[] {
  return Object.freeze([
    ...createPreflightSteps(),
    ...createMutationSteps(execute, repairVersions),
  ]);
}
