import { fetchCampaigns }
from '@/domains/marketing/services/marketing.service';

import { CampaignsTable }
from '@/domains/marketing/components/campaigns-table';

export default async function MarketingPage() {

  const campaigns =
    await fetchCampaigns();

  return (

    <main className="space-y-6">

      <div>

        <h1 className="text-4xl font-bold">

          Marketing

        </h1>

      </div>

      <CampaignsTable
        campaigns={campaigns}
      />

    </main>
  );
}
