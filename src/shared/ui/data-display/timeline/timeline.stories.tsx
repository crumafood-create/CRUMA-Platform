import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Timeline } from './timeline';

const meta = {
  title: 'Data Display/Timeline',
  component: Timeline,
} satisfies Meta<typeof Timeline>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      {
        id: '1',
        title: 'Pedido creado',
        description: 'Pedido registrado por cliente',
        date: '10:00 AM',
      },
      {
        id: '2',
        title: 'Pago recibido',
        description: 'Transferencia confirmada',
        date: '10:15 AM',
      },
      {
        id: '3',
        title: 'Producción iniciada',
        description: 'Tequeños enviados a cocina',
        date: '11:00 AM',
      },
      {
        id: '4',
        title: 'Pedido entregado',
        description: 'Entrega completada',
        date: '02:30 PM',
      },
    ],
  },
};
