import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  children,
  ...props
}: Props) {
  return (
    <button {...props}>
      {children}
    </button>
  );
}








