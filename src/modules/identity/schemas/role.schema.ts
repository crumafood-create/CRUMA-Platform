import { z } from 'zod';

export const RoleSchema = z.object({
  id: z.string(),

  name: z
    .string()
    .min(2)
    .max(100),

  description: z
    .string()
    .optional(),

  permissions: z.array(
    z.string()
  ),

  tenantId: z.string(),

  active: z.boolean().default(true),
});

export type RoleDto =
  z.infer<typeof RoleSchema>;
