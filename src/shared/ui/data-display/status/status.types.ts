export type StatusVariant =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'

export interface StatusProps {
  label: string

  variant?: StatusVariant

  dot?: boolean

  className?: string
}
