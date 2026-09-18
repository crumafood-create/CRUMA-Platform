'use client';

import React from 'react';

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({
  message = 'Cargando...',
}: LoadingStateProps) {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center p-8 font-arkibal">
      <div className="flex flex-col items-center space-y-4 text-center">
        
        {/* Spinner animado usando tu azul corporativo 'brand-blue' */}
        <div className="relative flex h-12 w-12 items-center justify-center">
          <div className="absolute h-10 w-10 animate-ping rounded-full bg-brand-blue/20" />
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-gray-25 border-t-brand-blue" />
        </div>

        {/* Mensaje de carga estilizado con tus grises de marca */}
        <div className="space-y-1">
          <p className="text-sm font-black text-brand-black tracking-wide">
            {message}
          </p>
          <p className="text-[11px] text-brand-gray-50 uppercase tracking-widest font-light">
            CRUMAFOOD SISTEMA
          </p>
        </div>

      </div>
    </div>
  );
}