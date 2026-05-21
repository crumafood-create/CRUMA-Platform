import type { ReactNode }
from 'react';

interface Props {

  children: ReactNode;
}

export function Container({
  children
}: Props) {

  return (

    <div className="mx-auto max-w-7xl px-4">

      {children}

    </div>
  );
}
