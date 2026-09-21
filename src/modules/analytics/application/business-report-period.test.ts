import { describe, expect, it } from 'vitest';

import { parseBusinessReportPeriod } from './business-report-period';

describe('periodo del reporte de negocio', () => {
  it('acepta un rango completo y ordenado', () => {
    expect(parseBusinessReportPeriod({ from: '2026-09-01', to: '2026-09-19' }))
      .toEqual({ from: '2026-09-01', to: '2026-09-19' });
  });

  it('usa treinta días seguros para rangos incompletos, inválidos o invertidos', () => {
    const now = new Date('2026-09-19T12:00:00.000Z');

    expect(parseBusinessReportPeriod({ from: 'ayer', to: '2026-09-19' }, now))
      .toEqual({ from: '2026-08-21', to: '2026-09-19' });
    expect(parseBusinessReportPeriod({ from: '2026-09-20', to: '2026-09-01' }, now))
      .toEqual({ from: '2026-08-21', to: '2026-09-19' });
  });
});
