import { FaInstagram, FaTiktok, FaWhatsapp, FaFacebook } from 'react-icons/fa'
import Link from 'next/link'
import { brandName, tagline } from '@/lib/constants'

export default function Footer() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}`
    : null
  // TODO (Phase 10): confirm real Flowerista contact email + social handles
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'hello@flowerista.pk'

  return (
    <footer className="bg-card text-text px-6 lg:px-16 pt-16 pb-0 border-t border-card-border">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 pb-14 border-b border-card-border">
        <div>
          <h3 className="font-heading text-4xl tracking-wide text-text mb-3">{brandName}</h3>
          <p className="text-xs text-muted-text leading-relaxed mb-6 max-w-50">
            {tagline}
          </p>
          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-accent text-text-on-accent text-xs font-semibold px-4 py-2.5 tracking-wide rounded-pill hover:bg-accent-strong transition-colors duration-300"
            >
              <FaWhatsapp size={15} />
              Chat on WhatsApp
            </a>
          ) : null}
        </div>

        <div>
          <h4 className="text-[10px] tracking-[3px] text-muted-text uppercase mb-5">Shop</h4>
          <div className="flex flex-col gap-3">
            <Link href="/products" className="text-[13px] text-muted-text hover:text-accent-strong transition-colors duration-200">
              Shop All
            </Link>
            <Link href="/products/crochet" className="text-[13px] text-muted-text hover:text-accent-strong transition-colors duration-200">
              Crochet
            </Link>
            <Link href="/products/pipecleaner-art" className="text-[13px] text-muted-text hover:text-accent-strong transition-colors duration-200">
              Pipecleaner Art
            </Link>
            <Link href="/collections" className="text-[13px] text-muted-text hover:text-accent-strong transition-colors duration-200">
              Collections
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] tracking-[3px] text-muted-text uppercase mb-5">Help</h4>
          <div className="flex flex-col gap-3">
            <Link href="/about" className="text-[13px] text-muted-text hover:text-accent-strong transition-colors duration-200">
              About Us
            </Link>
            <Link href="/returns" className="text-[13px] text-muted-text hover:text-accent-strong transition-colors duration-200">
              Returns &amp; Exchange
            </Link>
            <Link href="/shipping" className="text-[13px] text-muted-text hover:text-accent-strong transition-colors duration-200">
              Shipping Policy
            </Link>
            <Link href="/privacy-policy" className="text-[13px] text-muted-text hover:text-accent-strong transition-colors duration-200">
              Privacy Policy
            </Link>
            <Link href="/contact" className="text-[13px] text-muted-text hover:text-accent-strong transition-colors duration-200">
              Contact
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] tracking-[3px] text-muted-text uppercase mb-5">Follow Us</h4>
          <div className="flex gap-3 mb-8">
            <a
              href="https://instagram.com/flowerista"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-9 h-9 border border-card-border rounded-lg flex items-center justify-center text-muted-text hover:text-accent-strong hover:border-accent transition-colors duration-200"
            >
              <FaInstagram size={16} />
            </a>
            <a
              href="https://tiktok.com/@flowerista"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="w-9 h-9 border border-card-border rounded-lg flex items-center justify-center text-muted-text hover:text-accent-strong hover:border-accent transition-colors duration-200"
            >
              <FaTiktok size={16} />
            </a>
            <a
              href="https://facebook.com/flowerista"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-9 h-9 border border-card-border rounded-lg flex items-center justify-center text-muted-text hover:text-accent-strong hover:border-accent transition-colors duration-200"
            >
              <FaFacebook size={16} />
            </a>
          </div>
          <h4 className="text-[10px] tracking-[3px] text-muted-text uppercase mb-5 mt-0">Contact</h4>
          <div className="flex flex-col gap-3">
            <a href={`mailto:${contactEmail}`} className="text-[13px] text-accent-strong hover:underline">
              {contactEmail}
            </a>
            {whatsappNumber ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-accent-strong hover:underline"
              >
                {whatsappNumber}
              </a>
            ) : null}
            <p className="text-[13px] text-muted-text">Nationwide COD — All over Pakistan</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-5">
        <p className="text-[11px] text-muted-text">© {new Date().getFullYear()} {brandName}. All rights reserved.</p>
        <div className="flex gap-5">
          <Link href="/privacy-policy" className="text-[11px] text-muted-text hover:text-accent-strong transition-colors">
            Privacy Policy
          </Link>
          <Link href="/returns" className="text-[11px] text-muted-text hover:text-accent-strong transition-colors">
            Return Policy
          </Link>
        </div>
      </div>
    </footer>
  )
}
