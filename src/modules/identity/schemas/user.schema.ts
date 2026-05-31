import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().min(1),

  firstName: z
    .string()
    .min(2)
    .max(100),

  lastName: z
    .string()
    .min(2)
    .max(100),

  email: z
    .string()
    .email(),

  tenantId: z.string(),

  roleIds: z.array(z.string()),

  active: z.boolean().default(true),

  createdAt: z.date().optional(),

  updatedAt: z.date().optional(),
});

export type UserDto =
  z.infer<typeof UserSchema>;
