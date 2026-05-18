import type { ReactNode }
from 'react';

interface Props {

  children: ReactNode;
}

export function PageContainer({
  children
}: Props) {

  return (

    <main className="space-y-8 p-6">

      {children}

    </main>
  );
}
