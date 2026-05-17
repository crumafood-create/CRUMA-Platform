import type { ReactNode }
from 'react';

interface Props {

  children: ReactNode;
}

export function DataTable({
  children
}: Props) {

  return (

    <div className="overflow-x-auto rounded-2xl border bg-white">

      <table className="w-full">

        {children}

      </table>

    </div>
  );
}
