import { z } from 'zod';

export const PermissionSchema =
  z.object({
    id: z.string(),

    name: z
      .string()
      .min(2)
      .max(100),

    code: z
      .string()
      .min(2)
      .max(100),

    module: z.string(),

    description:
      z.string().optional(),
  });

export type PermissionDto =
  z.infer<typeof PermissionSchema>;
