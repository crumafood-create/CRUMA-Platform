'use client';

import React from 'react';

function Tequeno({ className }: { className: string }) {
  // Los tequeños ahora toman el color arena oficial 'brand-sand' para simular su masa dorada
  return (
    <span 
      className={`absolute h-10 w-40 rounded-full bg-brand-sand shadow-md border border-brand-sand/30 ${className}`} 
    />
  );
}

export function HeroArtwork() {
  return (
    <div
      role="img"
      aria-label="Ilustración de productos Crumafood para compartir"
      /* Cambiado el fondo verde por el azul corporativo 'brand-blue' */
      className="relative mx-auto aspect-square w-full max-w-lg overflow-hidden rounded-[3rem] bg-brand-blue shadow-xl border border-brand-blue/10"
    >
      {/* Círculo superior derecho adaptado al color negro puro de la marca */}
      <span className="absolute -right-16 -top-16 size-56 rounded-full bg-brand-black opacity-40" />
      
      {/* Círculo inferior izquierdo usando la escala de grises suave de fondo */}
      <span className="absolute -bottom-20 -left-16 size-64 rounded-full bg-brand-gray-25 opacity-20" />
      
      {/* El plato central ahora es blanco puro y limpio */}
      <div className="absolute inset-[18%] rotate-[-8deg] rounded-full bg-white shadow-2xl border border-brand-gray-25/40">
        <Tequeno className="left-[15%] top-[27%] rotate-[12deg]" />
        <Tequeno className="left-[22%] top-[43%] rotate-[-5deg]" />
        <Tequeno className="left-[18%] top-[59%] rotate-[8deg]" />
      </div>

      {/* Etiqueta institucional con tu fuente corporativa primaria font-arkibal */}
      <span className="absolute bottom-7 right-7 rounded-full bg-white/95 px-5 py-3 text-sm font-black text-brand-black font-arkibal shadow-sm">
        Hecho para disfrutar
      </span>
    </div>
  );
}