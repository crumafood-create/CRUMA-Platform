'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
}
from 'recharts';

interface Props {

  data: any[];
}

export function SalesChart({
  data
}: Props) {

  return (

    <div className="h-[400px] rounded-2xl border bg-white p-6">

      <ResponsiveContainer
        width="100%"
        height="100%"
      >

        <LineChart data={data}>

          <XAxis dataKey="day" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="revenue"
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  );
}
