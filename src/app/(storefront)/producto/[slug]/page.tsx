import type { Metadata }
from 'next';

import { notFound }
from 'next/navigation';

import { AddToCartButton }
from '@/domains/cart/components/add-to-cart-button';

import { fetchProduct }
from '@/domains/catalog/services/catalog.service';

import { ProductImage }
from '@/domains/catalog/components/product-image';

import { ProductPrice }
from '@/domains/catalog/components/product-price';

import { PageContainer }
from '@/shared/layouts/page-container';

import { RecommendedProducts }
from '@/domains/ai/components/recommended-products';

interface Props {

  params: Promise<{
    slug: string;
  }>;
}
export async function generateMetadata({
  params
}: Props): Promise<Metadata> {

  const { slug } = await params;

  const product = await fetchProduct(
    slug
  );

  return {

    title: product.name,

    description:
      product.description || undefined

    <RecommendedProducts
  title="También te puede interesar"
/>
  };
}

export default async function ProductPage({
  params
}: Props) {

  const { slug } = await params;

  try {

    const product = await fetchProduct(
      slug
    );

    return (

      <PageContainer>

        <div className="grid gap-10 lg:grid-cols-2">

          <ProductImage
            src={product.image_url}
            alt={product.name}
          />

          <div className="space-y-6">

            <h1 className="text-4xl font-bold">

              {product.name}

            </h1>

            <p className="text-lg text-gray-600">

              {product.description}

            </p>

            <ProductPrice
              retailPrice={product.retail_price}
              wholesalePrice={product.wholesale_price}
            />

          </div>

        </div>

      </PageContainer>
    );

  } catch {

    notFound();
  }
}
