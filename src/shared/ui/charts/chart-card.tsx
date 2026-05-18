import type { ReactNode }
from 'react';

interface Props {

  title: string;

  children: ReactNode;
}

export function ChartCard({

  title,
  children

}: Props) {

  return (

    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <h3 className="mb-6 text-lg font-semibold">

        {title}

      </h3>

      {children}

    </div>
  );
}
