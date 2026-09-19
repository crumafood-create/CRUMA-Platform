import type {
  SelectHTMLAttributes
}
from 'react';

interface Props
extends SelectHTMLAttributes<HTMLSelectElement> {}

export function FormSelect({
  className = '',
  ...props
}: Props) {

  return (

    <select
      {...props}
      className={`
        w-full
        rounded-xl
        border
        px-4
        py-3
        outline-none
        transition
        focus-visible:ring-2
        focus-visible:ring-brand-blue
        ${className}
      `}
    />
  );
}
