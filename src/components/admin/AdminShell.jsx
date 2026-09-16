"use client";

import { useEffect, useState } from "react";
import { PanelLeftOpen } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setSidebarOpen(false);
    }
  }, []);

  const toggleSidebar = () => setSidebarOpen((open) => !open);

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <AdminSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      {!sidebarOpen && (
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={toggleSidebar}
          className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full lg:hidden"
          style={{
            backgroundColor: "var(--admin-surface)",
            color: "var(--admin-text-muted)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <PanelLeftOpen size={18} />
        </button>
      )}

      <main
        className={`min-h-screen flex-1 p-8 transition-[margin] duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"}`}
        style={{ backgroundColor: "var(--admin-bg)" }}
      >
        {children}
      </main>
    </div>
  );
}
