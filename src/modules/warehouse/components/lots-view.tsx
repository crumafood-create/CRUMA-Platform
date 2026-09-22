import { notFound } from 'next/navigation';
import { getLotById } from '../services/lots.service';

type LotsViewProps = {
  id?: string;
};

export async function LotsView({ id }: LotsViewProps) {
  // Si no hay ID, se renderiza la vista general/lista de lotes
  if (!id) {
    return (
      <main className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">Listado de Lotes</h1>
        {/* Componente o lista general de lotes */}
      </main>
    );
  }

  // Obtención de datos mediante la capa de servicio
  const lot = await getLotById(id);

  if (!lot) {
    notFound();
  }

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Trazabilidad</h1>
      <div className="rounded-2xl border p-6">
        <div>
          <span className="font-semibold">Lote:</span> {lot.lot_number}
        </div>
        <div className="mt-2">
          <span className="font-semibold">Cantidad:</span> {lot.quantity}
        </div>
        <div className="mt-2">
          <span className="font-semibold">Tipo:</span> {lot.type}
        </div>
      </div>
    </main>
  );
}