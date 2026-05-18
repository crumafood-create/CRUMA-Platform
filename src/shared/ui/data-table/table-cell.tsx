import type { ReactNode }
from 'react';

interface Props {

  children: ReactNode;

  head?: boolean;
}

export function TableCell({
  children,
  head = false
}: Props) {

  if (head) {

    return (

      <th className="p-4 text-left font-medium">

        {children}

      </th>
    );
  }

  return (

    <td className="p-4">

      {children}

    </td>
  );
}
