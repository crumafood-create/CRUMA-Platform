import type {
  TextareaHTMLAttributes
}
from 'react';

interface Props
extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function FormTextarea({
  className = '',
  ...props
}: Props) {

  return (

    <textarea
      {...props}
      className={`
        min-h-[120px]
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
