import type { ReactNode }
from 'react';

interface Props {

  children: ReactNode;
}

export function TableHeader({
  children
}: Props) {

  return (

    <thead className="border-b bg-gray-50">

      {children}

    </thead>
  );
}
