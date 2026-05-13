export type UserRole = 'client' | 'b2b' | 'admin';

export const getPriceForRole = (
  prices: { retail: number; wholesale: number },
  role: UserRole = 'client'
) => {
  // Un usuario B2B ve precios de mayoreo, el resto ve menudeo
  if (role === 'b2b' || role === 'admin') {
    return {
      price: prices.wholesale,
      label: 'Precio Mayoreo',
      isWholesale: true
    };
  }

  return {
    price: prices.retail,
    label: 'Precio Menudeo',
    isWholesale: false
  };
};
