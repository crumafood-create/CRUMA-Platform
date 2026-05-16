export interface Supplier {

  id: string;

  company_name: string;

  contact_name: string | null;

  email: string | null;

  phone: string | null;

  is_active: boolean;

  created_at: string;
}
