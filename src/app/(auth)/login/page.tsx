'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/shared/ui/primitives/button'; // Tu botón corporativo
import { createClient } from '@/infrastructure/integrations/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    searchParams.get('error') === 'admin_required'
      ? 'Tu cuenta existe, pero todavía no tiene permisos de administrador para entrar al dashboard.'
      : null,
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'No fue posible conectar con el servicio de autenticación.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 py-16 sm:py-24 font-arkibal">
      <div className="w-full space-y-8 bg-white p-8 rounded-[2rem] border border-brand-gray-25 shadow-sm">
        
        {/* Encabezado */}
        <div className="text-center space-y-2">
          {/* h1 adopta font-grocry automáticamente del CSS global */}
          <h1 className="text-3xl font-black text-brand-black tracking-tight">
            Iniciar sesión
          </h1>
          <p className="text-sm text-brand-gray-75 font-light">
            Panel de gestión CRUMAFOOD
          </p>
        </div>

        {/* Alerta de Error integrada en la UI */}
        {errorMsg && (
          <div className="p-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl font-light">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-5">
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm text-brand-black bg-white border border-brand-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue placeholder:text-brand-gray-50 font-light transition-all"
            />
          </div>

          <div className="pt-2">
            {/* Implementamos tu componente de marca */}
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              fullWidth
              className="py-3 font-bold"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </div>
        </form>

        {/* Enlace de retorno o registro */}
        <div className="text-center pt-4 border-t border-brand-gray-25/50 text-xs text-brand-gray-75 font-light">
          <Link href="/" className="hover:text-brand-blue transition-colors font-medium">
            ← Volver al inicio
          </Link>
        </div>

      </div>
    </main>
  );
}