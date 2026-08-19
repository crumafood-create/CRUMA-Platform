import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createReconciliationDryRun,
  parseReconciliationManifest,
} from './migration-reconciliation.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MANIFEST_PATH = join(
  ROOT,
  'supabase/rehearsal/production-migration-reconciliation.json',
);
const MIGRATIONS_PATH = join(ROOT, 'supabase/migrations');
const VERSION_PATTERN = /^(\d{14})_.+\.sql$/;

function collectLocalVersions(fileNames: readonly string[]): string[] {
  return fileNames.flatMap((fileName) => {
    const match = VERSION_PATTERN.exec(fileName);
    const version = match?.[1];
    return version ? [version] : [];
  });
}

async function createPlan(): Promise<unknown> {
  const [manifestText, migrationFiles] = await Promise.all([
    readFile(MANIFEST_PATH, 'utf8'),
    readdir(MIGRATIONS_PATH),
  ]);
  const manifest = parseReconciliationManifest(JSON.parse(manifestText));

  return createReconciliationDryRun(
    manifest,
    collectLocalVersions(migrationFiles),
  );
}

async function main(): Promise<void> {
  const plan = await createPlan();
  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`RECONCILIATION_PLAN_FAILED: ${message}\n`);
  process.exitCode = 1;
});
