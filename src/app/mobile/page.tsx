import Link from 'next/link';

export default function MobilePage() {
  const tasks = [
    { href: '/mobile/receiving', eyebrow: 'Abastecimiento', title: 'Recibir mercancía', description: 'Consulta órdenes pendientes y registra cantidades recibidas.', icon: '📦' },
    { href: '/mobile/production', eyebrow: 'Planta', title: 'Ejecutar producción', description: 'Revisa órdenes, consumos y avance desde la estación.', icon: '🏭' },
    { href: '/mobile/picking', eyebrow: 'Almacén', title: 'Preparar pedidos', description: 'Sigue FEFO y confirma lotes antes de la salida.', icon: '🚚' },
    { href: '/mobile/scan', eyebrow: 'Consulta', title: 'Escanear código', description: 'Identifica rápidamente un lote o recurso.', icon: '▦' },
  ] as const;
  return (
    <main className="space-y-6 p-4 sm:p-6">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-blue">Turno operativo</p>
        <h1 className="mt-2 text-3xl font-black">¿Qué tarea realizarás?</h1>
        <p className="mt-2 text-sm leading-6 text-brand-gray-75">Elige una tarea. Cada confirmación queda registrada en el sistema.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {tasks.map((task) => <Link key={task.href} href={task.href} className="group min-h-44 rounded-3xl border border-brand-gray-25 bg-white p-5 shadow-sm transition hover:border-brand-blue hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"><div aria-hidden="true" className="text-3xl">{task.icon}</div><p className="mt-5 text-xs font-black uppercase tracking-wider text-brand-blue">{task.eyebrow}</p><h2 className="mt-1 text-xl font-black">{task.title}</h2><p className="mt-2 text-sm leading-5 text-brand-gray-75">{task.description}</p><span className="mt-4 inline-block font-black text-brand-blue">Abrir →</span></Link>)}
      </div>
    </main>
  );
}
