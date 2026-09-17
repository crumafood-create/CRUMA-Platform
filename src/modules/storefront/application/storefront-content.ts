export type StorefrontCategory = {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  formats: readonly string[];
  href: string;
};

export type StorefrontPromise = {
  title: string;
  description: string;
};

export const storefrontCategories: readonly StorefrontCategory[] = [
  {
    slug: 'tequenos',
    name: 'Tequeños',
    eyebrow: 'El favorito para compartir',
    description: 'Palitos de queso envueltos en una masa suave, listos para llevar a tu mesa o negocio.',
    formats: ['Frescos', 'Congelados', 'Precocidos'],
    href: '/catalogo#tequenos',
  },
  {
    slug: 'empanadas',
    name: 'Empanadas',
    eyebrow: 'Sabor que reúne',
    description: 'Opciones prácticas y versátiles para comidas, reuniones y servicio de alimentos.',
    formats: ['Frescas', 'Congeladas', 'Para eventos'],
    href: '/catalogo#empanadas',
  },
  {
    slug: 'discos',
    name: 'Discos',
    eyebrow: 'Tu receta empieza aquí',
    description: 'Tapas uniformes y fáciles de trabajar para preparar empanadas con tu propio sello.',
    formats: ['Refrigerados', 'Congelados', 'Food service'],
    href: '/catalogo#discos',
  },
  {
    slug: 'masas',
    name: 'Masas',
    eyebrow: 'Consistencia en cada preparación',
    description: 'Bases prácticas para cocinas que buscan ahorrar tiempo sin renunciar al resultado.',
    formats: ['Porcionadas', 'Congeladas', 'Mayoreo'],
    href: '/catalogo#masas',
  },
];

export const storefrontPromises: readonly StorefrontPromise[] = [
  {
    title: 'Para compartir',
    description: 'Formatos prácticos para tu casa, reuniones y celebraciones.',
  },
  {
    title: 'Para tu negocio',
    description: 'Atención a restaurantes, cafeterías, tiendas y distribuidores.',
  },
  {
    title: 'Hecho en Toluca',
    description: 'Elaboración cercana con procesos pensados para conservar calidad.',
  },
];
