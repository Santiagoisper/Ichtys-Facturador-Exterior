"use client";

import { COMPANY_INFO, BANK_DETAILS } from "@/lib/constants";
import { formatCurrency } from "@/lib/pricing";
import type { Client, Invoice, InvoiceItem } from "@/lib/types";

interface InvoiceViewProps {
  invoice: Invoice;
  client: Client;
  items: InvoiceItem[];
}

export function InvoiceView({ invoice, client, items }: InvoiceViewProps) {
  const formattedDate = new Date(invoice.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      id="invoice-print-root"
      className="bg-white rounded-lg border p-8 max-w-4xl mx-auto print:border-none print:p-0 print:shadow-none"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-[#134252]">
        <div>
          <h1 className="text-4xl font-bold text-[#134252] mb-2">INVOICE</h1>
          <div className="text-sm text-gray-500 leading-relaxed">
            <p className="font-semibold text-[#134252]">{COMPANY_INFO.adb}</p>
            <p>{COMPANY_INFO.legalName}</p>
            <p>
              {COMPANY_INFO.taxIdLabel}: {COMPANY_INFO.taxId}
            </p>
            <p>{COMPANY_INFO.address}</p>
            <p>{COMPANY_INFO.city}</p>
          </div>
        </div>
        <div className="text-right space-y-2">
          <div>
            <p className="text-xs font-bold text-[#134252]">Invoice #</p>
            <p className="text-sm text-gray-600">{invoice.invoice_number}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-[#134252]">Date</p>
            <p className="text-sm text-gray-600">{formattedDate}</p>
          </div>
          {invoice.period && (
            <div>
              <p className="text-xs font-bold text-[#134252]">Period</p>
              <p className="text-sm text-gray-600">{invoice.period}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-6 pb-4 border-b">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
          Bill To:
        </p>
        <p className="text-lg font-bold text-[#134252]">{client.nombre}</p>
        <div className="text-sm text-gray-600 leading-relaxed">
          {client.direccion && <p>{client.direccion}</p>}
          {client.telefono && <p>Tel: {client.telefono}</p>}
          {client.email && <p>{client.email}</p>}
          {client.rut_tax_id && <p>Tax/RUT: {client.rut_tax_id}</p>}
        </div>
      </div>

      {/* Service Items Table */}
      <table className="w-full text-sm mb-6">
        <tbody>
          {/* Protocol Fee */}
          {invoice.protocol_count > 0 && (
            <>
              <tr className="border-b">
                <td className="py-2.5 font-semibold text-[#134252]">
                  Protocol Base Fee
                </td>
                <td className="py-2.5 text-right">
                  USD {formatCurrency(invoice.protocol_total)}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5 pb-3 text-xs text-gray-500">
                  {invoice.protocol_count} protocol
                  {invoice.protocol_count !== 1 ? "s" : ""} @ USD{" "}
                  {formatCurrency(invoice.protocol_unit_price)}
                </td>
                <td></td>
              </tr>
            </>
          )}

          {/* On-Site Visits */}
          {invoice.onsite_visits > 0 && (
            <>
              <tr className="border-b">
                <td className="py-2.5 font-semibold text-[#134252]">
                  On-Site Visits
                </td>
                <td className="py-2.5 text-right">
                  USD {formatCurrency(invoice.onsite_total)}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5 pb-3 text-xs text-gray-500">
                  {invoice.onsite_visits} visit
                  {invoice.onsite_visits !== 1 ? "s" : ""} @ USD{" "}
                  {formatCurrency(invoice.onsite_unit_price)}
                  /ea
                </td>
                <td></td>
              </tr>
            </>
          )}

          {/* Remote Visits */}
          {invoice.remote_visits > 0 && (
            <>
              <tr className="border-b">
                <td className="py-2.5 font-semibold text-[#134252]">
                  Remote Visits
                </td>
                <td className="py-2.5 text-right">
                  USD {formatCurrency(invoice.remote_total)}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5 pb-3 text-xs text-gray-500">
                  {invoice.remote_visits} visit
                  {invoice.remote_visits !== 1 ? "s" : ""} @ USD{" "}
                  {formatCurrency(invoice.remote_unit_price)}
                  /ea
                </td>
                <td></td>
              </tr>
            </>
          )}

          {/* Subtotal before discount */}
          {(invoice.onsite_visits > 0 || invoice.remote_visits > 0) && (
            <tr className="bg-gray-50 font-semibold border-b">
              <td className="py-2.5 px-2">Subtotal (before discount)</td>
              <td className="py-2.5 px-2 text-right">
                USD{" "}
                {formatCurrency(invoice.onsite_total + invoice.remote_total)}
              </td>
            </tr>
          )}

          {/* Discount */}
          {invoice.visit_discount_percent > 0 && (
            <tr className="text-amber-700 font-medium border-b">
              <td className="py-2.5">
                Discount ({invoice.visit_discount_percent}%)
              </td>
              <td className="py-2.5 text-right">
                -USD {formatCurrency(invoice.visit_discount_amount)}
              </td>
            </tr>
          )}

          {/* After discount */}
          {invoice.visit_discount_percent > 0 && (
            <tr className="bg-gray-50 font-semibold border-b">
              <td className="py-2.5 px-2">Subtotal (after discount)</td>
              <td className="py-2.5 px-2 text-right">
                USD{" "}
                {formatCurrency(
                  invoice.onsite_total +
                    invoice.remote_total -
                    invoice.visit_discount_amount
                )}
              </td>
            </tr>
          )}

          {/* Implementation Fee */}
          {invoice.implementation_fee > 0 && (
            <tr className="border-b">
              <td className="py-2.5 font-semibold text-[#134252]">
                Implementation Fee
              </td>
              <td className="py-2.5 text-right">
                USD {formatCurrency(invoice.implementation_fee)}
              </td>
            </tr>
          )}

          {/* Free-form line items */}
          {items.length > 0 && (
            <>
              <tr>
                <td
                  colSpan={2}
                  className="pt-4 pb-2 font-bold text-[#134252] text-xs uppercase tracking-wider"
                >
                  Additional Items
                </td>
              </tr>
              {items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2.5">
                    <span className="font-medium text-[#134252]">
                      {item.description}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({item.quantity} x USD {formatCurrency(item.unit_price)})
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    USD {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </>
          )}

          {/* Total */}
          <tr className="bg-[#1a7482]/10 border-t-2 border-b-2 border-[#1a7482]">
            <td className="py-3 px-2 font-bold text-[#1a7482]">TOTAL DUE</td>
            <td className="py-3 px-2 text-right font-bold text-[#1a7482]">
              USD {formatCurrency(invoice.total)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Grand Total */}
      <div className="text-right mb-8 pt-4 border-t">
        <span className="text-2xl text-[#1a7482] mr-1">USD</span>
        <span className="text-4xl font-bold text-[#1a7482]">
          {formatCurrency(invoice.total)}
        </span>
      </div>

      {/* Bank Details */}
      <div className="border-t pt-6">
        <h3 className="font-bold text-[#134252] uppercase text-sm tracking-wide mb-3">
          Bank Transfer Details
        </h3>
        <div className="text-sm leading-relaxed">
          <p>
            <strong>{BANK_DETAILS.bank}</strong>
          </p>
          <p>
            <strong>ABA:</strong> {BANK_DETAILS.aba} |{" "}
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
        <div className="mt-4 bg-gray-50 rounded-md p-3 text-xs text-gray-600 space-y-1">
          {BANK_DETAILS.notes.map((note, i) => (
            <p key={i}>
              <strong>*</strong> {note}
            </p>
          ))}
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-bold text-[#134252] uppercase text-sm tracking-wide mb-2">
            Notes
          </h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {invoice.notes}
          </p>
        </div>
      )}
    </div>
  );
}
