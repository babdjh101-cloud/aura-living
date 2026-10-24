import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Truck, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { validateCheckoutForm, CheckoutFormErrors } from '../lib/validations';
import { submitOrder } from '../services/orders';
import { formatCurrency } from '../lib/formatters';

export const CheckoutPage: React.FC = () => {
  const { cart, subtotal, deliveryCharge, total, clearCart } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    shipping_address: '',
    city: '',
    postal_code: '',
    order_notes: '',
  });

  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-serif font-normal text-stone-900 mb-2">No Items to Checkout</h1>
        <p className="text-sm text-stone-500 mb-6">
          Your shopping bag is empty. Please select pieces from our catalog before completing checkout.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse Catalog</span>
        </Link>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof CheckoutFormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmissionError(null);

    // Validate customer input
    const validation = validateCheckoutForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare payload with product IDs & quantities
      // (Prices and stock are re-verified on the database side)
      const payload = {
        ...formData,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      };

      const result = await submitOrder(payload, cart);

      if (result.success && result.order_number) {
        clearCart();
        navigate(`/order-confirmation/${result.order_number}`);
      } else {
        setSubmissionError('Could not finalize order. Please review your details and try again.');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setSubmissionError(err.message || 'An error occurred while securing your order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="mb-8">
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-xs text-stone-500 hover:text-stone-900 mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Shopping Bag</span>
        </Link>
        <h1 className="text-3xl font-serif font-normal text-stone-900 tracking-tight">
          Delivery & Checkout
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Complete your delivery details. Cash on Delivery is confirmed upon dispatch.
        </p>
      </div>

      {submissionError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Order placement failed</span>
            <span>{submissionError}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-8">
          {/* Customer & Contact Section */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stone-200/80 shadow-xs space-y-5">
            <h2 className="text-base font-semibold text-stone-900 pb-2 border-b border-stone-100">
              1. Recipient Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  placeholder="e.g. Helena Lindqvist"
                  className={`w-full px-3.5 py-2 text-sm bg-stone-50/60 border rounded-lg focus:outline-none focus:ring-1 focus:bg-white transition-all ${
                    errors.customer_name
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-stone-200 focus:ring-stone-900'
                  }`}
                />
                {errors.customer_name && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.customer_name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Contact Phone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                  className={`w-full px-3.5 py-2 text-sm bg-stone-50/60 border rounded-lg focus:outline-none focus:ring-1 focus:bg-white transition-all ${
                    errors.customer_phone
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-stone-200 focus:ring-stone-900'
                  }`}
                />
                {errors.customer_phone && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.customer_phone}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Email Address <span className="text-stone-400 font-normal">(for tracking and invoice)</span>
                </label>
                <input
                  type="email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleInputChange}
                  placeholder="helena@example.com"
                  className={`w-full px-3.5 py-2 text-sm bg-stone-50/60 border rounded-lg focus:outline-none focus:ring-1 focus:bg-white transition-all ${
                    errors.customer_email
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-stone-200 focus:ring-stone-900'
                  }`}
                />
                {errors.customer_email && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.customer_email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Address Section */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stone-200/80 shadow-xs space-y-5">
            <h2 className="text-base font-semibold text-stone-900 pb-2 border-b border-stone-100">
              2. Shipping Destination
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Street Address & Apartment / Suite <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="shipping_address"
                  value={formData.shipping_address}
                  onChange={handleInputChange}
                  placeholder="Street name, house number, floor"
                  className={`w-full px-3.5 py-2 text-sm bg-stone-50/60 border rounded-lg focus:outline-none focus:ring-1 focus:bg-white transition-all ${
                    errors.shipping_address
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-stone-200 focus:ring-stone-900'
                  }`}
                />
                {errors.shipping_address && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.shipping_address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    City / Municipality <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Seattle, WA"
                    className={`w-full px-3.5 py-2 text-sm bg-stone-50/60 border rounded-lg focus:outline-none focus:ring-1 focus:bg-white transition-all ${
                      errors.city
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-stone-200 focus:ring-stone-900'
                    }`}
                  />
                  {errors.city && <p className="text-[11px] text-rose-600 mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Postal Code <span className="text-stone-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    placeholder="98101"
                    className="w-full px-3.5 py-2 text-sm bg-stone-50/60 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Delivery Notes & Instructions <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <textarea
                  name="order_notes"
                  value={formData.order_notes}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Gate code, concierge instructions, preferred delivery window..."
                  className="w-full px-3.5 py-2 text-sm bg-stone-50/60 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-stone-900 pb-2 border-b border-stone-100">
              3. Payment Selection
            </h2>

            {/* Cash on Delivery Selection */}
            <div className="p-4 rounded-xl border-2 border-stone-900 bg-stone-50 flex items-start gap-3.5">
              <CheckCircle2 className="w-5 h-5 text-stone-900 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-stone-900">
                    Cash on Delivery (COD)
                  </span>
                  <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    Default & Verified
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Pay securely with cash or certified check directly to our white-glove courier after you inspect your pieces upon arrival.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-xl text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Securing and Verifying Order...</span>
              </>
            ) : (
              <span>Confirm Order with Cash on Delivery ({formatCurrency(total)})</span>
            )}
          </button>
        </form>

        {/* Sidebar Summary */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-2xl border border-stone-200/80 shadow-xs space-y-5 sticky top-24">
          <h2 className="text-base font-semibold text-stone-900 pb-2 border-b border-stone-100">
            Selected Pieces ({cart.reduce((s, i) => s + i.quantity, 0)})
          </h2>

          <div className="divide-y divide-stone-100 max-h-80 overflow-y-auto pr-1 space-y-3">
            {cart.map((item) => {
              const effectivePrice = item.product.discount_price ?? item.product.regular_price;
              return (
                <div key={item.product.id} className="pt-3 first:pt-0 flex items-center gap-3">
                  <img
                    src={item.product.main_image}
                    alt={item.product.name}
                    className="w-14 h-14 rounded-lg object-cover bg-stone-100 shrink-0 border border-stone-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-stone-900 truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                      Qty: {item.quantity} × {formatCurrency(effectivePrice)}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-stone-900">
                    {formatCurrency(effectivePrice * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-stone-100 space-y-2 text-xs text-stone-600">
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
            <div className="pt-2 border-t border-stone-100 flex justify-between text-base font-semibold text-stone-900">
              <span>Total Payable</span>
              <span className="font-mono tabular-nums text-lg">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl space-y-1.5 text-[11px] text-stone-500 border border-stone-100">
            <div className="flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-stone-700 shrink-0" />
              <span>White-glove courier handling</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-700 shrink-0" />
              <span>Prices verified server-side against catalog inventory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
