"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateInvoiceStatusAction } from "@/app/actions/invoices";
import { InvoiceView } from "@/components/invoice-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/pricing";
import { BANK_DETAILS, COMPANY_INFO } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Download, Printer } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Client, Invoice, InvoiceItem } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Pagada",
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: inv } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", params.id)
        .single();

      if (!inv) {
        router.push("/dashboard/facturas");
        return;
      }

      const [{ data: clientData }, { data: itemsData }] = await Promise.all([
        supabase.from("clients").select("*").eq("id", inv.client_id).single(),
        supabase
          .from("invoice_items")
          .select("*")
          .eq("invoice_id", inv.id)
          .order("sort_order"),
      ]);

      setInvoice(inv as Invoice);
      setClient(clientData as Client);
      setItems((itemsData as InvoiceItem[]) ?? []);
      setLoading(false);
    }
    load();
  }, [params.id, router]);

  async function handleStatusChange(status: string) {
    if (!invoice) return;
    const result = await updateInvoiceStatusAction(
      invoice.id,
      status as "draft" | "sent" | "paid"
    );
    if (result?.error) {
      toast.error(result.error);
    } else {
      setInvoice({ ...invoice, status: status as "draft" | "sent" | "paid" });
      toast.success(`Estado actualizado a ${STATUS_LABELS[status]}`);
    }
  }

  function loadScript(src: string) {
    return new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(
        `script[data-src="${src}"]`
      ) as HTMLScriptElement | null;
      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.head.appendChild(script);
    });
  }

  async function handleExportPdf() {
    if (!invoice || !client) return;

    try {
      setExportingPdf(true);

      await loadScript(
        "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"
      );

      const jsPdfCtor = (
        window as unknown as {
          jspdf: {
            jsPDF: new (options: Record<string, unknown>) => {
              setFont: (fontName: string, fontStyle?: string) => void;
              setFontSize: (size: number) => void;
              text: (
                text: string,
                x: number,
                y: number,
                options?: { align?: "left" | "center" | "right" }
              ) => void;
              line: (x1: number, y1: number, x2: number, y2: number) => void;
              addImage: (
                imageData: string,
                format: string,
                x: number,
                y: number,
                width: number,
                height: number
              ) => void;
              save: (filename: string) => void;
            };
          };
        }
      ).jspdf?.jsPDF;

      if (!jsPdfCtor) {
        throw new Error("No se pudo inicializar la libreria de PDF.");
      }

      const pdf = new jsPdfCtor({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 210;
      const margin = 8;
      const right = pageWidth - margin;
      let y = 12;
      const line = (step = 4.2) => {
        y += step;
      };

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("INVOICE", margin, y);
      pdf.setFontSize(10);
      pdf.text(`Invoice # ${invoice.invoice_number}`, right, y, { align: "right" });
      line(5);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.text(COMPANY_INFO.adb, margin, y);
      line(3.8);
      pdf.text(COMPANY_INFO.legalName, margin, y);
      line(3.8);
      pdf.text(`${COMPANY_INFO.taxIdLabel}: ${COMPANY_INFO.taxId}`, margin, y);
      line(3.8);
      pdf.text(`${COMPANY_INFO.address}, ${COMPANY_INFO.city}`, margin, y);
      line(4.4);
      pdf.text(
        `Date: ${new Date(invoice.date).toLocaleDateString("en-US")}`,
        right,
        y,
        { align: "right" }
      );
      line(6);

      pdf.setFont("helvetica", "bold");
      pdf.text("Bill To:", margin, y);
      line(4);
      pdf.setFont("helvetica", "normal");
      pdf.text(client.nombre, margin, y);
      line(3.8);
      if (client.direccion) {
        pdf.text(client.direccion, margin, y);
        line(3.8);
      }
      if (client.email) {
        pdf.text(client.email, margin, y);
        line(3.8);
      }
      if (client.rut_tax_id) {
        pdf.text(`Tax/RUT: ${client.rut_tax_id}`, margin, y);
        line(3.8);
      }
      line(2.5);

      pdf.setFont("helvetica", "bold");
      pdf.text("Description", margin, y);
      pdf.text("Amount (USD)", right, y, { align: "right" });
      line(4);
      pdf.line(margin, y - 2.5, right, y - 2.5);

      const addRow = (label: string, amount: number) => {
        pdf.setFont("helvetica", "normal");
        pdf.text(label, margin, y);
        pdf.text(formatCurrency(amount), right, y, { align: "right" });
        line(4);
      };

      if (invoice.protocol_count > 0) {
        addRow(
          `Protocol Base Fee (${invoice.protocol_count} x ${formatCurrency(invoice.protocol_unit_price)})`,
          invoice.protocol_total
        );
      }
      if (invoice.onsite_visits > 0) {
        addRow(
          `On-Site Visits (${invoice.onsite_visits} x ${formatCurrency(invoice.onsite_unit_price)})`,
          invoice.onsite_total
        );
      }
      if (invoice.remote_visits > 0) {
        addRow(
          `Remote Visits (${invoice.remote_visits} x ${formatCurrency(invoice.remote_unit_price)})`,
          invoice.remote_total
        );
      }
      if (invoice.visit_discount_percent > 0) {
        addRow(`Discount (${invoice.visit_discount_percent}%)`, -invoice.visit_discount_amount);
      }
      if (invoice.implementation_fee > 0) {
        addRow("Implementation Fee", invoice.implementation_fee);
      }
      items.slice(0, 6).forEach((item) => {
        addRow(
          `${item.description} (${item.quantity} x ${formatCurrency(item.unit_price)})`,
          item.total
        );
      });

      line(1);
      pdf.line(margin, y - 2.5, right, y - 2.5);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text("TOTAL DUE", margin, y + 1);
      pdf.text(formatCurrency(invoice.total), right, y + 1, { align: "right" });
      line(7);

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Bank: ${BANK_DETAILS.bank}`, margin, y);
      line(3.6);
      pdf.text(`ABA: ${BANK_DETAILS.aba} | Swift: ${BANK_DETAILS.swift}`, margin, y);
      line(3.6);
      pdf.text(`Beneficiary: ${BANK_DETAILS.beneficiary}`, margin, y);
      line(3.6);
      pdf.text(`Account: ${BANK_DETAILS.account}`, margin, y);
      line(3.6);
      pdf.text(`Address: ${BANK_DETAILS.address}`, margin, y);

      pdf.save(`Invoice-${invoice.invoice_number}.pdf`);
      toast.success("PDF exportado.");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo exportar el PDF.");
    } finally {
      setExportingPdf(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!invoice || !client) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/facturas">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#134252]">
              Factura {invoice.invoice_number}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={
                  invoice.status === "paid"
                    ? "default"
                    : invoice.status === "sent"
                      ? "secondary"
                      : "outline"
                }
              >
                {STATUS_LABELS[invoice.status]}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={invoice.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Borrador</SelectItem>
              <SelectItem value="sent">Enviada</SelectItem>
              <SelectItem value="paid">Pagada</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="default"
            className="gap-2 bg-[#134252] hover:bg-[#0f3340]"
            onClick={handleExportPdf}
            disabled={exportingPdf}
          >
            <Download className="w-4 h-4" />
            {exportingPdf ? "Exportando..." : "Export PDF"}
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
        </div>
      </div>

      <InvoiceView invoice={invoice} client={client} items={items} />
    </div>
  );
}
