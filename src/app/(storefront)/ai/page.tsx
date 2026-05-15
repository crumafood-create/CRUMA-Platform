import { AiSearchBar }
from '@/domains/ai/components/ai-search-bar';

export default function AiSearchPage() {

  return (

    <main className="mx-auto max-w-4xl p-8">

      <div className="mb-8">

        <h1 className="text-4xl font-bold">

          AI Search

        </h1>

      </div>

      <AiSearchBar />

    </main>
  );
}
