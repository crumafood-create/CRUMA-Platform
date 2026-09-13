/** Boundary for a future PAC/CFDI integration; this module does not issue fiscal documents. */
export interface FiscalInvoiceGateway {
  requestIssue(invoiceId: string): Promise<{ provider: string; externalId: string }>;
  requestCancellation(externalId: string, reason: string): Promise<void>;
}
