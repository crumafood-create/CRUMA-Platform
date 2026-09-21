import type { BusinessReport } from './business-report-contract';

export type BusinessReportPeriod = { from: string; to: string };

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toBusinessReportCsv(
  report: BusinessReport,
  period: BusinessReportPeriod,
): string {
  const rows: Array<Array<string | number>> = [
    ['periodo_desde', 'periodo_hasta', 'seccion', 'indicador', 'dimension', 'valor'],
    [period.from, period.to, 'kpi', 'ingresos', 'total', report.kpis.revenue],
    [period.from, period.to, 'kpi', 'unidades_vendidas', 'total', report.kpis.unitsSold],
    [period.from, period.to, 'kpi', 'eficiencia_produccion', 'porcentaje', report.kpis.productionEfficiency],
    [period.from, period.to, 'kpi', 'usuarios_activos', 'total', report.kpis.activeUsers],
    ...report.salesByLine.map((line): Array<string | number> => [
      period.from, period.to, 'ventas', 'ingresos_por_linea', line.name, line.revenue,
    ]),
    ...report.inventoryBySku.map((item): Array<string | number> => [
      period.from, period.to, 'inventario', 'existencia_por_sku', item.sku, item.quantity,
    ]),
    ...report.userBehavior.topPages.map((page): Array<string | number> => [
      period.from, period.to, 'usuarios', 'vistas_por_pagina', page.page, page.views,
    ]),
  ];
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

function ascii(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '');
}

function pdfText(value: string): string {
  return ascii(value).replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}

export function toBusinessReportPdf(
  report: BusinessReport,
  period: BusinessReportPeriod,
): Uint8Array {
  const lines = [
    'CRUMAFOOD - Reporte ejecutivo',
    `${period.from} a ${period.to}`,
    `Ingresos: MXN ${report.kpis.revenue.toFixed(2)}`,
    `Unidades vendidas: ${report.kpis.unitsSold}`,
    `SKU bajo minimo: ${report.kpis.lowStockSkus}`,
    `Eficiencia de produccion: ${report.kpis.productionEfficiency}%`,
    `Usuarios activos: ${report.kpis.activeUsers}`,
    ...report.salesByLine.slice(0, 8).map((line) => `${line.name}: MXN ${line.revenue.toFixed(2)} / ${line.units} unidades`),
  ];
  const stream = lines.map((line, index) => (
    `${index === 0 ? 'BT /F1 18 Tf 50 770 Td' : index === 1 ? '0 -28 Td /F1 11 Tf' : '0 -20 Td'} (${pdfText(line)}) Tj${index === lines.length - 1 ? ' ET' : ''}`
  )).join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let document = '%PDF-1.4\n';
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(new TextEncoder().encode(document).length);
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = new TextEncoder().encode(document).length;
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  document += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n');
  document += `\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(document);
}
