"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
      try {
        const response = await fetch(`/api/invoices/${params.id}`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          router.push("/dashboard/facturas");
          return;
        }

        const payload = (await response.json()) as {
          invoice: Invoice;
          client: Client;
          items: InvoiceItem[];
        };

        setInvoice(payload.invoice);
        setClient(payload.client);
        setItems(payload.items ?? []);
      } finally {
        setLoading(false);
      }
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

  async function loadScriptWithFallback(sources: string[]) {
    let lastError: unknown = null;
    for (const src of sources) {
      try {
        await loadScript(src);
        return;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError ?? new Error("No se pudieron cargar scripts externos.");
  }

  async function handleExportPdf() {
    if (!invoice || !client) return;

    try {
      setExportingPdf(true);

      await loadScriptWithFallback([
        "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
        "https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js",
      ]);

      const jsPdfCtor = (
        window as unknown as {
          jspdf: {
            jsPDF: new (options: Record<string, unknown>) => {
              setFont: (fontName: string, fontStyle?: string) => void;
              setFontSize: (size: number) => void;
              setTextColor: (r: number, g: number, b: number) => void;
              setDrawColor: (r: number, g: number, b: number) => void;
              setLineWidth: (width: number) => void;
              line: (x1: number, y1: number, x2: number, y2: number) => void;
              rect: (
                x: number,
                y: number,
                width: number,
                height: number,
                style?: "S" | "F" | "FD" | "DF"
              ) => void;
              text: (
                text: string | string[],
                x: number,
                y: number,
                options?: { align?: "left" | "center" | "right" }
              ) => void;
              splitTextToSize: (text: string, size: number) => string[];
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
        orientation: "l",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 297;
      const margin = 10;
      const right = pageWidth - margin;
      let y = 16;

      const rows: Array<{
        concept: string;
        qty: string;
        unit: number;
        amount: number;
      }> = [];

      if (invoice.protocol_count > 0) {
        rows.push({
          concept: "Protocol Base Fee",
          qty: String(invoice.protocol_count),
          unit: invoice.protocol_unit_price,
          amount: invoice.protocol_total,
        });
      }
      if (invoice.onsite_visits > 0) {
        rows.push({
          concept: "On-Site Visits",
          qty: String(invoice.onsite_visits),
          unit: invoice.onsite_unit_price,
          amount: invoice.onsite_total,
        });
      }
      if (invoice.remote_visits > 0) {
        rows.push({
          concept: "Remote Visits",
          qty: String(invoice.remote_visits),
          unit: invoice.remote_unit_price,
          amount: invoice.remote_total,
        });
      }
      if (invoice.implementation_fee > 0) {
        rows.push({
          concept: "Implementation Fee",
          qty: "1",
          unit: invoice.implementation_fee,
          amount: invoice.implementation_fee,
        });
      }
      items.forEach((item) => {
        rows.push({
          concept: item.description,
          qty: String(item.quantity),
          unit: item.unit_price,
          amount: item.total,
        });
      });

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.setTextColor(19, 66, 82);
      pdf.text("INVOICE", margin, y);
      pdf.setFontSize(11);
      pdf.text(invoice.invoice_number, right, y, { align: "right" });
      y += 7;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(73, 94, 103);
      pdf.text(`Date: ${new Date(invoice.date).toLocaleDateString("en-US")}`, right, y, {
        align: "right",
      });
      if (invoice.period) {
        y += 4;
        pdf.text(`Period: ${invoice.period}`, right, y, { align: "right" });
      }

      const leftY = 34;
      const leftCol = margin;
      const rightCol = 112;

      pdf.setDrawColor(215, 227, 231);
      pdf.rect(leftCol, leftY, 88, 30, "S");
      pdf.rect(rightCol, leftY, 88, 30, "S");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(107, 125, 135);
      pdf.text("FROM", leftCol + 3, leftY + 5);
      pdf.text("BILL TO", rightCol + 3, leftY + 5);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9.5);
      pdf.setTextColor(19, 66, 82);
      pdf.text(COMPANY_INFO.adb, leftCol + 3, leftY + 10);
      pdf.text(client.nombre, rightCol + 3, leftY + 10);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(73, 94, 103);
      const fromLines = [
        COMPANY_INFO.legalName,
        `${COMPANY_INFO.taxIdLabel}: ${COMPANY_INFO.taxId}`,
        `${COMPANY_INFO.address}, ${COMPANY_INFO.city}`,
      ];
      const billLines = [
        client.direccion || "",
        client.email || "",
        client.rut_tax_id ? `Tax/RUT: ${client.rut_tax_id}` : "",
      ].filter(Boolean);

      fromLines.forEach((line, i) => pdf.text(line, leftCol + 3, leftY + 14 + i * 4));
      billLines.slice(0, 3).forEach((line, i) =>
        pdf.text(line, rightCol + 3, leftY + 14 + i * 4)
      );

      const tableX = 204;
      const tableW = 83;
      const colConcept = tableX + 2;
      const colQty = tableX + 53;
      const colUnit = tableX + 63;
      const colAmount = tableX + 81;
      const tableY = 34;

      pdf.setDrawColor(215, 227, 231);
      pdf.rect(tableX, tableY, tableW, 132, "S");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(107, 125, 135);
      pdf.text("CONCEPT", colConcept, tableY + 5);
      pdf.text("QTY", colQty, tableY + 5, { align: "right" });
      pdf.text("UNIT", colUnit, tableY + 5, { align: "right" });
      pdf.text("AMOUNT", colAmount, tableY + 5, { align: "right" });
      pdf.line(tableX, tableY + 7, tableX + tableW, tableY + 7);

      let rowY = tableY + 12;
      const maxRows = 9;
      const visibleRows = rows.slice(0, maxRows);
      visibleRows.forEach((row) => {
        const concept = row.concept.length > 24 ? `${row.concept.slice(0, 24)}...` : row.concept;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(19, 66, 82);
        pdf.text(concept, colConcept, rowY);
        pdf.text(row.qty, colQty, rowY, { align: "right" });
        pdf.text(formatCurrency(row.unit), colUnit, rowY, { align: "right" });
        pdf.text(formatCurrency(row.amount), colAmount, rowY, { align: "right" });
        rowY += 6;
      });
      if (rows.length > maxRows) {
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(7.5);
        pdf.setTextColor(107, 125, 135);
        pdf.text(`+ ${rows.length - maxRows} items more`, colConcept, rowY);
      }

      const summaryY = 114;
      pdf.setDrawColor(215, 227, 231);
      pdf.rect(10, summaryY, 192, 52, "S");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(19, 66, 82);
      pdf.text("SUMMARY", 13, summaryY + 6);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(73, 94, 103);
      pdf.text("Subtotal", 13, summaryY + 14);
      pdf.text(`USD ${formatCurrency(invoice.subtotal)}`, 90, summaryY + 14, { align: "right" });
      pdf.text("Discount", 13, summaryY + 20);
      pdf.text(`-USD ${formatCurrency(invoice.discount_amount)}`, 90, summaryY + 20, {
        align: "right",
      });
      pdf.setLineWidth(0.3);
      pdf.line(13, summaryY + 24, 90, summaryY + 24);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(19, 66, 82);
      pdf.text("TOTAL DUE", 13, summaryY + 32);
      pdf.text(`USD ${formatCurrency(invoice.total)}`, 90, summaryY + 32, {
        align: "right",
      });

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(19, 66, 82);
      pdf.text("BANK DETAILS", 108, summaryY + 6);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(73, 94, 103);
      const bankLines = [
        `Bank: ${BANK_DETAILS.bank}`,
        `ABA: ${BANK_DETAILS.aba} | Swift: ${BANK_DETAILS.swift}`,
        `Beneficiary: ${BANK_DETAILS.beneficiary}`,
        `Account: ${BANK_DETAILS.account}`,
      ];
      bankLines.forEach((line, i) => pdf.text(line, 108, summaryY + 14 + i * 5));

      if (invoice.notes) {
        const notesTop = 171;
        const notesMaxWidth = pageWidth - margin * 2;
        const notes = pdf.splitTextToSize(invoice.notes, notesMaxWidth - 8).slice(0, 3);
        pdf.setDrawColor(215, 227, 231);
        pdf.rect(margin, notesTop, notesMaxWidth, 25, "S");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(107, 125, 135);
        pdf.text("NOTES", margin + 3, notesTop + 5);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(73, 94, 103);
        pdf.text(notes, margin + 3, notesTop + 10);
      }

      pdf.save(`Invoice-${invoice.invoice_number}.pdf`);
      toast.success("PDF exportado.");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo exportar automaticamente el PDF.");
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
