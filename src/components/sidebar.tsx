"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  UserPlus,
  FileText,
  FilePlus,
  LayoutDashboard,
} from "lucide-react";

const navGroups = [
  {
    title: "General",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Clientes",
    items: [
      {
        label: "Lista de Clientes",
        href: "/dashboard/clientes",
        icon: Users,
      },
      {
        label: "Ingresar Cliente",
        href: "/dashboard/clientes/nuevo",
        icon: UserPlus,
      },
    ],
  },
  {
    title: "Facturas",
    items: [
      {
        label: "Lista de Facturas",
        href: "/dashboard/facturas",
        icon: FileText,
      },
      {
        label: "Crear Factura",
        href: "/dashboard/facturas/nueva",
        icon: FilePlus,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-[#134252] text-white">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-10 h-10 bg-[#1a7482] rounded-lg flex items-center justify-center font-bold text-lg">
          I
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wide">ICHTYS</h1>
          <p className="text-xs text-white/60">Facturacion</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                      isActive
                        ? "bg-[#1a7482] text-white font-medium"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs text-white/40">Veritas Lux Capital LLC</p>
      </div>
    </aside>
  );
}
