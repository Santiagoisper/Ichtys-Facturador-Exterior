import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ichtys - Sistema de Facturacion",
  description:
    "Sistema de facturacion para Ichtys Technology - Veritas Lux Capital LLC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
