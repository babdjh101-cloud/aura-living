import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  itemCount: number;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  lastAddedProduct: Product | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'aura_shopping_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<Product | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.warn('Failed to persist cart to localStorage:', err);
    }
  }, [cart]);

  const addToCart = (product: Product, quantity: number = 1) => {
    if (quantity <= 0) return;
    if (product.stock_quantity <= 0) return;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      const effectivePrice = product.discount_price ?? product.regular_price;

      if (existingIndex > -1) {
        const existing = prevCart[existingIndex];
        const newQty = Math.min(existing.quantity + quantity, product.stock_quantity);
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          selectedPrice: effectivePrice,
        };
        return updated;
      } else {
        const initialQty = Math.min(quantity, product.stock_quantity);
        return [
          ...prevCart,
          {
            product,
            quantity: initialQty,
            selectedPrice: effectivePrice,
          },
        ];
      }
    });

    setLastAddedProduct(product);
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const maxAllowed = item.product.stock_quantity;
          const cappedQty = Math.min(quantity, maxAllowed);
          return { ...item, quantity: cappedQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const itemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = item.product.discount_price ?? item.product.regular_price;
      return sum + price * item.quantity;
    }, 0);
  }, [cart]);

  // Free shipping above $150, else $15 delivery fee
  const deliveryCharge = useMemo(() => {
    if (subtotal === 0) return 0;
    return subtotal >= 150 ? 0 : 15;
  }, [subtotal]);

  const total = useMemo(() => {
    return subtotal + deliveryCharge;
  }, [subtotal, deliveryCharge]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        itemCount,
        subtotal,
        deliveryCharge,
        total,
        lastAddedProduct,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
