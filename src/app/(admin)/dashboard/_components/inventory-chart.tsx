'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  products: number;
  materials: number;
}

export function InventoryChart({
  products,
  materials,
}: Props) {
  const data = [
    {
      name: 'Productos',
      value: products,
    },
    {
      name: 'Materias',
      value: materials,
    },
  ];

  return (
    <div className="rounded-2xl border bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold">
        Inventario
      </h2>

      <div className="h-80">
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="name" />

            <YAxis />

            <Tooltip />

            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
