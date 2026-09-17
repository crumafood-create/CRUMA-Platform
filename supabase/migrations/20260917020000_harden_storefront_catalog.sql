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
  CONSTRAINT storefront_products_publication_date_check CHECK (
    is_published = false OR published_at IS NOT NULL
  ),
  CONSTRAINT storefront_products_publication_content_check CHECK (
    is_published = false OR (
      image_url IS NOT NULL AND length(trim(image_alt)) > 0
    )
  )
);

CREATE OR REPLACE FUNCTION public.validate_storefront_product_publication()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $
DECLARE
  product_status text;
  product_deleted_at timestamptz;
  product_is_active boolean;
BEGIN
  SELECT status, deleted_at, is_active
  INTO product_status, product_deleted_at, product_is_active
  FROM public.products
  WHERE id = NEW.product_id;

  IF NEW.is_published = true
    AND (
      product_status IS DISTINCT FROM 'active'
      OR product_deleted_at IS NOT NULL
      OR product_is_active IS DISTINCT FROM true
    )
  THEN
    RAISE EXCEPTION 'Only active products can be published.';
  END IF;

  RETURN NEW;
END;
$;

CREATE TRIGGER storefront_products_validate_publication
BEFORE INSERT OR UPDATE ON public.storefront_products
FOR EACH ROW
EXECUTE FUNCTION public.validate_storefront_product_publication();

CREATE OR REPLACE FUNCTION public.unpublish_storefront_product()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $
BEGIN
  IF (
    NEW.status IS DISTINCT FROM 'active'
    OR NEW.deleted_at IS NOT NULL
    OR NEW.is_active IS DISTINCT FROM true
  ) THEN
    UPDATE public.storefront_products
    SET is_published = false, published_at = NULL
    WHERE product_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$;

CREATE TRIGGER products_unpublish_storefront_product
AFTER UPDATE OF status, deleted_at, is_active ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.unpublish_storefront_product();

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
REVOKE INSERT, UPDATE, DELETE ON public.storefront_products FROM anon;
GRANT SELECT ON public.storefront_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.storefront_products TO authenticated;

REVOKE ALL ON FUNCTION public.set_storefront_product_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_storefront_product_publication() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unpublish_storefront_product() FROM PUBLIC;
