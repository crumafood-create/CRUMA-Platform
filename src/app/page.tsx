import { ExecutiveThreadList } from '@/components/executive-thread/executive-thread-list';

import { getExecutiveThread } from '@/core/executive-thread/thread-service';

export default function HomePage() {
  const items = getExecutiveThread();

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">
        Centro de Mando
      </h1>

      <ExecutiveThreadList items={items} />
    </main>
  );
}
