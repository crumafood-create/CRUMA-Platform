import { describe, expect, it } from 'vitest';

import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import {
  convertPurchaseRequisitionToOrders,
  createPurchaseApprovals,
  createPurchaseRequisitionFromMrp,
  decideApproval,
  submitPurchaseRequisition,
} from './purchase-requisition-repository';

function clientWith(data: unknown, error: unknown = null) {
  const calls: unknown[] = [];
  const client = { rpc: async (...args: unknown[]) => {
    calls.push(args);
    return { data, error };
  } } as unknown as TypedSupabaseClient;
  return { calls, client };
}

describe('repositorio de requisiciones y aprobaciones', () => {
  it('genera la requisición MRP con una sola RPC', async () => {
    const { calls, client } = clientWith('requisition-1');
    await expect(createPurchaseRequisitionFromMrp(client)).resolves.toBe('requisition-1');
    expect(calls).toEqual([['create_purchase_requisition_from_mrp']]);
  });

  it('envía la requisición a aprobación con bloqueo transaccional', async () => {
    const { calls, client } = clientWith('approval-1');
    await expect(submitPurchaseRequisition(client, 'requisition-1')).resolves.toBe('approval-1');
    expect(calls).toEqual([['submit_purchase_requisition', {
      p_requisition_id: 'requisition-1',
    }]]);
  });

  it('delega la decisión a una sola RPC', async () => {
    const { calls, client } = clientWith('approval-1');
    await expect(decideApproval(client, 'approval-1', 'approved')).resolves.toBe('approval-1');
    expect(calls).toEqual([['decide_approval', {
      p_approval_id: 'approval-1', p_decision: 'approved',
    }]]);
  });

  it('convierte una requisición en una o más órdenes agrupadas', async () => {
    const { calls, client } = clientWith(['order-1', 'order-2']);
    await expect(convertPurchaseRequisitionToOrders(client, 'requisition-1'))
      .resolves.toEqual(['order-1', 'order-2']);
    expect(calls).toEqual([['convert_purchase_requisition_to_orders', {
      p_requisition_id: 'requisition-1',
    }]]);
  });

  it('crea sugerencias de aprobación sin escrituras parciales del cliente', async () => {
    const { calls, client } = clientWith(2);
    await expect(createPurchaseApprovals(client)).resolves.toBe(2);
    expect(calls).toEqual([['create_purchase_approvals']]);
  });

  it('propaga el error de la base de datos', async () => {
    const { client } = clientWith(null, { message: 'Requisition is not an approved draft.' });
    await expect(convertPurchaseRequisitionToOrders(client, 'requisition-1'))
      .rejects.toThrow('Requisition is not an approved draft.');
  });

  it('rechaza respuestas vacías o inválidas', async () => {
    await expect(createPurchaseRequisitionFromMrp(clientWith(null).client))
      .rejects.toThrow('La base de datos no devolvió la requisición.');
    await expect(convertPurchaseRequisitionToOrders(clientWith([]).client, 'requisition-1'))
      .rejects.toThrow('La base de datos no devolvió órdenes de compra.');
  });
});
