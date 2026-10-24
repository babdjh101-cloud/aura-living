import { AvailabilityStatus, OrderStatus } from '../types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatOrderStatus(status: OrderStatus): { label: string; color: string } {
  switch (status) {
    case 'pending':
      return { label: 'Pending Confirmation', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    case 'confirmed':
      return { label: 'Confirmed', color: 'bg-sky-50 text-sky-800 border-sky-200' };
    case 'processing':
      return { label: 'In Production', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
    case 'shipped':
      return { label: 'Dispatched', color: 'bg-blue-50 text-blue-800 border-blue-200' };
    case 'delivered':
      return { label: 'Delivered', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    case 'cancelled':
      return { label: 'Cancelled', color: 'bg-rose-50 text-rose-800 border-rose-200' };
    default:
      return { label: status, color: 'bg-stone-50 text-stone-700 border-stone-200' };
  }
}

export function formatAvailability(status: AvailabilityStatus): { label: string; available: boolean; tone: string } {
  switch (status) {
    case 'in_stock':
      return { label: 'In Stock', available: true, tone: 'text-emerald-700' };
    case 'low_stock':
      return { label: 'Limited Stock', available: true, tone: 'text-amber-700' };
    case 'out_of_stock':
      return { label: 'Currently Sold Out', available: false, tone: 'text-rose-700' };
    case 'discontinued':
      return { label: 'Archived Edition', available: false, tone: 'text-stone-500' };
  }
}
