export interface B2BCustomer {

  id: string;

  company_name: string;

  contact_name: string | null;

  email: string | null;

  pricing_tier: string | null;

  credit_limit: number | null;

  is_active: boolean;
}
