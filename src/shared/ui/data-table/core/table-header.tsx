interface Props {
  title?: string;
}

export function TableHeader({
  title,
}: Props) {
  return (
    <div className="flex items-center justify-between py-4">
      <h3 className="font-medium">
        {title}
      </h3>
    </div>
  );
}
