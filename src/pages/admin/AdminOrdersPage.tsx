import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag, Eye, RefreshCw } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { fetchOrders, updateOrderStatus } from '../../services/orders';
import { formatCurrency, formatDateTime, formatOrderStatus } from '../../lib/formatters';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleQuickStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err: any) {
      alert(`Error updating order status: ${err.message}`);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.order_status === statusFilter;
    const matchesSearch =
      !search ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.city.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block mb-0.5">
            Logistics & Orders
          </span>
          <h1 className="text-2xl font-serif font-normal text-stone-900 tracking-tight">
            Order Fulfillment Registry ({orders.length})
          </h1>
        </div>

        <button
          onClick={loadOrders}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number, customer, phone, or city..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-white border border-stone-200 text-stone-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending Confirmation</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">In Production</option>
          <option value="shipped">Dispatched</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200/80 text-stone-500 uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-3 px-4">Order Reference</th>
                <th className="py-3 px-4">Customer & City</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-stone-400">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-stone-400">
                    No orders matching selected criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusInfo = formatOrderStatus(order.order_status);

                  return (
                    <tr key={order.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-stone-900">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="hover:underline flex items-center gap-1.5"
                        >
                          <span>{order.order_number}</span>
                        </Link>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-stone-900 block">{order.customer_name}</span>
                        <span className="text-[10px] text-stone-400">{order.city}</span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-stone-500">
                        {order.customer_phone}
                      </td>

                      <td className="py-3 px-4 text-stone-500 text-[11px]">
                        {formatDateTime(order.created_at)}
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                          Cash on Delivery
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={order.order_status}
                          onChange={(e) =>
                            handleQuickStatusChange(order.id, e.target.value as OrderStatus)
                          }
                          className={`text-[10px] font-semibold py-1 px-2 rounded border focus:outline-none cursor-pointer ${statusInfo.color}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold tabular-nums text-stone-900">
                        {formatCurrency(order.total_amount)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded inline-block"
                          title="View order details and items"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
