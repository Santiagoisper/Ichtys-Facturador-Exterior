"use server";

import { sql } from "@/lib/db";
import { invoiceSchema, type InvoiceFormData } from "@/lib/validations";
import { calculateInvoiceTotals } from "@/lib/pricing";
import { ONSITE_VISIT_PRICE, REMOTE_VISIT_PRICE } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function extractInvoiceNumberValue(invoiceNumber: string): number {
  const parsed = parseInt(invoiceNumber.replace(/\D/g, ""), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function getInvoiceNumberSequence(): Promise<{
  lastInvoiceNumber: string;
  nextInvoiceNumber: string;
}> {
  const rows = await sql<{ invoice_number: string }[]>`
    select invoice_number
    from invoices
  `;

  const maxNumber = rows.reduce(
    (max, row) => Math.max(max, extractInvoiceNumberValue(row.invoice_number)),
    0
  );

  return {
    lastInvoiceNumber:
      maxNumber > 0 ? `INV-${String(maxNumber).padStart(4, "0")}` : "N/A",
    nextInvoiceNumber: `INV-${String(maxNumber + 1).padStart(4, "0")}`,
  };
}

export async function getNextInvoiceNumber(): Promise<string> {
  const sequence = await getInvoiceNumberSequence();
  return sequence.nextInvoiceNumber;
}

export async function createInvoiceAction(formData: InvoiceFormData) {
  const validated = invoiceSchema.parse(formData);
  const normalizedInvoiceNumber = validated.invoice_number.trim().toUpperCase();

  const existingInvoice = await sql<{ id: string }[]>`
    select id
    from invoices
    where lower(invoice_number) = lower(${normalizedInvoiceNumber})
    limit 1
  `;

  if (existingInvoice.length > 0) {
    return { error: `El numero de factura ${normalizedInvoiceNumber} ya existe.` };
  }

  const totals = calculateInvoiceTotals({
    protocolCount: validated.protocol_count,
    onsiteVisits: validated.onsite_visits,
    remoteVisits: validated.remote_visits,
    includeImplementation: validated.include_implementation,
    lineItems: validated.items.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unit_price,
    })),
  });

  try {
    const invoiceRows = await sql<{ id: string }[]>`
      insert into invoices (
        client_id,
        invoice_number,
        date,
        period,
        protocol_count,
        protocol_unit_price,
        protocol_total,
        onsite_visits,
        onsite_unit_price,
        onsite_total,
        remote_visits,
        remote_unit_price,
        remote_total,
        visit_discount_percent,
        visit_discount_amount,
        implementation_fee,
        subtotal,
        discount_amount,
        total,
        notes,
        status
      ) values (
        ${validated.client_id}::uuid,
        ${normalizedInvoiceNumber},
        ${validated.date},
        ${validated.period || null},
        ${validated.protocol_count},
        ${totals.protocolUnitPrice},
        ${totals.protocolTotal},
        ${validated.onsite_visits},
        ${ONSITE_VISIT_PRICE},
        ${totals.onsiteTotal},
        ${validated.remote_visits},
        ${REMOTE_VISIT_PRICE},
        ${totals.remoteTotal},
        ${totals.visitDiscountPercent},
        ${totals.visitDiscountAmount},
        ${totals.implementationFee},
        ${totals.subtotal},
        ${totals.discountAmount},
        ${totals.total},
        ${validated.notes || null},
        'draft'
      )
      returning id
    `;

    const invoiceId = invoiceRows[0]?.id;
    if (!invoiceId) {
      return { error: "No se pudo crear la factura." };
    }

    if (validated.items.length > 0) {
      for (let index = 0; index < validated.items.length; index += 1) {
        const item = validated.items[index];
        await sql`
          insert into invoice_items (
            invoice_id,
            description,
            quantity,
            unit_price,
            total,
            sort_order
          ) values (
            ${invoiceId}::uuid,
            ${item.description},
            ${item.quantity},
            ${item.unit_price},
            ${item.quantity * item.unit_price},
            ${index}
          )
        `;
      }
    }

    revalidatePath("/dashboard/facturas");
    redirect(`/dashboard/facturas/${invoiceId}`);
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: string }).code)
        : "";
    if (code === "23505") {
      return {
        error: `El numero de factura ${normalizedInvoiceNumber} ya existe.`,
      };
    }
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "No se pudo crear la factura." };
  }
}

export async function updateInvoiceStatusAction(
  id: string,
  status: "draft" | "sent" | "paid"
) {
  try {
    await sql`
      update invoices
      set status = ${status}
      where id = ${id}::uuid
    `;
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "No se pudo actualizar el estado." };
  }

  revalidatePath("/dashboard/facturas");
  revalidatePath(`/dashboard/facturas/${id}`);
  return { error: null };
}

export async function deleteInvoiceAction(id: string) {
  try {
    await sql`
      delete from invoices
      where id = ${id}::uuid
    `;
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "No se pudo eliminar la factura." };
  }

  revalidatePath("/dashboard/facturas");
  return { error: null };
}
