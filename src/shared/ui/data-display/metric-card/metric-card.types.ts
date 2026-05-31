import { ReactNode } from 'react'

export interface MetricCardProps {
  title: string

  value: string | number

  subtitle?: string

  icon?: ReactNode

  trend?: {
    value: number
    label?: string
  }

  loading?: boolean

  className?: string
}
