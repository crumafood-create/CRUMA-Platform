interface Props {

  label: string;

  variant?:
    | 'success'
    | 'warning'
    | 'danger'
    | 'info';
}

export function StatusBadge({

  label,
  variant = 'info'

}: Props) {

  const variants = {

    success:
      'bg-green-100 text-green-700',

    warning:
      'bg-yellow-100 text-yellow-700',

    danger:
      'bg-red-100 text-red-700',

    info:
      'bg-blue-100 text-blue-700'
  };

  return (

    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${variants[variant]}`}
    >

      {label}

    </span>
  );
}
