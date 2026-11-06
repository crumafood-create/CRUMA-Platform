import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

type ActionContract = {
  file: string;
  action: string;
  guard: string;
  table: string;
  mutation: 'insert' | 'update';
};

const INTEGRITY_ACTIONS: ActionContract[] = [
  {
    file: '../../../app/(admin)/raw-materials/actions.ts',
    action: 'createRawMaterial',
    mutation: 'insert',
    guard: 'assertRawMaterialFamilyBelongsToCategory(',
    table: 'raw_materials',
  },
  {
    file: '../../../app/(admin)/raw-materials/actions.ts',
    action: 'updateRawMaterial',
    mutation: 'update',
    guard: 'assertRawMaterialFamilyBelongsToCategory(',
    table: 'raw_materials',
  },
  {
    file: '../../../app/(admin)/families/actions.ts',
    action: 'updateFamily',
    mutation: 'update',
    guard: 'assertFamilyCategoryCanBeChanged(',
    table: 'families',
  },
];

function actionSource(contract: ActionContract): string {
  const source = readFileSync(new URL(contract.file, import.meta.url), 'utf8');
  const declaration = `export async function ${contract.action}`;
  const start = source.indexOf(declaration);

  if (start === -1) throw new Error(`Acción no encontrada: ${contract.action}`);

  const nextAction = source.indexOf('export async function ', start + declaration.length);

  return source.slice(start, nextAction === -1 ? undefined : nextAction);
}

describe('integridad categoría-familia antes de escrituras administrativas', () => {
  it.each(INTEGRITY_ACTIONS)('protege la acción %j antes de escribir', (contract) => {
    const source = actionSource(contract);
    const guardIndex = source.indexOf(contract.guard);
    const writePattern = new RegExp(
      String.raw`\.from\(['"]${contract.table}['"]\)\s*\.${contract.mutation}\s*\(`,
    );
    const writeIndex = source.search(writePattern);

    expect(guardIndex >= 0).toBe(true);
    expect(writeIndex > guardIndex).toBe(true);
  });
});
