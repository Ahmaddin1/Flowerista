const CART_STORAGE_KEY = "cart"

function getSafeQuantity(value) {
  const quantity = Number(value)

  if (!Number.isFinite(quantity) || quantity < 1) {
    return 1
  }

  return Math.floor(quantity)
}

// Per-order cap for a line (spec 6.3). Flowerista has no stock counting — the
// only quantity limit is the product's maxQuantity. An unset/invalid cap means
// "no client-side limit"; server-side re-validation at order creation is the
// authoritative guard.
function getMaxQuantityLimit(value) {
  const maxQuantity = Number(value)

  if (!Number.isFinite(maxQuantity) || maxQuantity < 1) {
    return Number.MAX_SAFE_INTEGER
  }

  return Math.floor(maxQuantity)
}

function parseStoredCart(value) {
  if (!value) {
    return null
  }

  try {
    const parsedCart = JSON.parse(value)
    return Array.isArray(parsedCart) ? parsedCart : []
  } catch {
    return []
  }
}

function readCartFromStorage() {
  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY)
    const parsedCart = parseStoredCart(storedCart)

    return parsedCart === null ? [] : parsedCart
  } catch {
    return []
  }
}

function writeCartToStorage(cartItems) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
  } catch {}
}

export function getCart() {
  if (typeof window === 'undefined') return []

  return readCartFromStorage()
}

export function saveCart(cartItems) {
  if (typeof window === 'undefined') return

  writeCartToStorage(cartItems)
}

export function addToCart(item) {
  if (typeof window === 'undefined') return { cart: [], capped: false }

  const cart = readCartFromStorage()
  const quantityToAdd = getSafeQuantity(item.quantity)
  const maxQuantityLimit = getMaxQuantityLimit(item.maxQuantity)
  const existingItemIndex = cart.findIndex(
    (cartItem) => cartItem.cartItemId === item.cartItemId
  )

  if (existingItemIndex !== -1) {
    const existingItem = cart[existingItemIndex]
    const requestedQuantity = existingItem.quantity + quantityToAdd

    if (existingItem.quantity >= maxQuantityLimit) {
      return { cart, capped: true }
    }

    const nextQuantity = Math.min(requestedQuantity, maxQuantityLimit)

    const updatedCart = cart.map((cartItem, index) =>
      index === existingItemIndex
        ? { ...cartItem, quantity: nextQuantity, maxQuantity: maxQuantityLimit }
        : cartItem
    )

    writeCartToStorage(updatedCart)
    return { cart: updatedCart, capped: nextQuantity < requestedQuantity }
  }

  const nextItem = {
    ...item,
    quantity: Math.min(quantityToAdd, maxQuantityLimit),
    maxQuantity: maxQuantityLimit,
  }
  const updatedCart = [...cart, nextItem]
  writeCartToStorage(updatedCart)

  return { cart: updatedCart, capped: nextItem.quantity < quantityToAdd }
}

export function removeFromCart(cartItemId) {
  if (typeof window === 'undefined') return []

  const cart = readCartFromStorage()
  const updatedCart = cart.filter((item) => item.cartItemId !== cartItemId)

  writeCartToStorage(updatedCart)
  return updatedCart
}

export function updateQuantity(cartItemId, newQuantity) {
  if (typeof window === 'undefined') return []

  const cart = readCartFromStorage()
  const existingItem = cart.find((item) => item.cartItemId === cartItemId)

  if (!existingItem) {
    return cart
  }

  if (newQuantity <= 0) {
    return removeFromCart(cartItemId)
  }

  const updatedCart = cart.map((item) =>
    item.cartItemId === cartItemId
      ? {
          ...item,
          quantity: Math.min(newQuantity, getMaxQuantityLimit(item.maxQuantity)),
        }
      : item
  )

  writeCartToStorage(updatedCart)
  return updatedCart
}

export function clearCart() {
  if (typeof window === 'undefined') return []

  writeCartToStorage([])
  return []
}

export function getCartItem(cartItemId) {
  if (typeof window === 'undefined') return null

  const cart = readCartFromStorage()
  return cart.find((item) => item.cartItemId === cartItemId) ?? null
}

export function getCartCount() {
  if (typeof window === 'undefined') return 0

  const cart = readCartFromStorage()
  return cart.reduce((total, item) => total + item.quantity, 0)
}

export function getCartTotal() {
  if (typeof window === 'undefined') return 0

  const cart = readCartFromStorage()
  return cart.reduce((total, item) => total + item.price * item.quantity, 0)
}
