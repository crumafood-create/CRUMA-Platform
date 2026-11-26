'use client';

import { useState } from 'react';

import {
  releaseFinishedProductQualityToInventory,
} from '@/app/(admin)/lots/actions';

type Option = {
  id: string;
  label: string;
};

type StorageLocationOption = Option & {
  name: string;
  locationUse: string | null;
  storageCondition: string | null;
};

type InspectionOption = Option & {
  quantity: number;
  isIntermediateMass: boolean;
};

type Props = {
  inspections: InspectionOption[];
  warehouses: Option[];
  locations: StorageLocationOption[];
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
  const [selectedInspectionId, setSelectedInspectionId] =
    useState(initialInspectionId);
  const [selectedLocationId, setSelectedLocationId] =
    useState('');
  const selectedInspection = inspections.find(
    (inspection) => inspection.id === selectedInspectionId,
  );
  const compatibleLocations = locations.filter((location) => {
    if (!selectedInspection) return false;
    if (selectedInspection.isIntermediateMass) {
      return location.locationUse === 'prepared_ingredient'
        && location.storageCondition === 'refrigerated';
    }
    return location.locationUse === 'finished_product'
      && ['refrigerated', 'frozen'].includes(
        location.storageCondition ?? '',
      );
  });

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
          value={selectedInspectionId}
          onChange={(event) => {
            setSelectedInspectionId(event.target.value);
            setSelectedLocationId('');
          }}
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
              {inspection.quantity}{' '}
              {inspection.isIntermediateMass ? 'kg' : 'unidades'}
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
          Destino inicial del lote

          <select
            name="inventory_location_id"
            value={selectedLocationId}
            onChange={(event) => setSelectedLocationId(event.target.value)}
            required
            className={
              'mt-1 block w-full rounded ' +
              'border px-3 py-2'
            }
          >
            <option value="">
              {selectedInspection?.isIntermediateMass
                ? 'Selecciona semielaborados refrigerados'
                : 'Selecciona espera refrigerada o congelación directa'}
            </option>

            {compatibleLocations.map((location) => (
              <option
                key={location.id}
                value={location.id}
              >
                {selectedInspection?.isIntermediateMass
                  ? `${location.name} · Semielaborado refrigerado`
                  : location.label}
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

      <p className="text-sm text-gray-600">
        {!selectedInspection
          ? 'Selecciona una inspección para mostrar los destinos compatibles con la salida.'
          : selectedInspection.isIntermediateMass
          ? 'La masa intermedia conserva su peso en kg y se libera en una ubicación refrigerada de semielaborados.'
          : 'La espera refrigerada queda apartada de reservas y picking. La congelación directa inicia el proceso al liberar. En ambos casos, el producto estará disponible como congelado solo al confirmar que terminó.'}
      </p>
      {selectedInspection && !compatibleLocations.length && (
        <p role="alert" className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
          {selectedInspection.isIntermediateMass
            ? 'El administrador debe configurar una ubicación refrigerada para semielaborados en Ubicaciones.'
            : 'El administrador debe clasificar la espera refrigerada de producto terminado y el congelador en Ubicaciones.'}
        </p>
      )}

      <button
        type="submit"
        disabled={!selectedInspection || !compatibleLocations.length}
        className="rounded border px-4 py-2"
      >
        {selectedInspection?.isIntermediateMass
          ? 'Liberar masa a inventario'
          : 'Liberar producto a inventario'}
      </button>
    </form>
  );
}
