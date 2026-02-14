"use server";

import { createClient } from "@/lib/supabase/server";
import { invoiceSchema, type InvoiceFormData } from "@/lib/validations";
import { calculateInvoiceTotals } from "@/lib/pricing";
import {
  ONSITE_VISIT_PRICE,
  REMOTE_VISIT_PRICE,
} from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getNextInvoiceNumber(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("invoice_number")
    .order("created_at", { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return "INV-0001";

  const lastNum = parseInt(data[0].invoice_number.replace(/\D/g, "")) || 0;
  return `INV-${String(lastNum + 1).padStart(4, "0")}`;
}

export async function createInvoiceAction(formData: InvoiceFormData) {
  const supabase = await createClient();
  const validated = invoiceSchema.parse(formData);

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

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      client_id: validated.client_id,
      invoice_number: validated.invoice_number,
      date: validated.date,
      period: validated.period || null,
      protocol_count: validated.protocol_count,
      protocol_unit_price: totals.protocolUnitPrice,
      protocol_total: totals.protocolTotal,
      onsite_visits: validated.onsite_visits,
      onsite_unit_price: ONSITE_VISIT_PRICE,
      onsite_total: totals.onsiteTotal,
      remote_visits: validated.remote_visits,
      remote_unit_price: REMOTE_VISIT_PRICE,
      remote_total: totals.remoteTotal,
      visit_discount_percent: totals.visitDiscountPercent,
      visit_discount_amount: totals.visitDiscountAmount,
      implementation_fee: totals.implementationFee,
      subtotal: totals.subtotal,
      discount_amount: totals.discountAmount,
      total: totals.total,
      notes: validated.notes || null,
      status: "draft",
    })
    .select()
    .single();

  if (invoiceError) {
    return { error: invoiceError.message };
  }

  if (validated.items.length > 0) {
    const items = validated.items.map((item, index) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price,
      sort_order: index,
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(items);

    if (itemsError) {
      return { error: itemsError.message };
    }
  }

  revalidatePath("/dashboard/facturas");
  redirect(`/dashboard/facturas/${invoice.id}`);
}

export async function updateInvoiceStatusAction(
  id: string,
  status: "draft" | "sent" | "paid"
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("invoices")
    .update({ status })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/facturas");
  revalidatePath(`/dashboard/facturas/${id}`);
  return { error: null };
}

export async function deleteInvoiceAction(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("invoices").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/facturas");
  return { error: null };
}
