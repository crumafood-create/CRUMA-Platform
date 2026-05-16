import type { KPI }
from '../types/kpi.type';

interface Props {

  kpi: KPI;
}

export function KPICard({
  kpi
}: Props) {

  return (

    <div className="rounded-2xl border bg-white p-6">

      <p className="text-sm text-gray-500">

        {kpi.title}

      </p>

      <h3 className="mt-2 text-3xl font-bold">

        {kpi.value}

      </h3>

      <p className="mt-2 text-sm">

        {kpi.change_percentage}%

      </p>

    </div>
  );
}
