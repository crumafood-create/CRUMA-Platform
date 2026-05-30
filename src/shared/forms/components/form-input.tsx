import type {
  InputHTMLAttributes
}
from 'react';

interface Props
extends InputHTMLAttributes<HTMLInputElement> {}

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
        focus:ring-2
        focus:ring-black
        ${className}
      `}
    />
  );
}
