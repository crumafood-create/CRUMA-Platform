import { FlavorForm } from '@/app/(admin)/_components/flavor-form';

import { createFlavor } from '../actions';

export default async function NewFlavorPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Nuevo Sabor
      </h1>

      <FlavorForm
        action={createFlavor}
      />
    </main>
  );
}
