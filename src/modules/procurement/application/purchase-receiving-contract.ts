import { z } from 'zod';

const isoDateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'La caducidad debe usar el formato YYYY-MM-DD.',
  )
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);

    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, 'La fecha de caducidad no es válida.');

export const purchaseReceivingInputSchema = z
  .object({
    purchaseOrderItemId: z.string().uuid(),
    quantityReceived: z
      .number()
      .finite()
      .positive(),
    lotNumber: z
      .string()
      .trim()
      .min(1, 'El lote es obligatorio.'),
    expirationDate: isoDateSchema,
    inventoryLocationId: z.string().uuid(),
    idempotencyKey: z.string().uuid(),
  })
  .strict();

export type PurchaseReceivingInput = z.infer<
  typeof purchaseReceivingInputSchema
>;

export function parsePurchaseReceivingInput(
  input: PurchaseReceivingInput,
): PurchaseReceivingInput {
  const result =
    purchaseReceivingInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(
      'Los datos de la recepción no son válidos.',
    );
  }

  return result.data;
}

export function assertPurchaseReceiptMatchesPresentation(
  quantity: number,
  presentationMode: 'base_unit' | 'sealed_package',
  baseQuantityPerPresentation: number,
): void {
  if (presentationMode === 'base_unit') return;
  if (!Number.isFinite(baseQuantityPerPresentation) || baseQuantityPerPresentation <= 0) {
    throw new Error('La conversiÃ³n de la presentaciÃ³n no es vÃ¡lida.');
  }
  const packageCount = quantity / baseQuantityPerPresentation;
  if (Math.abs(packageCount - Math.round(packageCount)) > 1e-8) {
    throw new Error('Solo se pueden aceptar presentaciones cerradas completas.');
  }
}
