import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MobileShell } from './mobile-shell';

vi.mock('next/navigation', () => ({ usePathname: () => '/mobile/picking/order-1' }));
vi.mock('@/modules/analytics/components/analytics-tracker', () => ({ AnalyticsTracker: () => null }));

describe('shell de operación móvil', () => {
  it('expone tareas reales con targets táctiles y estado de navegación', () => {
    render(<MobileShell><p>Tarea activa</p></MobileShell>);

    expect(screen.getByRole('navigation', { name: 'Tareas móviles' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Picking/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Recepción/ })).toHaveClass('min-h-16');
    expect(screen.getByText('Tarea activa')).toBeInTheDocument();
  });
});
