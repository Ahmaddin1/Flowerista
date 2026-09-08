import ConditionalLayout from "@/components/ConditionalLayout";
import { Cormorant, DM_Sans } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const cormorant = Cormorant({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata = {
  title: {
    default: "Flowerista",
    template: "%s | Flowerista",
  },
  description: "Handmade crochet and pipecleaner art, made with love in Pakistan.",
  keywords: [
    "Flowerista",
    "Flowerista Pakistan",
    "handmade crochet Pakistan",
    "crochet flowers",
    "pipecleaner art",
    "pipe cleaner flowers",
    "handmade flower bouquets",
    "flower baskets",
    "name wall hangings",
    "decorative wall hangings",
    "handmade gifts Pakistan",
    "custom handmade decor",
    "artisan home decor Pakistan",
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL),
  openGraph: {
    type: "website",
    locale: "en_PK",
    siteName: "Flowerista",
    url: process.env.NEXT_PUBLIC_SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const fbPixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        {gaId ? (
          <Script
            id="ga4-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
        ) : null}
        {gaId ? (
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
        ) : null}
        {fbPixelId ? (
          <Script id="facebook-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${fbPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
        ) : null}
        <SmoothScroll>
          <ConditionalLayout>{children}</ConditionalLayout>
          <Toaster position="top-right" richColors />
        </SmoothScroll>
        {fbPixelId ? (
          <noscript>
            <img
              alt=""
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${fbPixelId}&ev=PageView&noscript=1`}
            />
          </noscript>
        ) : null}
      </body>
    </html>
  );
}

