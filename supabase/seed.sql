-- ==============================================================================
-- MIGRATION 20261024000005: Initial Product & Category Seed Data
-- Target: Supabase PostgreSQL 15+
-- ==============================================================================

-- 1. Insert Initial Curated Categories
INSERT INTO public.categories (id, name, slug, description, image_url, display_order, is_active)
VALUES
(
    '11111111-1111-1111-1111-111111111001',
    'Seating & Lounges',
    'seating-lounges',
    'Architectural armchairs, dining seating, and minimalist lounge forms.',
    '/images/product_oak_chair.jpg',
    1,
    true
),
(
    '11111111-1111-1111-1111-111111111002',
    'Sculptural Lighting',
    'lighting',
    'Modernist brass, paper, and ambient directional illumination.',
    '/images/product_brass_lamp.jpg',
    2,
    true
),
(
    '11111111-1111-1111-1111-111111111003',
    'Handcrafted Ceramics',
    'ceramics',
    'Tactile stoneware vessels, sculptural vases, and artisan centerpieces.',
    '/images/product_ceramic_vase.jpg',
    3,
    true
),
(
    '11111111-1111-1111-1111-111111111004',
    'Tables & Surfaces',
    'tables-surfaces',
    'Monolithic travertine, solid oak, and raw stone coffee tables.',
    '/images/product_travertine_table.jpg',
    4,
    true
),
(
    '11111111-1111-1111-1111-111111111005',
    'Textiles & Living',
    'textiles-living',
    'Heavyweight waffle merino throws, linen covers, and woven rugs.',
    '/images/product_wool_throw.jpg',
    5,
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active;

-- 2. Insert Initial Curated Products
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
    is_featured,
    is_published
)
VALUES
(
    '22222222-2222-2222-2222-222222222001',
    'Klint Solid Oak Bouclé Armchair',
    'klint-solid-oak-boucle-armchair',
    'AUR-CHAIR-001',
    'Hand-finished sculptural armchair carved from sustainably harvested solid white oak. Cushioned in tactile Italian wool-blend bouclé in warm chalk white with ergonomic curved armrests and exposed mortise-and-tenon joinery.',
    '11111111-1111-1111-1111-111111111001',
    890.00,
    790.00,
    '/images/product_oak_chair.jpg',
    ARRAY['/images/hero_living_space.jpg'],
    14,
    'in_stock',
    true,
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
    '/images/product_brass_lamp.jpg',
    ARRAY[]::TEXT[],
    8,
    'in_stock',
    true,
    true
),
(
    '22222222-2222-2222-2222-222222222003',
    'Vesna Textured Stoneware Amphora',
    'vesna-textured-stoneware-amphora',
    'AUR-VASE-003',
    'Hand-thrown coarse stoneware ceramic vase finished in a raw volcanic matte texture. Organic pinched contours make each individual vessel an irreproducible sculptural work.',
    '11111111-1111-1111-1111-111111111003',
    185.00,
    145.00,
    '/images/product_ceramic_vase.jpg',
    ARRAY[]::TEXT[],
    19,
    'in_stock',
    true,
    true
),
(
    '22222222-2222-2222-2222-222222222004',
    'Fluted Roman Travertine Coffee Table',
    'fluted-roman-travertine-coffee-table',
    'AUR-TABL-004',
    'Low-profile monolithic coffee table sculpted from honed Italian travertine stone with fluted architectural perimeter columns and soft radiused corners.',
    '11111111-1111-1111-1111-111111111004',
    1450.00,
    1280.00,
    '/images/product_travertine_table.jpg',
    ARRAY[]::TEXT[],
    3,
    'low_stock',
    true,
    true
),
(
    '22222222-2222-2222-2222-222222222005',
    'Oat Waffle Merino Living Blanket',
    'oat-waffle-merino-living-blanket',
    'AUR-TEXT-005',
    'Generously sized 100% Australian extra-fine merino wool throw blanket woven in a deep waffle structure for breathable insulation and natural tactile drape.',
    '11111111-1111-1111-1111-111111111005',
    220.00,
    NULL,
    '/images/product_wool_throw.jpg',
    ARRAY[]::TEXT[],
    22,
    'in_stock',
    false,
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    category_id = EXCLUDED.category_id,
    regular_price = EXCLUDED.regular_price,
    discount_price = EXCLUDED.discount_price,
    main_image = EXCLUDED.main_image,
    additional_images = EXCLUDED.additional_images,
    stock_quantity = EXCLUDED.stock_quantity,
    availability_status = EXCLUDED.availability_status,
    is_featured = EXCLUDED.is_featured,
    is_published = EXCLUDED.is_published;
