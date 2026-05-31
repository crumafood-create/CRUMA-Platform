import type { ReactNode }
from 'react';

interface Props {

  children: ReactNode;
}

export function FormLabel({
  children
}: Props) {

  return (

    <label className="mb-2 block text-sm font-medium">

      {children}

    </label>
  );
}
