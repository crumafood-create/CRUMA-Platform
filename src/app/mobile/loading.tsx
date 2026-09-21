import { PageSkeleton } from '@/shared/ui/feedback/page-skeleton';

export default function MobileLoading() {
  return <main className="p-4"><PageSkeleton label="Cargando tarea móvil" cards={3} /></main>;
}
