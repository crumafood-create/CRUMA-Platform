import { getPriceForRole, type UserRole } from '../utils/price-engine';

interface Props {
  product: any;
  userRole?: UserRole;
}

export function ProductCard({ product, userRole }: Props) {
  const { price, label, isWholesale } = getPriceForRole(
    { retail: product.price_retail, wholesale: product.price_wholesale },
    userRole
  );

  return (
    <div className="group rounded-2xl p-4 bg-white border border-[#E2DED0] hover:shadow-xl transition-all">
      <div className="relative aspect-square mb-4 bg-[#F5F2ED] rounded-xl overflow-hidden">
        {/* Imagen del Tequeño/Empanada */}
      </div>
      
      <h3 className="text-[#4A3F35] font-semibold text-lg">{product.name}</h3>
      
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-[#C4A484]">${price}</span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#F5F2ED] text-[#8C7E6F]">
          {label}
        </span>
      </div>

      {isWholesale && (
        <p className="mt-1 text-xs text-green-600 font-medium">
          ✓ Beneficio B2B activado
        </p>
      )}

      <button className="w-full mt-4 py-2 bg-[#4A3F35] text-white rounded-lg hover:bg-[#332C25] transition-colors">
        Agregar al pedido
      </button>
    </div>
  );
}
