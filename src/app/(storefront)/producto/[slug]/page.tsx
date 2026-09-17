import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';

import { StorefrontProductDetail } from '@/components/storefront/storefront-product-detail';
import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { fetchPublishedStorefrontProduct } from '@/modules/storefront/application/storefront-product-repository';

const loadProduct = cache(async (slug: string) => {
  const supabase = await createTypedClient();
  return fetchPublishedStorefrontProduct(supabase, slug, new Date().toISOString());
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);

  if (!product) return { title: 'Producto no encontrado' };

  return {
    title: product.seo_title ?? product.name,
    description: product.seo_description ?? product.short_description,
    alternates: { canonical: `/producto/${product.slug}` },
    openGraph: {
      title: product.seo_title ?? product.name,
      description: product.seo_description ?? product.short_description,
      images: product.image_url ? [{ url: product.image_url, alt: product.image_alt }] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) notFound();

  const structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.short_description,
    image: product.image_url ? [product.image_url] : undefined,
    category: product.category_name,
    offers: {
      '@type': 'Offer',
      url: `https://crumafood.com.mx/producto/${product.slug}`,
      priceCurrency: product.currency,
      price: product.price.toFixed(2),
    },
  }).replace(/</g, '\\u003c');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
      <StorefrontProductDetail product={product} />
    </>
  );
}
