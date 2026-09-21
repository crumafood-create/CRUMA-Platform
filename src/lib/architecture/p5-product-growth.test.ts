import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();
const source = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('contratos de producto y crecimiento P5', () => {
  it('documenta roadmap con ROI, límites de alcance y criterios de salida', () => {
    const roadmap = source('docs/product/functional-roadmap.md');

    expect(roadmap).toContain('ROI');
    expect(roadmap).toContain('Fuera de alcance');
    expect(roadmap).toContain('Criterio de salida');
  });

  it('protege reportes y exportaciones con permiso explícito', () => {
    expect(source('src/app/(admin)/reports/page.tsx')).toContain('BUSINESS_REPORT_VIEW');
    expect(source('src/app/(admin)/reports/export/route.ts')).toContain('BUSINESS_REPORT_VIEW');
  });

  it('conecta telemetría mínima al shell administrativo', () => {
    expect(source('src/app/(admin)/_components/admin-shell.tsx')).toContain('AnalyticsTracker');
    expect(source('src/components/analytics/analytics-tracker.tsx')).toContain('trackAnalyticsPageView');
    expect(source('src/modules/analytics/application/analytics-event-action.ts')).toContain("event_type: 'page_view'");
  });

  it('define límites de carga y error para la operación móvil', () => {
    for (const path of ['src/app/mobile/layout.tsx', 'src/app/mobile/loading.tsx', 'src/app/mobile/error.tsx']) {
      expect(existsSync(resolve(root, path))).toBe(true);
    }
    expect(source('src/app/mobile/layout.tsx')).toContain('MOBILE_OPERATIONS_ACCESS');
  });

  it('elimina enlaces móviles a rutas inexistentes', () => {
    const mobileHome = source('src/app/mobile/page.tsx');

    expect(mobileHome).toContain('/mobile/receiving');
    expect(mobileHome).not.toContain('/mobile/receive"');
    expect(mobileHome).not.toContain('/mobile/inventory"');
    expect(mobileHome).not.toContain('/mobile/lots"');
  });
});
