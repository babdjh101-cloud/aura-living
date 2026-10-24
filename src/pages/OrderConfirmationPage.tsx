import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, PackageCheck, Printer, ArrowRight, Truck, MapPin, Phone, Mail } from 'lucide-react';
import { Order } from '../types';
import { fetchOrderByNumber } from '../services/orders';
import { formatCurrency, formatDateTime, formatOrderStatus } from '../lib/formatters';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!orderNumber) return;
      setIsLoading(true);
      try {
        const found = await fetchOrderByNumber(orderNumber);
        setOrder(found);
      } catch (err) {
        console.error('Failed to load confirmed order:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrder();
  }, [orderNumber]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="w-16 h-16 bg-stone-200 rounded-full mx-auto mb-4" />
        <div className="h-6 bg-stone-200 rounded w-1/3 mx-auto mb-2" />
        <div className="h-4 bg-stone-200 rounded w-1/2 mx-auto" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-serif font-normal text-stone-900 mb-2">Order Reference Not Found</h1>
        <p className="text-sm text-stone-500 mb-6">
          We could not locate an order matching reference &ldquo;{orderNumber}&rdquo;.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors"
        >
          <span>Return to Storefront</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const statusInfo = formatOrderStatus(order.order_status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Success banner */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-8 sm:p-10 shadow-xs mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-emerald-800 font-semibold block mb-1">
              Order Confirmed & Logged
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-normal text-stone-900">
              Thank you, {order.customer_name}
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Order Reference:{' '}
              <span className="font-mono font-semibold text-stone-800">{order.order_number}</span>
              {' · '}Placed on {formatDateTime(order.created_at)}
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer shrink-0 print:hidden"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Receipt</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Status Card */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block">
            Fulfillment Status
          </span>
          <div className="inline-flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-medium border ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
          </div>
          <p className="text-xs text-stone-500 pt-1">
            Preparing for studio dispatch and white-glove transport.
          </p>
        </div>

        {/* Payment Terms */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block">
            Payment Term
          </span>
          <p className="text-sm font-semibold text-stone-900">Cash on Delivery (COD)</p>
          <p className="text-xs text-stone-500">
            Please prepare <strong className="font-mono text-stone-800">{formatCurrency(order.total_amount)}</strong> for delivery courier upon inspection.
          </p>
        </div>

        {/* Shipping Address */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs space-y-1.5">
          <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block">
            Delivery Destination
          </span>
          <p className="text-xs text-stone-800 font-medium">{order.shipping_address}</p>
          <p className="text-xs text-stone-500">{order.city} {order.postal_code || ''}</p>
          <p className="text-xs text-stone-500 flex items-center gap-1.5 pt-1">
            <Phone className="w-3 h-3 text-stone-400" />
            <span>{order.customer_phone}</span>
          </p>
        </div>
      </div>

      {/* Itemized Receipt Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden mb-8">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-900">Itemized Invoice Breakdown</h2>
          <span className="text-xs text-stone-400 font-mono">
            {order.items?.length || 1} piece(s)
          </span>
        </div>

        <div className="divide-y divide-stone-100">
          {order.items && order.items.length > 0 ? (
            order.items.map((item, idx) => (
              <div key={idx} className="p-5 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-stone-900">{item.product_name}</h4>
                  <div className="flex items-center gap-2 text-xs text-stone-500 font-mono mt-0.5">
                    <span>SKU: {item.product_sku}</span>
                    <span aria-hidden="true">·</span>
                    <span>Qty: {item.quantity} × {formatCurrency(item.unit_price)}</span>
                  </div>
                </div>
                <span className="text-sm font-mono font-semibold text-stone-900">
                  {formatCurrency(item.line_total)}
                </span>
              </div>
            ))
          ) : (
            <div className="p-5 text-sm text-stone-500">No items recorded.</div>
          )}
        </div>

        {/* Totals */}
        <div className="bg-stone-50/70 p-6 space-y-2 border-t border-stone-100 text-xs">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal</span>
            <span className="font-mono tabular-nums font-medium text-stone-900">
              {formatCurrency(order.subtotal)}
            </span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Insured Courier Delivery</span>
            <span className="font-mono tabular-nums text-stone-800">
              {order.delivery_charge === 0 ? (
                <span className="text-emerald-700 font-medium">Complimentary</span>
              ) : (
                formatCurrency(order.delivery_charge)
              )}
            </span>
          </div>
          <div className="pt-2 border-t border-stone-200 flex justify-between text-base font-semibold text-stone-900">
            <span>Total Payable on Delivery</span>
            <span className="font-mono tabular-nums text-lg">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between print:hidden">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700 hover:text-stone-900"
        >
          <span>Continue Browsing Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
