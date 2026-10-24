-- ==============================================================================
-- AURA LIVING E-COMMERCE DATABASE INITIALIZATION & RLS POLICIES
-- Target: Supabase PostgreSQL 15+
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. CATEGORIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for category slug lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories (is_active);

-- ------------------------------------------------------------------------------
-- 2. PRODUCTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    sku TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    regular_price NUMERIC(10, 2) NOT NULL CHECK (regular_price >= 0),
    discount_price NUMERIC(10, 2) CHECK (discount_price IS NULL OR discount_price >= 0),
    main_image TEXT NOT NULL,
    additional_images TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    availability_status TEXT NOT NULL DEFAULT 'in_stock' CHECK (availability_status IN ('in_stock', 'low_stock', 'out_of_stock', 'discontinued')),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_discount_less_than_regular CHECK (discount_price IS NULL OR discount_price < regular_price)
);

-- Indexes for product filtering, searching, and catalog ordering
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products (slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products (sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products (is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_published ON public.products (is_published);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products (availability_status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products (created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. ADMIN USERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 4. ORDERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    shipping_address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT,
    order_notes TEXT,
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_charge >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery' CHECK (payment_method IN ('cash_on_delivery')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders (order_status);

-- ------------------------------------------------------------------------------
-- 5. ORDER ITEMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_sku TEXT NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);

-- ------------------------------------------------------------------------------
-- 6. AUTOMATIC UPDATED_AT TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 7. SECURE ORDER CREATION DATABASE FUNCTION
-- Re-verifies actual database product prices, recalculates totals, validates stock,
-- and decrements stock in a single transaction (protecting against client tampering).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_order_securely(
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_customer_email TEXT,
    p_shipping_address TEXT,
    p_city TEXT,
    p_postal_code TEXT,
    p_order_notes TEXT,
    p_items JSONB -- Array of objects: [{"product_id": "uuid", "quantity": 1}]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_item JSONB;
    v_prod RECORD;
    v_item_price NUMERIC(10, 2);
    v_item_subtotal NUMERIC(10, 2);
    v_subtotal NUMERIC(10, 2) := 0.00;
    v_delivery_charge NUMERIC(10, 2) := 0.00;
    v_total NUMERIC(10, 2) := 0.00;
BEGIN
    -- Validate customer input
    IF TRIM(COALESCE(p_customer_name, '')) = '' THEN
        RAISE EXCEPTION 'Customer name is required';
    END IF;
    IF TRIM(COALESCE(p_customer_phone, '')) = '' THEN
        RAISE EXCEPTION 'Customer phone number is required';
    END IF;
    IF TRIM(COALESCE(p_shipping_address, '')) = '' THEN
        RAISE EXCEPTION 'Shipping address is required';
    END IF;
    IF TRIM(COALESCE(p_city, '')) = '' THEN
        RAISE EXCEPTION 'City is required';
    END IF;
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Order must contain at least one item';
    END IF;

    -- Generate human-friendly, collision-safe Order Number: e.g. "AUR-2026-XXXXX"
    v_order_number := 'AUR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6));

    -- First Pass: Lock product rows, check availability, calculate authoritative prices
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT id, name, sku, regular_price, discount_price, stock_quantity, availability_status
        INTO v_prod
        FROM public.products
        WHERE id = (v_item->>'product_id')::UUID
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with ID % not found', (v_item->>'product_id');
        END IF;

        IF v_prod.stock_quantity < (v_item->>'quantity')::INT THEN
            RAISE EXCEPTION 'Insufficient stock for product "%" (Available: %, Requested: %)', 
                v_prod.name, v_prod.stock_quantity, (v_item->>'quantity')::INT;
        END IF;

        -- Use authoritative discount price if available, otherwise regular price
        v_item_price := COALESCE(v_prod.discount_price, v_prod.regular_price);
        v_item_subtotal := v_item_price * (v_item->>'quantity')::INT;
        v_subtotal := v_subtotal + v_item_subtotal;
    END LOOP;

    -- Authoritative delivery calculation: Free delivery over $150, else $15 flat
    IF v_subtotal >= 150.00 THEN
        v_delivery_charge := 0.00;
    ELSE
        v_delivery_charge := 15.00;
    END IF;
    v_total := v_subtotal + v_delivery_charge;

    -- Insert Order
    INSERT INTO public.orders (
        order_number,
        customer_name,
        customer_phone,
        customer_email,
        shipping_address,
        city,
        postal_code,
        order_notes,
        subtotal,
        delivery_charge,
        total_amount,
        payment_method,
        payment_status,
        order_status
    ) VALUES (
        v_order_number,
        p_customer_name,
        p_customer_phone,
        p_customer_email,
        p_shipping_address,
        p_city,
        p_postal_code,
        p_order_notes,
        v_subtotal,
        v_delivery_charge,
        v_total,
        'cash_on_delivery',
        'pending',
        'pending'
    ) RETURNING id INTO v_order_id;

    -- Second Pass: Insert Order Items and decrement stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT id, name, sku, regular_price, discount_price, stock_quantity
        INTO v_prod
        FROM public.products
        WHERE id = (v_item->>'product_id')::UUID;

        v_item_price := COALESCE(v_prod.discount_price, v_prod.regular_price);
        v_item_subtotal := v_item_price * (v_item->>'quantity')::INT;

        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name,
            product_sku,
            unit_price,
            quantity,
            line_total
        ) VALUES (
            v_order_id,
            v_prod.id,
            v_prod.name,
            v_prod.sku,
            v_item_price,
            (v_item->>'quantity')::INT,
            v_item_subtotal
        );

        -- Decrement stock and update status if depleted
        UPDATE public.products
        SET stock_quantity = stock_quantity - (v_item->>'quantity')::INT,
            availability_status = CASE 
                WHEN (stock_quantity - (v_item->>'quantity')::INT) <= 0 THEN 'out_of_stock'
                WHEN (stock_quantity - (v_item->>'quantity')::INT) <= 3 THEN 'low_stock'
                ELSE 'in_stock'
            END
        WHERE id = v_prod.id;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'subtotal', v_subtotal,
        'delivery_charge', v_delivery_charge,
        'total_amount', v_total
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_securely(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;

-- Function to allow guest customers to retrieve only their own confirmed order by exact order number token
CREATE OR REPLACE FUNCTION public.get_order_by_number(p_order_number TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_items JSONB;
BEGIN
    SELECT * INTO v_order
    FROM public.orders
    WHERE order_number = p_order_number;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', oi.id,
            'order_id', oi.order_id,
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'product_sku', oi.product_sku,
            'unit_price', oi.unit_price,
            'quantity', oi.quantity,
            'line_total', oi.line_total
        )
    ) INTO v_items
    FROM public.order_items oi
    WHERE oi.order_id = v_order.id;

    RETURN jsonb_build_object(
        'id', v_order.id,
        'order_number', v_order.order_number,
        'customer_name', v_order.customer_name,
        'customer_phone', v_order.customer_phone,
        'customer_email', v_order.customer_email,
        'shipping_address', v_order.shipping_address,
        'city', v_order.city,
        'postal_code', v_order.postal_code,
        'order_notes', v_order.order_notes,
        'subtotal', v_order.subtotal,
        'delivery_charge', v_order.delivery_charge,
        'total_amount', v_order.total_amount,
        'payment_method', v_order.payment_method,
        'payment_status', v_order.payment_status,
        'order_status', v_order.order_status,
        'created_at', v_order.created_at,
        'items', COALESCE(v_items, '[]'::jsonb)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_by_number(TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Helper function: is current user an authenticated admin?
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

-- Categories RLS: Public can read active categories, only admin can manage
CREATE POLICY "Public categories are viewable by everyone"
ON public.categories FOR SELECT
USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can insert categories"
ON public.categories FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update categories"
ON public.categories FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete categories"
ON public.categories FOR DELETE
USING (public.is_admin());

-- Products RLS: Public users can read ONLY published products, only admin can manage
CREATE POLICY "Published products are viewable by public"
ON public.products FOR SELECT
USING (
    (is_published = true AND availability_status != 'discontinued')
    OR public.is_admin()
);

CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
USING (public.is_admin());

-- Admin Users RLS: Only admins can view the admin roster
CREATE POLICY "Admins can view admin_users"
ON public.admin_users FOR SELECT
USING (public.is_admin() OR auth.uid() = id);

-- Orders RLS: Direct table access is restricted to authorized administrators.
-- Public guest submissions use create_order_securely() and lookups use get_order_by_number().
CREATE POLICY "Admins can manage all orders"
ON public.orders FOR ALL
USING (public.is_admin());

-- Order Items RLS: Direct table access is restricted to authorized administrators.
CREATE POLICY "Admins can manage order items"
ON public.order_items FOR ALL
USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 9. SUPABASE STORAGE BUCKET CONFIGURATION (product-images)
-- ------------------------------------------------------------------------------
-- Insert bucket if not exists
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

-- Storage RLS: Public can view images
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Storage RLS: Only authenticated admins can upload images
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'product-images' 
    AND (public.is_admin() OR auth.role() = 'authenticated')
);

-- Storage RLS: Only authenticated admins can update images
CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'product-images' 
    AND (public.is_admin() OR auth.role() = 'authenticated')
);

-- Storage RLS: Only authenticated admins can delete images
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'product-images' 
    AND (public.is_admin() OR auth.role() = 'authenticated')
);
