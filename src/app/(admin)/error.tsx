'use client';

import React from 'react';
import { Button } from '@/components/button';

interface Props {
  error: Error;
  reset: () => void;
}

export default function AdminError({ error, reset }: Props) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-5 font-arkibal">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-[2rem] border border-brand-gray-25 shadow-sm text-center">
        
        {/* Icono de advertencia decorativo en el tono arena de la marca */}
        <div className="mx-auto w-16 h-16 bg-brand-sand/20 text-brand-black rounded-full flex items-center justify-center text-2xl" aria-hidden="true">
          ⚠️
        </div>

        {/* Encabezado: h1 adopta font-grocry automáticamente del CSS global */}
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-brand-black tracking-tight">
            Error en el sistema
          </h1>
          <p className="text-xs font-black uppercase tracking-wider text-brand-blue">
            Módulo Administrativo
          </p>
        </div>

        {/* Mensaje de Error Técnico */}
        <div className="p-4 bg-brand-gray-25/50 border border-brand-gray-25 rounded-xl">
          <p className="text-sm text-brand-gray-75 font-light leading-relaxed break-words">
            {error.message || 'Ocurrió un problema inesperado al cargar esta sección.'}
          </p>
        </div>

        {/* Acción de recuperación usando tu Button corporativo */}
        <div className="pt-2">
          <Button
            onClick={reset}
            variant="dark"
            fullWidth
            className="py-3 font-bold"
          >
            Reintentar cargar
          </Button>
        </div>

      </div>
    </main>
  );
}