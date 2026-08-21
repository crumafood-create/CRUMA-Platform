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
  const [firstVersion, secondVersion] = requireRepairVersions(repairVersions);

  return [
    createRepairStep(firstVersion, execute),
    createInventoryStep(
      'inventory-after-first-repair',
      'after-first-repair',
      execute,
    ),
    createRepairStep(secondVersion, execute),
    createInventoryStep('inventory-after-repair', 'after-repair', execute),
    createStep('push-pending', ['db', 'push', '--linked', '--yes'], true, execute),
    createInventoryStep('inventory-after-push', 'after-push', execute),
  ];
}

function createRepairStep(
  version: string,
  execute: boolean,
): ProductionExecutionStep {
  return createStep(
    `repair-history-${version}`,
    ['migration', 'repair', version, '--status', 'applied', '--linked', '--yes'],
    true,
    execute,
  );
}

function createInventoryStep(
  id: string,
  checkpoint: Checkpoint,
  enabled: boolean,
): ProductionExecutionStep {
  return createStep(
    id,
    ['migration', 'list', '--linked'],
    false,
    enabled,
    checkpoint,
  );
}

function requireRepairVersions(
  versions: readonly string[],
): readonly [string, string] {
  const [firstVersion, secondVersion] = versions;

  if (versions.length !== 2 || !firstVersion || !secondVersion) {
    throw new Error('La ejecución requiere dos reparaciones individuales.');
  }

  return [firstVersion, secondVersion];
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
