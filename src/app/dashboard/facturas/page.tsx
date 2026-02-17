import { sql } from "@/lib/db";
import { InvoicesTable } from "@/components/invoices-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { Invoice } from "@/lib/types";

type InvoiceRow = Invoice & {
  client_nombre: string | null;
};

export default async function FacturasPage() {
  const rows = await sql<InvoiceRow[]>`
    select
      i.*,
      c.nombre as client_nombre
    from invoices i
    left join clients c on c.id = i.client_id
    order by i.date desc
  `;

  const invoices = rows.map((row) => ({
    ...row,
    total: Number(row.total) || 0,
    client: row.client_nombre ? { nombre: row.client_nombre } : undefined,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#134252]">Facturas</h1>
          <p className="text-muted-foreground">
            Gestiona tus facturas emitidas
          </p>
        </div>
        <Link href="/dashboard/facturas/nueva">
          <Button className="bg-[#1a7482] hover:bg-[#134252] gap-2">
            <Plus className="w-4 h-4" />
            Nueva Factura
          </Button>
        </Link>
      </div>

      <InvoicesTable invoices={invoices ?? []} />
    </div>
  );
}
