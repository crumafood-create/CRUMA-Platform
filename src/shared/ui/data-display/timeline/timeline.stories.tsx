import { Timeline } from './timeline'

export default {
  title: 'Data Display/Timeline',
  component: Timeline,
}

export const Default = {
  args: {
    items: [
      {
        id: '1',
        title: 'Pedido creado',
        description:
          'Pedido registrado por cliente',
        date: '10:00 AM',
      },
      {
        id: '2',
        title: 'Pago recibido',
        description:
          'Transferencia confirmada',
        date: '10:15 AM',
      },
      {
        id: '3',
        title: 'Producción iniciada',
        description:
          'Tequeños enviados a cocina',
        date: '11:00 AM',
      },
      {
        id: '4',
        title: 'Pedido entregado',
        description:
          'Entrega completada',
        date: '02:30 PM',
      },
    ],
  },
}
