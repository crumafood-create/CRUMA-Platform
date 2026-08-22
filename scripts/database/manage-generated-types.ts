import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { promisify } from 'node:util';

import {
  assertGeneratedDatabaseTypes,
  assertGeneratedTypesAreCurrent,
  CANONICAL_DATABASE_TYPES_PATH,
  createLocalTypeGenerationArgs,
  createLocalTypeGenerationEnvironment,
  normalizeGeneratedDatabaseTypes,
} from './generated-types.ts';

const execFileAsync = promisify(execFile);
type GenerationMode = 'generate' | 'check';

function resolveMode(input: string | undefined): GenerationMode {
  if (input !== 'generate' && input !== 'check') {
    throw new Error('Uso: manage-generated-types <generate|check>');
  }

  return input;
}

async function generateLocalDatabaseTypes(): Promise<string> {
  let output: string;

  try {
    ({ stdout: output } = await execFileAsync(
      'pnpm',
      [...createLocalTypeGenerationArgs()],
      {
        encoding: 'utf8',
        env: createLocalTypeGenerationEnvironment(process.env),
        maxBuffer: 10 * 1024 * 1024,
      },
    ));
  } catch {
    throw new Error('No se pudieron generar tipos desde Supabase local.');
  }

  assertGeneratedDatabaseTypes(output);
  return normalizeGeneratedDatabaseTypes(output);
}

async function writeGeneratedTypes(generated: string): Promise<void> {
  await mkdir(dirname(CANONICAL_DATABASE_TYPES_PATH), { recursive: true });
  await writeFile(CANONICAL_DATABASE_TYPES_PATH, generated, { mode: 0o644 });
  process.stdout.write(`DATABASE_TYPES_GENERATED=${CANONICAL_DATABASE_TYPES_PATH}\n`);
}

async function verifyGeneratedTypes(generated: string): Promise<void> {
  const committed = await readFile(CANONICAL_DATABASE_TYPES_PATH, 'utf8');
  assertGeneratedTypesAreCurrent(committed, generated);
  process.stdout.write('DATABASE_TYPES_CURRENT=OK\n');
}

async function main(): Promise<void> {
  const mode = resolveMode(process.argv[2]);
  const generated = await generateLocalDatabaseTypes();

  if (mode === 'generate') {
    await writeGeneratedTypes(generated);
    return;
  }

  await verifyGeneratedTypes(generated);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`DATABASE_TYPES_FAILED: ${message}\n`);
  process.exitCode = 1;
});
