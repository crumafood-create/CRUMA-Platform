import { cn }
from '@/lib/utils';

import type {
  InputHTMLAttributes
} from 'react';

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {

  return (

    <input

      className={cn(

        'flex h-11 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none',

        className
      )}

      {...props}
    />
  );
}
