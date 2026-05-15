import type { ReactNode } from 'react';

export default function StorefrontLayout({
  children
}: {
  children: ReactNode;
}) {

  return (

    <div>

      <header>
        Navbar
      </header>

      <main>
        {children}
      </main>

      <footer>
        Footer
      </footer>

    </div>
  );
}
