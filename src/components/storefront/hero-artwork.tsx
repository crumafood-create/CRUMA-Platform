function Tequeno({ className }: { className: string }) {
  return <span className={`absolute h-10 w-40 rounded-full bg-[#f3b64c] shadow-lg ${className}`} />;
}

export function HeroArtwork() {
  return (
    <div
      role="img"
      aria-label="Ilustración de productos Crumafood para compartir"
      className="relative mx-auto aspect-square w-full max-w-lg overflow-hidden rounded-[3rem] bg-[#173b2f]"
    >
      <span className="absolute -right-16 -top-16 size-56 rounded-full bg-[#e85d32]" />
      <span className="absolute -bottom-20 -left-16 size-64 rounded-full bg-[#a8c686]" />
      <div className="absolute inset-[18%] rotate-[-8deg] rounded-full bg-[#fffaf2] shadow-2xl">
        <Tequeno className="left-[15%] top-[27%] rotate-[12deg]" />
        <Tequeno className="left-[22%] top-[43%] rotate-[-5deg]" />
        <Tequeno className="left-[18%] top-[59%] rotate-[8deg]" />
      </div>
      <span className="absolute bottom-7 right-7 rounded-full bg-white/95 px-5 py-3 text-sm font-black text-[#173b2f]">
        Hecho para disfrutar
      </span>
    </div>
  );
}
