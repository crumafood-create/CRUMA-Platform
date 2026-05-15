import { z }
from 'zod';

export const checkoutSchema = z.object({

  fullName: z
    .string()
    .min(3),

  phone: z
    .string()
    .min(8),

  address: z
    .string()
    .min(5),

  city: z
    .string()
    .min(2),

  state: z
    .string()
    .min(2),

  postalCode: z
    .string()
    .min(4)
});

export type CheckoutSchema =
  z.infer<typeof checkoutSchema>;
