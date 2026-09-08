// ⚠️  CLIENT REVIEW REQUIRED — This page contains legal policy language.
// Please review every section carefully to confirm it accurately reflects
// Flowerista's actual data practices before going live. Do not rely solely
// on this draft as legal advice or a final policy.

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'hello@flowerista.pk'

export const metadata = {
  title: 'Privacy Policy | Flowerista',
  description: 'Read the Flowerista privacy policy to understand how we collect, use, and protect your personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-bg text-text">
      <h1 className="text-4xl font-normal text-center text-text mb-4 pt-24">Privacy Policy</h1>
      <div className="pl-6 lg:pl-16 pr-6 pb-24 max-w-200">

        <section className="mb-12">
          <p className="text-sm text-muted-text leading-[1.9] mb-4">
            At Flowerista, we take your privacy seriously. This policy explains what information we collect, how we use it, and how we protect it. By using our website, you agree to the practices described below.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-base font-medium text-text mb-4 uppercase tracking-widest">Information We Collect</h2>

          <h3 className="text-sm font-medium text-text mb-2 mt-6">Personal Information:</h3>
          <p className="text-sm text-muted-text leading-[1.9] mb-4">
            When you place an order, contact us, or interact with our site, we may collect your name, email address, phone number, and shipping address. We only collect what is necessary to process your order and provide you with a smooth experience.
          </p>

          <h3 className="text-sm font-medium text-text mb-2 mt-6">Log Data:</h3>
          <p className="text-sm text-muted-text leading-[1.9] mb-4">
            Our servers automatically record certain information when you visit our site — including your IP address, browser type, and pages visited. This data is used in aggregate to improve site performance and is not used to identify you personally.
          </p>

          <h3 className="text-sm font-medium text-text mb-2 mt-6">Cookies:</h3>
          <p className="text-sm text-muted-text leading-[1.9] mb-4">
            We use cookies to remember your cart and preferences. You can disable cookies through your browser settings, though some features of the site may not work correctly as a result.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-base font-medium text-text mb-4 uppercase tracking-widest">How We Use Your Information</h2>
          <p className="text-sm text-muted-text leading-[1.9] mb-4">
            We use your information to process and deliver your orders, respond to your queries, and send order updates via WhatsApp. We do not sell your data to anyone.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-base font-medium text-text mb-4 uppercase tracking-widest">Information Sharing</h2>
          <p className="text-sm text-muted-text leading-[1.9] mb-4">
            We only share your information with trusted third-party service providers — such as courier partners — strictly for the purpose of fulfilling your order. We may also disclose information if required by law.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-base font-medium text-text mb-4 uppercase tracking-widest">Data Security</h2>
          <p className="text-sm text-muted-text leading-[1.9] mb-4">
            We take reasonable measures to protect your personal information. However, no system is completely foolproof, and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-base font-medium text-text mb-4 uppercase tracking-widest">Your Rights</h2>
          <p className="text-sm text-muted-text leading-[1.9] mb-4">
            You can request access to, correction of, or deletion of your personal information at any time by contacting us directly on WhatsApp or via email.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-base font-medium text-text mb-4 uppercase tracking-widest">Contact</h2>
          <p className="text-sm text-muted-text leading-[1.9] mb-4">
            For any privacy-related questions, reach out to us at{' '}
            <a href={`mailto:${contactEmail}`} className="text-accent-strong hover:underline">{contactEmail}</a>{' '}
            or on WhatsApp.
          </p>
        </section>
      </div>
    </main>
  )
}
