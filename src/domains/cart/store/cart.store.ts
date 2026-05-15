import { create }
from 'zustand';

import { persist }
from 'zustand/middleware';

import type { CartItem }
from '../types/cart-item.type';

interface CartStore {

  items: CartItem[];

  addItem: (
    item: CartItem
  ) => void;

  removeItem: (
    productId: string
  ) => void;

  clearCart: () => void;

  increaseQuantity: (
    productId: string
  ) => void;

  decreaseQuantity: (
    productId: string
  ) => void;
}

export const useCartStore = create<CartStore>()(

  persist(

    (set) => ({

      items: [],

      addItem: (item) =>

        set((state) => {

          const exists =
            state.items.find(

              i =>
                i.productId === item.productId
            );

          if (exists) {

            return {

              items: state.items.map(

                i =>

                  i.productId === item.productId

                    ? {
                        ...i,
                        quantity:
                          i.quantity + item.quantity
                      }

                    : i
              )
            };
          }

          return {

            items: [
              ...state.items,
              item
            ]
          };
        }),

      removeItem: (productId) =>

        set((state) => ({

          items: state.items.filter(

            i =>
              i.productId !== productId
          )
        })),

      clearCart: () =>

        set({
          items: []
        }),

      increaseQuantity: (
        productId
      ) =>

        set((state) => ({

          items: state.items.map(

            i =>

              i.productId === productId

                ? {
                    ...i,
                    quantity:
                      i.quantity + 1
                  }

                : i
          )
        })),

      decreaseQuantity: (
        productId
      ) =>

        set((state) => ({

          items: state.items.map(

            i =>

              i.productId === productId

                ? {
                    ...i,
                    quantity:
                      Math.max(
                        1,
                        i.quantity - 1
                      )
                  }

                : i
          )
        }))
    }),

    {
      name: 'cart-storage'
    }
  )
);
