'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { onboardingSchema, type OnboardingData } from '@/shared/schemas/onboarding.schema'
import { completeOnboarding } from '../actions/onboarding.action'

export function OnboardingForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema)
  })

  const onSubmit = async (data: OnboardingData) => {
    try {
      await completeOnboarding(data)
    } catch (error) {
      alert("Hubo un error al guardar tu perfil.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md mx-auto p-8 bg-[#F5F2ED] rounded-2xl shadow-sm border border-[#E2DED0]">
      <h2 className="text-2xl font-semibold text-[#4A3F35]">Bienvenido a CRUMAFOOD</h2>
      <p className="text-[#8C7E6F]">Completemos tu registro para empezar.</p>

      {/* Inputs con estilo Neominimalista */}
      <div>
        <label className="block text-sm font-medium text-[#4A3F35]">Nombre de Negocio</label>
        <input 
          {...register('business_name')} 
          className="mt-1 block w-full rounded-lg border-[#D3CBBF] bg-white/50 focus:border-[#C4A484] focus:ring-[#C4A484]" 
        />
        {errors.business_name && <span className="text-red-500 text-xs">{errors.business_name.message}</span>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#4A3F35]">RFC</label>
          <input {...register('rfc')} className="mt-1 block w-full rounded-lg border-[#D3CBBF]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#4A3F35]">Teléfono</label>
          <input {...register('phone')} className="mt-1 block w-full rounded-lg border-[#D3CBBF]" />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full py-3 px-4 bg-[#C4A484] hover:bg-[#A68966] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#C4A484]/20"
      >
        {isSubmitting ? 'Guardando...' : 'Finalizar Registro'}
      </button>
    </form>
  )
}
