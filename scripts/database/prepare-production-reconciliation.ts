import { readFile } from 'node:fs/promises';

import type { ReconciliationDryRun } from './migration-reconciliation.ts';
import { createProductionReconciliationPacket } from './production-reconciliation.ts';

function resolveArguments(argv: readonly string[]): readonly [string, string] {
  const [planPath, projectRef] = argv;

  if (!planPath || !projectRef) {
    throw new Error(
      'Uso: prepare-production-reconciliation <plan.json> <project-ref>',
    );
  }

  return [planPath, projectRef];
}

async function main(): Promise<void> {
  const [planPath, projectRef] = resolveArguments(process.argv.slice(2));
  const plan = JSON.parse(
    await readFile(planPath, 'utf8'),
  ) as ReconciliationDryRun;
  const packet = createProductionReconciliationPacket(plan, projectRef);

  process.stdout.write(JSON.stringify(packet, null, 2) + '\n');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write('PRODUCTION_RECONCILIATION_PREP_FAILED: ' + message + '\n');
  process.exitCode = 1;
});
