import type { ReactNode }
from 'react';

interface Props {

  children: ReactNode;
}

export function FiltersBar({
  children
}: Props) {

  return (

    <div className="flex flex-wrap gap-4 rounded-2xl border bg-white p-4">

      {children}

    </div>
  );
}
