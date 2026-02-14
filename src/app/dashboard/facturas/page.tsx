import { createClient } from "@/lib/supabase/server";
import { InvoicesTable } from "@/components/invoices-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function FacturasPage() {
  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, client:clients(nombre)")
    .order("date", { ascending: false });

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
