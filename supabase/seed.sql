-- ==============================================================================
-- AURA LIVING E-COMMERCE SEED DATA
-- Run this in your Supabase SQL Editor after running the migration.
-- ==============================================================================

-- 1. Insert Categories
INSERT INTO public.categories (id, name, slug, description, image_url, display_order)
VALUES 
    ('11111111-1111-1111-1111-111111111001', 'Seating & Lounges', 'seating-lounges', 'Architectural armchairs, dining seating, and minimalist lounge forms.', '/src/assets/images/product_oak_chair_1792797934499.jpg', 1),
    ('11111111-1111-1111-1111-111111111002', 'Sculptural Lighting', 'lighting', 'Modernist brass, paper, and ambient directional illumination.', '/src/assets/images/product_brass_lamp_1792797934863.jpg', 2),
    ('11111111-1111-1111-1111-111111111003', 'Handcrafted Ceramics', 'ceramics', 'Tactile stoneware vessels, sculptural vases, and artisan centerpieces.', '/src/assets/images/product_ceramic_vase_1792797934676.jpg', 3),
    ('11111111-1111-1111-1111-111111111004', 'Tables & Surfaces', 'tables-surfaces', 'Monolithic travertine, solid oak, and raw stone coffee tables.', '/src/assets/images/product_travertine_table_1792797950554.jpg', 4),
    ('11111111-1111-1111-1111-111111111005', 'Textiles & Living', 'textiles-living', 'Heavyweight waffle merino throws, linen covers, and woven rugs.', '/src/assets/images/product_wool_throw_1792797951430.jpg', 5)
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Products
INSERT INTO public.products (
    id,
    name,
    slug,
    sku,
    description,
    category_id,
    regular_price,
    discount_price,
    main_image,
    additional_images,
    stock_quantity,
    availability_status,
    is_featured
) VALUES
(
    '22222222-2222-2222-2222-222222222001',
    'Klint Solid Oak Bouclé Armchair',
    'klint-solid-oak-boucle-armchair',
    'AUR-CHAIR-001',
    'Hand-finished sculptural armchair carved from sustainably harvested solid white oak. Cushioned in tactile Italian wool-blend bouclé in warm chalk white with ergonomic curved armrests.',
    '11111111-1111-1111-1111-111111111001',
    890.00,
    790.00,
    '/src/assets/images/product_oak_chair_1792797934499.jpg',
    ARRAY['/src/assets/images/hero_living_space_1792797933871.jpg'],
    14,
    'in_stock',
    true
),
(
    '22222222-2222-2222-2222-222222222002',
    'Aethel Spun Brass Task Lamp',
    'aethel-spun-brass-task-lamp',
    'AUR-LAMP-002',
    'Modernist task and accent lamp forged in heavy brushed brass. Features dual-axis articulation, weighted conical base, and warm 2700K ambient illumination.',
    '11111111-1111-1111-1111-111111111002',
    340.00,
    NULL,
    '/src/assets/images/product_brass_lamp_1792797934863.jpg',
    ARRAY[]::TEXT[],
    8,
    'in_stock',
    true
),
(
    '22222222-2222-2222-2222-222222222003',
    'Vesna Textured Stoneware Amphora',
    'vesna-textured-stoneware-amphora',
    'AUR-VASE-003',
    'Hand-thrown coarse stoneware ceramic vase finished in a raw volcanic matte texture. Organic pinched contours make each individual vessel unique.',
    '11111111-1111-1111-1111-111111111003',
    185.00,
    145.00,
    '/src/assets/images/product_ceramic_vase_1792797934676.jpg',
    ARRAY[]::TEXT[],
    19,
    'in_stock',
    true
),
(
    '22222222-2222-2222-2222-222222222004',
    'Fluted Roman Travertine Coffee Table',
    'fluted-roman-travertine-coffee-table',
    'AUR-TABL-004',
    'Low-profile monolithic coffee table sculpted from honed Italian travertine stone with fluted architectural perimeter columns and radiused corners.',
    '11111111-1111-1111-1111-111111111004',
    1450.00,
    1280.00,
    '/src/assets/images/product_travertine_table_1792797950554.jpg',
    ARRAY[]::TEXT[],
    3,
    'low_stock',
    true
),
(
    '22222222-2222-2222-2222-222222222005',
    'Oat Waffle Merino Living Blanket',
    'oat-waffle-merino-living-blanket',
    'AUR-TEXT-005',
    'Generously sized 100% Australian extra-fine merino wool throw blanket woven in a deep waffle structure for breathable insulation and natural drape.',
    '11111111-1111-1111-1111-111111111005',
    220.00,
    NULL,
    '/src/assets/images/product_wool_throw_1792797951430.jpg',
    ARRAY[]::TEXT[],
    22,
    'in_stock',
    false
)
ON CONFLICT (slug) DO NOTHING;

-- 3. HOW TO CONFIGURE YOUR ADMIN USER:
-- Step A: Sign up your admin user via Supabase Auth (or via /admin/login with email/password).
-- Step B: Run the following SQL to grant that user admin permissions:
-- 
-- INSERT INTO public.admin_users (id, email, full_name, role)
-- SELECT id, email, raw_user_meta_data->>'full_name', 'admin'
-- FROM auth.users
-- WHERE email = 'your-admin-email@example.com'
-- ON CONFLICT (id) DO NOTHING;
