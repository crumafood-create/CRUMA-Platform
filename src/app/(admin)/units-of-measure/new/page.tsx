import { UnitOfMeasureForm } from '@/app/(admin)/_components/unit-of-measure-form';

import { createUnitOfMeasure } from '../actions';

export default function NewUnitPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Nueva Unidad
      </h1>

      <UnitOfMeasureForm
        action={createUnitOfMeasure}
      />
    </main>
  );
}
