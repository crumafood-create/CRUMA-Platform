import type { Metadata } from 'next';

import { PublicCatalog } from '@/components/storefront/public-catalog';
import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { fetchPublishedStorefrontProducts } from '@/modules/storefront/application/storefront-product-repository';

export const metadata: Metadata = {
  title: 'Catálogo',
  description: 'Conoce las líneas, presentaciones y precios públicos de Crumafood.',
};

export default async function CatalogPage() {
  const supabase = await createTypedClient();
  const products = await fetchPublishedStorefrontProducts(
    supabase,
    new Date().toISOString(),
  );

  return <PublicCatalog products={products} />;
}
