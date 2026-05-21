import type { ReactNode }
from 'react';

interface Props {

  children: ReactNode;
}

export function ResponsiveTableWrapper({
  children
}: Props) {

  return (

    <div className="overflow-x-auto">

      {children}

    </div>
  );
}
