import { sql } from "@/lib/db";
import { getInvoiceNumberSequence } from "@/app/actions/invoices";
import { InvoiceForm } from "@/components/invoice-form";
import type { Client } from "@/lib/types";

export default async function NuevaFacturaPage() {
  const [clients, invoiceSequence] = await Promise.all([
    sql<Client[]>`
      select *
      from clients
      order by nombre asc
    `,
    getInvoiceNumberSequence(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#134252]">Crear Factura</h1>
        <p className="text-muted-foreground">
          Completa los datos para generar una nueva factura
        </p>
      </div>
      <InvoiceForm
        clients={clients ?? []}
        nextInvoiceNumber={invoiceSequence.nextInvoiceNumber}
        lastInvoiceNumber={invoiceSequence.lastInvoiceNumber}
      />
    </div>
  );
}
