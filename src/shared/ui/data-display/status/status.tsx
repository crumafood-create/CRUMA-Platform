import { cn } from '@/lib/utils'

import {
  StatusProps,
  StatusVariant,
} from './status.types'

const variants: Record<StatusVariant, string> = {
  active:
    'bg-green-100 text-green-700 border-green-200',

  inactive:
    'bg-slate-100 text-slate-600 border-slate-200',

  pending:
    'bg-yellow-100 text-yellow-700 border-yellow-200',

  approved:
    'bg-emerald-100 text-emerald-700 border-emerald-200',

  rejected:
    'bg-red-100 text-red-700 border-red-200',

  success:
    'bg-green-100 text-green-700 border-green-200',

  warning:
    'bg-orange-100 text-orange-700 border-orange-200',

  danger:
    'bg-red-100 text-red-700 border-red-200',

  info:
    'bg-blue-100 text-blue-700 border-blue-200',
}

const dots: Record<StatusVariant, string> = {
  active: 'bg-green-500',
  inactive: 'bg-slate-400',
  pending: 'bg-yellow-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
  success: 'bg-green-500',
  warning: 'bg-orange-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
}

export function Status({
  label,
  variant = 'info',
  dot = true,
  className,
}: StatusProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            dots[variant]
          )}
        />
      )}

      {label}
    </span>
  )
}
