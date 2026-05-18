import { Suspense }
from 'react';

async function AnalyticsData() {

  await new Promise(resolve =>
    setTimeout(resolve, 3000)
  );

  return (
    <div>
      Analytics loaded
    </div>
  );
}

export default function Page() {

  return (

    <div>

      <Suspense
        fallback={
          <div>
            Loading charts...
          </div>
        }
      >

        <AnalyticsData />

      </Suspense>

    </div>
  );
}
