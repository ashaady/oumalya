'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Product, PRODUCTS_BY_ID } from '@/data/products';

export interface CartEntry {
  p: Product;
  size: string;
  qty: number;
}

export interface CartContextType {
  cart: Record<string, Record<string, number>>;
  favorites: Record<string, boolean>;
  cartEntries: CartEntry[];
  totalCount: number;
  totalPrice: number;
  addToCart: (id: string, size?: string, qty?: number) => void;
  updateQuantity: (id: string, size: string, delta: number) => void;
  removeFromCart: (id: string, size: string) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  clearCart: () => void;
  // UI states
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  quickProduct: Product | null;
  openQuick: (p: Product) => void;
  closeQuick: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = 'oumalya_cart_v2';
const FAV_KEY = 'oumalya_fav_v2';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Record<string, Record<string, number>>>({});
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTimeout, setToastTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_KEY);
      if (savedCart) {
        const raw = JSON.parse(savedCart);
        const normalized: Record<string, Record<string, number>> = {};
        for (const [id, val] of Object.entries(raw)) {
          if (!PRODUCTS_BY_ID[id]) continue;
          if (typeof val === 'number') {
            if (val > 0) normalized[id] = { default: Math.min(99, Math.floor(val)) };
          } else if (val && typeof val === 'object') {
            normalized[id] = {};
            for (const [sz, q] of Object.entries(val as Record<string, number>)) {
              const num = Number(q);
              if (num > 0 && Number.isFinite(num)) {
                normalized[id][sz] = Math.min(99, Math.floor(num));
              }
            }
            if (!Object.keys(normalized[id]).length) delete normalized[id];
          }
        }
        setCart(normalized);
      }
    } catch {}

    try {
      const savedFav = localStorage.getItem(FAV_KEY);
      if (savedFav) {
        setFavorites(JSON.parse(savedFav));
      }
    } catch {}
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeout) clearTimeout(toastTimeout);
    const t = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
    setToastTimeout(t);
  }, [toastTimeout]);

  const saveCart = useCallback((newCart: Record<string, Record<string, number>>) => {
    setCart(newCart);
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(newCart));
    } catch {}
  }, []);

  const saveFav = useCallback((newFav: Record<string, boolean>) => {
    setFavorites(newFav);
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(newFav));
    } catch {}
  }, []);

  const addToCart = useCallback((id: string, size = 'default', qty = 1) => {
    const p = PRODUCTS_BY_ID[id];
    if (!p) return;
    setCart(prev => {
      const updated = { ...prev };
      if (!updated[id]) updated[id] = {};
      const current = updated[id][size] || 0;
      updated[id] = { ...updated[id], [size]: Math.min(99, current + qty) };
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast(`${p.name} ajouté au panier`);
  }, [showToast]);

  const updateQuantity = useCallback((id: string, size: string, delta: number) => {
    setCart(prev => {
      if (!prev[id] || prev[id][size] === undefined) return prev;
      const updated = { ...prev };
      const newQty = (updated[id][size] || 0) + delta;
      if (newQty <= 0) {
        const productSizes = { ...updated[id] };
        delete productSizes[size];
        if (Object.keys(productSizes).length === 0) {
          delete updated[id];
        } else {
          updated[id] = productSizes;
        }
      } else {
        updated[id] = { ...updated[id], [size]: Math.min(99, newQty) };
      }
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const removeFromCart = useCallback((id: string, size: string) => {
    setCart(prev => {
      if (!prev[id]) return prev;
      const updated = { ...prev };
      const productSizes = { ...updated[id] };
      delete productSizes[size];
      if (Object.keys(productSizes).length === 0) {
        delete updated[id];
      } else {
        updated[id] = productSizes;
      }
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart({});
    try {
      localStorage.removeItem(CART_KEY);
    } catch {}
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify(next));
      } catch {}
      showToast(next[id] ? 'Ajouté à vos favoris' : 'Retiré des favoris');
      return next;
    });
  }, [showToast]);

  const isFavorite = useCallback((id: string) => {
    return !!favorites[id];
  }, [favorites]);

  const cartEntries = useMemo<CartEntry[]>(() => {
    const list: CartEntry[] = [];
    for (const [id, sizes] of Object.entries(cart)) {
      const p = PRODUCTS_BY_ID[id];
      if (!p) continue;
      for (const [size, qty] of Object.entries(sizes)) {
        if (qty > 0) {
          list.push({ p, size, qty });
        }
      }
    }
    return list;
  }, [cart]);

  const totalCount = useMemo(() => {
    return cartEntries.reduce((sum, item) => sum + item.qty, 0);
  }, [cartEntries]);

  const totalPrice = useMemo(() => {
    return cartEntries.reduce((sum, item) => sum + item.qty * item.p.price, 0);
  }, [cartEntries]);

  const openCart = useCallback(() => {
    setIsSearchOpen(false);
    setQuickProduct(null);
    setIsCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const toggleCart = useCallback(() => {
    setIsCartOpen(prev => !prev);
  }, []);

  const openSearch = useCallback(() => {
    setIsCartOpen(false);
    setQuickProduct(null);
    setIsSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  const openQuick = useCallback((p: Product) => {
    setIsCartOpen(false);
    setIsSearchOpen(false);
    setQuickProduct(p);
  }, []);

  const closeQuick = useCallback(() => {
    setQuickProduct(null);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        favorites,
        cartEntries,
        totalCount,
        totalPrice,
        addToCart,
        updateQuantity,
        removeFromCart,
        toggleFavorite,
        isFavorite,
        clearCart,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        isSearchOpen,
        openSearch,
        closeSearch,
        quickProduct,
        openQuick,
        closeQuick,
        toastMessage,
        showToast
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
