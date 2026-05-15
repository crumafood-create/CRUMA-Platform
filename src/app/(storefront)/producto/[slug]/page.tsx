import { notFound }
from 'next/navigation';

import { fetchProduct }
from '@/domains/catalog/services/catalog.service';

interface Props {

  params: Promise<{
    slug: string;
  }>;
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

      <main>

        <h1>
          {product.name}
        </h1>

      </main>
    );

  } catch {

    notFound();
  }
}
