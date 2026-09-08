// ⚠️  CLIENT REVIEW REQUIRED — Confirm these terms match Flowerista's actual
// return/exchange policy before going live. Handmade/custom items often carry
// different or no-return terms; do not assume SM Drips' policy transfers.

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'hello@flowerista.pk'
const rawNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''
const waNumber = rawNumber.startsWith('0') ? '92' + rawNumber.slice(1) : rawNumber

export const metadata = {
  title: 'Return & Exchange Policy | Flowerista',
  description:
    'Read the Flowerista return and exchange policy for handmade crochet and pipecleaner art pieces.',
}

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-bg text-text">
      <h1 className="text-4xl font-normal text-center text-text mb-10 pt-24">Return & Exchange Policy</h1>
      <div className="pl-6 lg:pl-16 pr-6 pb-24 max-w-[800px]">

        <section className="mb-10">
          <h2 className="text-base font-medium text-text mb-4">Our policy for handmade items</h2>
          <p className="text-sm text-muted-text leading-[1.9] mb-3">
            Because every Flowerista piece is made by hand to order, we are unable to accept returns or exchanges for change of mind or sizing preference. Each item is crafted individually and cannot be restocked.
          </p>
          <p className="text-sm text-muted-text leading-[1.9] mb-3">
            We will, however, accept a return or send a replacement if:
          </p>
          <ul className="list-disc list-outside pl-5 flex flex-col gap-3">
            <li className="text-sm text-muted-text leading-[1.9]">
              The item received is faulty, damaged, or defective.
            </li>
            <li className="text-sm text-muted-text leading-[1.9]">
              The item received is the wrong product or does not match what you ordered.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-medium text-text mb-4">How to raise a claim</h2>
          <ul className="list-disc list-outside pl-5 flex flex-col gap-3">
            <li className="text-sm text-muted-text leading-[1.9]">
              Contact us within 7 days of delivery via WhatsApp or email.
            </li>
            <li className="text-sm text-muted-text leading-[1.9]">
              Send clear photographic evidence of the issue.
            </li>
            <li className="text-sm text-muted-text leading-[1.9]">
              If the claim is approved, we will send a replacement and cover the return courier charges.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-medium text-text mb-4">Items not eligible for return</h2>
          <ul className="list-disc list-outside pl-5 flex flex-col gap-3">
            <li className="text-sm text-muted-text leading-[1.9]">
              Change-of-mind returns or size preference changes.
            </li>
            <li className="text-sm text-muted-text leading-[1.9]">
              Items that have been used, altered, or are no longer in their original condition.
            </li>
            <li className="text-sm text-muted-text leading-[1.9]">
              Claims raised more than 7 days after delivery.
            </li>
          </ul>
        </section>

        <section className="mb-0">
          <h2 className="text-base font-medium text-text mb-4">Need Help?</h2>
          <p className="text-sm text-muted-text leading-[1.9]">
            Contact us on WhatsApp or at{' '}
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
