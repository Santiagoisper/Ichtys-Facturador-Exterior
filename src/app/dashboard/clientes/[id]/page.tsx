import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import type { Client, Invoice } from "@/lib/types";
import { formatCurrency } from "@/lib/pricing";

export default async function ClientDetailPage({
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

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("client_id", id)
    .order("date", { ascending: false });

  const typedClient = client as Client;
  const typedInvoices = (invoices as Invoice[]) ?? [];
  const totalFacturado = typedInvoices.reduce((acc, invoice) => acc + invoice.total, 0);
  const totalCobrado = typedInvoices.reduce(
    (acc, invoice) => acc + (invoice.status === "paid" ? invoice.total : 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clientes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#134252]">
            {typedClient.nombre}
          </h1>
          <p className="text-muted-foreground">Detalle del cliente</p>
        </div>
        <Link href={`/dashboard/clientes/${id}/editar`}>
          <Button variant="outline" className="gap-2">
            <Pencil className="w-4 h-4" />
            Editar
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informacion</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Direccion</p>
            <p className="font-medium">{typedClient.direccion || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Telefono</p>
            <p className="font-medium">{typedClient.telefono || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{typedClient.email || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">RUT / TAX ID</p>
            <p className="font-medium">{typedClient.rut_tax_id || "-"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Facturas ({typedInvoices.length})
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-sm">
                Facturado: USD {formatCurrency(totalFacturado)}
              </Badge>
              <Badge variant="secondary" className="text-sm">
                Cobrado: USD {formatCurrency(totalCobrado)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {typedInvoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No hay facturas para este cliente
            </p>
          ) : (
            <div className="space-y-3">
              {typedInvoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/dashboard/facturas/${inv.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{inv.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(inv.date).toLocaleDateString("es")}
                      {inv.period && ` - ${inv.period}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        inv.status === "paid"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {inv.status === "paid" ? "Pagada" : "Enviada"}
                    </Badge>
                    <span className="font-semibold text-[#134252]">
                      USD {formatCurrency(inv.total)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
