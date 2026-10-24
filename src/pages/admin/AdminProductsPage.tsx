import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Star,
  Package,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Product, Category } from '../../types';
import { fetchProducts, updateProduct, deleteProduct } from '../../services/products';
import { fetchCategories } from '../../services/categories';
import { formatCurrency, formatAvailability } from '../../lib/formatters';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [{ products: prods }, cats] = await Promise.all([
        fetchProducts({
          search,
          categorySlug: selectedCategory,
          limit: 100,
        }),
        fetchCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load products list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedCategory]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      const updated = await updateProduct(product.id, {
        is_featured: !product.is_featured,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_featured: updated.is_featured } : p))
      );
      showToast(`Updated "${product.name}" featured status.`);
    } catch (err: any) {
      alert(`Error toggling featured: ${err.message}`);
    }
  };

  const handleInlineStockChange = async (productId: string, newStock: number) => {
    if (newStock < 0 || isNaN(newStock)) return;
    try {
      const updated = await updateProduct(productId, {
        stock_quantity: newStock,
        availability_status:
          newStock === 0 ? 'out_of_stock' : newStock <= 3 ? 'low_stock' : 'in_stock',
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, stock_quantity: updated.stock_quantity, availability_status: updated.availability_status }
            : p
        )
      );
      showToast('Inventory level synchronized.');
    } catch (err: any) {
      alert(`Error updating stock: ${err.message}`);
    }
  };

  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeletingLoading(true);
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirmId(null);
      showToast('Product successfully removed from catalog.');
    } catch (err: any) {
      alert(`Failed to delete product: ${err.message}`);
    } finally {
      setIsDeletingLoading(false);
    }
  };

  const productToDelete = products.find((p) => p.id === deleteConfirmId);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl">
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-rose-50 text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-stone-900">
                  Delete Product from Catalog?
                </h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Are you sure you want to delete <strong className="text-stone-800">{productToDelete.name}</strong> (SKU: {productToDelete.sku})? This permanently deletes the catalog row and cleans up associated images from Supabase Storage.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
              <button
                type="button"
                disabled={isDeletingLoading}
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingLoading}
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isDeletingLoading ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block mb-0.5">
            Inventory & Catalog
          </span>
          <h1 className="text-2xl font-serif font-normal text-stone-900 tracking-tight">
            Products Directory ({products.length})
          </h1>
        </div>

        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, SKU, or keyword..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-xs bg-white border border-stone-200 text-stone-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200/80 text-stone-500 uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-3 px-4">Piece</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Pricing</th>
                <th className="py-3 px-4">Stock Qty</th>
                <th className="py-3 px-4">Availability</th>
                <th className="py-3 px-4 text-center">Featured</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-stone-400">
                    Loading inventory records...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-stone-400">
                    No products found matching query.
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const availability = formatAvailability(prod.availability_status);
                  const isDeleting = deleteConfirmId === prod.id;

                  return (
                    <tr key={prod.id} className="hover:bg-stone-50/70 transition-colors">
                      {/* Name & Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.main_image}
                            alt={prod.name}
                            className="w-11 h-11 rounded-lg object-cover bg-stone-100 shrink-0 border border-stone-100"
                          />
                          <div className="min-w-0 max-w-xs">
                            <span className="font-semibold text-stone-900 block truncate">
                              {prod.name}
                            </span>
                            <Link
                              to={`/products/${prod.slug}`}
                              target="_blank"
                              className="text-[10px] text-stone-400 hover:text-stone-700 inline-flex items-center gap-1"
                            >
                              <span>View on store</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono text-[11px] text-stone-500">{prod.sku}</td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="text-stone-600">{prod.category?.name || '—'}</span>
                      </td>

                      {/* Pricing */}
                      <td className="py-3 px-4 font-mono tabular-nums">
                        {prod.discount_price ? (
                          <div>
                            <span className="font-semibold text-stone-900 block">
                              {formatCurrency(prod.discount_price)}
                            </span>
                            <span className="text-[10px] text-stone-400 line-through block">
                              {formatCurrency(prod.regular_price)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-semibold text-stone-900">
                            {formatCurrency(prod.regular_price)}
                          </span>
                        )}
                      </td>

                      {/* Stock Quantity (Inline update) */}
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min="0"
                          defaultValue={prod.stock_quantity}
                          onBlur={(e) =>
                            handleInlineStockChange(prod.id, parseInt(e.target.value, 10))
                          }
                          className="w-16 px-2 py-1 bg-stone-50 border border-stone-200 rounded font-mono text-center text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                        />
                      </td>

                      {/* Availability */}
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-medium ${availability.tone}`}>
                          {availability.label}
                        </span>
                      </td>

                      {/* Featured */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleFeatured(prod)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            prod.is_featured
                              ? 'text-amber-500 hover:text-amber-600'
                              : 'text-stone-300 hover:text-stone-500'
                          }`}
                          title={prod.is_featured ? 'Featured on home' : 'Click to feature'}
                        >
                          <Star
                            className="w-4 h-4"
                            fill={prod.is_featured ? 'currentColor' : 'none'}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/products/${prod.id}/edit`}
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded"
                            title="Edit product details & images"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(prod.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
