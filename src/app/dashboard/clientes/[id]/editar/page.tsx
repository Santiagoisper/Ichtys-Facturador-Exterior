import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ClientForm } from "@/components/client-form";
import type { Client } from "@/lib/types";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#134252]">Editar Cliente</h1>
        <p className="text-muted-foreground">
          Modifica los datos del cliente
        </p>
      </div>
      <ClientForm client={client as Client} />
    </div>
  );
}
