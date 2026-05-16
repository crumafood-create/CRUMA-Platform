export interface GlobalUser {

  id: string;

  full_name: string | null;

  email: string | null;

  role: string;

  tenant_id: string | null;

  is_active: boolean;
}
