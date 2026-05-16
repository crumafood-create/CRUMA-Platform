import type { Campaign }
from '../types/campaign.type';

interface Props {

  campaigns: Campaign[];
}

export function CampaignsTable({
  campaigns
}: Props) {

  return (

    <div className="overflow-hidden rounded-2xl border">

      <table className="w-full">

        <thead className="border-b bg-gray-50">

          <tr>

            <th className="p-4 text-left">

              Campaña

            </th>

            <th className="p-4 text-left">

              Canal

            </th>

            <th className="p-4 text-left">

              Estado

            </th>

            <th className="p-4 text-left">

              Enviados

            </th>

          </tr>

        </thead>

        <tbody>

          {campaigns.map(campaign => (

            <tr
              key={campaign.id}
              className="border-b"
            >

              <td className="p-4">

                {campaign.name}

              </td>

              <td className="p-4">

                {campaign.channel}

              </td>

              <td className="p-4">

                {campaign.status}

              </td>

              <td className="p-4">

                {campaign.sent_count}

              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}

