import { cn } from '@/lib/utils'

import {
  StatCardProps,
  StatCardVariant,
} from './stat-card.types'

const variants: Record<StatCardVariant, string> = {
  default:
    'border-border',

  success:
    'border-green-500/20 bg-green-500/5',

  warning:
    'border-yellow-500/20 bg-yellow-500/5',

  danger:
    'border-red-500/20 bg-red-500/5',

  info:
    'border-blue-500/20 bg-blue-500/5',
}

export function StatCard({
  title,
  value,
  description,
  icon,
  variant = 'default',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-5',
        variants[variant],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-bold">
            {value}
          </h3>

          {description && (
            <p className="mt-2 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
