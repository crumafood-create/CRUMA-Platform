import { readdir, readFile } from 'node:fs/promises';
import process from 'node:process';

const MIGRATION_VERSION = /^\d{14}$/;
const MIGRATION_FILE = /^(\d{14})_.+\.sql$/;

export function parseRemoteVersions(text) {
  const versions = [];

  for (const line of text.split(/\r?\n/)) {
    const columns = line.split('|');

    if (columns.length < 2) {
      continue;
    }

    const remoteVersion = columns[1].trim();

    if (MIGRATION_VERSION.test(remoteVersion)) {
      versions.push(remoteVersion);
    }
  }

  return [...new Set(versions)].sort();
}

export function compareVersions(localVersions, remoteVersions) {
  const local = new Set(localVersions);
  const remote = new Set(remoteVersions);

  return {
    shared: localVersions.filter((version) => remote.has(version)),
    localOnly: localVersions.filter((version) => !remote.has(version)),
    remoteOnly: remoteVersions.filter((version) => !local.has(version)),
  };
}

async function readLocalVersions() {
  const entries = await readdir('supabase/migrations');
  const versions = entries.flatMap((entry) => {
    const match = MIGRATION_FILE.exec(entry);
    return match ? [match[1]] : [];
  });

  if (versions.length !== new Set(versions).size) {
    throw new Error('Hay timestamps duplicados en supabase/migrations.');
  }

  return versions.sort();
}

function printGroup(label, versions) {
  console.log(`${label}: ${versions.length}`);

  for (const version of versions) {
    console.log(`  - ${version}`);
  }
}

function runSelfTest() {
  const sample = `
   Local          | Remote         | Time (UTC)
  ----------------|----------------|---------------------
   20260801000000 | 20260801000000 | 2026-08-01 00:00:00
   20260802000000 |                | 2026-08-02 00:00:00
                  | 20260712000000 | 2026-07-12 00:00:00
  `;
  const remote = parseRemoteVersions(sample);
  const result = compareVersions(
    ['20260801000000', '20260802000000'],
    remote,
  );

  if (
    JSON.stringify(result) !==
    JSON.stringify({
      shared: ['20260801000000'],
      localOnly: ['20260802000000'],
      remoteOnly: ['20260712000000'],
    })
  ) {
    throw new Error('Falló el contrato del comparador de historial.');
  }

  console.log('Contrato del comparador de historial: OK');
}

async function main() {
  if (process.argv[2] === '--self-test') {
    runSelfTest();
    return;
  }

  const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error(
      'Uso: node scripts/database/compare-migration-history.mjs <migration-list.txt>',
    );
  }

  const [localVersions, remoteText] = await Promise.all([
    readLocalVersions(),
    readFile(inputPath, 'utf8'),
  ]);
  const remoteVersions = parseRemoteVersions(remoteText);

  if (remoteVersions.length === 0) {
    throw new Error(
      'No se encontraron versiones remotas en el inventario. No se asume historial vacío.',
    );
  }

  const result = compareVersions(localVersions, remoteVersions);

  printGroup('Compartidas', result.shared);
  printGroup('Solo locales', result.localOnly);
  printGroup('Solo remotas', result.remoteOnly);

  if (result.localOnly.length > 0 || result.remoteOnly.length > 0) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
