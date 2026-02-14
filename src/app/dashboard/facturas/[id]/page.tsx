"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateInvoiceStatusAction } from "@/app/actions/invoices";
import { InvoiceView } from "@/components/invoice-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Client, Invoice, InvoiceItem } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Pagada",
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: inv } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", params.id)
        .single();

      if (!inv) {
        router.push("/dashboard/facturas");
        return;
      }

      const [{ data: clientData }, { data: itemsData }] = await Promise.all([
        supabase.from("clients").select("*").eq("id", inv.client_id).single(),
        supabase
          .from("invoice_items")
          .select("*")
          .eq("invoice_id", inv.id)
          .order("sort_order"),
      ]);

      setInvoice(inv as Invoice);
      setClient(clientData as Client);
      setItems((itemsData as InvoiceItem[]) ?? []);
      setLoading(false);
    }
    load();
  }, [params.id, router]);

  async function handleStatusChange(status: string) {
    if (!invoice) return;
    const result = await updateInvoiceStatusAction(
      invoice.id,
      status as "draft" | "sent" | "paid"
    );
    if (result?.error) {
      toast.error(result.error);
    } else {
      setInvoice({ ...invoice, status: status as "draft" | "sent" | "paid" });
      toast.success(`Estado actualizado a ${STATUS_LABELS[status]}`);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!invoice || !client) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/facturas">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#134252]">
              Factura {invoice.invoice_number}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={
                  invoice.status === "paid"
                    ? "default"
                    : invoice.status === "sent"
                      ? "secondary"
                      : "outline"
                }
              >
                {STATUS_LABELS[invoice.status]}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={invoice.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Borrador</SelectItem>
              <SelectItem value="sent">Enviada</SelectItem>
              <SelectItem value="paid">Pagada</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
        </div>
      </div>

      <InvoiceView invoice={invoice} client={client} items={items} />
    </div>
  );
}
