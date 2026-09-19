import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ErrorState } from './error-state';

describe('ErrorState', () => {
  it('presenta un mensaje seguro y conserva un identificador de soporte', () => {
    render(<ErrorState error={Object.assign(new Error('password authentication failed'), { digest: 'abc123' })} onRetry={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar esta información');
    expect(screen.queryByText(/password authentication failed/i)).not.toBeInTheDocument();
    expect(screen.getByText(/abc123/i)).toBeVisible();
  });

  it('ofrece recuperación accesible', () => {
    const retry = vi.fn();
    render(<ErrorState error={new Error('boom')} onRetry={retry} />);
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
