// ⚠️  CLIENT REVIEW REQUIRED — Confirm the flat shipping cost (Rs. 350) and
// delivery timeframe before going live. These are placeholders pending client
// confirmation (spec Section 9).

import { SHIPPING_COST } from '@/lib/constants'

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'hello@flowerista.pk'
const rawNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''
const waNumber = rawNumber.startsWith('0') ? '92' + rawNumber.slice(1) : rawNumber

export const metadata = {
  title: 'Shipping Policy | Flowerista',
  description:
    'Learn about Flowerista shipping charges, delivery timeframes, and how we handle damaged or incorrect orders across Pakistan.',
}

export default function ShippingPage() {
  return (
    <main className="min-h-screen bg-bg text-text">
      <h1 className="text-4xl font-normal text-center text-text mb-10 pt-24">Shipping Policy</h1>
      <div className="pl-6 lg:pl-16 pr-6 pb-24 max-w-200">

        <p className="text-sm text-muted-text leading-[1.9] mb-12">
          At Flowerista, every order is made by hand before it ships. Please read this policy carefully so you know what to expect.
        </p>

        <section className="mb-10">
          <h2 className="text-base font-medium text-text mb-4">Order Processing Time</h2>
          <ul className="list-disc list-outside pl-5 flex flex-col gap-3">
            <li className="text-sm text-muted-text leading-[1.9]">
              Because each piece is handmade to order, please allow 2–4 business days for your order to be prepared before dispatch.
            </li>
            <li className="text-sm text-muted-text leading-[1.9]">
              Orders are not dispatched on Sundays or public holidays.
            </li>
            <li className="text-sm text-muted-text leading-[1.9]">
              COD orders are confirmed via WhatsApp before dispatch. If we are unable to reach you within 24 hours, the order may be cancelled.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-medium text-text mb-4">Shipping Charges</h2>
          <ul className="list-disc list-outside pl-5 flex flex-col gap-3">
            <li className="text-sm text-muted-text leading-[1.9]">
              A flat shipping fee of Rs. {SHIPPING_COST}/- applies to all orders, regardless of order size.
            </li>
            <li className="text-sm text-muted-text leading-[1.9]">
              Shipping charges are non-refundable unless the item received was defective or incorrect.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-medium text-text mb-4">Delivery Timeframe</h2>
          <ul className="list-disc list-outside pl-5 flex flex-col gap-3">
            <li className="text-sm text-muted-text leading-[1.9]">
              Nationwide delivery within Pakistan: 2–4 working days after dispatch.
            </li>
            <li className="text-sm text-muted-text leading-[1.9]">
              Please allow extra time during high-demand periods or public holidays.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-medium text-text mb-4">Shipping Confirmation & Tracking</h2>
          <ul className="list-disc list-outside pl-5 flex flex-col gap-3">
            <li className="text-sm text-muted-text leading-[1.9]">
              Once your order is dispatched, a confirmation will be sent via WhatsApp along with your tracking number.
            </li>
            <li className="text-sm text-muted-text leading-[1.9]">
              Tracking details become active within 24 hours of dispatch.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-medium text-text mb-4">Incorrect Address or Failed Delivery</h2>
          <ul className="list-disc list-outside pl-5 flex flex-col gap-3">
            <li className="text-sm text-muted-text leading-[1.9]">
              Please ensure all shipping details are accurate when placing your order.
            </li>
            <li className="text-sm text-muted-text leading-[1.9]">
              Flowerista is not responsible for orders lost or undelivered due to an incorrect address provided by the customer.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-medium text-text mb-4">Damaged or Defective Items</h2>
          <ul className="list-disc list-outside pl-5 flex flex-col gap-3">
            <li className="text-sm text-muted-text leading-[1.9]">
              If your order arrives damaged, defective, or incorrect, contact us within 7 days of delivery via WhatsApp or email.
            </li>
            <li className="text-sm text-muted-text leading-[1.9]">
              Send photographic evidence of the issue.
            </li>
            <li className="text-sm text-muted-text leading-[1.9]">
              If the claim is approved, we will send a replacement and cover the return courier charges.
            </li>
          </ul>
        </section>

        <section className="mb-0">
          <h2 className="text-base font-medium text-text mb-4">Need Help?</h2>
          <p className="text-sm text-muted-text leading-[1.9]">
            Contact our support team on WhatsApp or at{' '}
            <a href={`mailto:${contactEmail}`} className="text-accent-strong hover:underline">{contactEmail}</a>.
          </p>
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 bg-accent text-text-on-accent text-xs font-semibold px-4 py-2.5 tracking-wide rounded-md hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(229,31,118,0.4)] transition-all duration-300"
          >
            Chat on WhatsApp
          </a>
        </section>
      </div>
    </main>
  )
}
