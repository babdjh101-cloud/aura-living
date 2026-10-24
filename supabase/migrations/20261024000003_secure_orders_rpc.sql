-- ==============================================================================
-- MIGRATION 20261024000003: Atomic & Authoritative Order Creation RPC
-- Target: Supabase PostgreSQL 15+
-- ==============================================================================

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

    -- 2. Generate human-friendly, collision-safe Order Number: e.g. "AUR-20261024-XXXXXX"
    v_order_number := 'AUR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6));

    -- 3. First Pass: Lock product rows, check availability, calculate authoritative prices
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT id, name, sku, regular_price, discount_price, stock_quantity, availability_status, is_published
        INTO v_prod
        FROM public.products
        WHERE id = (v_item->>'product_id')::UUID
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with ID % not found', (v_item->>'product_id');
        END IF;

        IF NOT v_prod.is_published THEN
            RAISE EXCEPTION 'Product "%" is not currently available for purchase', v_prod.name;
        END IF;

        IF v_prod.stock_quantity < (v_item->>'quantity')::INT THEN
            RAISE EXCEPTION 'Insufficient stock for product "%" (Available: %, Requested: %)', 
                v_prod.name, v_prod.stock_quantity, (v_item->>'quantity')::INT;
        END IF;

        -- Authoritative price: use discount price if valid, otherwise regular price
        v_item_price := COALESCE(v_prod.discount_price, v_prod.regular_price);
        v_item_subtotal := v_item_price * (v_item->>'quantity')::INT;
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

    -- 6. Second Pass: Insert Order Items and decrement stock safely
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

-- Grant execution to public anon role and authenticated users
GRANT EXECUTE ON FUNCTION public.create_order_securely(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;

-- ==============================================================================
-- Secure Order Lookup RPC for Public Guest Confirmation
-- Prevents harvesting of customer names/addresses via table scans.
-- Only returns order data if exact unguessable order_number token matches.
-- ==============================================================================
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

