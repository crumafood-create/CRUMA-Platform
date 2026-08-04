import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Package } from 'lucide-react';

import { DataList } from './data-list';

const meta = {
  title: 'Data Display/Data List',
  component: DataList,
} satisfies Meta<typeof DataList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      {
        id: '1',
        title: 'Tequeños Tradicionales',
        description: 'Producto agregado al catálogo',
        metadata: 'Hace 5 min',
        icon: <Package />,
      },
      {
        id: '2',
        title: 'Empanadas de Queso',
        description: 'Inventario actualizado',
        metadata: 'Hace 15 min',
        icon: <Package />,
      },
    ],
  },
};
