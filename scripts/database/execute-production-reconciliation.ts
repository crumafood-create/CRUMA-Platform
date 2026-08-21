import { chmod, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  createProductionExecutionPlan,
} from './production-reconciliation-execution.ts';
import type {
  ExecutionMode,
  ProductionExecutionRequest,
} from './production-reconciliation-execution.types.ts';
import { recordProductionStep } from './production-reconciliation-runner.ts';
import type { ProductionReconciliationPacket } from './production-reconciliation.ts';

const SECRET_PATTERN =
  /postgres(?:ql)?:\/\/|sbp_|SUPABASE_ACCESS_TOKEN|SERVICE_ROLE_KEY|JWT_SECRET|YOUR-PASSWORD/i;
const LINKED_REF_PATH = 'supabase/.temp/project-ref';

function requireArgument(input: string | undefined): string {
  if (!input) {
    throw new Error(
      'Uso: execute-production-reconciliation <authorization-packet.json>',
    );
  }

  return input;
}

function resolveMode(input: string | undefined): ExecutionMode {
  const mode = input ?? 'dry-run';

  if (mode !== 'dry-run' && mode !== 'execute') {
    throw new Error('CRUMA_PRODUCTION_EXECUTION_MODE inválido.');
  }

  return mode;
}

function createRequest(): ProductionExecutionRequest {
  const confirmation = process.env.CRUMA_PRODUCTION_EXECUTION_CONFIRMATION;

  return {
    mode: resolveMode(process.env.CRUMA_PRODUCTION_EXECUTION_MODE),
    projectRef: process.env.CRUMA_PRODUCTION_PROJECT_REF ?? '',
    planFingerprint: process.env.CRUMA_PRODUCTION_PLAN_FINGERPRINT ?? '',
    ...(confirmation ? { confirmation } : {}),
  };
}

function assertSecretFree(text: string): void {
  if (SECRET_PATTERN.test(text)) {
    throw new Error('La evidencia contiene un patrón sensible.');
  }
}

async function createEvidenceDirectory(): Promise<string> {
  const configured = process.env.CRUMA_PRODUCTION_EXECUTION_EVIDENCE_DIR;
  const directory = configured
    ? configured
    : await mkdtemp(join(tmpdir(), 'cruma-production-reconciliation-'));

  await mkdir(directory, { recursive: true });
  await chmod(directory, 0o700);
  return directory;
}

async function assertRuntimeReady(projectRef: string): Promise<void> {
  if (!process.env.SUPABASE_ACCESS_TOKEN) {
    throw new Error('SUPABASE_ACCESS_TOKEN no está disponible.');
  }

  const linkedRef = (await readFile(LINKED_REF_PATH, 'utf8')).trim();
  if (linkedRef !== projectRef) {
    throw new Error('El proyecto Supabase vinculado no coincide.');
  }
}

async function main(): Promise<void> {
  const packetPath = requireArgument(process.argv[2]);
  const packet = JSON.parse(
    await readFile(packetPath, 'utf8'),
  ) as ProductionReconciliationPacket;
  const plan = createProductionExecutionPlan(packet, createRequest());
  await assertRuntimeReady(plan.projectRef);
  const evidenceDirectory = await createEvidenceDirectory();
  const planText = `${JSON.stringify(plan, null, 2)}\n`;
  assertSecretFree(planText);
  await writeFile(join(evidenceDirectory, 'execution-plan.json'), planText, {
    mode: 0o600,
  });

  for (const step of plan.steps.filter(({ enabled }) => enabled)) {
    await recordProductionStep(step, evidenceDirectory);
  }

  process.stdout.write(`PRODUCTION_EXECUTION_MODE=${plan.mode}\n`);
  process.stdout.write(`REMOTE_WRITES_AUTHORIZED=${plan.remoteWritesAuthorized}\n`);
  process.stdout.write(`EVIDENCE_DIR=${evidenceDirectory}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`PRODUCTION_RECONCILIATION_FAILED: ${message}\n`);
  process.exitCode = 1;
});
