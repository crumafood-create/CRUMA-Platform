export const validateOrderMinima = (items: CartItem[], role: string) => {
  if (role === 'b2b') {
    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
    // Ejemplo: Angie o cualquier B2B debe pedir al menos 30 paquetes en total
    if (totalItems < 30) {
      return { 
        valid: false, 
        message: "Los pedidos de mayoreo deben ser de al menos 30 unidades totales." 
      };
    }
  }
  return { valid: true };
};
