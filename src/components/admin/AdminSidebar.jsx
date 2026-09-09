"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import {
  BarChart3,
  ShoppingBag,
  Package,
  Settings,
  LogOut,
  Home,
  ChevronLeft,
  PanelLeftClose,
} from "lucide-react";

const EXPANDED_WIDTH = 256; // w-64
const COLLAPSED_WIDTH = 80; // w-20

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const asideRef = useRef(null);
  const labelRefs = useRef([]); // all text nodes (title, link labels, logout label)
  labelRefs.current = [];

  const addLabelRef = (el) => {
    if (el && !labelRefs.current.includes(el)) {
      labelRefs.current.push(el);
    }
  };

  const navLinks = [
    { label: "Dashboard", route: "/admin", icon: BarChart3 },
    { label: "Orders", route: "/admin/orders", icon: ShoppingBag },
    { label: "Products", route: "/admin/products", icon: Package },
    { label: "Settings", route: "/admin/settings", icon: Settings },
    { label: "Home", route: "/", icon: Home },
  ];

  const isActive = (route) => {
    if (route === "/") return pathname === "/";
    if (route === "/admin") return pathname === "/admin";
    return pathname.startsWith(route);
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/admin/auth/logout", { method: "POST" });
      if (res.ok) router.push("/admin/login");
      else console.error("Logout failed");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const tl = gsap.timeline();

    if (collapsed) {
      // Fade labels out first, then shrink the sidebar
      tl.to(labelRefs.current, {
        opacity: 0,
        duration: 0.15,
        ease: "power1.out",
      }).to(
        asideRef.current,
        {
          width: COLLAPSED_WIDTH,
          duration: 0.3,
          ease: "power2.inOut",
        },
        "-=0.05",
      );
    } else {
      // Expand the sidebar first, then fade labels in
      tl.to(asideRef.current, {
        width: EXPANDED_WIDTH,
        duration: 0.3,
        ease: "power2.inOut",
      }).to(
        labelRefs.current,
        {
          opacity: 1,
          duration: 0.2,
          ease: "power1.in",
        },
        "-=0.1",
      );
    }

    return () => tl.kill();
  }, [collapsed]);

  return (
    <aside
      ref={asideRef}
      className="fixed left-0 top-0 h-screen flex flex-col overflow-hidden"
      style={{
        width: EXPANDED_WIDTH,
        backgroundColor: "var(--admin-bg)",
        borderRight: "1px solid var(--admin-border)",
      }}
    >
      {/* Header */}
      <div className="relative p-6 flex items-center">
        <h1
          ref={addLabelRef}
          className="text-xl font-bold whitespace-nowrap"
          style={{ color: "var(--admin-accent)" }}
        >
          Flowerista Admin
        </h1>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute right-3 top-4 z-10 flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-[var(--admin-accent)] hover:text-white"
          style={{
            backgroundColor: "var(--admin-surface)",
            color: "var(--admin-text-muted)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <PanelLeftClose
            size={18}
            style={{
              transition: "transform 0.3s ease",
              transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-4">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.route);
          return (
            <Link
              key={link.route}
              href={link.route}
              title={collapsed ? link.label : undefined}
              className="flex items-center gap-3 px-4 py-3 rounded mb-1 transition-colors hover:bg-white/50 hover:text-[var(--admin-accent)]"
              style={{
                backgroundColor: active ? "var(--admin-surface)" : undefined,
                color: active
                  ? "var(--admin-accent)"
                  : "var(--admin-text-muted)",
              }}
            >
              <Icon size={20} className="shrink-0" />
              <span ref={addLabelRef} className="whitespace-nowrap">
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded transition-colors hover:bg-[var(--admin-surface)] hover:text-[var(--admin-accent)]"
          style={{
            backgroundColor: "var(--admin-surface-low)",
            color: "var(--admin-text-muted)",
          }}
        >
          <LogOut size={20} className="shrink-0" />
          <span ref={addLabelRef} className="whitespace-nowrap">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}
