export interface Product {

  id: string;

  slug: string;

  name: string;

  description: string | null;

  image_url: string | null;

  retail_price: number | null;

  wholesale_price: number | null;

  stock_quantity: number | null;

  is_active: boolean;

  created_at: string;
}
