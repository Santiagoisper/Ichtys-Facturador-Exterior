import postgres from "postgres";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
const neonUrl = process.env.DATABASE_URL;

if (!supabaseUrl) {
  throw new Error("Falta SUPABASE_DATABASE_URL.");
}
if (!neonUrl) {
  throw new Error("Falta DATABASE_URL (Neon).");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, "..", "supabase-schema.sql");

const source = postgres(supabaseUrl, {
  ssl: "require",
  prepare: false,
  max: 1,
});

const target = postgres(neonUrl, {
  ssl: "require",
  prepare: false,
  max: 1,
});

async function ensureSchema() {
  const schemaSql = await fs.readFile(schemaPath, "utf8");
  await target.unsafe(schemaSql);
}

async function copyClients() {
  const rows = await source`
    select
      id, nombre, direccion, telefono, email, rut_tax_id, created_at, updated_at
    from clients
    order by created_at asc
  `;

  for (const row of rows) {
    await target`
      insert into clients (
        id, nombre, direccion, telefono, email, rut_tax_id, created_at, updated_at
      ) values (
        ${row.id}::uuid,
        ${row.nombre},
        ${row.direccion},
        ${row.telefono},
        ${row.email},
        ${row.rut_tax_id},
        ${row.created_at},
        ${row.updated_at}
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

  console.log(`Clients migrados: ${rows.length}`);
}

async function copyInvoices() {
  const rows = await source`
    select
      id, client_id, invoice_number, date, period,
      protocol_count, protocol_unit_price, protocol_total,
      onsite_visits, onsite_unit_price, onsite_total,
      remote_visits, remote_unit_price, remote_total,
      visit_discount_percent, visit_discount_amount,
      implementation_fee, subtotal, discount_amount, total,
      notes, status, created_at, updated_at
    from invoices
    order by created_at asc
  `;

  for (const row of rows) {
    await target`
      insert into invoices (
        id, client_id, invoice_number, date, period,
        protocol_count, protocol_unit_price, protocol_total,
        onsite_visits, onsite_unit_price, onsite_total,
        remote_visits, remote_unit_price, remote_total,
        visit_discount_percent, visit_discount_amount,
        implementation_fee, subtotal, discount_amount, total,
        notes, status, created_at, updated_at
      ) values (
        ${row.id}::uuid, ${row.client_id}::uuid, ${row.invoice_number}, ${row.date}, ${row.period},
        ${row.protocol_count}, ${row.protocol_unit_price}, ${row.protocol_total},
        ${row.onsite_visits}, ${row.onsite_unit_price}, ${row.onsite_total},
        ${row.remote_visits}, ${row.remote_unit_price}, ${row.remote_total},
        ${row.visit_discount_percent}, ${row.visit_discount_amount},
        ${row.implementation_fee}, ${row.subtotal}, ${row.discount_amount}, ${row.total},
        ${row.notes}, ${row.status}, ${row.created_at}, ${row.updated_at}
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

  console.log(`Invoices migradas: ${rows.length}`);
}

async function copyInvoiceItems() {
  const rows = await source`
    select
      id, invoice_id, description, quantity, unit_price, total, sort_order, created_at
    from invoice_items
    order by created_at asc
  `;

  for (const row of rows) {
    await target`
      insert into invoice_items (
        id, invoice_id, description, quantity, unit_price, total, sort_order, created_at
      ) values (
        ${row.id}::uuid, ${row.invoice_id}::uuid, ${row.description},
        ${row.quantity}, ${row.unit_price}, ${row.total}, ${row.sort_order}, ${row.created_at}
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

  console.log(`Invoice items migrados: ${rows.length}`);
}

async function main() {
  try {
    console.log("Aplicando schema en Neon...");
    await ensureSchema();

    console.log("Migrando clients...");
    await copyClients();

    console.log("Migrando invoices...");
    await copyInvoices();

    console.log("Migrando invoice_items...");
    await copyInvoiceItems();

    console.log("Migracion completada.");
  } finally {
    await source.end({ timeout: 5 });
    await target.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error("Error de migracion:", error);
  process.exitCode = 1;
});

