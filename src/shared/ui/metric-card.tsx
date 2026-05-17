import type { ReactNode }
from 'react';

interface Props {

  title: string;

  value: string | number;

  icon?: ReactNode;

  description?: string;
}

export function MetricCard({

  title,
  value,
  icon,
  description

}: Props) {

  return (

    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-gray-500">

            {title}

          </p>

          <h3 className="mt-2 text-3xl font-bold">

            {value}

          </h3>

          {description && (

            <p className="mt-2 text-sm text-gray-400">

              {description}

            </p>
          )}

        </div>

        {icon}

      </div>

    </div>
  );
}
