import { ReactNode } from 'react'

export type StatCardVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'

export interface StatCardProps {
  title: string

  value: string | number

  description?: string

  icon?: ReactNode

  variant?: StatCardVariant

  className?: string
}
