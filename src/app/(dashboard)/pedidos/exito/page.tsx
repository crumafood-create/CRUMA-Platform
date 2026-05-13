import Link from 'next/link';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 bg-[#FDFCFB]">
      <div className="max-w-md w-full text-center p-10 bg-white rounded-[2rem] border border-[#E2DED0] shadow-sm">
        {/* Icono con aura cálida */}
        <div className="mx-auto w-20 h-20 bg-[#F5F2ED] rounded-full flex items-center justify-center mb-6">
          <CheckCircleIcon className="w-12 h-12 text-[#C4A484]" />
        </div>

        <h1 className="text-3xl font-bold text-[#4A3F35] mb-3">
          ¡Pedido Confirmado!
        </h1>
        
        <p className="text-[#8C7E6F] mb-8 leading-relaxed">
          Tu pago ha sido procesado con éxito. Ya estamos preparando tus tequeños y empanadas con la calidad de siempre.
        </p>

        {/* Card Informativa de Seguimiento */}
        <div className="bg-[#F5F2ED]/50 rounded-2xl p-6 mb-8 text-left border border-[#F5F2ED]">
          <h2 className="text-sm font-semibold text-[#4A3F35] uppercase tracking-wider mb-3">
            Próximos pasos
          </h2>
          <ul className="space-y-3">
            <li className="flex gap-3 text-sm text-[#6B5E50]">
              <span className="font-bold text-[#C4A484]">1.</span> 
              Recibirás un correo con el detalle de tu factura (RESICO).
            </li>
            <li className="flex gap-3 text-sm text-[#6B5E50]">
              <span className="font-bold text-[#C4A484]">2.</span> 
              Te notificaremos vía WhatsApp cuando tu pedido vaya en camino.
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Link 
            href="/dashboard/pedidos"
            className="w-full py-4 bg-[#4A3F35] text-white rounded-xl font-bold hover:bg-[#332C25] transition-all"
          >
            Ver mis pedidos
          </Link>
          <Link 
            href="/"
            className="w-full py-4 text-[#4A3F35] font-medium hover:underline transition-all"
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    </main>
  );
}
