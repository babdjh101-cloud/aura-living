-- ==============================================================================
-- MIGRATION 20261024000004: Supabase Storage product-images Bucket & Security Policies
-- Target: Supabase PostgreSQL 15+ / Storage API
-- ==============================================================================

-- 1. Create or configure the dedicated 'product-images' Storage Bucket
-- Public = true allows direct public HTTP image delivery to storefront visitors.
-- Size limit is capped at 5MB per image.
-- Allowed MIME types restrict uploads strictly to valid web images.
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

-- 2. Storage Object RLS Policy: Public read access
-- Anyone (including guest visitors) can view product images.
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 3. Storage Object RLS Policy: Admin-only upload access
-- Only authenticated users present in the public.admin_users table can upload.
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'product-images'
    AND (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE admin_users.id = auth.uid()
        )
    )
);

-- 4. Storage Object RLS Policy: Admin-only update/replace access
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'product-images'
    AND (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE admin_users.id = auth.uid()
        )
    )
);

-- 5. Storage Object RLS Policy: Admin-only deletion access
-- Prevents unauthorized removal of product images from the storage bucket.
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'product-images'
    AND (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE admin_users.id = auth.uid()
        )
    )
);
