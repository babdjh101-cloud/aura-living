import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product, Category } from '../types';
import { fetchProducts } from '../services/products';
import { fetchCategories } from '../services/categories';
import { ProductGrid } from '../components/products/ProductGrid';
import { ProductFilters } from '../components/products/ProductFilters';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const categoryParam = searchParams.get('category') || 'all';
  const filterParam = searchParams.get('filter') || '';
  const searchParam = searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price_asc' | 'price_desc'>(
    filterParam === 'featured' ? 'featured' : 'newest'
  );

  // Sync state with URL params
  useEffect(() => {
    if (categoryParam) setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [{ products: prods }, cats] = await Promise.all([
          fetchProducts({
            categorySlug: selectedCategory,
            search: searchQuery,
            availability: availabilityFilter,
            sortBy,
            isFeatured: filterParam === 'featured',
          }),
          fetchCategories(),
        ]);
        setProducts(prods);
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [selectedCategory, searchQuery, availabilityFilter, sortBy, filterParam]);

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    const newParams = new URLSearchParams(searchParams);
    if (slug === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', slug);
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const newParams = new URLSearchParams(searchParams);
    if (!query) {
      newParams.delete('search');
    } else {
      newParams.set('search', query);
    }
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setAvailabilityFilter('all');
    setSortBy('featured');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Page Header */}
      <div className="mb-8">
        <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold block mb-1">
          Catalog & Works
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-normal text-stone-900 tracking-tight">
          All Studio Pieces
        </h1>
        <p className="text-sm text-stone-500 mt-1 max-w-xl">
          Architectural furniture, lighting, and ceramics crafted from raw travertine, solid oak, and coarse stoneware.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <ProductFilters
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortChange={setSortBy}
        availabilityFilter={availabilityFilter}
        onAvailabilityChange={setAvailabilityFilter}
        totalResults={products.length}
      />

      {/* Product Grid */}
      <ProductGrid
        products={products}
        isLoading={isLoading}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
};
