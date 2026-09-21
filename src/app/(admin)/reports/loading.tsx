import { PageSkeleton } from '@/shared/ui/feedback/page-skeleton';

export default function ReportsLoading() {
  return <PageSkeleton label="Cargando reporte ejecutivo" cards={6} />;
}
