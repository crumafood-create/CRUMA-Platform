import PickingDetailClient from './picking-detail-client';

export default async function Page({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  return (
    <PickingDetailClient
      pickingId={id}
    />
  );
}
