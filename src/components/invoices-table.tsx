"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteInvoiceAction } from "@/app/actions/invoices";
import type { Invoice } from "@/lib/types";
import { formatCurrency } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface InvoicesTableProps {
  invoices: (Invoice & { client?: { nombre: string } })[];
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Pagada",
};

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const router = useRouter();

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.client?.nombre ?? "")
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const groupedInvoices = filtered
    .slice()
    .sort((a, b) => {
      const clientA = (a.client?.nombre ?? "Sin cliente").toLowerCase();
      const clientB = (b.client?.nombre ?? "Sin cliente").toLowerCase();
      if (clientA !== clientB) {
        return clientA.localeCompare(clientB, "es");
      }
      return (
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    })
    .reduce<Record<string, (Invoice & { client?: { nombre: string } })[]>>(
      (acc, invoice) => {
        const clientName = invoice.client?.nombre ?? "Sin cliente";
        if (!acc[clientName]) {
          acc[clientName] = [];
        }
        acc[clientName].push(invoice);
        return acc;
      },
      {}
    );
  const groupedEntries = Object.entries(groupedInvoices);

  async function handleDelete(id: string) {
    const result = await deleteInvoiceAction(id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Factura eliminada");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por numero o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Borrador</SelectItem>
            <SelectItem value="sent">Enviada</SelectItem>
            <SelectItem value="paid">Pagada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Factura #</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedEntries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  {search || statusFilter !== "all"
                    ? "No se encontraron facturas"
                    : "No hay facturas registradas"}
                </TableCell>
              </TableRow>
            ) : (
              groupedEntries.map(([clientName, clientInvoices]) => (
                <Fragment key={`group-${clientName}`}>
                  <TableRow className="bg-muted/40">
                    <TableCell colSpan={6} className="font-semibold text-[#134252]">
                      {clientName} ({clientInvoices.length})
                    </TableCell>
                  </TableRow>
                  {clientInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">
                        {inv.invoice_number}
                      </TableCell>
                      <TableCell>
                        {new Date(inv.date).toLocaleDateString("es")}
                      </TableCell>
                      <TableCell>{inv.period || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            inv.status === "paid"
                              ? "default"
                              : inv.status === "sent"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {STATUS_LABELS[inv.status] || inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-[#134252]">
                        USD {formatCurrency(inv.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Link href={`/dashboard/facturas/${inv.id}`}>
                            <Button variant="ghost" size="icon" title="Ver">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Eliminar"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Eliminar factura
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta accion no se puede deshacer. Se eliminara
                                  permanentemente la factura &quot;
                                  {inv.invoice_number}&quot;.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(inv.id)}
                                  className="bg-destructive text-white hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
