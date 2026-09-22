import type { NextRequest } from 'next/server';

import { isAuthorizationError } from '@/modules/identity/guards/permission.guard';
import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import { parseBusinessReportPeriod } from '@/modules/analytics/application/business-report-period';
import { toBusinessReportCsv, toBusinessReportPdf } from '@/modules/analytics/application/business-report-export';
import { loadBusinessReport } from '@/modules/analytics/application/business-report-repository';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const period = parseBusinessReportPeriod({
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
    });
    const { supabase } = await requireTypedAuthorizedAction(PERMISSIONS.BUSINESS_REPORT_VIEW);
    const report = await loadBusinessReport(supabase, period);
    const format = searchParams.get('format');
    const filename = `cruma-reporte-${period.from}-${period.to}`;

    if (format === 'pdf') {
      const pdf = toBusinessReportPdf(report, period);
      const pdfBuffer = new Uint8Array(pdf.byteLength);
      pdfBuffer.set(pdf);
      return new Response(new Blob([pdfBuffer.buffer], { type: 'application/pdf' }), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}.pdf"`,
          'Cache-Control': 'private, no-store',
        },
      });
    }
    return new Response(toBusinessReportCsv(report, period), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    if (isAuthorizationError(error)) {
      return Response.json({ error: 'No autorizado.' }, { status: error.reason === 'unauthenticated' ? 401 : 403 });
    }
    throw error;
  }
}
