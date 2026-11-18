import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const ACTIONS = '../../../app/(admin)/cheese-preparation/actions.ts';

describe('autorización de preparación de queso', () => {
  it.each([
    ['recordCheeseCutAction', 'recordCheeseCut('],
    ['recordCheeseGratingAction', 'recordCheeseGrating('],
  ])('%s protege la escritura antes de invocar el repositorio', (actionName, repositoryCall) => {
    const source = readFileSync(new URL(ACTIONS, import.meta.url), 'utf8');
    const start = source.indexOf(`export async function ${actionName}`);
    const end = source.indexOf('export async function ', start + 1);
    const body = source.slice(start, end === -1 ? undefined : end);
    const guardIndex = body.indexOf('requireTypedAuthorizedAction(');
    const writeIndex = body.indexOf(repositoryCall);

    expect(guardIndex).toBeGreaterThanOrEqual(0);
    expect(body).toContain('PERMISSIONS.INVENTORY_ADJUSTMENT_CREATE');
    expect(writeIndex).toBeGreaterThan(guardIndex);
  });
});
