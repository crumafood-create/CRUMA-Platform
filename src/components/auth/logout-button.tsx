'use client';

import { useRouter } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/client';

import { Button } from '@/components/button';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push('/login');
    router.refresh();
  }

  return (
    <Button 
      variant="outline"
      onClick={handleLogout}
      className="border-brand-gray-50 text-brand-gray-75 hover:bg-brand-black hover:text-white hover:border-brand-black"
    >
      Cerrar sesión
    </Button>
  );
}
