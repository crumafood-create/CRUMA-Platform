import type { ReactNode }
from 'react';

interface Props {

  title: string;

  children: ReactNode;
}

export function MobileAdminCard({
  title,
  children
}: Props) {

  return (

    <div className="rounded-2xl border bg-white p-4">

      <h3 className="mb-4 font-semibold">

        {title}

      </h3>

      {children}

    </div>
  );
}
