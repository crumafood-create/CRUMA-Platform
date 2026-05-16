import type { ReactNode }
from 'react';

interface Props {

  children: ReactNode;
}

export function Badge({
  children
}: Props) {

  return (

    <span className="rounded-full border px-3 py-1 text-sm">

      {children}

    </span>
  );
}
