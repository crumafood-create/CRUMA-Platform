import type { ReactNode }
from 'react';

interface Props {

  children: ReactNode;
}

export function TableRow({
  children
}: Props) {

  return (

    <tr className="border-b">

      {children}

    </tr>
  );
}
