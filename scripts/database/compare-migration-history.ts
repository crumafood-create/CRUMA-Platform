import { readdir, readFile } from 'node:fs/promises';
import process from 'node:process';

import {
  compareMigrationVersions,
  parseRemoteVersions,
  resolveMigrationHistoryInput,
} from './migration-history.ts';

const MIGRATION_FILE = /^(\d{14})_.+\.sql$/;
const IO_TIMEOUT_MS = 10_000;

function withTimeout<T>(operation: Promise<T>, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`Tiempo agotado al ${label}.`)),
      IO_TIMEOUT_MS,
    );
  });

  return Promise.race([operation, timeout]);
}

async function readLocalVersions(): Promise<readonly string[]> {
  const entries = await withTimeout(
    readdir('supabase/migrations'),
    'leer las migraciones locales',
  );
  const versions = entries.flatMap((entry) => {
    const version = MIGRATION_FILE.exec(entry)?.[1];
    return version === undefined ? [] : [version];
  });

  if (versions.length !== new Set(versions).size) {
    throw new Error('Hay timestamps duplicados en supabase/migrations.');
  }

  return versions.sort();
}

function printGroup(label: string, versions: readonly string[]): void {
  console.log(`${label}: ${versions.length}`);
  versions.forEach((version) => console.log(`  - ${version}`));
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error no identificado.';
}

async function main(): Promise<void> {
  const inputPath = resolveMigrationHistoryInput(process.argv.slice(2));
  const [localVersions, remoteText] = await Promise.all([
    readLocalVersions(),
    withTimeout(readFile(inputPath, 'utf8'), 'leer el inventario remoto'),
  ]);
  const remoteVersions = parseRemoteVersions(remoteText);

  if (remoteVersions.length === 0) {
    throw new Error(
      'No se encontraron versiones remotas. No se asume historial vacío.',
    );
  }

  const result = compareMigrationVersions(localVersions, remoteVersions);
  printGroup('Compartidas', result.shared);
  printGroup('Solo locales', result.localOnly);
  printGroup('Solo remotas', result.remoteOnly);

  if (result.localOnly.length > 0 || result.remoteOnly.length > 0) {
    process.exitCode = 2;
  }
}

main().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      level: 'error',
      code: 'MIGRATION_HISTORY_FAILED',
      message: toErrorMessage(error),
    }),
  );
  process.exitCode = 1;
});
