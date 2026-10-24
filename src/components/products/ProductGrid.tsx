import React from 'react';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';
import { PackageOpen } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  onResetFilters?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  onResetFilters,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-white rounded-xl border border-stone-200 overflow-hidden"
          >
            <div className="aspect-4/3 bg-stone-200/80 w-full" />
            <div className="p-4 space-y-3">
              <div className="h-3 bg-stone-200 rounded w-1/3" />
              <div className="h-5 bg-stone-200 rounded w-3/4" />
              <div className="pt-2 flex justify-between items-center border-t border-stone-100">
                <div className="h-5 bg-stone-200 rounded w-1/4" />
                <div className="h-8 bg-stone-200 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-20 px-4 text-center bg-white rounded-2xl border border-stone-200/80 max-w-xl mx-auto my-8">
        <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-500 mb-4">
          <PackageOpen className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-stone-900 mb-1">No products match your criteria</h3>
        <p className="text-sm text-stone-500 max-w-sm mx-auto mb-6">
          Try adjusting your search terms or clearing your active category filters to explore the rest of our catalog.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="px-4 py-2 text-xs font-medium text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
