-- Persist the operational hierarchy without changing authorization.
-- Existing warehouses remain global until an explicit backfill assigns them.

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL
    REFERENCES public.tenants(id)
    ON DELETE RESTRICT,
  code text NOT NULL
    CHECK (code = upper(code) AND length(btrim(code)) > 0),
  name text NOT NULL
    CHECK (length(btrim(name)) > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, code)
);

CREATE TABLE public.plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  code text NOT NULL
    CHECK (code = upper(code) AND length(btrim(code)) > 0),
  name text NOT NULL
    CHECK (length(btrim(name)) > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, code),
  CONSTRAINT plants_tenant_id_organization_id_fkey
    FOREIGN KEY (tenant_id, organization_id)
    REFERENCES public.organizations(tenant_id, id)
    ON DELETE RESTRICT
);

ALTER TABLE public.warehouses
  ADD COLUMN tenant_id uuid,
  ADD COLUMN plant_id uuid,
  ADD CONSTRAINT warehouses_plant_scope_fkey
    FOREIGN KEY (tenant_id, plant_id)
    REFERENCES public.plants(tenant_id, id)
    ON DELETE RESTRICT,
  ADD CONSTRAINT warehouses_scope_pair_check
    CHECK (
      (tenant_id IS NULL AND plant_id IS NULL)
      OR (tenant_id IS NOT NULL AND plant_id IS NOT NULL)
    );

CREATE UNIQUE INDEX warehouses_scoped_code_unique
  ON public.warehouses (tenant_id, code)
  WHERE tenant_id IS NOT NULL;

CREATE INDEX organizations_tenant_idx
  ON public.organizations (tenant_id, is_active);

CREATE INDEX plants_organization_idx
  ON public.plants (tenant_id, organization_id, is_active);

CREATE INDEX warehouses_plant_idx
  ON public.warehouses (tenant_id, plant_id)
  WHERE tenant_id IS NOT NULL;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;

CREATE POLICY organizations_admin_write
  ON public.organizations
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY plants_admin_write
  ON public.plants
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

REVOKE ALL ON TABLE public.organizations
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.plants
  FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.organizations
  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.plants
  TO authenticated;

COMMENT ON TABLE public.organizations IS
  'Operational scope only. Membership in tenant_members does not authorize access.';
COMMENT ON TABLE public.plants IS
  'Operational scope only. Access remains governed by public.user_roles.';
COMMENT ON COLUMN public.warehouses.tenant_id IS
  'Optional until explicit backfill. Null preserves the current global warehouse.';
