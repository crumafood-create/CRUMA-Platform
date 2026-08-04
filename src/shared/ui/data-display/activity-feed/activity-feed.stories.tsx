import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ActivityFeed } from './activity-feed';

const meta = {
  title: 'Data Display/Activity Feed',
  component: ActivityFeed,
} satisfies Meta<typeof ActivityFeed>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      {
        id: '1',
        actor: 'Juan',
        action: 'creó el pedido',
        target: '#1001',
        timestamp: 'Hace 5 min',
      },
      {
        id: '2',
        actor: 'María',
        action: 'aprobó la compra',
        target: 'OC-201',
        timestamp: 'Hace 15 min',
      },
      {
        id: '3',
        actor: 'Sistema',
        action: 'actualizó inventario',
        target: 'Tequeños',
        timestamp: 'Hace 30 min',
      },
    ],
  },
};
