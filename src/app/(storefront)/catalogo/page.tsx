import type { Metadata } from 'next';

import { PublicCatalog } from '@/components/storefront/public-catalog';

export const metadata: Metadata = {
  title: 'Catálogo',
  description: 'Conoce las líneas de tequeños, empanadas, discos y masas de Crumafood.',
};

export default function CatalogPage() {
  return <PublicCatalog />;
}
