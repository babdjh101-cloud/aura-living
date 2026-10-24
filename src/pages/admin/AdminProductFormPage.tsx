import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Check,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { Category, Product, AvailabilityStatus } from '../../types';
import { fetchProductById, createProduct, updateProduct } from '../../services/products';
import { fetchCategories } from '../../services/categories';
import { validateProductForm } from '../../lib/validations';
import { ImageUploadField } from '../../components/admin/ImageUploadField';

export const AdminProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sku: '',
    description: '',
    category_id: '',
    regular_price: '',
    discount_price: '',
    stock_quantity: '10',
    availability_status: 'in_stock' as AvailabilityStatus,
    is_featured: false,
    main_image: '',
    additional_images: [] as string[],
  });

  // Load initial product if editing
  useEffect(() => {
    async function init() {
      try {
        const cats = await fetchCategories();
        setCategories(cats);

        if (isEditing && id) {
          const prod = await fetchProductById(id);
          if (prod) {
            setFormData({
              name: prod.name,
              slug: prod.slug,
              sku: prod.sku,
              description: prod.description,
              category_id: prod.category_id || '',
              regular_price: prod.regular_price.toString(),
              discount_price: prod.discount_price ? prod.discount_price.toString() : '',
              stock_quantity: prod.stock_quantity.toString(),
              availability_status: prod.availability_status,
              is_featured: prod.is_featured,
              main_image: prod.main_image,
              additional_images: prod.additional_images || [],
            });
          } else {
            setErrorMessage('Product not found in catalog.');
          }
        } else if (cats.length > 0) {
          setFormData((prev) => ({ ...prev, category_id: cats[0].id }));
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to initialize form');
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [id, isEditing]);

  // Auto-generate slug and SKU when name changes (only in add mode)
  const handleNameChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!isEditing && (!formData.slug || formData.slug === '')) {
      const skuSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      setFormData((prev) => ({
        ...prev,
        name: val,
        slug,
        sku: prev.sku || `AUR-${skuSuffix}`,
      }));
    } else {
      setFormData((prev) => ({ ...prev, name: val }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const regPrice = parseFloat(formData.regular_price);
    const discPrice = formData.discount_price ? parseFloat(formData.discount_price) : null;
    const stockQty = parseInt(formData.stock_quantity, 10);

    const validation = validateProductForm({
      name: formData.name,
      slug: formData.slug,
      sku: formData.sku,
      regular_price: regPrice,
      discount_price: discPrice,
      stock_quantity: stockQty,
      description: formData.description,
      main_image: formData.main_image,
    });

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        sku: formData.sku.trim(),
        description: formData.description.trim(),
        category_id: formData.category_id || null,
        regular_price: regPrice,
        discount_price: discPrice,
        stock_quantity: stockQty,
        availability_status: formData.availability_status,
        is_featured: formData.is_featured,
        main_image: formData.main_image,
        additional_images: formData.additional_images,
      };

      if (isEditing && id) {
        await updateProduct(id, payload);
      } else {
        await createProduct(payload);
      }

      navigate('/admin/products');
    } catch (err: any) {
      console.error('Save product error:', err);
      setErrorMessage(err.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center animate-pulse">
        <div className="h-6 bg-stone-200 rounded w-1/4 mx-auto mb-4" />
        <div className="h-64 bg-stone-200 rounded max-w-2xl mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl space-y-6">
      {/* Back button & title */}
      <div>
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Product Directory</span>
        </Link>
        <h1 className="text-2xl font-serif font-normal text-stone-900 tracking-tight">
          {isEditing ? `Edit: ${formData.name || 'Studio Piece'}` : 'Register New Studio Piece'}
        </h1>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details Card */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
          <h2 className="text-xs uppercase tracking-wider text-stone-400 font-semibold pb-2 border-b border-stone-100">
            Core Metadata & Identification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Product Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Klint Solid Oak Bouclé Armchair"
                className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white"
              />
              {formErrors.name && (
                <p className="text-[11px] text-rose-600 mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                URL Slug <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="klint-solid-oak-armchair"
                className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white"
              />
              {formErrors.slug && (
                <p className="text-[11px] text-rose-600 mt-1">{formErrors.slug}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                SKU / Catalog Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="AUR-CHAIR-001"
                className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white"
              />
              {formErrors.sku && <p className="text-[11px] text-rose-600 mt-1">{formErrors.sku}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Studio Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Availability Status
              </label>
              <select
                value={formData.availability_status}
                onChange={(e) =>
                  setFormData({ ...formData, availability_status: e.target.value as any })
                }
                className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white"
              >
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Limited Stock</option>
                <option value="out_of_stock">Sold Out</option>
                <option value="discontinued">Archived / Discontinued</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Detailed Architectural Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the materials, joinery, finish, tactile dimensions..."
                className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white"
              />
              {formErrors.description && (
                <p className="text-[11px] text-rose-600 mt-1">{formErrors.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Pricing & Stock Card */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
          <h2 className="text-xs uppercase tracking-wider text-stone-400 font-semibold pb-2 border-b border-stone-100">
            Financials & Inventory
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Regular Price ($ USD) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.regular_price}
                onChange={(e) => setFormData({ ...formData, regular_price: e.target.value })}
                placeholder="890.00"
                className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white"
              />
              {formErrors.regular_price && (
                <p className="text-[11px] text-rose-600 mt-1">{formErrors.regular_price}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Promotional Discount Price ($ USD) <span className="text-stone-400">(optional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.discount_price}
                onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                placeholder="790.00"
                className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white"
              />
              {formErrors.discount_price && (
                <p className="text-[11px] text-rose-600 mt-1">{formErrors.discount_price}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Units in Stock <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                placeholder="10"
                className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="is_featured"
              checked={formData.is_featured}
              onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
              className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
            />
            <label htmlFor="is_featured" className="text-xs text-stone-700 font-medium">
              Feature this piece on the storefront home hero and curated grid
            </label>
          </div>
        </div>

        {/* Media & Supabase Storage Card */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
          <ImageUploadField
            value={formData.main_image}
            onChange={(url) => {
              setFormData((prev) => ({ ...prev, main_image: url }));
              if (formErrors.main_image) {
                setFormErrors((prev) => {
                  const updated = { ...prev };
                  delete updated.main_image;
                  return updated;
                });
              }
            }}
            onRemove={() => setFormData((prev) => ({ ...prev, main_image: '' }))}
            label="Product Primary Photography"
            description="Select or drag high-resolution studio photography (&le; 5MB, JPEG, PNG, WEBP, AVIF). Automatically validated and uploaded to the product-images Supabase Storage bucket."
            aspectRatio="aspect-4/3"
            required
          />
          {formErrors.main_image && (
            <p className="text-[11px] text-rose-600 font-medium">{formErrors.main_image}</p>
          )}

          {/* Optional Direct URL Fallback input */}
          <div className="pt-3 border-t border-stone-100">
            <details className="text-xs text-stone-500">
              <summary className="cursor-pointer hover:text-stone-800 font-medium">
                Advanced: Manual Image URL or Local Asset Path Override
              </summary>
              <div className="mt-2">
                <input
                  type="text"
                  value={formData.main_image}
                  onChange={(e) => setFormData((prev) => ({ ...prev, main_image: e.target.value }))}
                  placeholder="https://... or /src/assets/..."
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg font-mono focus:bg-white"
                />
              </div>
            </details>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/admin/products"
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Update Piece' : 'Publish Product to Store'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
