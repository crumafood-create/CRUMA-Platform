import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { getReceivingOrders } from '@/modules/warehouse/services/receiving.service';

import { ReceivingView } from './receiving-view';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@/modules/warehouse/services/receiving.service', () => ({
  getReceivingOrders: vi.fn(),
}));

describe('ReceivingView', () => {
  it('lists a partial order with a link to its receiving detail', async () => {
    vi.mocked(getReceivingOrders).mockResolvedValue([{
      id: 'partial-order-id',
      order_number: 'PO-TEST-PARTIAL',
      supplier_name: 'Proveedor de prueba',
      status: 'partially_received',
      created_at: '2026-11-09T12:00:00Z',
    }]);

    render(await ReceivingView());

    expect(screen.getByText('PO-TEST-PARTIAL')).toBeInTheDocument();
    expect(screen.getByText('Proveedor de prueba')).toBeInTheDocument();
    expect(screen.getByText('Parcialmente recibida')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /PO-TEST-PARTIAL/ }))
      .toHaveAttribute('href', '/mobile/receiving/partial-order-id');
  });
});
