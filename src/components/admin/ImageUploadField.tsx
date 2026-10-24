import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Check,
  AlertCircle,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
  Loader2,
  HardDrive,
} from 'lucide-react';
import { uploadProductImage, deleteProductImage } from '../../services/storage';

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  label?: string;
  description?: string;
  aspectRatio?: 'aspect-4/3' | 'aspect-16/9' | 'aspect-square';
  required?: boolean;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  value,
  onChange,
  onRemove,
  label = 'Product Photography',
  description = 'Upload high-resolution photography (JPEG, PNG, WEBP, AVIF up to 5MB). Stored in the product-images bucket.',
  aspectRatio = 'aspect-4/3',
  required = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const result = await uploadProductImage(file, {
        previousImageUrl: value || null,
        onProgress: (pct) => setUploadProgress(pct),
      });

      onChange(result.publicUrl);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 2500);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMessage(err.message || 'Image upload failed. Please verify format and size.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = async () => {
    if (!value) return;
    try {
      await deleteProductImage(value);
      if (onRemove) {
        onRemove();
      } else {
        onChange('');
      }
    } catch (err) {
      console.warn('Remove error:', err);
      onChange('');
    }
  };

  const isSupabaseStored = value && value.includes('product-images');

  return (
    <div className="space-y-3">
      {/* Header and Label */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-stone-900">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {isSupabaseStored && (
          <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-mono flex items-center gap-1">
            <HardDrive className="w-2.5 h-2.5" />
            <span>Supabase Storage</span>
          </span>
        )}
      </div>

      <p className="text-xs text-stone-500">{description}</p>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success alert */}
      {successToast && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-xs">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Image uploaded and stored in product-images bucket.</span>
        </div>
      )}

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={onFileInputChange}
        className="hidden"
      />

      {/* Preview or Dropzone */}
      {value ? (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-stone-100 border border-stone-200 group">
            <div className={`${aspectRatio} w-full overflow-hidden`}>
              <img
                src={value}
                alt="Product preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {/* Hover action overlay */}
            <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-1.5 text-xs font-semibold text-stone-900 bg-white hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace Image</span>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isUploading}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>

          {/* Quick replacement button for touch devices where hover is unavailable */}
          <div className="flex sm:hidden items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-medium text-stone-700 bg-stone-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Replace</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs font-medium text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-stone-900 bg-stone-100/80'
              : 'border-stone-200 hover:border-stone-400 bg-stone-50/60'
          }`}
        >
          {isUploading ? (
            <div className="space-y-3 py-3">
              <Loader2 className="w-8 h-8 text-stone-700 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-stone-800">
                Uploading to Supabase Storage ({uploadProgress}%)...
              </p>
              <div className="w-48 mx-auto bg-stone-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-stone-900 h-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-white border border-stone-200 shadow-2xs flex items-center justify-center text-stone-500 mx-auto">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-stone-800">
                Click to browse or drag & drop image here
              </p>
              <p className="text-[11px] text-stone-400">
                JPEG, PNG, WEBP, or AVIF &middot; Maximum 5MB
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
