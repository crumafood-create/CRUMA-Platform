import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { getReceivingDetail } from './actions';
import ReceivingDetailClient from './receiving-detail-client';

vi.mock('./actions', () => ({
  confirmReceiving: vi.fn(),
  getReceivingDetail: vi.fn(),
}));

vi.mock('@/modules/warehouse/components/mobile-scanner', () => ({
  MobileScanner: () => null,
}));

describe('ReceivingDetailClient', () => {
  it('shows the received and pending base quantities for a partial order', async () => {
    vi.mocked(getReceivingDetail).mockResolvedValue({
      purchaseOrder: {
        id: 'partial-order-id',
        order_number: 'PO-TEST-PARTIAL',
        supplier_id: 'supplier-id',
        status: 'partially_received',
      },
      items: [{
        id: 'item-id',
        purchase_order_id: 'partial-order-id',
        raw_material_id: 'material-id',
        quantity: 50,
        received_quantity: 25,
        unit_cost: 30,
        presentation_mode: 'sealed_package',
        purchase_quantity: 2,
        base_quantity_per_presentation: 25,
        base_unit_code: 'kg',
        raw_material: { id: 'material-id', name: 'Harina de trigo' },
        suggested_location: null,
        storage_configuration_error: 'Asigna un destino habitual compatible en Materias Primas.',
      }],
    });

    render(<ReceivingDetailClient purchaseOrderId="partial-order-id" />);

    await waitFor(() => {
      expect(screen.getByText('Pendiente: 25 kg')).toBeInTheDocument();
    });
    expect(screen.getByText('Recibido').parentElement?.parentElement)
      .toHaveTextContent('25 kg');
    expect(screen.getByText('Esperado').parentElement?.parentElement)
      .toHaveTextContent('50 kg');
    expect(screen.getByText('Destino automático de almacenamiento')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Asigna un destino habitual compatible');
    expect(screen.getByRole('button', { name: /Confirmar recepci/ })).toBeDisabled();
  });

  it('shows the configured destination as read only', async () => {
    vi.mocked(getReceivingDetail).mockResolvedValue({
      purchaseOrder: { id: 'order', order_number: 'PO-1', supplier_id: 'supplier', status: 'released' },
      items: [{
        id: 'item', purchase_order_id: 'order', raw_material_id: 'material', quantity: 1,
        received_quantity: 0, unit_cost: 20, presentation_mode: 'base_unit', purchase_quantity: 1,
        base_quantity_per_presentation: 1, base_unit_code: 'kg',
        raw_material: { id: 'material', name: 'Queso cheddar fuerte' },
        suggested_location: { id: 'location', name: 'Refrigeración de materias primas', slug: 'REF-MP-01' },
        storage_configuration_error: null,
      }],
    });

    render(<ReceivingDetailClient purchaseOrderId="order" />);

    expect(await screen.findByText('Refrigeración de materias primas · REF-MP-01')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirmar recepci/ })).toBeEnabled();
  });
});
