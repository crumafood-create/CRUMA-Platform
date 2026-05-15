export interface CartItem {

  productId: string;

  slug: string;

  name: string;

  imageUrl: string | null;

  retailPrice: number | null;

  wholesalePrice: number | null;

  quantity: number;
}
