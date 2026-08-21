import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { parseRemoteVersions } from './migration-history.ts';
import { assertEvidenceFingerprint } from './production-reconciliation-evidence.ts';
import { assertReconciliationCheckpoint } from './production-reconciliation-execution.ts';
import type { ProductionExecutionStep } from './production-reconciliation-execution.types.ts';

const execFileAsync = promisify(execFile);
const SECRET_PATTERN =
  /postgres(?:ql)?:\/\/|sbp_|SUPABASE_ACCESS_TOKEN|SERVICE_ROLE_KEY|JWT_SECRET|YOUR-PASSWORD/i;

interface CommandOutput {
  readonly stdout: string;
  readonly stderr: string;
}

function assertSecretFree(text: string): void {
  if (SECRET_PATTERN.test(text)) {
    throw new Error('La evidencia contiene un patrón sensible.');
  }
}

async function runSupabaseStep(
  step: ProductionExecutionStep,
): Promise<CommandOutput> {
  try {
    return await execFileAsync(
      'pnpm',
      ['exec', 'supabase', ...step.args],
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
    );
  } catch {
    throw new Error(`Falló el paso protegido ${step.id}.`);
  }
}

function verifyOutput(step: ProductionExecutionStep, stdout: string): void {
  if (step.checkpoint) {
    assertReconciliationCheckpoint(
      step.checkpoint,
      parseRemoteVersions(stdout),
    );
  }

  if (step.evidenceFingerprint) {
    const actual = createHash('sha256').update(stdout).digest('hex');
    assertEvidenceFingerprint(actual, step.evidenceFingerprint);
  }
}

async function writeOutput(
  directory: string,
  step: ProductionExecutionStep,
  output: CommandOutput,
): Promise<void> {
  await Promise.all([
    writeFile(join(directory, `${step.id}.stdout.txt`), output.stdout, {
      mode: 0o600,
    }),
    writeFile(join(directory, `${step.id}.stderr.txt`), output.stderr, {
      mode: 0o600,
    }),
  ]);
}

export async function recordProductionStep(
  step: ProductionExecutionStep,
  evidenceDirectory: string,
): Promise<void> {
  const output = await runSupabaseStep(step);
  assertSecretFree(`${output.stdout}${output.stderr}`);
  verifyOutput(step, output.stdout);
  await writeOutput(evidenceDirectory, step, output);
}
