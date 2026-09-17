import Link from 'next/link';

export function BrandMark() {
  return (
    <Link
      href="/"
      aria-label="Crumafood, ir al inicio"
      className="inline-flex items-center gap-3 text-[#173b2f]"
    >
      <span className="grid size-10 place-items-center rounded-full bg-[#e85d32] text-sm font-black text-white shadow-sm">
        C
      </span>
      <span className="text-xl font-black tracking-[-0.04em]">
        CRUMA<span className="text-[#e85d32]">FOOD</span>
      </span>
    </Link>
  );
}
