-- ==============================================================================
-- MIGRATION 20261024000002: Row Level Security (RLS) & Access Control
-- Target: Supabase PostgreSQL 15+
-- ==============================================================================

-- 1. Enable RLS on all exposed tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 2. Helper function: verify if the authenticated user has an active admin record
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE id = auth.uid()
    );
$$;

-- ------------------------------------------------------------------------------
-- 3. CATEGORIES RLS POLICIES
-- Rule: Public can read active categories; only authorized admins may modify
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public categories are viewable by everyone" ON public.categories;
CREATE POLICY "Public categories are viewable by everyone"
ON public.categories FOR SELECT
USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories"
ON public.categories FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories"
ON public.categories FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories"
ON public.categories FOR DELETE
USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. PRODUCTS RLS POLICIES
-- Rule: Public users may read ONLY published products. Only admins can modify.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Published products are viewable by public" ON public.products;
CREATE POLICY "Published products are viewable by public"
ON public.products FOR SELECT
USING (
    (is_published = true AND availability_status != 'discontinued')
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. ADMIN USERS RLS POLICIES
-- Rule: Protected administrative roster.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users"
ON public.admin_users FOR SELECT
USING (public.is_admin() OR auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 6. ORDERS & ORDER ITEMS RLS POLICIES
-- Rule: Direct table SELECT, INSERT, UPDATE, DELETE are restricted to authorized
-- administrators. Guest customers submit orders via the atomic create_order_securely()
-- RPC and look up their own confirmation via get_order_by_number() RPC (SECURITY DEFINER).
-- This completely prevents public scraping/enumeration of customer PII.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders"
ON public.orders FOR ALL
USING (public.is_admin());

DROP POLICY IF EXISTS "Customers can view specific order by order_number" ON public.orders;

DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;
CREATE POLICY "Admins can manage order items"
ON public.order_items FOR ALL
USING (public.is_admin());

DROP POLICY IF EXISTS "Customers can view order items for orders" ON public.order_items;

-- ------------------------------------------------------------------------------
-- 7. SUPABASE STORAGE BUCKET POLICIES (product-images)
-- Rule: Public can view images; only authenticated admins can upload/update/delete.
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880, -- 5 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'product-images' 
    AND (public.is_admin() OR auth.role() = 'authenticated')
);

DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'product-images' 
    AND (public.is_admin() OR auth.role() = 'authenticated')
);

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'product-images' 
    AND (public.is_admin() OR auth.role() = 'authenticated')
);
