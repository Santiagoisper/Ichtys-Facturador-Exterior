"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, type ClientFormData } from "@/lib/validations";
import { createClientAction, updateClientAction } from "@/app/actions/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Client } from "@/lib/types";
import Link from "next/link";
import { toast } from "sonner";

interface ClientFormProps {
  client?: Client;
}

export function ClientForm({ client }: ClientFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!client;

  const {
    register,
    handleSubmit,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema) as any,
    defaultValues: {
      nombre: client?.nombre ?? "",
      direccion: client?.direccion ?? "",
      telefono: client?.telefono ?? "",
      email: client?.email ?? "",
      rut_tax_id: client?.rut_tax_id ?? "",
    },
  });

  async function onSubmit(data: ClientFormData) {
    setSubmitting(true);
    try {
      const result = isEdit
        ? await updateClientAction(client!.id, data)
        : await createClientAction(data);

      if (result?.error) {
        toast.error(result.error);
        setSubmitting(false);
      }
    } catch {
      // redirect throws, so this is expected on success
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-[#134252]">
          {isEdit ? "Editar Cliente" : "Ingresar Nuevo Cliente"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              placeholder="Nombre del cliente"
              {...register("nombre")}
            />
            {errors.nombre && (
              <p className="text-sm text-destructive">
                {errors.nombre.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Direccion</Label>
            <Input
              id="direccion"
              placeholder="Direccion completa"
              {...register("direccion")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">Telefono</Label>
              <Input
                id="telefono"
                placeholder="+1 (555) 123-4567"
                {...register("telefono")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@empresa.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rut_tax_id">RUT / TAX ID</Label>
            <Input
              id="rut_tax_id"
              placeholder="12345678-9"
              {...register("rut_tax_id")}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="bg-[#1a7482] hover:bg-[#134252]"
              disabled={submitting}
            >
              {submitting
                ? "Guardando..."
                : isEdit
                  ? "Actualizar Cliente"
                  : "Guardar Cliente"}
            </Button>
            <Link href="/dashboard/clientes">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
