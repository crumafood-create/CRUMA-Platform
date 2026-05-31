interface Props {
  children?: React.ReactNode;
}

export function TableToolbar({
  children,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      {children}
    </div>
  );
}
