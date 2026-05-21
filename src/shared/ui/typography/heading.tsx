import type { ReactNode }
from 'react';

interface Props {

  children: ReactNode;
}

export function Heading({
  children
}: Props) {

  return (

    <h1 className="text-4xl font-bold tracking-tight">

      {children}

    </h1>
  );
}
