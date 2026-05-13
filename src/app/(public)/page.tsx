import { createClient } from '@/infrastructure/supabase/server';
import { ProductCard } from '@/domains/catalog/components/ProductCard';

export default async function HomePage() {
  const supabase = await createClient();
  
  // 1. Obtener sesión y perfil en una sola pasada de servidor
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user 
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null };

  // 2. Traer productos
  const { data: products } = await supabase.from('products').select('*');

  return (
    <main className="container mx-auto px-4 py-12">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-[#4A3F35] mb-4">Nuestro Catálogo</h1>
        {profile?.role === 'b2b' && (
          <div className="inline-block px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-sm">
            Estás navegando con tu tarifa especial de socio <strong>CRUMA B2B</strong>.
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products?.map(product => (
          <ProductCard 
            key={product.id} 
            product={product} 
            userRole={profile?.role as any} 
          />
        ))}
      </div>
    </main>
  );
}

