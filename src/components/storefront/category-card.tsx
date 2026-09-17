import Link from 'next/link';

import type { StorefrontCategory } from '@/modules/storefront/application/storefront-content';

export function CategoryCard({
  category,
  index,
}: {
  category: StorefrontCategory;
  index: number;
}) {
  return (
    <article id={category.slug} className="group flex min-h-80 scroll-mt-28 flex-col rounded-[2rem] border border-[#173b2f]/10 bg-white p-7 shadow-[0_18px_60px_rgba(23,59,47,0.08)]">
      <div className="mb-8 flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-[#e85d32]">
          {category.eyebrow}
        </span>
        <span className="text-4xl font-black text-[#173b2f]/10">0{index + 1}</span>
      </div>
      <h2 className="text-3xl font-black tracking-[-0.04em]">{category.name}</h2>
      <p className="mt-3 leading-7 text-[#567268]">{category.description}</p>
      <ul aria-label={`Presentaciones de ${category.name}`} className="mt-6 flex flex-wrap gap-2">
        {category.formats.map((format) => (
          <li key={format} className="rounded-full bg-[#f2e8d8] px-3 py-1 text-xs font-bold">{format}</li>
        ))}
      </ul>
      <Link href={category.href} className="mt-auto pt-8 text-sm font-black text-[#e85d32]">
        Conocer esta línea <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
