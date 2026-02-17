import { sql } from "@/lib/db";
import { ClientsTable } from "@/components/clients-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { Client } from "@/lib/types";

export default async function ClientesPage() {
  const clients = await sql<Client[]>`
    select *
    from clients
    order by nombre asc
  `;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#134252]">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona tus clientes registrados
          </p>
        </div>
        <Link href="/dashboard/clientes/nuevo">
          <Button className="bg-[#1a7482] hover:bg-[#134252] gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      <ClientsTable clients={clients ?? []} />
    </div>
  );
}
