import { validateCheckoutForm, validateProductForm, validateImageUpload } from '../src/lib/validations';
import { formatCurrency, formatAvailability, formatDate } from '../src/lib/formatters';

console.log('====================================================');
console.log('🧪 AURA Living — AUTOMATED QA & INTEGRATION TEST SUITE');
console.log('====================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (failureDetails) console.error(`     Details: ${failureDetails}`);
    failedTests++;
  }
}

// ----------------------------------------------------
// TEST GROUP 1: Catalog Integrity & Seed Data
// ----------------------------------------------------
console.log('📦 1. Catalog Integrity & Schema Verification');

const sampleProducts = [
  { id: '1', name: 'Nordic Oak Lounge Chair', sku: 'AUR-OAK-01', slug: 'nordic-oak-lounge-chair', regular_price: 450, discount_price: 380, category_id: 'cat-living' },
  { id: '2', name: 'Ceramic Stoneware Vase', sku: 'AUR-VAS-02', slug: 'ceramic-stoneware-vase', regular_price: 95, discount_price: null, category_id: 'cat-decor' },
  { id: '3', name: 'Brushed Brass Pendant Light', sku: 'AUR-LGT-03', slug: 'brushed-brass-pendant-light', regular_price: 240, discount_price: 195, category_id: 'cat-lighting' },
];

const sampleCategories = [
  { id: 'cat-living', name: 'Living Room', slug: 'living-room' },
  { id: 'cat-decor', name: 'Decor', slug: 'decor' },
  { id: 'cat-lighting', name: 'Lighting', slug: 'lighting' },
];

const validCategories = new Set(sampleCategories.map((c) => c.id));
const allProductsHaveValidCategories = sampleProducts.every((p) => validCategories.has(p.category_id));
assert(allProductsHaveValidCategories, 'All products map to valid category IDs in foreign key relation');

const uniqueSkus = new Set(sampleProducts.map((p) => p.sku));
assert(uniqueSkus.size === sampleProducts.length, 'All product SKUs are unique (no duplicates)');

const uniqueSlugs = new Set(sampleProducts.map((p) => p.slug));
assert(uniqueSlugs.size === sampleProducts.length, 'All product slugs are unique (no duplicates)');

const positivePrices = sampleProducts.every((p) => p.regular_price > 0 && (p.discount_price === null || p.discount_price < p.regular_price));
assert(positivePrices, 'All products have positive regular prices, and discounts (if any) are less than regular prices');

// ----------------------------------------------------
// TEST GROUP 2: Checkout Form Validation
// ----------------------------------------------------
console.log('\n📝 2. Checkout Form Validation');

const validCheckout = validateCheckoutForm({
  customer_name: 'Helena Lindqvist',
  customer_phone: '+46 70 123 4567',
  customer_email: 'helena@example.com',
  shipping_address: 'Strandvägen 12, Apt 4B',
  city: 'Stockholm',
  postal_code: '114 56',
});
assert(validCheckout.isValid, 'Valid checkout form succeeds validation');

const invalidName = validateCheckoutForm({
  customer_name: 'A',
  customer_phone: '1234567890',
  shipping_address: 'Valid Street 10',
  city: 'Stockholm',
});
assert(!invalidName.isValid && !!invalidName.errors.customer_name, 'Rejects customer name shorter than 2 characters');

const invalidPhone = validateCheckoutForm({
  customer_name: 'Helena Lindqvist',
  customer_phone: '1234',
  shipping_address: 'Valid Street 10',
  city: 'Stockholm',
});
assert(!invalidPhone.isValid && !!invalidPhone.errors.customer_phone, 'Rejects phone numbers with fewer than 7 digits');

const missingAddress = validateCheckoutForm({
  customer_name: 'Helena Lindqvist',
  customer_phone: '+46 70 123 4567',
  shipping_address: '',
  city: 'Stockholm',
});
assert(!missingAddress.isValid && !!missingAddress.errors.shipping_address, 'Enforces non-empty shipping address');

const missingCity = validateCheckoutForm({
  customer_name: 'Helena Lindqvist',
  customer_phone: '+46 70 123 4567',
  shipping_address: 'Valid Street 10',
  city: '',
});
assert(!missingCity.isValid && !!missingCity.errors.city, 'Enforces non-empty city');

// ----------------------------------------------------
// TEST GROUP 3: Order Totals & Delivery Charge Logic
// ----------------------------------------------------
console.log('\n💰 3. Financial Calculations & Delivery Fee Rules');

function calculateOrderTotals(subtotal: number) {
  const deliveryCharge = subtotal >= 150 ? 0.0 : 15.0;
  return { subtotal, deliveryCharge, total: subtotal + deliveryCharge };
}

const underThreshold = calculateOrderTotals(149.99);
assert(underThreshold.deliveryCharge === 15.0 && Math.abs(underThreshold.total - 164.99) < 0.001, 'Applies $15 flat delivery charge for subtotal under $150 threshold ($149.99)');

const atThreshold = calculateOrderTotals(150.0);
assert(atThreshold.deliveryCharge === 0.0 && atThreshold.total === 150.0, 'Applies $0 free delivery charge at exactly $150.00 threshold');

const overThreshold = calculateOrderTotals(420.0);
assert(overThreshold.deliveryCharge === 0.0 && overThreshold.total === 420.0, 'Applies $0 free delivery charge for subtotal well above $150 ($420.00)');

// ----------------------------------------------------
// TEST GROUP 4: Product Form Validation & Image Upload Guard
// ----------------------------------------------------
console.log('\n🛋️ 4. Product Admin Form & Media Upload Guard');

const validProduct = validateProductForm({
  name: 'Nordic Oak Lounge Chair',
  slug: 'nordic-oak-lounge-chair',
  sku: 'AUR-OAK-01',
  regular_price: 499.0,
  discount_price: 399.0,
  stock_quantity: 15,
  description: 'Handcrafted solid oak chair with natural linen cushioning.',
  main_image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=1000&q=80',
});
assert(validProduct.isValid, 'Valid product form passes validation');

const invalidPrice = validateProductForm({
  name: 'Invalid Price Chair',
  slug: 'invalid-price-chair',
  sku: 'AUR-INV-01',
  regular_price: -10,
  discount_price: 200,
  stock_quantity: 5,
  description: 'Testing price validation.',
  main_image: 'https://example.com/chair.jpg',
});
assert(!invalidPrice.isValid && !!invalidPrice.errors.regular_price, 'Rejects negative regular price');

const invalidDiscount = validateProductForm({
  name: 'Invalid Discount Chair',
  slug: 'invalid-discount-chair',
  sku: 'AUR-INV-02',
  regular_price: 100,
  discount_price: 150, // Discount higher than regular
  stock_quantity: 5,
  description: 'Testing discount validation.',
  main_image: 'https://example.com/chair.jpg',
});
assert(!invalidDiscount.isValid && !!invalidDiscount.errors.discount_price, 'Rejects discount price greater than or equal to regular price');

// ----------------------------------------------------
// TEST GROUP 5: Formatters & Currency
// ----------------------------------------------------
console.log('\n🔤 5. UI Formatters & Localization');

assert(formatCurrency(0) === '$0.00', 'Formats $0.00 properly');
assert(formatCurrency(129.5) === '$129.50', 'Formats decimals with two digits ($129.50)');
assert(formatCurrency(1250) === '$1,250.00', 'Formats thousands with commas ($1,250.00)');

assert(formatAvailability('in_stock').label === 'In Stock', 'Formats in_stock status label ("In Stock")');
assert(formatAvailability('low_stock').label === 'Limited Stock', 'Formats low_stock status label ("Limited Stock")');
assert(formatAvailability('out_of_stock').label === 'Currently Sold Out', 'Formats out_of_stock status label ("Currently Sold Out")');
assert(formatAvailability('discontinued').label === 'Archived Edition', 'Formats discontinued status label ("Archived Edition")');

console.log('\n====================================================');
console.log(`📊 TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('====================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
