import type {
  HTMLAttributes,
  ReactNode,
} from 'react';

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;

  variant?:
    | 'success'
    | 'secondary'
    | 'warning'
    | 'destructive'
    | 'outline';
}

export function Badge({
  children,
  variant,
  ...props
}: BadgeProps) {
  return (
    <span
      data-variant={variant}
      {...props}
    >
      {children}
    </span>
  );
}
