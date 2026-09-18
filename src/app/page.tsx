import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="demo-home">
      <section className="demo-home__panel" aria-labelledby="demo-title">
        <p className="demo-home__eyebrow">Crumafood Platform</p>
        <h1 id="demo-title">Modo demostración local</h1>
        <p>
          La interfaz está disponible sin Docker ni conexión a Supabase.
          Las funciones que necesitan datos reales permanecen desactivadas.
        </p>
        <Link className="demo-home__link" href="/login">
          Ir al inicio de sesión
        </Link>
      </section>
    </main>
  );
}