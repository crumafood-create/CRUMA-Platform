import type {
  ButtonHTMLAttributes,
  ReactNode,
} from 'react';

export type ButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?:
      | 'default'
      | 'ghost'
      | 'outline'
      | 'secondary'
      | 'destructive';

    size?:
      | 'default'
      | 'sm'
      | 'lg'
      | 'icon';

    children?: ReactNode;
  };

export function Button({
  children,
  variant,
  size,
  ...props
}: ButtonProps) {
  return (
    <button
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
