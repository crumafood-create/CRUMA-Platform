import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  getReceivingDetail,
  getReceivingLocations,
} from './actions';
import ReceivingDetailClient from './receiving-detail-client';

vi.mock('./actions', () => ({
  confirmReceiving: vi.fn(),
  getReceivingDetail: vi.fn(),
  getReceivingLocations: vi.fn(),
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
      }],
    });
    vi.mocked(getReceivingLocations).mockResolvedValue([]);

    render(<ReceivingDetailClient purchaseOrderId="partial-order-id" />);

    await waitFor(() => {
      expect(screen.getByText('Pendiente: 25 kg')).toBeInTheDocument();
    });
    expect(screen.getByText('Recibido').parentElement?.parentElement)
      .toHaveTextContent('25 kg');
    expect(screen.getByText('Esperado').parentElement?.parentElement)
      .toHaveTextContent('50 kg');
  });
});
