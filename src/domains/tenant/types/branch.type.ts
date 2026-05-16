export interface Branch {

  id: string;

  tenant_id: string;

  name: string;

  city: string | null;

  state: string | null;

  is_active: boolean;
}
