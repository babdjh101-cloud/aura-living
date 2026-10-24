import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../lib/formatters';

export const CartPage: React.FC = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    deliveryCharge,
    total,
    itemCount,
  } = useCart();

  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-4">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-serif font-normal text-stone-900 mb-2">Your Bag is Empty</h1>
        <p className="text-sm text-stone-500 mb-8 max-w-sm mx-auto">
          Explore our collection of sculptural furniture, lighting, and ceramics to begin curating your living space.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-xs"
        >
          <span>Discover Collection</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="flex items-end justify-between mb-8 pb-4 border-b border-stone-200">
        <div>
          <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold block mb-1">
            Order Review
          </span>
          <h1 className="text-3xl font-serif font-normal text-stone-900">
            Shopping Bag ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </h1>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
        >
          Clear entire bag
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Items Table */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => {
            const effectivePrice = item.product.discount_price ?? item.product.regular_price;
            return (
              <div
                key={item.product.id}
                className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.product.main_image}
                    alt={item.product.name}
                    className="w-20 h-20 rounded-lg object-cover bg-stone-100 shrink-0 border border-stone-100"
                  />
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-stone-400 font-medium block">
                      {item.product.category?.name || 'Studio Piece'}
                    </span>
                    <Link
                      to={`/products/${item.product.slug}`}
                      className="text-base font-semibold text-stone-900 hover:text-stone-700 transition-colors line-clamp-1"
                    >
                      {item.product.name}
                    </Link>
                    <span className="text-xs text-stone-500 font-mono block mt-0.5">
                      {formatCurrency(effectivePrice)} each
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1.5 text-stone-600 hover:text-stone-900 cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-mono font-medium text-stone-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock_quantity}
                      className="p-1.5 text-stone-600 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <span className="text-sm font-mono font-semibold tabular-nums text-stone-900 min-w-20 text-right">
                    {formatCurrency(effectivePrice * item.quantity)}
                  </span>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                    aria-label={`Remove ${item.product.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="pt-4">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4 bg-white p-6 sm:p-7 rounded-2xl border border-stone-200/80 shadow-xs space-y-5">
          <h2 className="text-base font-semibold text-stone-900 pb-3 border-b border-stone-100">
            Order Summary
          </h2>

          <div className="space-y-3 text-sm text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums font-medium text-stone-900">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Courier Delivery</span>
              <span className="font-mono tabular-nums text-stone-800">
                {deliveryCharge === 0 ? (
                  <span className="text-emerald-700 font-medium">Complimentary</span>
                ) : (
                  formatCurrency(deliveryCharge)
                )}
              </span>
            </div>

            {subtotal >= 150 ? (
              <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-md font-medium">
                Complimentary white-glove shipping applied.
              </p>
            ) : (
              <p className="text-xs text-stone-500 bg-stone-50 p-2 rounded-md">
                Add {formatCurrency(150 - subtotal)} more to qualify for complimentary delivery.
              </p>
            )}

            <div className="pt-3 border-t border-stone-100 flex justify-between text-base font-semibold text-stone-900">
              <span>Total Estimated</span>
              <span className="font-mono tabular-nums text-lg">{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full py-3.5 px-6 rounded-lg text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[11px] text-stone-400 text-center leading-relaxed">
            Taxes and courier verification calculated at checkout. Cash on Delivery is supported.
          </p>
        </div>
      </div>
    </div>
  );
};
