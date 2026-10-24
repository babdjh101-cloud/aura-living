export interface CheckoutFormErrors {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  shipping_address?: string;
  city?: string;
  postal_code?: string;
}

export function validateCheckoutForm(data: {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  shipping_address: string;
  city: string;
}): { isValid: boolean; errors: CheckoutFormErrors } {
  const errors: CheckoutFormErrors = {};

  if (!data.customer_name.trim()) {
    errors.customer_name = 'Full name is required for delivery.';
  } else if (data.customer_name.trim().length < 2) {
    errors.customer_name = 'Name must be at least 2 characters.';
  }

  const phoneClean = data.customer_phone.replace(/[\s\-\(\)\+]/g, '');
  if (!data.customer_phone.trim()) {
    errors.customer_phone = 'Phone number is required for delivery coordination.';
  } else if (phoneClean.length < 7 || !/^\d+$/.test(phoneClean)) {
    errors.customer_phone = 'Please provide a valid contact phone number.';
  }

  if (data.customer_email && data.customer_email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.customer_email.trim())) {
      errors.customer_email = 'Please provide a valid email address.';
    }
  }

  if (!data.shipping_address.trim()) {
    errors.shipping_address = 'Delivery street address is required.';
  } else if (data.shipping_address.trim().length < 5) {
    errors.shipping_address = 'Please specify a complete delivery address.';
  }

  if (!data.city.trim()) {
    errors.city = 'City or Municipality is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateProductForm(data: {
  name: string;
  slug: string;
  sku: string;
  regular_price: number;
  discount_price?: number | null;
  stock_quantity: number;
  description: string;
  main_image: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = 'Product name is required.';
  }
  if (!data.slug.trim()) {
    errors.slug = 'Unique URL slug is required.';
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    errors.slug = 'Slug must be lowercase alphanumeric with hyphens (e.g. "oak-lounge-chair").';
  }
  if (!data.sku.trim()) {
    errors.sku = 'SKU / Product Code is required.';
  }
  if (data.regular_price <= 0 || isNaN(data.regular_price)) {
    errors.regular_price = 'Regular price must be greater than zero.';
  }
  if (data.discount_price !== undefined && data.discount_price !== null && data.discount_price !== 0) {
    if (data.discount_price >= data.regular_price) {
      errors.discount_price = 'Discount price must be less than the regular price.';
    }
  }
  if (data.stock_quantity < 0 || isNaN(data.stock_quantity)) {
    errors.stock_quantity = 'Stock quantity cannot be negative.';
  }
  if (!data.description.trim()) {
    errors.description = 'Product description is required.';
  }
  if (!data.main_image.trim()) {
    errors.main_image = 'A primary product image is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateImageUpload(file: File): { isValid: boolean; error?: string } {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  const maxBytes = 5 * 1024 * 1024; // 5MB

  if (!allowedMimeTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, WEBP, or AVIF image.',
    };
  }

  if (file.size > maxBytes) {
    return {
      isValid: false,
      error: 'File size exceeds 5MB limit. Please compress your image before uploading.',
    };
  }

  return { isValid: true };
}
