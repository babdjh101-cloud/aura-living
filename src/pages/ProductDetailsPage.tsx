import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Check,
  AlertCircle,
  Plus,
  Minus,
} from 'lucide-react';
import { Product } from '../types';
import { fetchProductBySlug, fetchProducts } from '../services/products';
import { formatCurrency, formatAvailability } from '../lib/formatters';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/products/ProductCard';

export const ProductDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [addedAnimation, setAddedAnimation] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      setIsLoading(true);
      try {
        const found = await fetchProductBySlug(slug);
        if (found) {
          setProduct(found);
          setSelectedImage(found.main_image);
          setQuantity(1);

          // Load related products from same category
          const { products: related } = await fetchProducts({
            categorySlug: found.category?.slug,
            limit: 3,
          });
          setRelatedProducts(related.filter((p) => p.id !== found.id));
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-pulse">
        <div className="h-6 bg-stone-200 rounded w-24 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 aspect-4/3 bg-stone-200 rounded-2xl" />
          <div className="lg:col-span-5 space-y-4">
            <div className="h-4 bg-stone-200 rounded w-1/4" />
            <div className="h-8 bg-stone-200 rounded w-3/4" />
            <div className="h-6 bg-stone-200 rounded w-1/3" />
            <div className="h-24 bg-stone-200 rounded" />
            <div className="h-12 bg-stone-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <AlertCircle className="w-10 h-10 text-stone-400 mx-auto mb-3" />
        <h1 className="text-2xl font-serif font-normal text-stone-900 mb-2">Piece Not Found</h1>
        <p className="text-sm text-stone-500 mb-6">
          The requested studio piece may have been archived or moved to a different collection.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Catalog</span>
        </Link>
      </div>
    );
  }

  const availability = formatAvailability(product.availability_status);
  const isAvailable = product.stock_quantity > 0 && product.availability_status !== 'out_of_stock';
  const hasDiscount = product.discount_price !== null && product.discount_price < product.regular_price;
  const allImages = [product.main_image, ...(product.additional_images || [])];

  const handleAddToCart = () => {
    if (!isAvailable) return;
    addToCart(product, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  // Structured Data Schema for Google Search
  const structuredData = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: [product.main_image],
    description: product.description,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: product.discount_price ?? product.regular_price,
      availability: isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Breadcrumb navigation */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-stone-500">
        <Link to="/" className="hover:text-stone-900 transition-colors">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link to="/products" className="hover:text-stone-900 transition-colors">
          Catalog
        </Link>
        {product.category && (
          <>
            <span aria-hidden="true">/</span>
            <Link
              to={`/products?category=${product.category.slug}`}
              className="hover:text-stone-900 transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span aria-hidden="true">/</span>
        <span className="text-stone-900 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
        {/* Left Column: Gallery */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Visual Preview */}
          <div className="aspect-4/3 rounded-2xl bg-stone-100 overflow-hidden border border-stone-200/80 shadow-2xs">
            <img
              src={selectedImage || product.main_image}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Additional Thumbnails if available */}
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedImage === img
                      ? 'border-stone-900 shadow-xs'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Contiguous Purchase Module */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-xs sticky top-24 space-y-6">
          {/* Header Metadata */}
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
              <span className="uppercase tracking-wider font-medium">
                {product.category?.name || 'Architectural Object'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-stone-400">SKU: {product.sku}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-normal text-stone-900 tracking-tight leading-snug">
              {product.name}
            </h1>
          </div>

          {/* Pricing Row */}
          <div className="flex items-baseline gap-3 pt-2 pb-3 border-y border-stone-100">
            {hasDiscount ? (
              <>
                <span className="text-3xl font-semibold font-mono tabular-nums text-stone-900">
                  {formatCurrency(product.discount_price!)}
                </span>
                <span className="text-base font-mono tabular-nums text-stone-400 line-through">
                  {formatCurrency(product.regular_price)}
                </span>
                <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  Save {formatCurrency(product.regular_price - product.discount_price!)}
                </span>
              </>
            ) : (
              <span className="text-3xl font-semibold font-mono tabular-nums text-stone-900">
                {formatCurrency(product.regular_price)}
              </span>
            )}
          </div>

          {/* Stock Availability */}
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                product.stock_quantity > 3
                  ? 'bg-emerald-500'
                  : product.stock_quantity > 0
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            <span className={`font-medium ${availability.tone}`}>{availability.label}</span>
            {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
              <span className="text-stone-500 font-mono">({product.stock_quantity} remaining)</span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-stone-600 leading-relaxed font-normal">
            {product.description}
          </p>

          {/* Quantity and Add to Bag */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-600 font-medium">Quantity:</span>
              <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="p-2 text-stone-600 hover:text-stone-900 disabled:opacity-40 cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 text-sm font-mono font-medium text-stone-800">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  disabled={quantity >= product.stock_quantity}
                  className="p-2 text-stone-600 hover:text-stone-900 disabled:opacity-40 cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!isAvailable}
              className={`w-full py-3.5 px-6 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                addedAnimation
                  ? 'bg-emerald-700 text-white'
                  : isAvailable
                  ? 'bg-stone-900 hover:bg-stone-800 text-white'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Shopping Bag</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isAvailable ? 'Add to Bag' : 'Temporarily Out of Stock'}</span>
                </>
              )}
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-4 border-t border-stone-100 space-y-2 text-xs text-stone-500">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-stone-700 shrink-0" />
              <span>Complimentary insured shipping on orders over $150</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-stone-700 shrink-0" />
              <span>Cash on Delivery — pay only upon physical inspection</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <section className="mt-20 pt-12 border-t border-stone-200">
          <div className="mb-8">
            <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold block mb-1">
              Harmonizing Pieces
            </span>
            <h2 className="text-2xl font-serif font-normal text-stone-900">
              Related from this Studio Discipline
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
