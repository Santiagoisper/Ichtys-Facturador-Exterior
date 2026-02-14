import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { COMPANY_INFO } from "@/lib/constants";
import { formatCurrency } from "@/lib/pricing";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    clientsResult,
    invoicesResult,
    draftInvoicesResult,
    sentInvoicesResult,
    paidInvoicesResult,
  ] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("invoices").select("id", { count: "exact", head: true }),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent"),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("status", "paid"),
  ]);

  const totalClients = clientsResult.count ?? 0;
  const totalFacturadas = invoicesResult.count ?? 0;
  const totalBorrador = draftInvoicesResult.count ?? 0;
  const totalEnviadas = sentInvoicesResult.count ?? 0;
  const totalCobradas = paidInvoicesResult.count ?? 0;
  const { data: invoicesForTotals } = await supabase
    .from("invoices")
    .select("total, status");
  const totals = (invoicesForTotals ?? []).reduce(
    (acc, invoice) => {
      const amount = Number(invoice.total) || 0;
      acc.facturado += amount;
      if (invoice.status === "paid") {
        acc.cobrado += amount;
      }
      return acc;
    },
    { facturado: 0, cobrado: 0 }
  );
  const totalPendiente = totals.facturado - totals.cobrado;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#134252]">
          {COMPANY_INFO.adb}
        </h1>
        <p className="text-muted-foreground">
          {COMPANY_INFO.legalName} &mdash; {COMPANY_INFO.address},{" "}
          {COMPANY_INFO.city}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Clientes
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#134252]">
              {totalClients}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Facturadas
            </CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#134252]">
              {totalFacturadas}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Borrador
            </CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#134252]">
              {totalBorrador}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Enviadas
            </CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#134252]">
              {totalEnviadas}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cobradas
            </CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#134252]">
              {totalCobradas}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              USD Facturado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#134252]">
              USD {formatCurrency(totals.facturado)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              USD Cobrado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#134252]">
              USD {formatCurrency(totals.cobrado)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              USD Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#134252]">
              USD {formatCurrency(totalPendiente)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/dashboard/clientes/nuevo">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 bg-[#1a7482]/10 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-[#1a7482]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#134252]">
                  Ingresar Cliente
                </h3>
                <p className="text-sm text-muted-foreground">
                  Agregar un nuevo cliente al sistema
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/facturas/nueva">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 bg-[#1a7482]/10 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#1a7482]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#134252]">Crear Factura</h3>
                <p className="text-sm text-muted-foreground">
                  Generar una nueva factura
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
