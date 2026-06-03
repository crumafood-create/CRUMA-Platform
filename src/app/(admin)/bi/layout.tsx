import type { ReactNode }
from 'react';

interface Props {

  children: ReactNode;
}

export default function Layout({
  children
}: Props) {

  return (

    <div className="space-y-6">

      {children}

    </div>
  );
}
