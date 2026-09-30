import {
  releaseFinishedProductQualityToInventory,
} from '@/app/(admin)/lots/actions';

type Option = {
  id: string;
  label: string;
};

type InspectionOption = Option & {
  quantity: number;
};

type Props = {
  inspections: InspectionOption[];
  warehouses: Option[];
  locations: Option[];
  initialInspectionId: string;
  idempotencyKey: string;
};

export function ProductionLotReleaseForm({
  inspections,
  warehouses,
  locations,
  initialInspectionId,
  idempotencyKey,
}: Props) {
  return (
    <form
      action={
        releaseFinishedProductQualityToInventory
      }
      className={
        'space-y-5 rounded-2xl border p-6'
      }
    >
      <label className="block text-sm">
        Inspección aprobada

        <select
          name="quality_inspection_id"
          defaultValue={initialInspectionId}
          required
          className={
            'mt-1 block w-full rounded ' +
            'border px-3 py-2'
          }
        >
          <option value="">
            Selecciona una inspección
          </option>

          {inspections.map((inspection) => (
            <option
              key={inspection.id}
              value={inspection.id}
            >
              {inspection.label}
              {' · '}
              {inspection.quantity} unidades
            </option>
          ))}
        </select>
      </label>

      <input
        type="hidden"
        name="idempotency_key"
        value={idempotencyKey}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          Número de lote

          <input
            name="lot_number"
            required
            maxLength={40}
            className={
              'mt-1 block w-full rounded ' +
              'border px-3 py-2'
            }
          />
        </label>

        <label className="text-sm">
          Fecha de caducidad

          <input
            name="expiration_date"
            type="date"
            required
            className={
              'mt-1 block w-full rounded ' +
              'border px-3 py-2'
            }
          />
        </label>

        <label className="text-sm">
          Almacén

          <select
            name="warehouse_id"
            required
            className={
              'mt-1 block w-full rounded ' +
              'border px-3 py-2'
            }
          >
            <option value="">
              Selecciona un almacén
            </option>

            {warehouses.map((warehouse) => (
              <option
                key={warehouse.id}
                value={warehouse.id}
              >
                {warehouse.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Ubicación

          <select
            name="inventory_location_id"
            required
            className={
              'mt-1 block w-full rounded ' +
              'border px-3 py-2'
            }
          >
            <option value="">
              Selecciona una ubicación
            </option>

            {locations.map((location) => (
              <option
                key={location.id}
                value={location.id}
              >
                {location.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm">
        Observaciones

        <textarea
          name="reason"
          className={
            'mt-1 block w-full rounded ' +
            'border px-3 py-2'
          }
        />
      </label>

      <button
        type="submit"
        className="rounded border px-4 py-2"
      >
        Liberar producto a inventario
      </button>
    </form>
  );
}