import { create } from "zustand";

import {
  addToCart as addToCartUtil,
  clearCart as clearCartUtil,
  getCart as getCartFromStorage,
  removeFromCart as removeFromCartUtil,
  updateQuantity as updateQuantityUtil,
} from "@/lib/cart";

function emitCartUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event("cartUpdated"));
}

function getImageUrl(image) {
  if (!image) {
    return "";
  }

  return typeof image === "string" ? image : (image.url ?? "");
}

function getMaxQuantity(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

// Flowerista cart item shape (spec 8.x): one line per product, keyed by
// productId (no size/color variants, no compound key). Quantity is capped by
// maxQuantity, enforced client-side by lib/cart.js. Server-side re-validation
// at order creation is the authoritative maxQuantity guard; this is the
// client-side UX cap.
function normalizeCartItem(item, modalProduct) {
  if (!item) {
    return null;
  }

  const productId = item.productId ?? modalProduct?._id ?? null;

  if (!productId) {
    return null;
  }

  const image =
    getImageUrl(item.image) || getImageUrl(modalProduct?.images?.[0]);
  const maxQuantity = getMaxQuantity(
    item.maxQuantity ?? modalProduct?.maxQuantity,
  );

  return {
    ...item,
    cartItemId: item.cartItemId ?? String(productId),
    productId,
    productName: item.productName ?? item.name ?? modalProduct?.name ?? "",
    name: item.name ?? item.productName ?? modalProduct?.name ?? "",
    slug: item.slug ?? modalProduct?.slug ?? "",
    image,
    quantity: Math.max(1, Number(item.quantity) || 1),
    price: item.price ?? modalProduct?.basePrice ?? 0,
    originalPrice: item.originalPrice ?? modalProduct?.originalPrice ?? null,
    sku: item.sku ?? modalProduct?.sku ?? "",
    maxQuantity,
  };
}

export const useCartStore = create((set, get) => ({
  cart: [],
  _hasHydrated: false,
  stockCapped: false,
  isCartModalOpen: false,
  modalProduct: null,

  initializeCart: () => {
    const cart = getCartFromStorage();

    set({
      cart,
      _hasHydrated: true,
    });
  },

  addToCart: (item) => {
    const normalizedItem = normalizeCartItem(item, get().modalProduct);

    if (!normalizedItem?.cartItemId) {
      return;
    }

    const { cart, capped } = addToCartUtil(normalizedItem);

    set({
      cart,
      stockCapped: capped,
    });

    emitCartUpdated();
  },

  openCartModal: (product) => {
    set({
      isCartModalOpen: Boolean(product),
      modalProduct: product ?? null,
    });
  },

  closeCartModal: () => {
    set({
      isCartModalOpen: false,
      modalProduct: null,
    });
  },

  removeFromCart: (cartItemId) => {
    const cart = removeFromCartUtil(cartItemId);
    set({ cart });
    emitCartUpdated();
  },

  updateQuantity: (cartItemId, newQuantity) => {
    const cart = updateQuantityUtil(cartItemId, newQuantity);
    set({ cart });
    emitCartUpdated();
  },

  clearCart: () => {
    const cart = clearCartUtil();
    set({ cart });
    emitCartUpdated();
  },

  resetStockCapped: () => {
    set({ stockCapped: false });
  },

  getCartCount: () => {
    const { cart } = get();

    if (cart.length === 0) {
      return 0;
    }

    return cart.reduce((total, item) => total + item.quantity, 0);
  },

  getCartTotal: () => {
    const { cart } = get();

    if (cart.length === 0) {
      return 0;
    }

    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  getCartItem: (cartItemId) => {
    const { cart } = get();

    return cart.find((item) => item.cartItemId === cartItemId) ?? null;
  },
}));
