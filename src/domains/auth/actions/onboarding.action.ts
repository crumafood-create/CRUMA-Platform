'use server'

import { createClient } from '@/infrastructure/supabase/server'
import { onboardingSchema, type OnboardingData } from '@/shared/schemas/onboarding.schema'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function completeOnboarding(formData: OnboardingData) {
  const supabase = await createClient()
  
  // 1. Verificar sesión
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autorizado")

  // 2. Validar datos contra el esquema
  const validatedData = onboardingSchema.parse(formData)

  // 3. Actualizar perfil y marcar onboarding como completado
  const { error } = await supabase
    .from('profiles')
    .update({
      ...validatedData,
      onboarding_completed: true,
      role: 'client', // Por defecto, luego admin puede promover a B2B
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) throw new Error("Error al actualizar perfil")

  // 4. Limpiar caché y redirigir
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
