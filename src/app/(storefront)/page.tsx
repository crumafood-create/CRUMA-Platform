import type { Metadata } from 'next';

import { PublicHome } from '@/components/storefront/public-home';

export const metadata: Metadata = {
  title: 'Tequeños, empanadas y masas artesanales',
  description: 'Productos frescos y congelados para hogares, negocios y eventos, elaborados en Toluca.',
};

export default function HomePage() {
  return <PublicHome />;
}
