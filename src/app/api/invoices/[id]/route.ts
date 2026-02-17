import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import type { Client, Invoice, InvoiceItem } from "@/lib/types";

type InvoiceRow = Invoice & {
  total: string | number;
  protocol_unit_price: string | number;
  protocol_total: string | number;
  onsite_unit_price: string | number;
  onsite_total: string | number;
  remote_unit_price: string | number;
  remote_total: string | number;
  visit_discount_percent: string | number;
  visit_discount_amount: string | number;
  implementation_fee: string | number;
  subtotal: string | number;
  discount_amount: string | number;
};

type InvoiceItemRow = InvoiceItem & {
  quantity: string | number;
  unit_price: string | number;
  total: string | number;
};

function toNumber(value: string | number): number {
  return Number(value) || 0;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const invoices = await sql<InvoiceRow[]>`
    select *
    from invoices
    where id = ${id}::uuid
    limit 1
  `;
  const invoice = invoices[0];

  if (!invoice) {
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
  }

  const clients = await sql<Client[]>`
    select *
    from clients
    where id = ${invoice.client_id}::uuid
    limit 1
  `;
  const client = clients[0];

  if (!client) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const items = await sql<InvoiceItemRow[]>`
    select *
    from invoice_items
    where invoice_id = ${invoice.id}::uuid
    order by sort_order asc
  `;

  const normalizedInvoice: Invoice = {
    ...invoice,
    protocol_unit_price: toNumber(invoice.protocol_unit_price),
    protocol_total: toNumber(invoice.protocol_total),
    onsite_unit_price: toNumber(invoice.onsite_unit_price),
    onsite_total: toNumber(invoice.onsite_total),
    remote_unit_price: toNumber(invoice.remote_unit_price),
    remote_total: toNumber(invoice.remote_total),
    visit_discount_percent: toNumber(invoice.visit_discount_percent),
    visit_discount_amount: toNumber(invoice.visit_discount_amount),
    implementation_fee: toNumber(invoice.implementation_fee),
    subtotal: toNumber(invoice.subtotal),
    discount_amount: toNumber(invoice.discount_amount),
    total: toNumber(invoice.total),
  };

  const normalizedItems: InvoiceItem[] = items.map((item) => ({
    ...item,
    quantity: toNumber(item.quantity),
    unit_price: toNumber(item.unit_price),
    total: toNumber(item.total),
  }));

  return NextResponse.json({
    invoice: normalizedInvoice,
    client,
    items: normalizedItems,
  });
}
