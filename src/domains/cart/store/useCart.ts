import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  minOrder: number; // 1 para B2C, ej. 10 para B2B
}

interface CartStore {
  items: CartItem[];
  addItem: (product: any, role: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, role) => set((state) => {
        const isB2B = role === 'b2b';
        const minOrder = isB2B ? 10 : 1; // Regla de negocio: Mayoreo mínimo 10 unidades
        
        const existing = state.items.find(i => i.id === product.id);
        if (existing) {
          return {
            items: state.items.map(i => 
              i.id === product.id ? { ...i, quantity: i.quantity + minOrder } : i
            )
          };
        }
        return { 
          items: [...state.items, { 
            id: product.id, 
            name: product.name, 
            price: isB2B ? product.price_wholesale : product.price_retail, 
            quantity: minOrder,
            minOrder
          }] 
        };
      }),
      updateQuantity: (id, delta) => set((state) => ({
        items: state.items.map(i => {
          if (i.id === id) {
            const nextQty = i.quantity + delta;
            return { ...i, quantity: nextQty < i.minOrder ? i.minOrder : nextQty };
          }
          return i;
        })
      })),
      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
      })),
    }),
    { name: 'cruma-cart-storage' }
  )
);
