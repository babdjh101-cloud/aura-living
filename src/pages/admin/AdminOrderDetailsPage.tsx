import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { fetchOrders, updateOrderStatus } from '../../services/orders';
import { formatCurrency, formatDateTime, formatOrderStatus } from '../../lib/formatters';

export const AdminOrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setIsLoading(true);
      try {
        const orders = await fetchOrders();
        const found = orders.find((o) => o.id === id);
        setOrder(found || null);
      } catch (err) {
        console.error('Failed to load order details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) return;
    try {
      const updated = await updateOrderStatus(order.id, newStatus);
      setOrder(updated);
      setStatusMessage(`Order status transitioned to "${newStatus}".`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        <div className="h-6 bg-stone-200 rounded w-1/4" />
        <div className="h-64 bg-white rounded-xl border border-stone-200" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="w-10 h-10 text-stone-400 mx-auto mb-3" />
        <h1 className="text-xl font-semibold text-stone-900 mb-2">Order Not Found</h1>
        <Link
          to="/admin/orders"
          className="text-xs font-semibold text-stone-700 underline"
        >
          Return to orders registry
        </Link>
      </div>
    );
  }

  const statusInfo = formatOrderStatus(order.order_status);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-5xl">
      {/* Toast message */}
      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Orders</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-serif font-normal text-stone-900 tracking-tight">
                Order {order.order_number}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${statusInfo.color}`}
              >
                {statusInfo.label}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Placed on {formatDateTime(order.created_at)} · Payment: Cash on Delivery (Pending Courier)
            </p>
          </div>

          {/* Quick status control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-600 font-medium">Update Status:</span>
            <select
              value={order.order_status}
              onChange={(e) => handleStatusUpdate(e.target.value as OrderStatus)}
              className="text-xs bg-white border border-stone-300 font-medium py-1.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 cursor-pointer"
            >
              <option value="pending">Pending Confirmation</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">In Production / Packing</option>
              <option value="shipped">Dispatched with Courier</option>
              <option value="delivered">Delivered to Recipient</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recipient Card */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-stone-400 font-semibold border-b border-stone-100 pb-2">
            Customer Information
          </h2>
          <div className="space-y-1.5 text-xs text-stone-700">
            <p className="font-semibold text-sm text-stone-900">{order.customer_name}</p>
            <p className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-stone-400" />
              <span className="font-mono">{order.customer_phone}</span>
            </p>
            {order.customer_email && (
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                <span>{order.customer_email}</span>
              </p>
            )}
          </div>
        </div>

        {/* Shipping Destination */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-stone-400 font-semibold border-b border-stone-100 pb-2">
            Destination & Delivery Notes
          </h2>
          <div className="space-y-1.5 text-xs text-stone-700">
            <p className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
              <span>
                {order.shipping_address}, {order.city} {order.postal_code || ''}
              </span>
            </p>
            {order.order_notes && (
              <div className="pt-2 border-t border-stone-100">
                <span className="text-[10px] uppercase text-stone-400 font-semibold block">
                  Delivery Instructions:
                </span>
                <p className="text-stone-600 italic mt-0.5 bg-stone-50 p-2 rounded">
                  &ldquo;{order.order_notes}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Itemized Table */}
      <div className="bg-white rounded-xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
            Order Items ({order.items?.length || 0})
          </h2>
          <span className="text-xs text-stone-400 font-mono">Invoice Records</span>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100 text-stone-500 uppercase text-[10px]">
              <th className="py-2.5 px-4">Item Name</th>
              <th className="py-2.5 px-4">SKU</th>
              <th className="py-2.5 px-4 text-center">Quantity</th>
              <th className="py-2.5 px-4 text-right">Unit Price</th>
              <th className="py-2.5 px-4 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {order.items?.map((item, idx) => (
              <tr key={idx} className="hover:bg-stone-50/50">
                <td className="py-3 px-4 font-medium text-stone-900">{item.product_name}</td>
                <td className="py-3 px-4 font-mono text-[11px] text-stone-500">{item.product_sku}</td>
                <td className="py-3 px-4 text-center font-mono">{item.quantity}</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums">
                  {formatCurrency(item.unit_price)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-stone-900">
                  {formatCurrency(item.line_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals breakdown */}
        <div className="bg-stone-50/60 p-5 border-t border-stone-100 flex justify-end">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal:</span>
              <span className="font-mono tabular-nums font-medium text-stone-900">
                {formatCurrency(order.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Courier Freight:</span>
              <span className="font-mono tabular-nums text-stone-800">
                {order.delivery_charge === 0 ? 'Complimentary' : formatCurrency(order.delivery_charge)}
              </span>
            </div>
            <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-semibold text-stone-900">
              <span>Total Payable (COD):</span>
              <span className="font-mono tabular-nums text-base">{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
