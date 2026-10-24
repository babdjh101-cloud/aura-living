import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Category } from '../../types';

interface ProductFiltersProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: 'featured' | 'newest' | 'price_asc' | 'price_desc';
  onSortChange: (sort: 'featured' | 'newest' | 'price_asc' | 'price_desc') => void;
  availabilityFilter: string;
  onAvailabilityChange: (val: string) => void;
  totalResults: number;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  availabilityFilter,
  onAvailabilityChange,
  totalResults,
}) => {
  return (
    <div className="space-y-4 mb-8">
      {/* Search and Sort Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products by title, SKU, or material..."
            className="w-full pl-10 pr-9 py-2 text-sm bg-white border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort & Availability Controls */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Availability filter */}
          <select
            value={availabilityFilter}
            onChange={(e) => onAvailabilityChange(e.target.value)}
            className="text-xs bg-white border border-stone-200 text-stone-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 cursor-pointer"
            aria-label="Filter by availability"
          >
            <option value="all">All Availability</option>
            <option value="in_stock">In Stock Only</option>
            <option value="low_stock">Limited Stock</option>
          </select>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500 hidden sm:inline" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="text-xs bg-white border border-stone-200 text-stone-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 cursor-pointer font-medium"
              aria-label="Sort products"
            >
              <option value="featured">Featured First</option>
              <option value="newest">Newest Releases</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Segmented Category Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
        <button
          onClick={() => onSelectCategory('all')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white text-stone-600 border border-stone-200/80 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          All Collections ({totalResults})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.slug)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategory === cat.slug
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200/80 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
};
