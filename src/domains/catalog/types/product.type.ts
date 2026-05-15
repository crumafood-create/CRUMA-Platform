export interface Product {

  id: string;

  slug: string;

  name: string;

  description: string | null;

  image_url: string | null;

  is_active: boolean;

  created_at: string;
}
