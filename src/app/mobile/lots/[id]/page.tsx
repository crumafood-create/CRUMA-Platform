import { LotsView } from '@/modules/warehouse';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LotPage({ params }: Props) {
  const { id } = await params;
  return <LotsView id={id} />;
}
