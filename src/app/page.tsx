'use client';

import { toast } from 'sonner';

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
