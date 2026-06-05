'use client';

import { toast } from 'sonner';

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/login');
}

export default function HomePage() {
  return (
    <main className="p-10">
      <button
        onClick={() => toast.success('Crumafood iniciado')}
      >
        Probar toast
      </button>
    </main>
  );
}
