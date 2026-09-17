CREATE TABLE public.storefront_products (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  short_description text NOT NULL CHECK (length(trim(short_description)) > 0),
  description text,
  category_slug text NOT NULL CHECK (category_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  category_name text NOT NULL CHECK (length(trim(category_name)) > 0),
  presentation text NOT NULL CHECK (length(trim(presentation)) > 0),
  price numeric(14,2) NOT NULL CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'MXN' CHECK (currency = 'MXN'),
  image_url text,
  image_alt text NOT NULL DEFAULT '',
  seo_title text,
  seo_description text,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT storefront_products_publication_check CHECK (
    is_published = false OR (
      published_at IS NOT NULL
      AND image_url IS NOT NULL
      AND length(trim(image_alt)) > 0
    )
  )
);

CREATE INDEX storefront_products_public_listing_idx
  ON public.storefront_products (is_featured DESC, name)
  WHERE is_published = true;

CREATE INDEX storefront_products_public_category_idx
  ON public.storefront_products (category_slug, name)
  WHERE is_published = true;

CREATE OR REPLACE FUNCTION public.set_storefront_product_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER storefront_products_set_updated_at
BEFORE UPDATE ON public.storefront_products
FOR EACH ROW
EXECUTE FUNCTION public.set_storefront_product_updated_at();

ALTER TABLE public.storefront_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY storefront_products_public_read
ON public.storefront_products
FOR SELECT
TO anon, authenticated
USING (
  is_published = true
  AND published_at IS NOT NULL
  AND published_at <= now()
);

CREATE POLICY storefront_products_admin_manage
ON public.storefront_products
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

REVOKE ALL ON public.storefront_products FROM anon;
GRANT SELECT ON public.storefront_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.storefront_products TO authenticated;

REVOKE ALL ON FUNCTION public.set_storefront_product_updated_at() FROM PUBLIC;
