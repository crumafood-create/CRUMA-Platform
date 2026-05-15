export interface Delivery {

  id: string;

  order_id: string;

  status: string;

  driver_name: string | null;

  tracking_code: string | null;

  created_at: string;
}
