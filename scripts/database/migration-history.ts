const MIGRATION_VERSION = /^\d{14}$/;

export interface MigrationComparison {
  readonly shared: readonly string[];
  readonly localOnly: readonly string[];
  readonly remoteOnly: readonly string[];
}

function isMigrationVersion(value: string): boolean {
  return MIGRATION_VERSION.test(value);
}

function uniqueSorted(versions: readonly string[]): readonly string[] {
  return [...new Set(versions)].sort();
}

function validateVersions(versions: readonly string[]): void {
  const invalidVersion = versions.find((version) => !isMigrationVersion(version));

  if (invalidVersion !== undefined) {
    throw new Error(`Versión de migración inválida: ${invalidVersion}`);
  }
}

function requireCollection(
  versions: readonly string[] | null | undefined,
): asserts versions is readonly string[] {
  if (versions === null || versions === undefined) {
    throw new Error('Las versiones deben ser colecciones.');
  }
}

export function parseRemoteVersions(
  input: string | null | undefined,
): readonly string[] {
  if (typeof input !== 'string') {
    throw new Error('El inventario remoto debe ser texto.');
  }

  const versions = input.split(/\r?\n/).flatMap((line) => {
    const remoteVersion = line.split('|')[1]?.trim();
    return remoteVersion !== undefined && isMigrationVersion(remoteVersion)
      ? [remoteVersion]
      : [];
  });

  return uniqueSorted(versions);
}

export function compareMigrationVersions(
  localInput: readonly string[] | null | undefined,
  remoteInput: readonly string[] | null | undefined,
): MigrationComparison {
  requireCollection(localInput);
  requireCollection(remoteInput);
  const localVersions = uniqueSorted(localInput);
  const remoteVersions = uniqueSorted(remoteInput);
  validateVersions(localVersions);
  validateVersions(remoteVersions);
  const local = new Set(localVersions);
  const remote = new Set(remoteVersions);

  return {
    shared: localVersions.filter((version) => remote.has(version)),
    localOnly: localVersions.filter((version) => !remote.has(version)),
    remoteOnly: remoteVersions.filter((version) => !local.has(version)),
  };
}
