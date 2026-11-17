import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { QualitySampleSummary } from './quality-sample-summary';

describe('QualitySampleSummary', () => {
  it('muestra en solo lectura las cantidades del lote y sus unidades', () => {
    const { container } = render(
      <QualitySampleSummary
        samples={[
          {
            lotId: 'lot-1',
            lotNumber: 'PARTY-001',
            productName: 'Tequeño Party Queso Crudo',
            immediateInspection: 2,
            immediateSampleId: 'sample-1',
            safetyRetention: 3,
          },
        ]}
      />,
    );

    expect(screen.getByText('Tequeño Party Queso Crudo · lote PARTY-001')).toBeInTheDocument();
    expect(screen.getByText('Inspección inmediata').nextElementSibling).toHaveTextContent('2 piezas');
    expect(screen.getByText('Retención de seguridad').nextElementSibling).toHaveTextContent('3 piezas');
    expect(screen.getByRole('link', { name: 'Inspeccionar muestra' })).toHaveAttribute(
      'href',
      '/qa/samples/sample-1/inspect',
    );
    expect(container.querySelector('input, select, textarea')).toBeNull();
  });
});
