interface DashboardCardProps {
  title: string;
  value: string | number;
  description?: string;
}

export function DashboardCard({
  title,
  value,
  description,
}: DashboardCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="text-sm font-medium text-gray-500">
        {title}
      </div>

      <div className="mt-2 text-3xl font-bold">
        {value}
      </div>

      {description ? (
        <div className="mt-2 text-sm text-gray-500">
          {description}
        </div>
      ) : null}
    </div>
  );
}
