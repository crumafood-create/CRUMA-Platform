import { Status } from './status'

export default {
  title: 'Data Display/Status',
  component: Status,
}

export const Active = {
  args: {
    label: 'Activo',
    variant: 'active',
  },
}

export const Pending = {
  args: {
    label: 'Pendiente',
    variant: 'pending',
  },
}

export const Approved = {
  args: {
    label: 'Aprobado',
    variant: 'approved',
  },
}

export const Rejected = {
  args: {
    label: 'Rechazado',
    variant: 'rejected',
  },
}

export const Success = {
  args: {
    label: 'Completado',
    variant: 'success',
  },
}

export const Danger = {
  args: {
    label: 'Cancelado',
    variant: 'danger',
  },
}
