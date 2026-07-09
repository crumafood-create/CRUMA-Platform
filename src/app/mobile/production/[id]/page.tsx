import ProductionDetailClient from './production-detail-client';

export default async function Page({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  return (
    <ProductionDetailClient
      productionOrderId={id}
    />
  );
}
