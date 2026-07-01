'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  draft: number;
  progress: number;
  completed: number;
}

export function ProductionChart({
  draft,
  progress,
  completed,
}: Props) {
  const data = [
    {
      name: 'Borrador',
      value: draft,
    },
    {
      name: 'Producción',
      value: progress,
    },
    {
      name: 'Completadas',
      value: completed,
    },
  ];

  return (
    <div className="rounded-2xl border bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold">
        Producción
      </h2>

      <div className="h-80">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
            >
              <Cell />
              <Cell />
              <Cell />
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
