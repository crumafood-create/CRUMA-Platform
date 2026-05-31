import { z } from 'zod';

export const TenantSchema =
  z.object({
    id: z.string(),

    name: z
      .string()
      .min(2)
      .max(150),

    slug: z
      .string()
      .min(2)
      .max(100),

    email: z
      .string()
      .email(),

    active: z.boolean(),

    createdAt:
      z.date().optional(),
  });

export type TenantDto =
  z.infer<typeof TenantSchema>;
