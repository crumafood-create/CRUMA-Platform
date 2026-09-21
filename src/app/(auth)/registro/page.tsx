'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/shared/ui/primitives/button'; // Tu botón corporativo
import { createClient } from '@/infrastructure/integrations/supabase/client';

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const supabase = createClient();

    // Llamada nativa al método signUp de Supabase
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setSuccessMsg('¡Cuenta creada con éxito! Verifica tu correo electrónico para confirmar.');
    
    // Opcional: Redirigir automáticamente después de unos segundos
    setTimeout(() => {
      router.push('/login');
    }, 3500);
  }

  return (
    <main className="mx-auto max-w-md px-5 py-16 sm:py-24 font-arkibal">
      <div className="w-full space-y-8 bg-white p-8 rounded-[2rem] border border-brand-gray-25 shadow-sm">
        
        {/* Encabezado */}
        <div className="text-center space-y-2">
          {/* h1 adopta font-grocry automáticamente del CSS global */}
          <h1 className="text-3xl font-black text-brand-black tracking-tight">
            Crear cuenta
          </h1>
          <p className="text-sm text-brand-gray-75 font-light">
            Únete a la plataforma de CRUMAFOOD
          </p>
        </div>

        {/* Alerta de Error integrada en la UI */}
        {errorMsg && (
          <div className="p-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl font-light">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Alerta de Éxito integrada en la UI */}
        {successMsg && (
          <div className="p-4 text-xs text-green-600 bg-green-50 border border-green-200 rounded-xl font-light">
            ✅ {successMsg}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-brand-gray-75">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              placeholder="ejemplo@crumafood.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-sm text-brand-black bg-white border border-brand-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue placeholder:text-brand-gray-50 font-light transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-brand-gray-75">
              Contraseña
            </label>
            <input
              type="password"
              required
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm text-brand-black bg-white border border-brand-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue placeholder:text-brand-gray-50 font-light transition-all"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              fullWidth
              className="py-3 font-bold"
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </Button>
          </div>
        </form>

        {/* Enlace de retorno o alternancia a Login */}
        <div className="text-center pt-4 border-t border-brand-gray-25/50 text-xs text-brand-gray-75 font-light space-y-2">
          <p>
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="text-brand-blue font-semibold hover:underline">
              Inicia sesión
            </Link>
          </p>
          <Link href="/" className="block hover:text-brand-blue transition-colors font-medium pt-1">
            ← Volver al inicio
          </Link>
        </div>

      </div>
    </main>
  );
}
