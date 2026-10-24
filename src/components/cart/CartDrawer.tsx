import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, ArrowRight, ShoppingBag, Plus, Minus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../lib/formatters';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    deliveryCharge,
    total,
    itemCount,
  } = useCart();

  const navigate = useNavigate();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCartOpen(false);
    };
    if (isCartOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF9F6] shadow-2xl flex flex-col justify-between border-l border-stone-200">
          {/* Header */}
          <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-stone-800" />
              <h2 className="text-base font-semibold text-stone-900">Your Shopping Bag</h2>
              <span className="text-xs text-stone-500 font-mono">({itemCount} items)</span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-stone-800">Your bag is empty</p>
                <p className="text-xs text-stone-500 max-w-xs mt-1 mb-6">
                  Explore our curated architectural furniture and ceramics to find your next centerpiece.
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/products');
                  }}
                  className="px-4 py-2 text-xs font-medium text-stone-900 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Browse Catalog
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const effectivePrice = item.product.discount_price ?? item.product.regular_price;
                return (
                  <div
                    key={item.product.id}
                    className="flex gap-4 p-3 bg-white rounded-xl border border-stone-200/80 shadow-2xs"
                  >
                    {/* Thumbnail */}
                    <img
                      src={item.product.main_image}
                      alt={item.product.name}
                      className="w-20 h-20 rounded-lg object-cover bg-stone-100 shrink-0 border border-stone-100"
                    />

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-medium">
                            {item.product.category?.name || 'Edition'}
                          </span>
                          <Link
                            to={`/products/${item.product.slug}`}
                            onClick={() => setIsCartOpen(false)}
                            className="text-sm font-semibold text-stone-900 hover:text-stone-700 line-clamp-1"
                          >
                            {item.product.name}
                          </Link>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                          title="Remove item"
                          aria-label={`Remove ${item.product.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                        {/* Stepper */}
                        <div className="flex items-center border border-stone-200 rounded-md bg-stone-50">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 text-stone-600 hover:text-stone-900 cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-mono font-medium text-stone-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock_quantity}
                            className={`p-1 text-stone-600 hover:text-stone-900 cursor-pointer ${
                              item.quantity >= item.product.stock_quantity ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <span className="text-xs font-mono font-semibold text-stone-900">
                          {formatCurrency(effectivePrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {cart.length > 0 && (
            <div className="p-5 bg-white border-t border-stone-200 space-y-3">
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums font-medium text-stone-900">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Courier Delivery</span>
                  <span className="font-mono tabular-nums text-stone-700">
                    {deliveryCharge === 0 ? (
                      <span className="text-emerald-700 font-medium">Complimentary</span>
                    ) : (
                      formatCurrency(deliveryCharge)
                    )}
                  </span>
                </div>
                {subtotal < 150 && (
                  <p className="text-[11px] text-stone-500 italic pt-0.5">
                    Add {formatCurrency(150 - subtotal)} more for free delivery
                  </p>
                )}
                <div className="pt-2 border-t border-stone-100 flex justify-between text-sm font-semibold text-stone-900">
                  <span>Total Amount</span>
                  <span className="font-mono tabular-nums text-base">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="py-2.5 px-3 text-center text-xs font-medium text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  View Bag
                </Link>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/checkout');
                  }}
                  className="py-2.5 px-3 flex items-center justify-center gap-1.5 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
