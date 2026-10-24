import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, Sparkles, Compass } from 'lucide-react';
import { Product, Category } from '../types';
import { fetchProducts } from '../services/products';
import { fetchCategories } from '../services/categories';
import { ProductCard } from '../components/products/ProductCard';
import { heroImg } from '../services/mockData';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [{ products }, cats] = await Promise.all([
          fetchProducts({ isFeatured: true, limit: 4 }),
          fetchCategories(),
        ]);
        setFeaturedProducts(products);
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load home page content:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* 1. Storefront Hero: Single campaign focal point */}
      <section className="relative bg-stone-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Text & Action column */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs uppercase tracking-widest text-stone-400 font-semibold block">
                Autumn 2026 Collection
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal tracking-tight text-white leading-[1.1] text-balance">
                Architectural living, crafted with natural materiality.
              </h1>
              <p className="text-base sm:text-lg text-stone-300 max-w-xl font-normal leading-relaxed">
                Sculptural armchairs, honed Roman travertine, and tactile ceramics designed to bring quiet warmth and architectural permanence to everyday spaces.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  to="/products"
                  className="px-6 py-3.5 text-sm font-medium text-stone-900 bg-white hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
                >
                  <span>Explore All Pieces</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/categories"
                  className="px-6 py-3.5 text-sm font-medium text-white border border-stone-700 hover:border-stone-500 rounded-lg transition-colors whitespace-nowrap"
                >
                  Browse by Category
                </Link>
              </div>
            </div>

            {/* Campaign Visual Frame */}
            <div className="lg:col-span-6">
              <div className="relative aspect-4/3 rounded-2xl overflow-hidden border border-stone-800 shadow-2xl">
                <img
                  src={heroImg}
                  alt="Architectural living room with oak armchair and travertine stone pedestal"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 text-xs text-stone-300 flex items-center justify-between backdrop-blur-xs bg-stone-900/40 p-2.5 rounded-lg border border-white/10">
                  <span className="font-medium text-white">The Oslo Suite</span>
                  <span className="text-stone-400">Solid White Oak · Honed Limestone</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Trust & Materiality Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-8 border-y border-stone-200 text-stone-700">
          <div className="flex items-start gap-3.5">
            <Truck className="w-5 h-5 text-stone-900 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-stone-900">Direct Courier Delivery</h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Complimentary tracked delivery on orders above $150. Inspect prior to payment with Cash on Delivery.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <ShieldCheck className="w-5 h-5 text-stone-900 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-stone-900">Genuine Craftsmanship</h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Hand-finished solid hardwoods, Italian travertine, and hand-thrown studio stoneware.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <Compass className="w-5 h-5 text-stone-900 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-stone-900">30-Day Studio Guarantee</h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Uncompromising standard of beauty. Hassle-free returns on non-customized pieces.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Collection Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-stone-200">
          <div>
            <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold block mb-1">
              Curated Selection
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-normal text-stone-900">
              Featured Editions
            </h2>
          </div>
          <Link
            to="/products"
            className="text-xs sm:text-sm font-medium text-stone-800 hover:text-stone-950 flex items-center gap-1.5 transition-colors"
          >
            <span>View All Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl h-96" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Category Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 pb-4 border-b border-stone-200">
          <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold block mb-1">
            Studio Disciplines
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-normal text-stone-900">
            Shop by Material & Form
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="group relative bg-white p-3.5 rounded-xl border border-stone-200/80 hover:border-stone-400 hover:shadow-xs transition-all flex flex-col"
            >
              <div className="aspect-square rounded-lg bg-stone-100 overflow-hidden mb-3">
                {cat.image_url && (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
              </div>
              <h3 className="text-sm font-semibold text-stone-900 group-hover:text-stone-700 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                {cat.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Studio Story / Editorial Rest Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-stone-100 rounded-2xl p-8 sm:p-12 lg:p-16 border border-stone-200/80">
          <div className="max-w-2xl space-y-4">
            <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold block">
              Craft & Origin
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-normal text-stone-900 leading-snug">
              Every curve honors the grain of raw wood and the grit of unglazed clay.
            </h2>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
              We reject rapid disposable design. Each piece in the AURA catalog is created in small studio batches alongside master woodworkers and ceramicists, ensuring enduring tactile presence for generations.
            </p>
            <div className="pt-2">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-900 hover:text-stone-700 border-b border-stone-900 pb-0.5"
              >
                <span>Read our design manifesto</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
