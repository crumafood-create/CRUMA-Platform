interface Props {
  children?: React.ReactNode;
}

export function TableActions({
  children,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      {children}
    </div>
  );
}
