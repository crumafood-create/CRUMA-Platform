import type { ButtonHTMLAttributes }
from 'react';

interface Props
extends ButtonHTMLAttributes<HTMLButtonElement> {}

export function Button({
  className = '',
  ...props
}: Props) {

  return (

    <button
      {...props}
      className={`
        rounded-xl
        bg-black
        px-4
        py-2
        text-white
        transition
        hover:opacity-90
        disabled:opacity-50
        ${className}
      `}
    />
  );
}
