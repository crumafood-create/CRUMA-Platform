tsx
import type { ReactNode }
from 'react';

interface Props {

  children: ReactNode;

  className?: string;
}

export function Card({
  children,
  className = ''
}: Props) {

  return (

    <div
      className={`
        rounded-2xl
        border
        bg-white
        p-6
        shadow-sm
        ${className}
      `}
    >

      {children}

    </div>
  );
}
