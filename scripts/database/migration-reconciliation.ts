import { compareMigrationVersions } from './migration-history.ts';

export interface MigrationReconciliationPlan {
  readonly repairCandidates: readonly string[];
  readonly pendingApplication: readonly string[];
}

export interface ReconciliationManifest {
  readonly environmentKind: 'disposable';
  readonly remoteWritesAuthorized: false;
  readonly sourceEvidenceDate: string;
  readonly representedVersions: readonly string[];
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null;
}

function requireRepresentedVersions(input: unknown): readonly string[] {
  if (
    !Array.isArray(input) ||
    input.some((version) => typeof version !== 'string')
  ) {
    throw new Error(
      'Las versiones representadas deben ser una colección de texto.',
    );
  }

  return [...input];
}

export function parseReconciliationManifest(
  input: unknown,
): ReconciliationManifest {
  if (!isRecord(input) || input.environmentKind !== 'disposable') {
    throw new Error('El ensayo debe usar un entorno desechable.');
  }

  if (input.remoteWritesAuthorized !== false) {
    throw new Error('El ensayo no puede autorizar escrituras remotas.');
  }

  if (typeof input.sourceEvidenceDate !== 'string') {
    throw new Error('El manifiesto requiere una fecha de evidencia.');
  }

  return {
    environmentKind: 'disposable',
    remoteWritesAuthorized: false,
    sourceEvidenceDate: input.sourceEvidenceDate,
    representedVersions: requireRepresentedVersions(
      input.representedVersions,
    ),
  };
}

export function buildMigrationReconciliationPlan(
  localVersions: readonly string[] | null | undefined,
  representedVersions: readonly string[] | null | undefined,
): MigrationReconciliationPlan {
  const comparison = compareMigrationVersions(
    localVersions,
    representedVersions,
  );

  if (comparison.remoteOnly.length > 0) {
    throw new Error(
      `Versiones representadas ausentes en Git: ${comparison.remoteOnly.join(', ')}`,
    );
  }

  return {
    repairCandidates: comparison.shared,
    pendingApplication: comparison.localOnly,
  };
}

export interface ReconciliationDryRun extends MigrationReconciliationPlan {
  readonly mode: 'dry-run';
  readonly sourceEvidenceDate: string;
  readonly remoteWritesAuthorized: false;
}

export function createReconciliationDryRun(
  manifest: ReconciliationManifest,
  localVersions: readonly string[],
): ReconciliationDryRun {
  const plan = buildMigrationReconciliationPlan(
    localVersions,
    manifest.representedVersions,
  );

  return {
    mode: 'dry-run',
    sourceEvidenceDate: manifest.sourceEvidenceDate,
    remoteWritesAuthorized: false,
    ...plan,
  };
}
