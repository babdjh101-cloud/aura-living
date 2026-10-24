import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  AlertTriangle,
  DollarSign,
  Plus,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { getAdminMetrics, AdminMetrics } from '../../services/admin';
import { formatCurrency, formatDateTime, formatOrderStatus } from '../../lib/formatters';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (isLoading || !metrics) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-1/4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-stone-200" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Gross Sales Recorded',
      value: formatCurrency(metrics.totalRevenue),
      subtext: 'Cash on Delivery totals',
      icon: DollarSign,
      color: 'text-emerald-700 bg-emerald-50',
    },
    {
      label: 'Total Orders',
      value: metrics.totalOrders.toString(),
      subtext: `${metrics.pendingOrders} pending fulfillment`,
      icon: ShoppingBag,
      color: 'text-indigo-700 bg-indigo-50',
    },
    {
      label: 'Active Catalog Pieces',
      value: metrics.totalProducts.toString(),
      subtext: 'Across all categories',
      icon: Package,
      color: 'text-stone-700 bg-stone-100',
    },
    {
      label: 'Low Stock Alerts',
      value: metrics.lowStockProducts.toString(),
      subtext: 'Items <= 3 units remaining',
      icon: AlertTriangle,
      color:
        metrics.lowStockProducts > 0
          ? 'text-amber-700 bg-amber-50'
          : 'text-stone-600 bg-stone-50',
    },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block mb-0.5">
            Operational Overview
          </span>
          <h1 className="text-2xl font-serif font-normal text-stone-900 tracking-tight">
            Studio Management Console
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadMetrics}
            className="p-2 text-stone-500 hover:text-stone-900 hover:bg-white rounded-lg transition-colors border border-stone-200/80 bg-white cursor-pointer"
            title="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs flex items-start justify-between"
            >
              <div>
                <span className="text-xs text-stone-500 font-medium block">{card.label}</span>
                <span className="text-2xl font-semibold font-mono tabular-nums text-stone-900 mt-1 block">
                  {card.value}
                </span>
                <span className="text-[11px] text-stone-400 mt-0.5 block">{card.subtext}</span>
              </div>
              <div className={`p-2.5 rounded-lg ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Split view: Recent Orders & Low Stock Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Orders */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200/80 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-stone-900">Recent Customer Orders</h2>
              <span className="text-[11px] text-stone-400">Latest orders awaiting dispatch</span>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-stone-100">
            {metrics.recentOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400">No orders recorded yet.</div>
            ) : (
              metrics.recentOrders.map((order) => {
                const status = formatOrderStatus(order.order_status);
                return (
                  <Link
                    key={order.id}
                    to={`/admin/orders/${order.id}`}
                    className="p-4 hover:bg-stone-50 transition-colors flex items-center justify-between gap-4 block"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-stone-900">
                          {order.customer_name}
                        </span>
                        <span className="text-[10px] font-mono text-stone-400">
                          {order.order_number}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-500 block mt-0.5">
                        {order.city} · {formatDateTime(order.created_at)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-semibold text-stone-900 block">
                        {formatCurrency(order.total_amount)}
                      </span>
                      <span
                        className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-medium border ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Low Stock Watchlist */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-stone-200/80 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-stone-900">Low Stock Inventory</h2>
              <span className="text-[11px] text-stone-400">Replenishment needed</span>
            </div>
            <Link
              to="/admin/products"
              className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-stone-100">
            {metrics.lowStockItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-emerald-700 bg-emerald-50/40">
                All catalog inventory levels healthy.
              </div>
            ) : (
              metrics.lowStockItems.map((prod) => (
                <div
                  key={prod.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-stone-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={prod.main_image}
                      alt={prod.name}
                      className="w-10 h-10 rounded-md object-cover bg-stone-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-stone-900 truncate">
                        {prod.name}
                      </h4>
                      <span className="text-[10px] font-mono text-stone-400 block">
                        SKU: {prod.sku}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                        prod.stock_quantity === 0
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {prod.stock_quantity} left
                    </span>
                    <Link
                      to={`/admin/products/${prod.id}/edit`}
                      className="text-xs font-medium text-stone-700 hover:text-stone-900 border border-stone-200 px-2 py-1 rounded hover:bg-stone-100"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
