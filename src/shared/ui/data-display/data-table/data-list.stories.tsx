import { Package } from 'lucide-react'

import { DataList } from './data-list'

export default {
  title: 'Data Display/Data List',
  component: DataList,
}

export const Default = {
  args: {
    items: [
      {
        id: '1',
        title: 'Tequeños Tradicionales',
        description:
          'Producto agregado al catálogo',
        metadata: 'Hace 5 min',
        icon: <Package />,
      },
      {
        id: '2',
        title: 'Empanadas de Queso',
        description:
          'Inventario actualizado',
        metadata: 'Hace 15 min',
        icon: <Package />,
      },
    ],
  },
}
