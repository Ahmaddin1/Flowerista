import {
  brandName,
  SHIPPING_COST,
  ORDER_STATUS_LABELS,
} from "@/lib/constants";

// ---------------------------------------------------------------------------
// WhatsApp deep-link message builder (spec 7.8).
// - Brand name comes from constants (no hardcoded "SM Drips").
// - Per-item line drops Size/Color.
// - Shipping uses the shared SHIPPING_COST constant (spec 7.2) as a fallback.
// - Unhandled statuses fall back to a human-readable label, never a raw enum.
// ---------------------------------------------------------------------------

const STATUS_MESSAGES = {
  pending_confirmation: (name, orderId, itemsSummary) =>
    `Hi ${name}! Your order at ${brandName} (Order ID: ${orderId}) has been received!\n${itemsSummary}\nReply *CONFIRM* to confirm your order or *CANCEL* to cancel it.\n\nThank you for shopping with us!`,

  confirmed: (name, orderId, itemsSummary) =>
    `Hi ${name}! Your ${brandName} order (Order ID: ${orderId}) has been confirmed and is being prepared.\n${itemsSummary}\nWe'll notify you once it's shipped. Thank you!`,

  processing: (name, orderId, itemsSummary) =>
    `Hi ${name}! Your ${brandName} order (Order ID: ${orderId}) is being handmade with care.\n${itemsSummary}\nWe'll let you know as soon as it ships. Thank you!`,

  shipped: (name, orderId, itemsSummary) =>
    `Hi ${name}! Your ${brandName} order (Order ID: ${orderId}) is on its way!\n${itemsSummary}\nYou'll receive it soon. Thank you for shopping with us!`,

  delivered: (name, orderId, itemsSummary) =>
    `Hi ${name}! Your ${brandName} order (Order ID: ${orderId}) has been delivered!\n${itemsSummary}\nWe hope you love it. Thank you for shopping with us!`,

  cancelled: (name, orderId, itemsSummary) =>
    `Hi ${name}, your ${brandName} order (Order ID: ${orderId}) has been cancelled as requested.\n${itemsSummary}\nIf this was a mistake, feel free to place a new order. Thank you!`,
};

function statusLabel(status) {
  return ORDER_STATUS_LABELS[status] ?? "updated";
}

export function buildWhatsAppLink({
  phone,
  orderId,
  customerName,
  status,
  items = [],
  shippingCost = SHIPPING_COST,
  tip = 0,
}) {
  let digits = String(phone ?? "").replace(/\D/g, "");

  if (digits.startsWith("92") && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }

  const fullPhone = `92${digits}`;

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const safeShipping = Number.isFinite(Number(shippingCost))
    ? Number(shippingCost)
    : SHIPPING_COST;
  const safeTip = Number.isFinite(Number(tip)) ? Number(tip) : 0;
  const total = subtotal + safeShipping + safeTip;

  const itemsSummary =
    items.length > 0
      ? `\nOrder Summary:\n${items
          .map(
            (item) =>
              `- ${item.productName} | Qty: ${item.quantity} | Rs. ${item.price * item.quantity}`,
          )
          .join("\n")}\n\nSubtotal: Rs. ${subtotal}\nShipping: Rs. ${safeShipping}${
          safeTip > 0 ? `\nTip: Rs. ${safeTip}` : ""
        }\nTotal: Rs. ${total}`
      : "";

  const messageBuilder = STATUS_MESSAGES[status];
  const message = messageBuilder
    ? messageBuilder(customerName, orderId, itemsSummary)
    : `Hi ${customerName}, your ${brandName} order (Order ID: ${orderId}) status has been ${statusLabel(
        status,
      ).toLowerCase()}. Thank you!`;

  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
}
