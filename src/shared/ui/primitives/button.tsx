import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '@/shared/ui/utils/cn';

export type ButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?:
      | 'default'
      | 'primary'
      | 'ghost'
      | 'outline'
      | 'secondary'
      | 'destructive'
      | 'dark';

    size?:
      | 'default'
      | 'md'
      | 'sm'
      | 'lg'
      | 'icon';
    fullWidth?: boolean;
  };

const variants = {
  default: 'bg-brand-blue text-white hover:bg-brand-blue/90',
  primary: 'bg-brand-blue text-white hover:bg-brand-blue/90',
  secondary: 'bg-brand-sand text-brand-black hover:bg-brand-sand/90',
  outline:
    'border-2 border-brand-blue bg-transparent text-brand-blue hover:bg-brand-blue hover:text-white',
  ghost: 'bg-transparent text-brand-black hover:bg-brand-gray-25/50',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  dark: 'bg-brand-black text-white hover:bg-brand-gray-75',
} satisfies Record<NonNullable<ButtonProps['variant']>, string>;

const sizes = {
  default: 'min-h-11 px-5 py-2.5 text-sm',
  md: 'min-h-11 px-5 py-2.5 text-sm',
  sm: 'min-h-9 px-3 py-1.5 text-xs',
  lg: 'min-h-12 px-7 py-3 text-base',
  icon: 'size-11 p-0',
} satisfies Record<NonNullable<ButtonProps['size']>, string>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = 'default',
      size = 'default',
      fullWidth = false,
      type = 'button',
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      />
    );
  },
);

// Alias para garantizar compatibilidad legacy en pruebas
export const LegacyButton = Button;

export default Button;