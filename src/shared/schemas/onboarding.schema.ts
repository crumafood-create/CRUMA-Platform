import { z } from 'zod'

export const onboardingSchema = z.object({
  full_name: z.string().min(3, "El nombre es demasiado corto"),
  phone: z.string().regex(/^\d{10}$/, "El teléfono debe tener 10 dígitos"),
  user_type: z.enum(['persona_fisica', 'persona_moral']),
  business_name: z.string().min(3, "Nombre de negocio requerido"),
  rfc: z.string().min(12).max(13).toUpperCase(),
})

export type OnboardingData = z.infer<typeof onboardingSchema>
