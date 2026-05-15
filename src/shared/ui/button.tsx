import { cva }
from 'class-variance-authority';

import { cn }
from '@/lib/utils';

import type {
  ButtonHTMLAttributes
} from 'react';

const buttonVariants = cva(

  'inline-flex items-center justify-center rounded-xl transition-all',

  {

    variants: {

      variant: {

        default:
          'bg-black text-white hover:opacity-90',

        outline:
          'border border-border bg-white hover:bg-gray-100'
      },

      size: {

        default:
          'h-11 px-5',

        sm:
          'h-9 px-3 text-sm',

        lg:
          'h-12 px-8'
      }
    },

    defaultVariants: {

      variant: 'default',

      size: 'default'
    }
  }
);

interface Props
extends ButtonHTMLAttributes<HTMLButtonElement> {

  variant?: 'default' | 'outline';

  size?: 'default' | 'sm' | 'lg';
}

export function Button({
  className,
  variant,
  size,
  ...props
}: Props) {

  return (

    <button
      className={cn(
        buttonVariants({
          variant,
          size
        }),
        className
      )}
      {...props}
    />
  );
}
