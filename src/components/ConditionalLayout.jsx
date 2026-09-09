"use client"

import { usePathname } from "next/navigation"
import Navbar from "@/components/Navbar"
import CartBubble from "@/components/CartBubble"
import ScrollToTop from "@/components/ScrollToTop"
import BottomNav from "@/components/BottomNav"
import Footer from "@/components/Footer"
import { brandName } from "@/lib/constants"

export default function ConditionalLayout({ children }) {
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith("/admin")

  if (isAdminRoute) {
    return <main className="flex-1">{children}</main>
  }

  return (
    <>
      <Navbar brandName={brandName} />
      <CartBubble />
      <ScrollToTop />
      <BottomNav />
      <main className="flex-1 pb-28 md:pb-0">{children}</main>
      <Footer />
    </>
  )
}
