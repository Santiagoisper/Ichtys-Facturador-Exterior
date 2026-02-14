"use client";

import { BANK_DETAILS, COMPANY_INFO } from "@/lib/constants";
import { formatCurrency } from "@/lib/pricing";
import type { Client, Invoice, InvoiceItem } from "@/lib/types";

interface InvoiceViewProps {
  invoice: Invoice;
  client: Client;
  items: InvoiceItem[];
}

type InvoiceRow = {
  key: string;
  concept: string;
  quantity: string;
  unitPrice: number;
  total: number;
};

export function InvoiceView({ invoice, client, items }: InvoiceViewProps) {
  const formattedDate = new Date(invoice.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const rows: InvoiceRow[] = [];

  if (invoice.protocol_count > 0) {
    rows.push({
      key: "protocol",
      concept: "Protocol Base Fee",
      quantity: String(invoice.protocol_count),
      unitPrice: invoice.protocol_unit_price,
      total: invoice.protocol_total,
    });
  }

  if (invoice.onsite_visits > 0) {
    rows.push({
      key: "onsite",
      concept: "On-Site Visits",
      quantity: String(invoice.onsite_visits),
      unitPrice: invoice.onsite_unit_price,
      total: invoice.onsite_total,
    });
  }

  if (invoice.remote_visits > 0) {
    rows.push({
      key: "remote",
      concept: "Remote Visits",
      quantity: String(invoice.remote_visits),
      unitPrice: invoice.remote_unit_price,
      total: invoice.remote_total,
    });
  }

  if (invoice.implementation_fee > 0) {
    rows.push({
      key: "implementation",
      concept: "Implementation Fee",
      quantity: "1",
      unitPrice: invoice.implementation_fee,
      total: invoice.implementation_fee,
    });
  }

  items.forEach((item) => {
    rows.push({
      key: item.id,
      concept: item.description,
      quantity: String(item.quantity),
      unitPrice: item.unit_price,
      total: item.total,
    });
  });

  return (
    <div
      id="invoice-print-root"
      className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-[#d7e3e7] bg-white shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none"
    >
      <div className="border-b border-[#d7e3e7] bg-[#134252] px-8 py-7 text-white print:bg-white print:text-[#134252]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/70 print:text-[#134252]/70">
              Invoice
            </p>
            <h1 className="mt-2 text-4xl font-bold">{invoice.invoice_number}</h1>
            <p className="mt-2 text-sm text-white/80 print:text-[#134252]/80">
              Issue Date: {formattedDate}
              {invoice.period ? ` | Period: ${invoice.period}` : ""}
            </p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-right text-sm print:border-[#d7e3e7] print:bg-[#f4f8f9]">
            <p className="text-xs uppercase tracking-wide text-white/70 print:text-[#134252]/70">
              Amount Due
            </p>
            <p className="mt-1 text-3xl font-bold">USD {formatCurrency(invoice.total)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 border-b border-[#d7e3e7] px-8 py-6 md:grid-cols-2">
        <div className="rounded-xl border border-[#d7e3e7] bg-[#f7fbfc] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7d87]">
            From
          </p>
          <p className="mt-2 text-lg font-bold text-[#134252]">{COMPANY_INFO.adb}</p>
          <div className="mt-2 space-y-1 text-sm text-[#4b5e67]">
            <p>{COMPANY_INFO.legalName}</p>
            <p>
              {COMPANY_INFO.taxIdLabel}: {COMPANY_INFO.taxId}
            </p>
            <p>{COMPANY_INFO.address}</p>
            <p>{COMPANY_INFO.city}</p>
          </div>
        </div>

        <div className="rounded-xl border border-[#d7e3e7] bg-[#f7fbfc] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7d87]">
            Bill To
          </p>
          <p className="mt-2 text-lg font-bold text-[#134252]">{client.nombre}</p>
          <div className="mt-2 space-y-1 text-sm text-[#4b5e67]">
            {client.direccion && <p>{client.direccion}</p>}
            {client.telefono && <p>Tel: {client.telefono}</p>}
            {client.email && <p>{client.email}</p>}
            {client.rut_tax_id && <p>Tax/RUT: {client.rut_tax_id}</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 px-8 py-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-xl border border-[#d7e3e7]">
          <table className="w-full text-sm">
            <thead className="bg-[#edf4f6] text-[#134252]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Concept</th>
                <th className="px-4 py-3 text-right font-semibold">Qty</th>
                <th className="px-4 py-3 text-right font-semibold">Unit (USD)</th>
                <th className="px-4 py-3 text-right font-semibold">Amount (USD)</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-[#6b7d87]">
                    No billable items in this invoice.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.key} className="border-t border-[#edf3f5]">
                    <td className="px-4 py-3 text-[#134252]">{row.concept}</td>
                    <td className="px-4 py-3 text-right text-[#4b5e67]">
                      {row.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-[#4b5e67]">
                      {formatCurrency(row.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#134252]">
                      {formatCurrency(row.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[#d7e3e7] bg-[#f7fbfc] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#6b7d87]">
              Summary
            </h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between text-[#4b5e67]">
                <span>Subtotal</span>
                <span>USD {formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-[#4b5e67]">
                <span>Discount</span>
                <span>-USD {formatCurrency(invoice.discount_amount)}</span>
              </div>
              <div className="mt-3 border-t border-[#d7e3e7] pt-3">
                <div className="flex items-center justify-between text-base font-bold text-[#134252]">
                  <span>Total Due</span>
                  <span>USD {formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#d7e3e7] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#6b7d87]">
              Bank Details
            </h3>
            <div className="mt-3 space-y-1 text-sm text-[#4b5e67]">
              <p>
                <strong>Bank:</strong> {BANK_DETAILS.bank}
              </p>
              <p>
                <strong>ABA:</strong> {BANK_DETAILS.aba}
              </p>
              <p>
                <strong>Swift:</strong> {BANK_DETAILS.swift}
              </p>
              <p>
                <strong>Beneficiary:</strong> {BANK_DETAILS.beneficiary}
              </p>
              <p>
                <strong>Account:</strong> {BANK_DETAILS.account}
              </p>
              <p>
                <strong>Address:</strong> {BANK_DETAILS.address}
              </p>
            </div>
            <div className="mt-3 space-y-1 rounded-lg bg-[#f7fbfc] p-3 text-xs text-[#5b6f78]">
              {BANK_DETAILS.notes.map((note, index) => (
                <p key={index}>* {note}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="border-t border-[#d7e3e7] px-8 py-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#6b7d87]">
            Notes
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-[#4b5e67]">
            {invoice.notes}
          </p>
        </div>
      )}
    </div>
  );
}
