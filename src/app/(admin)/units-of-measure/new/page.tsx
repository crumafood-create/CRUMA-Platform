import { UnitOfMeasureForm }
from '@/app/(admin)/_components/unit-of-measure-form';

import { createUnitOfMeasure }
from '../actions';

export default function NewUnitOfMeasurePage() {
  return (
    <main className="space-y-6">
      <div>
        <a
          href="/units-of-measure"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          ← Volver a Unidades de Medida
        </a>

        <h1 className="mt-2 text-4xl font-bold">
          Nueva Unidad de Medida
        </h1>
      </div>

      <UnitOfMeasureForm
        action={createUnitOfMeasure}
      />
    </main>
  );
}
