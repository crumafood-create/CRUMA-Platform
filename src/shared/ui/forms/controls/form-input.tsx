import type {
  InputHTMLAttributes
}
from 'react';

type Props = InputHTMLAttributes<HTMLInputElement>

export function FormInput({
  className = '',
  ...props
}: Props) {

  return (

    <input
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
