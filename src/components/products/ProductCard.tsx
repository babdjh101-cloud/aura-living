import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Check } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency, formatAvailability } from '../../lib/formatters';
import { useCart } from '../../context/CartContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [imageFailed, setImageFailed] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const availability = formatAvailability(product.availability_status);
  const isAvailable = product.stock_quantity > 0 && product.availability_status !== 'out_of_stock';
  const hasDiscount = product.discount_price !== null && product.discount_price < product.regular_price;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAvailable) return;

    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-xl border border-stone-200/80 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Product Image Frame */}
      <Link
        to={`/products/${product.slug}`}
        className="relative aspect-4/3 w-full bg-stone-100 overflow-hidden block"
      >
        {!imageFailed ? (
          <img
            src={product.main_image}
            alt={product.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 text-stone-400 p-4 text-center">
            <span className="text-xs uppercase tracking-wider font-medium text-stone-500">
              {product.category?.name || 'Studio Object'}
            </span>
            <span className="text-sm font-semibold text-stone-700 mt-1">{product.name}</span>
          </div>
        )}

        {/* Quiet text label (no pill badges) */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {product.is_featured && (
            <span className="text-[11px] font-medium tracking-wider uppercase text-stone-900 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-sm">
              Featured
            </span>
          )}
          {!isAvailable && (
            <span className="text-[11px] font-medium tracking-wider uppercase text-rose-700 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-sm">
              Sold Out
            </span>
          )}
        </div>
      </Link>

      {/* Card Content & Metadata */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Category & Status Line */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1">
            <span className="uppercase tracking-wider text-[11px]">
              {product.category?.name || 'Collection'}
            </span>
            <span aria-hidden="true">·</span>
            <span className={`text-[11px] ${availability.tone}`}>
              {product.stock_quantity <= 3 && product.stock_quantity > 0
                ? `Only ${product.stock_quantity} left`
                : availability.label}
            </span>
          </div>

          {/* Product Title */}
          <h3 className="text-base font-semibold text-stone-900 tracking-tight leading-snug line-clamp-1 group-hover:text-stone-700 transition-colors">
            <Link to={`/products/${product.slug}`}>
              {product.name}
            </Link>
          </h3>
        </div>

        {/* Price & Action Row */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
          <div className="flex items-baseline gap-2 font-mono tabular-nums">
            {hasDiscount ? (
              <>
                <span className="text-base font-semibold text-stone-900">
                  {formatCurrency(product.discount_price!)}
                </span>
                <span className="text-xs text-stone-400 line-through">
                  {formatCurrency(product.regular_price)}
                </span>
              </>
            ) : (
              <span className="text-base font-semibold text-stone-900">
                {formatCurrency(product.regular_price)}
              </span>
            )}
          </div>

          {/* Functional Quick Add Button */}
          <button
            onClick={handleQuickAdd}
            disabled={!isAvailable}
            className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : isAvailable
                ? 'bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-800'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            }`}
            aria-label={`Add ${product.name} to cart`}
            title={isAvailable ? 'Quick Add to Bag' : 'Out of Stock'}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
