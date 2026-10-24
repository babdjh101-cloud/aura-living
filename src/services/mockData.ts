/**
 * TEMPORARY MOCK SEED DATA FOR PHASE 1 UI LAYOUT DEVELOPMENT ONLY
 * Note: Once Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
 * are configured, live Supabase PostgreSQL tables serve all product, category, and order data.
 */

import { Category, Product, Order } from '../types';

import heroImg from '../assets/images/hero_living_space_1792797933871.jpg';
import oakChairImg from '../assets/images/product_oak_chair_1792797934499.jpg';
import ceramicVaseImg from '../assets/images/product_ceramic_vase_1792797934676.jpg';
import brassLampImg from '../assets/images/product_brass_lamp_1792797934863.jpg';
import travertineTableImg from '../assets/images/product_travertine_table_1792797950554.jpg';
import woolThrowImg from '../assets/images/product_wool_throw_1792797951430.jpg';

export { heroImg };

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: '11111111-1111-1111-1111-111111111001',
    name: 'Seating & Lounges',
    slug: 'seating-lounges',
    description: 'Architectural armchairs, dining seating, and minimalist lounge forms.',
    image_url: oakChairImg,
    display_order: 1,
  },
  {
    id: '11111111-1111-1111-1111-111111111002',
    name: 'Sculptural Lighting',
    slug: 'lighting',
    description: 'Modernist brass, paper, and ambient directional illumination.',
    image_url: brassLampImg,
    display_order: 2,
  },
  {
    id: '11111111-1111-1111-1111-111111111003',
    name: 'Handcrafted Ceramics',
    slug: 'ceramics',
    description: 'Tactile stoneware vessels, sculptural vases, and artisan centerpieces.',
    image_url: ceramicVaseImg,
    display_order: 3,
  },
  {
    id: '11111111-1111-1111-1111-111111111004',
    name: 'Tables & Surfaces',
    slug: 'tables-surfaces',
    description: 'Monolithic travertine, solid oak, and raw stone coffee tables.',
    image_url: travertineTableImg,
    display_order: 4,
  },
  {
    id: '11111111-1111-1111-1111-111111111005',
    name: 'Textiles & Living',
    slug: 'textiles-living',
    description: 'Heavyweight waffle merino throws, linen covers, and woven rugs.',
    image_url: woolThrowImg,
    display_order: 5,
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '22222222-2222-2222-2222-222222222001',
    name: 'Klint Solid Oak Bouclé Armchair',
    slug: 'klint-solid-oak-boucle-armchair',
    sku: 'AUR-CHAIR-001',
    description: 'Hand-finished sculptural armchair carved from sustainably harvested solid white oak. Cushioned in tactile Italian wool-blend bouclé in warm chalk white with ergonomic curved armrests and exposed mortise-and-tenon joinery.',
    category_id: '11111111-1111-1111-1111-111111111001',
    regular_price: 890.00,
    discount_price: 790.00,
    main_image: oakChairImg,
    additional_images: [heroImg],
    stock_quantity: 14,
    availability_status: 'in_stock',
    is_featured: true,
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222002',
    name: 'Aethel Spun Brass Task Lamp',
    slug: 'aethel-spun-brass-task-lamp',
    sku: 'AUR-LAMP-002',
    description: 'Modernist task and accent lamp forged in heavy brushed brass. Features dual-axis articulation, weighted conical base, and warm 2700K ambient illumination.',
    category_id: '11111111-1111-1111-1111-111111111002',
    regular_price: 340.00,
    discount_price: null,
    main_image: brassLampImg,
    additional_images: [],
    stock_quantity: 8,
    availability_status: 'in_stock',
    is_featured: true,
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222003',
    name: 'Vesna Textured Stoneware Amphora',
    slug: 'vesna-textured-stoneware-amphora',
    sku: 'AUR-VASE-003',
    description: 'Hand-thrown coarse stoneware ceramic vase finished in a raw volcanic matte texture. Organic pinched contours make each individual vessel an irreproducible sculptural work.',
    category_id: '11111111-1111-1111-1111-111111111003',
    regular_price: 185.00,
    discount_price: 145.00,
    main_image: ceramicVaseImg,
    additional_images: [],
    stock_quantity: 19,
    availability_status: 'in_stock',
    is_featured: true,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222004',
    name: 'Fluted Roman Travertine Coffee Table',
    slug: 'fluted-roman-travertine-coffee-table',
    sku: 'AUR-TABL-004',
    description: 'Low-profile monolithic coffee table sculpted from honed Italian travertine stone with fluted architectural perimeter columns and soft radiused corners.',
    category_id: '11111111-1111-1111-1111-111111111004',
    regular_price: 1450.00,
    discount_price: 1280.00,
    main_image: travertineTableImg,
    additional_images: [],
    stock_quantity: 3,
    availability_status: 'low_stock',
    is_featured: true,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222005',
    name: 'Oat Waffle Merino Living Blanket',
    slug: 'oat-waffle-merino-living-blanket',
    sku: 'AUR-TEXT-005',
    description: 'Generously sized 100% Australian extra-fine merino wool throw blanket woven in a deep waffle structure for breathable insulation and natural tactile drape.',
    category_id: '11111111-1111-1111-1111-111111111005',
    regular_price: 220.00,
    discount_price: null,
    main_image: woolThrowImg,
    additional_images: [],
    stock_quantity: 22,
    availability_status: 'in_stock',
    is_featured: false,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: '33333333-3333-3333-3333-333333333001',
    order_number: 'AUR-20261023-08241F',
    customer_name: 'Helena Lindqvist',
    customer_phone: '+1 (555) 392-8812',
    customer_email: 'helena.l@nordicdesign.com',
    shipping_address: '742 Evergreen Terrace, Apt 4B',
    city: 'Seattle',
    postal_code: '98101',
    order_notes: 'Please leave with concierge if unavailable.',
    subtotal: 790.00,
    delivery_charge: 0.00,
    total_amount: 790.00,
    payment_method: 'cash_on_delivery',
    payment_status: 'pending',
    order_status: 'confirmed',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    items: [
      {
        id: '44444444-4444-4444-4444-444444444001',
        product_id: '22222222-2222-2222-2222-222222222001',
        product_name: 'Klint Solid Oak Bouclé Armchair',
        product_sku: 'AUR-CHAIR-001',
        unit_price: 790.00,
        quantity: 1,
        line_total: 790.00,
      },
    ],
  },
];
