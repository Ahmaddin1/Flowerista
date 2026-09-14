# Flowerista

Handmade crochet and pipe-cleaner art, sold online. Flowerista is a full-stack ecommerce storefront built for a small handmade-goods business — every product is made by hand, listed as a single fixed design with no size or color variants, and manually marked in or out of stock by the seller.

> *Tagline: "Handmade for the girly at heart" — confirm/update in `lib/constants.js` if this hasn't been finalized.*

---

## Features

**Storefront**
- Product catalog with category + subcategory filtering (custom dropdown UI, no native `<select>`)
- Product detail pages with image gallery, description, and shipping/returns info
- Cart with a per-product quantity cap (handmade goods have a realistic production limit per order)
- Guest checkout — no customer accounts, no login required to buy
- Cash on Delivery and Bank Deposit payment methods
- Flat-rate shipping on every order
- Order status updates sent to customers via WhatsApp deep links
- Soft, smooth entrance and scroll animations throughout (GSAP + Lenis)

**Admin panel**
- JWT-authenticated, single-admin login
- Dashboard: order counts, revenue chart, payment-method breakdown, recent orders
- Full product CRUD, including image upload via Cloudinary
- Order management with status updates (`pending_confirmation` → `confirmed` → `processing` → `shipped` → `delivered`, or `cancelled`)
- Category management

**Explicitly not included** (by design, not oversight):
- No customer accounts/registration
- No product search
- No wishlist or favorites
- No reviews/ratings
- No online payment gateway
- No multi-language or multi-currency support

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Database | MongoDB + Mongoose |
| State management | Zustand |
| Styling | Tailwind CSS |
| Animation | GSAP (+ ScrollTrigger), Lenis |
| Auth | JWT (`jose`), bcrypt |
| Media | Cloudinary |
| Toasts/notifications | Sonner |
| Customer messaging | WhatsApp deep links |
| Analytics | Google Analytics 4, Meta Pixel |

---

## Project Structure

```
app/
  admin/            → Admin panel (protected routes under (protected)/, login separate)
  api/               → API routes (auth, products, categories, orders, cart validation)
  products/          → Public product listing + detail pages
  cart/, checkout/   → Cart and checkout flow
  about, contact, privacy-policy, returns, shipping/  → Static content pages
components/
  admin/             → Admin-only components (sidebar, forms, charts)
  shop/              → Storefront filtering/browsing components
  ui/                → Shared UI primitives
  *.jsx              → Storefront components (hero, navbar, footer, product card, etc.)
lib/                 → Shared utilities (auth, db, cart logic, WhatsApp messaging, constants)
models/              → Mongoose schemas (Product, Category, Order)
store/               → Zustand cart store
```

---

## Getting Started

```bash
git clone <repo-url>
cd flowerista
npm install
```

Create a `.env.local` file in the project root (see [Environment Variables](#environment-variables) below), then:

```bash
npm run dev
```

The site runs at `http://localhost:3000`. The admin panel is at `/admin/login`.

---

## Environment Variables

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | Yes | Connection string for this project's own database. |
| `JWT_SECRET` | Yes | Used to sign admin session tokens. Generate a strong, unique secret — do not reuse a secret from any other project. |
| `ADMIN_EMAIL` | Yes | Admin login email. |
| `ADMIN_PASSWORD_HASH` | Yes | Bcrypt hash (cost factor 12) of the admin password — never store the plain password. See below for how to generate one. |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary account name for product image uploads. |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Yes | Business WhatsApp number (international format), used for order status messages and the footer/contact CTA. |
| `NEXT_PUBLIC_GA_ID` | Optional | Google Analytics 4 property ID. |
| `NEXT_PUBLIC_SITE_URL` | Yes | Production domain — used for the sitemap and metadata. |

### Generating `ADMIN_PASSWORD_HASH`

```bash
node -e "console.log(require('bcryptjs').hashSync('YOUR_PASSWORD_HERE', 12))"
```

Copy the full output string (starts with `$2a$` or `$2b$`) into `ADMIN_PASSWORD_HASH`. Never commit the plain-text password anywhere, including this file.

---

## Product Model

Products have no size or color variants — each listing is one fixed design at one price. Availability is a manual boolean the admin toggles (there is no stock-count/inventory system). Each product also has a `maxQuantity` cap to keep single orders within a realistic handmade production limit; this is configurable per product in the admin panel.

### Categories

- **Crochet** (no subcategories)
- **Pipecleaner Art**
  - Name Wall Hangings
  - Decorative Wall Hangings
  - Flower Baskets
  - Flower Bouquets

Product listing URLs use `?category=<slug>&subcategory=<slug>`, e.g. `/products?category=pipecleaner-art&subcategory=flower-baskets`.

---

## Design System

Colors are centralized as CSS custom properties in `globals.css` — no hardcoded hex values appear in components.

| Token | Hex | Usage |
|---|---|---|
| `--color-bg` | `#ffdff0` | Page background |
| `--color-card` | `#dadadb` | Cards, inputs |
| `--color-accent` | `#e51f76` | CTAs, active/hover states, badges |

White text on the accent color is reserved for large/bold text only (small text uses dark text on accent, for contrast reasons). Every card-type surface carries a border or shadow, since the background/card colors are close enough in luminance that they don't separate on color alone.

The admin panel uses its own separate dark-theme token set, sharing only the accent color with the storefront.

---

## Deployment

Standard Next.js deployment (Vercel or similar). Ensure all environment variables above are set in the deployment platform before the first deploy — the app will fail to connect to the database or authenticate admin users without them.

Before going live, double check:
- `NEXT_PUBLIC_SITE_URL` matches the real production domain (affects sitemap/metadata correctness)
- `robots.js` / `sitemap.js` are generating URLs against the production domain
- The shipping cost constant in `lib/constants.js` reflects the final confirmed rate, not a placeholder

---

## Checkout Validation & Security

Checkout input is validated at two **independent** layers with a strict trust boundary between them. Both layers import their format rules from a single source of truth — `src/lib/checkoutValidation.js` — so the client and server can never silently drift apart.

### Layer 1 — Client-side (presentation only)

`src/app/checkout/page.jsx` validates five fields (first name, last name, postal code, email, delivery contact number) on blur and again on submit, showing a field-specific message below each input and focusing the first invalid field. This layer exists **only** to give real customers fast, friendly feedback.

> **This is not a security control.** Anything running in the browser can be bypassed (curl, Postman, or a script hitting the API directly). The client-side validation provides **zero** protection against a malicious request. The API route below re-runs every check independently and is the only place a rule is actually enforced.

The other address fields (street, city, province, country) are intentionally **not** format-validated — they are free text with presence + length checks only.

### Layer 2 — Server-side (the enforcement point)

`src/app/api/orders/create/route.js` treats every request body as hostile. In order:

1. **Rate-limit by IP** — coarse throttle on scripted submissions (`src/lib/rateLimit.js`).
2. **Strip dangerous keys** — recursively removes any key that is `$`-prefixed, contains a `.`, or is a prototype-pollution vector (`__proto__`, `prototype`, `constructor`) from the entire body before any field is read. Neutralizes NoSQL-operator injection (e.g. `{"$gt":""}`) and prototype pollution.
3. **Type-guard** — any field expected to be a string that arrives as an object/array is rejected outright.
4. **Format re-validation** — the same phone / name / postal / email checks the browser runs, from the shared module.
5. **Whitelist** — only known fields are copied into the object handed to Mongoose; the raw request body is never passed to `create()`/`find()`.
6. **Field-by-field queries** — product lookups are built from validated primitives only, never from raw input.
7. **Normalize** — email is lowercased/trimmed; phone is collapsed to a canonical `03XXXXXXXXX` form before storage.
8. **Generic errors** — raw Mongoose/Mongo error text and stack traces never reach the client.

Prices, availability, `isActive`, `maxQuantity`, shipping cost, and tip bounds are all re-computed/re-validated server-side against the database — client-supplied prices are ignored.

### Layer 3 — Schema constraints (defense-in-depth)

`src/models/Order.js` adds `maxlength` + `match` validators (using the same shared regexes) on the customer name, email, phone, WhatsApp number, and postal code, plus length caps on the free-text address fields. This ensures the database itself rejects malformed customer data arriving from **any** code path — seed scripts, migrations, or future admin tooling — not just the checkout route.

### Field rules

| Field | Rule |
|---|---|
| First / last name | Unicode letters only; spaces, hyphens, and apostrophes (`'` and `’`) allowed **between** letter groups so names like `O'Brien`, `Anne-Marie`, and `de la Cruz` pass. No digits or other symbols. Max 50 chars each. |
| Postal code | Optional. When provided, exactly **5 digits** (Pakistan ships-to only). Revisit if international shipping is enabled. |
| Email | `name@domain.tld` — one `@`, non-empty local part, a domain with a dot, and a letters-only TLD ≥ 2 chars. Max 254 chars. |
| Phone | Exactly one of: `03XXXXXXXXX` (11 digits), `92XXXXXXXXXX` (12 digits), or `03XX-XXXXXXX` (single dash after the 4th digit). Spaces, `+`, extra dashes, and wrong digit counts are rejected. Stored canonicalized to `03XXXXXXXXX`. |

### Rate-limiter deployment note

`src/lib/rateLimit.js` is an in-memory, fixed-window limiter. It works as a speed bump on a **single** long-lived Node instance (e.g. `next start` on one server) but does **not** coordinate across multiple instances or serverless invocations. If you deploy to a multi-instance/serverless platform, replace the in-memory map with a shared store (Redis / Upstash / `@vercel/kv`) exposing the same `rateLimit(key, opts)` check.
