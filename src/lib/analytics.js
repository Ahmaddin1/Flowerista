const NEXT_PUBLIC_GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const NEXT_PUBLIC_FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID

function getProductPrice(product) {
  return product.salePrice ?? product.price
}

function mapCartItemToGaItem(item) {
  return {
    item_id: item.productId,
    item_name: item.productName,
    price: item.price,
    quantity: item.quantity,
  }
}

function mapOrderItemToGaItem(item) {
  return {
    item_id: item.sku,
    item_name: item.productName,
    price: item.price,
    quantity: item.quantity,
  }
}

export function trackPageView(url) {
  if (typeof window === 'undefined') return

  try {
    if (NEXT_PUBLIC_GA_MEASUREMENT_ID && typeof gtag === 'function') {
      gtag('config', NEXT_PUBLIC_GA_MEASUREMENT_ID, { page_path: url })
    }

    if (NEXT_PUBLIC_FB_PIXEL_ID && typeof fbq === 'function') {
      fbq('track', 'PageView')
    }
  } catch {}
}

export function trackViewContent(product) {
  if (typeof window === 'undefined') return

  try {
    const itemId = product._id.toString()
    const itemName = product.name
    const price = getProductPrice(product)

    if (NEXT_PUBLIC_GA_MEASUREMENT_ID && typeof gtag === 'function') {
      gtag('event', 'view_item', {
        currency: 'PKR',
        value: price,
        items: [{ item_id: itemId, item_name: itemName, price }],
      })
    }

    if (NEXT_PUBLIC_FB_PIXEL_ID && typeof fbq === 'function') {
      fbq('track', 'ViewContent', {
        content_ids: [itemId],
        content_type: 'product',
        value: price,
        currency: 'PKR',
      })
    }
  } catch {}
}

export function trackAddToCart(item) {
  if (typeof window === 'undefined') return

  try {
    const value = item.price * item.quantity
    const gaItem = mapCartItemToGaItem(item)

    if (NEXT_PUBLIC_GA_MEASUREMENT_ID && typeof gtag === 'function') {
      gtag('event', 'add_to_cart', {
        currency: 'PKR',
        value,
        items: [gaItem],
      })
    }

    if (NEXT_PUBLIC_FB_PIXEL_ID && typeof fbq === 'function') {
      fbq('track', 'AddToCart', {
        content_ids: [item.productId],
        content_type: 'product',
        value,
        currency: 'PKR',
      })
    }
  } catch {}
}

export function trackInitiateCheckout(cartItems, total) {
  if (typeof window === 'undefined') return

  try {
    const items = cartItems.map(mapCartItemToGaItem)

    if (NEXT_PUBLIC_GA_MEASUREMENT_ID && typeof gtag === 'function') {
      gtag('event', 'begin_checkout', {
        currency: 'PKR',
        value: total,
        items,
      })
    }

    if (NEXT_PUBLIC_FB_PIXEL_ID && typeof fbq === 'function') {
      fbq('track', 'InitiateCheckout', {
        value: total,
        currency: 'PKR',
        num_items: cartItems.length,
      })
    }
  } catch {}
}

export function trackPurchase(order) {
  if (typeof window === 'undefined') return

  try {
    const items = order.items.map(mapOrderItemToGaItem)

    if (NEXT_PUBLIC_GA_MEASUREMENT_ID && typeof gtag === 'function') {
      gtag('event', 'purchase', {
        transaction_id: order.orderId,
        value: order.totalAmount,
        currency: 'PKR',
        items,
      })
    }

    if (NEXT_PUBLIC_FB_PIXEL_ID && typeof fbq === 'function') {
      fbq('track', 'Purchase', {
        value: order.totalAmount,
        currency: 'PKR',
      })
    }
  } catch {}
}
