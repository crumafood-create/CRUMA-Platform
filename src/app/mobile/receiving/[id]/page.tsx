import ReceivingDetailClient from './receiving-detail-client';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({
  params,
}: PageProps) {
  const { id } = await params;

  return (
    <ReceivingDetailClient
      purchaseOrderId={id}
    />
  );
}
