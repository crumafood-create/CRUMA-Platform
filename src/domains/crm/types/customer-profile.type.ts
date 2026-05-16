export interface CustomerProfile {

  id: string;

  full_name: string | null;

  email: string | null;

  phone: string | null;

  loyalty_points: number | null;

  total_orders: number | null;

  lifetime_value: number | null;
}
