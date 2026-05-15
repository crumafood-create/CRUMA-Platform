import Image
from 'next/image';

interface Props {

  src: string | null;

  alt: string;
}

export function ProductImage({
  src,
  alt
}: Props) {

  return (

    <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">

      <Image
        src={
          src ||
          '/placeholder-product.jpg'
        }
        alt={alt}
        fill
        className="object-cover"
      />

    </div>
  );
}
