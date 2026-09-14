import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('trazabilidad canónica de producción', () => {
  it('consulta consumos reales y evita el modelo heredado incorrecto', () => {
    const page = source('src/app/(admin)/lots/production/[id]/page.tsx');
    expect(page).toContain('createTypedClient(');
    expect(page).toContain(".from('production_order_consumptions')");
    expect(page).toContain(".from('product_lots')");
    expect(page).not.toContain('production_lot_consumptions');
    expect(page).not.toContain(".from('inventory_lots')");
    expect(page).not.toContain(': any');
  });

  it('expone el progreso por múltiples lotes en picking', () => {
    const action = source('src/app/mobile/picking/[id]/actions.ts');
    const client = source('src/app/mobile/picking/[id]/picking-detail-client.tsx');
    expect(action).toContain('picking_lot_allocations');
    expect(client).toContain('picked_quantity');
    expect(client).toContain('allocations');
    expect(client).toContain('Restante');
  });
});
