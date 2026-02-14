"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteClientAction } from "@/app/actions/clients";
import type { Client } from "@/lib/types";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ClientsTableProps {
  clients: Client[];
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const filtered = clients.filter(
    (c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.rut_tax_id && c.rut_tax_id.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleDelete(id: string) {
    const result = await deleteClientAction(id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Cliente eliminado");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email o RUT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefono</TableHead>
              <TableHead>RUT/TAX ID</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {search
                    ? "No se encontraron clientes"
                    : "No hay clientes registrados"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    {client.nombre}
                  </TableCell>
                  <TableCell>{client.email || "-"}</TableCell>
                  <TableCell>{client.telefono || "-"}</TableCell>
                  <TableCell>{client.rut_tax_id || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/dashboard/clientes/${client.id}`}>
                        <Button variant="ghost" size="icon" title="Ver">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link
                        href={`/dashboard/clientes/${client.id}/editar`}
                      >
                        <Button variant="ghost" size="icon" title="Editar">
                          <Pencil className="w-4 h-4" />
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
                              Eliminar cliente
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta accion no se puede deshacer. Se eliminara
                              permanentemente el cliente &quot;{client.nombre}
                              &quot;.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(client.id)}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
