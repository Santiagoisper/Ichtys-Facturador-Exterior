import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

type SupabaseTable = "clients" | "invoices" | "invoice_items";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

async function fetchSupabaseRows(table: SupabaseTable) {
  const supabaseUrl = getRequiredEnv("SUPABASE_URL");
  const supabaseAnonKey = getRequiredEnv("SUPABASE_ANON_KEY");
  const pageSize = 1000;
  let from = 0;
  const allRows: Record<string, unknown>[] = [];

  while (true) {
    const to = from + pageSize - 1;
    const response = await fetch(
      `${supabaseUrl}/rest/v1/${table}?select=*`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          Range: `${from}-${to}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Supabase ${table} fetch failed: ${response.status} ${body}`);
    }

    const rows = (await response.json()) as Record<string, unknown>[];
    allRows.push(...rows);
    if (rows.length < pageSize) {
      break;
    }
    from += pageSize;
  }

  return allRows;
}

async function upsertClients(rows: Record<string, unknown>[]) {
  for (const row of rows) {
    await sql`
      insert into clients (
        id, nombre, direccion, telefono, email, rut_tax_id, created_at, updated_at
      ) values (
        ${String(row.id)}::uuid,
        ${row.nombre as string},
        ${(row.direccion as string | null) ?? null},
        ${(row.telefono as string | null) ?? null},
        ${(row.email as string | null) ?? null},
        ${(row.rut_tax_id as string | null) ?? null},
        ${(row.created_at as string | null) ?? null},
        ${(row.updated_at as string | null) ?? null}
      )
      on conflict (id) do update set
        nombre = excluded.nombre,
        direccion = excluded.direccion,
        telefono = excluded.telefono,
        email = excluded.email,
        rut_tax_id = excluded.rut_tax_id,
        updated_at = excluded.updated_at
    `;
  }
}

async function upsertInvoices(rows: Record<string, unknown>[]) {
  for (const row of rows) {
    await sql`
      insert into invoices (
        id, client_id, invoice_number, date, period,
        protocol_count, protocol_unit_price, protocol_total,
        onsite_visits, onsite_unit_price, onsite_total,
        remote_visits, remote_unit_price, remote_total,
        visit_discount_percent, visit_discount_amount,
        implementation_fee, subtotal, discount_amount, total,
        notes, status, created_at, updated_at
      ) values (
        ${String(row.id)}::uuid,
        ${String(row.client_id)}::uuid,
        ${row.invoice_number as string},
        ${row.date as string},
        ${(row.period as string | null) ?? null},
        ${(row.protocol_count as number | null) ?? 0},
        ${(row.protocol_unit_price as number | string | null) ?? 0},
        ${(row.protocol_total as number | string | null) ?? 0},
        ${(row.onsite_visits as number | null) ?? 0},
        ${(row.onsite_unit_price as number | string | null) ?? 0},
        ${(row.onsite_total as number | string | null) ?? 0},
        ${(row.remote_visits as number | null) ?? 0},
        ${(row.remote_unit_price as number | string | null) ?? 0},
        ${(row.remote_total as number | string | null) ?? 0},
        ${(row.visit_discount_percent as number | string | null) ?? 0},
        ${(row.visit_discount_amount as number | string | null) ?? 0},
        ${(row.implementation_fee as number | string | null) ?? 0},
        ${(row.subtotal as number | string | null) ?? 0},
        ${(row.discount_amount as number | string | null) ?? 0},
        ${(row.total as number | string | null) ?? 0},
        ${(row.notes as string | null) ?? null},
        ${(row.status as string | null) ?? "draft"},
        ${(row.created_at as string | null) ?? null},
        ${(row.updated_at as string | null) ?? null}
      )
      on conflict (id) do update set
        client_id = excluded.client_id,
        invoice_number = excluded.invoice_number,
        date = excluded.date,
        period = excluded.period,
        protocol_count = excluded.protocol_count,
        protocol_unit_price = excluded.protocol_unit_price,
        protocol_total = excluded.protocol_total,
        onsite_visits = excluded.onsite_visits,
        onsite_unit_price = excluded.onsite_unit_price,
        onsite_total = excluded.onsite_total,
        remote_visits = excluded.remote_visits,
        remote_unit_price = excluded.remote_unit_price,
        remote_total = excluded.remote_total,
        visit_discount_percent = excluded.visit_discount_percent,
        visit_discount_amount = excluded.visit_discount_amount,
        implementation_fee = excluded.implementation_fee,
        subtotal = excluded.subtotal,
        discount_amount = excluded.discount_amount,
        total = excluded.total,
        notes = excluded.notes,
        status = excluded.status,
        updated_at = excluded.updated_at
    `;
  }
}

async function upsertInvoiceItems(rows: Record<string, unknown>[]) {
  for (const row of rows) {
    await sql`
      insert into invoice_items (
        id, invoice_id, description, quantity, unit_price, total, sort_order, created_at
      ) values (
        ${String(row.id)}::uuid,
        ${String(row.invoice_id)}::uuid,
        ${row.description as string},
        ${(row.quantity as number | string | null) ?? 0},
        ${(row.unit_price as number | string | null) ?? 0},
        ${(row.total as number | string | null) ?? 0},
        ${(row.sort_order as number | null) ?? 0},
        ${(row.created_at as string | null) ?? null}
      )
      on conflict (id) do update set
        invoice_id = excluded.invoice_id,
        description = excluded.description,
        quantity = excluded.quantity,
        unit_price = excluded.unit_price,
        total = excluded.total,
        sort_order = excluded.sort_order
    `;
  }
}

export async function POST(request: Request) {
  try {
    const expectedToken = getRequiredEnv("MIGRATION_TOKEN");
    const providedToken = request.headers.get("x-migration-token");
    if (!providedToken || providedToken !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [clients, invoices, invoiceItems] = await Promise.all([
      fetchSupabaseRows("clients"),
      fetchSupabaseRows("invoices"),
      fetchSupabaseRows("invoice_items"),
    ]);

    await upsertClients(clients);
    await upsertInvoices(invoices);
    await upsertInvoiceItems(invoiceItems);

    const [clientsCount, invoicesCount, itemsCount] = await Promise.all([
      sql<{ count: number }[]>`select count(*)::int as count from clients`,
      sql<{ count: number }[]>`select count(*)::int as count from invoices`,
      sql<{ count: number }[]>`select count(*)::int as count from invoice_items`,
    ]);

    return NextResponse.json({
      ok: true,
      source: {
        clients: clients.length,
        invoices: invoices.length,
        invoice_items: invoiceItems.length,
      },
      target: {
        clients: clientsCount[0]?.count ?? 0,
        invoices: invoicesCount[0]?.count ?? 0,
        invoice_items: itemsCount[0]?.count ?? 0,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

