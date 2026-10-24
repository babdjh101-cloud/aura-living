-- ==============================================================================
-- MIGRATION 20261024000006: Hardening Product RLS, Admin Authorization, and Orders RPC
-- Target: Supabase PostgreSQL 15+
-- Description:
--   1. Ensures public.is_admin() supports both public.admin_users roster and JWT claims
--   2. Ensures public.create_order_securely enforces positive quantity, published stock checks,
--      atomic decrement, and explicit EXECUTE grants for anon and authenticated roles.
-- ==============================================================================

-- 1. Upgrade public.is_admin() to support both database table and Supabase Auth metadata
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT (
        -- Check if current authenticated user exists in admin_users roster
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE id = auth.uid()
        )
        OR
        -- Check if current JWT contains admin role in app_metadata
        COALESCE((auth.jwt()->'app_metadata'->>'role'), '') IN ('admin', 'super_admin')
        OR
        -- Check if current JWT contains admin role in user_metadata
        COALESCE((auth.jwt()->'user_metadata'->>'role'), '') IN ('admin', 'super_admin')
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- 2. Ensure RLS policies on public.products are robust and active
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Ensure update policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'products' 
          AND policyname = 'Admins can update products'
    ) THEN
        CREATE POLICY "Admins can update products"
        ON public.products FOR UPDATE
        USING (public.is_admin())
        WITH CHECK (public.is_admin());
    END IF;

    -- Ensure insert policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'products' 
          AND policyname = 'Admins can insert products'
    ) THEN
        CREATE POLICY "Admins can insert products"
        ON public.products FOR INSERT
        WITH CHECK (public.is_admin());
    END IF;

    -- Ensure delete policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'products' 
          AND policyname = 'Admins can delete products'
    ) THEN
        CREATE POLICY "Admins can delete products"
        ON public.products FOR DELETE
        USING (public.is_admin());
    END IF;
END $$;

-- 3. Hardened Atomic Order Placement RPC
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
    v_qty INT;
    v_item_price NUMERIC(10, 2);
    v_item_subtotal NUMERIC(10, 2);
    v_subtotal NUMERIC(10, 2) := 0.00;
    v_delivery_charge NUMERIC(10, 2) := 0.00;
    v_total NUMERIC(10, 2) := 0.00;
BEGIN
    -- 1. Validate customer input
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

    -- 2. Generate human-friendly, collision-safe Order Number
    v_order_number := 'AUR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6));

    -- 3. First Pass: Lock product rows, validate availability and stock, calculate authoritative prices
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_qty := (v_item->>'quantity')::INT;
        IF v_qty IS NULL OR v_qty <= 0 THEN
            RAISE EXCEPTION 'Item quantity must be a positive integer';
        END IF;

        SELECT id, name, sku, regular_price, discount_price, stock_quantity, availability_status, is_published
        INTO v_prod
        FROM public.products
        WHERE id = (v_item->>'product_id')::UUID
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with ID % not found in database catalog', (v_item->>'product_id');
        END IF;

        IF NOT COALESCE(v_prod.is_published, true) OR v_prod.availability_status = 'discontinued' THEN
            RAISE EXCEPTION 'Product "%" is not currently available for purchase', v_prod.name;
        END IF;

        IF v_prod.stock_quantity < v_qty THEN
            RAISE EXCEPTION 'Insufficient stock for product "%" (Available: %, Requested: %)', 
                v_prod.name, v_prod.stock_quantity, v_qty;
        END IF;

        -- Authoritative price: discount price if present, else regular price
        v_item_price := COALESCE(v_prod.discount_price, v_prod.regular_price);
        v_item_subtotal := v_item_price * v_qty;
        v_subtotal := v_subtotal + v_item_subtotal;
    END LOOP;

    -- 4. Authoritative delivery calculation: Free delivery over $150, else $15 flat
    IF v_subtotal >= 150.00 THEN
        v_delivery_charge := 0.00;
    ELSE
        v_delivery_charge := 15.00;
    END IF;
    v_total := v_subtotal + v_delivery_charge;

    -- 5. Insert Order record
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
        TRIM(p_customer_name),
        TRIM(p_customer_phone),
        NULLIF(TRIM(p_customer_email), ''),
        TRIM(p_shipping_address),
        TRIM(p_city),
        NULLIF(TRIM(p_postal_code), ''),
        NULLIF(TRIM(p_order_notes), ''),
        v_subtotal,
        v_delivery_charge,
        v_total,
        'cash_on_delivery',
        'pending',
        'pending'
    ) RETURNING id INTO v_order_id;

    -- 6. Second Pass: Insert Order Items and decrement stock safely
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_qty := (v_item->>'quantity')::INT;

        SELECT id, name, sku, regular_price, discount_price, stock_quantity
        INTO v_prod
        FROM public.products
        WHERE id = (v_item->>'product_id')::UUID;

        v_item_price := COALESCE(v_prod.discount_price, v_prod.regular_price);
        v_item_subtotal := v_item_price * v_qty;

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
            v_qty,
            v_item_subtotal
        );

        -- Decrement stock and update availability status
        UPDATE public.products
        SET stock_quantity = GREATEST(0, stock_quantity - v_qty),
            availability_status = CASE 
                WHEN (stock_quantity - v_qty) <= 0 THEN 'out_of_stock'
                WHEN (stock_quantity - v_qty) <= 3 THEN 'low_stock'
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

-- Grant execution to anon (guest checkout) and authenticated users
GRANT EXECUTE ON FUNCTION public.create_order_securely(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;
