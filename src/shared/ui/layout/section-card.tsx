import type { ReactNode }
from 'react';

interface Props {

  title?: string;

  children: ReactNode;
}

export function SectionCard({

  title,
  children

}: Props) {

  return (

    <section className="rounded-2xl border bg-white p-6 shadow-sm">

      {title && (

        <h2 className="mb-6 text-xl font-semibold">

          {title}

        </h2>
      )}

      {children}

    </section>
  );
}
