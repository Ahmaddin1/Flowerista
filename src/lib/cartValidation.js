// ---------------------------------------------------------------------------
// Cart validation (spec 7.3) — rewritten. No size/color/stock concepts.
// Validation checks: product exists + isActive, price matches the live
// product, and quantity <= maxQuantity. Returns { isValid, item }.
// ---------------------------------------------------------------------------

function getSafeInteger(value, fallback = 0) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(0, Math.floor(parsed));
}

function getSafePrice(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getImageUrl(image) {
  if (!image) {
    return "";
  }

  // Images are plain URL strings now; tolerate legacy {url} objects.
  return typeof image === "string" ? image : (image.url ?? "");
}

function normalizeImages(images) {
  if (!Array.isArray(images)) {
    return [];
  }
  return images.map(getImageUrl).filter(Boolean);
}

// Return shape per spec 7.3.
export function serializeProductForCart(product) {
  if (!product) {
    return null;
  }

  return {
    _id: String(product._id),
    name: product.name ?? "",
    slug: product.slug ?? "",
    basePrice: getSafePrice(product.basePrice),
    ...(product.originalPrice != null
      ? { originalPrice: getSafePrice(product.originalPrice) }
      : {}),
    images: normalizeImages(product.images),
    isActive: product.isActive !== false,
    maxQuantity: Math.max(1, getSafeInteger(product.maxQuantity, 1)),
  };
}

export function validateCartItem(item, product) {
  const safeProduct = serializeProductForCart(product);

  const requestedQuantity = getSafeInteger(item?.quantity, 1);
  const maxQuantity = safeProduct ? safeProduct.maxQuantity : 1;

  // Clamp the quantity into [1, maxQuantity] when the product is available.
  const isMissingProduct = !safeProduct || safeProduct.isActive === false;
  const quantity = isMissingProduct
    ? 0
    : Math.min(Math.max(1, requestedQuantity), maxQuantity);

  const basePrice = safeProduct
    ? getSafePrice(safeProduct.basePrice)
    : getSafePrice(item?.price);
  const originalPrice =
    safeProduct?.originalPrice != null
      ? getSafePrice(safeProduct.originalPrice)
      : (item?.originalPrice ?? null);

  const correctedItem = {
    ...item,
    // cartItemId is now simply the productId string (spec 7.4) — no compound key.
    cartItemId: item?.productId ? String(item.productId) : null,
    productId: item?.productId ? String(item.productId) : "",
    productName: item?.productName ?? item?.name ?? safeProduct?.name ?? "",
    name: item?.name ?? item?.productName ?? safeProduct?.name ?? "",
    slug: safeProduct?.slug ?? item?.slug ?? "",
    image: getImageUrl(item?.image) || getImageUrl(safeProduct?.images?.[0]),
    quantity,
    price: basePrice,
    originalPrice: originalPrice ?? null,
    maxQuantity,
  };

  const isPriceMismatch = getSafePrice(item?.price) !== basePrice;
  const currentOriginalPrice =
    item?.originalPrice != null ? getSafePrice(item.originalPrice) : null;
  const nextOriginalPrice = originalPrice != null ? getSafePrice(originalPrice) : null;
  const isOriginalPriceMismatch = currentOriginalPrice !== nextOriginalPrice;
  const isQuantityMismatch = requestedQuantity !== quantity;

  return {
    isValid:
      !isMissingProduct &&
      !isPriceMismatch &&
      !isOriginalPriceMismatch &&
      !isQuantityMismatch,
    item: correctedItem,
  };
}
