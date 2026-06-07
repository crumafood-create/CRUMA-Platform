'use client';

import { useRouter } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/client';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border px-4 py-2"
    >
      Cerrar sesión
    </button>
  );
}
