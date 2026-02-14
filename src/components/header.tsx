"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Menu,
  LogOut,
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
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Clientes",
    items: [
      { label: "Lista de Clientes", href: "/dashboard/clientes", icon: Users },
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

export function Header({ userEmail }: { userEmail?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-white border-b h-16 flex items-center px-4 md:px-6">
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-[#134252] text-white p-0 border-none">
            <SheetTitle className="sr-only">Menu de navegacion</SheetTitle>
            <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
              <div className="w-10 h-10 bg-[#1a7482] rounded-lg flex items-center justify-center font-bold text-lg">
                I
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-wide">ICHTYS</h1>
                <p className="text-xs text-white/60">Facturacion</p>
              </div>
            </div>
            <nav className="px-3 py-4 space-y-6">
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
                          onClick={() => setOpen(false)}
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
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {userEmail && (
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {userEmail}
          </span>
        )}
        <form action={logout}>
          <Button variant="ghost" size="sm" type="submit" className="gap-2">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
