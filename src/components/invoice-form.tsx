"use client";

import { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { invoiceSchema, type InvoiceFormData } from "@/lib/validations";
import { createInvoiceAction } from "@/app/actions/invoices";
import { calculateInvoiceTotals, formatCurrency } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Client } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface InvoiceFormProps {
  clients: Client[];
  nextInvoiceNumber: string;
}

export function InvoiceForm({ clients, nextInvoiceNumber }: InvoiceFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema) as any,
    defaultValues: {
      client_id: "",
      invoice_number: nextInvoiceNumber,
      date: new Date().toISOString().split("T")[0],
      period: "",
      protocol_count: 0,
      onsite_visits: 0,
      remote_visits: 0,
      include_implementation: false,
      notes: "",
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedValues = watch();

  const totals = useMemo(() => {
    return calculateInvoiceTotals({
      protocolCount: watchedValues.protocol_count || 0,
      onsiteVisits: watchedValues.onsite_visits || 0,
      remoteVisits: watchedValues.remote_visits || 0,
      includeImplementation: watchedValues.include_implementation || false,
      lineItems: (watchedValues.items || []).map((item) => ({
        quantity: Number(item?.quantity) || 0,
        unitPrice: Number(item?.unit_price) || 0,
      })),
    });
  }, [
    watchedValues.protocol_count,
    watchedValues.onsite_visits,
    watchedValues.remote_visits,
    watchedValues.include_implementation,
    watchedValues.items,
  ]);

  async function onSubmit(data: InvoiceFormData) {
    setSubmitting(true);
    try {
      const result = await createInvoiceAction(data);
      if (result?.error) {
        toast.error(result.error);
        setSubmitting(false);
      }
    } catch {
      // redirect throws on success
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Section 1: Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#134252]">
            Informacion de Factura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select
                onValueChange={(val) => setValue("client_id", val)}
                defaultValue=""
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nombre}
                      {client.rut_tax_id && ` (${client.rut_tax_id})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.client_id && (
                <p className="text-sm text-destructive">
                  {errors.client_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_number">Numero de Factura *</Label>
              <Input
                id="invoice_number"
                {...register("invoice_number")}
                placeholder="INV-0001"
              />
              {errors.invoice_number && (
                <p className="text-sm text-destructive">
                  {errors.invoice_number.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha *</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && (
                <p className="text-sm text-destructive">
                  {errors.date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Periodo</Label>
              <Input
                id="period"
                placeholder="Enero 2026"
                {...register("period")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Protocol Services */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#134252]">
            Servicios de Protocolo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="protocol_count">Protocolos</Label>
              <Input
                id="protocol_count"
                type="number"
                min="0"
                {...register("protocol_count", { valueAsNumber: true })}
              />
              {totals.protocolUnitPrice > 0 && (
                <p className="text-xs text-muted-foreground">
                  Precio unitario: USD {formatCurrency(totals.protocolUnitPrice)}{" "}
                  | Total: USD {formatCurrency(totals.protocolTotal)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="onsite_visits">Visitas On-Site</Label>
              <Input
                id="onsite_visits"
                type="number"
                min="0"
                {...register("onsite_visits", { valueAsNumber: true })}
              />
              {totals.onsiteTotal > 0 && (
                <p className="text-xs text-muted-foreground">
                  @ USD 10.00/ea | Total: USD {formatCurrency(totals.onsiteTotal)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="remote_visits">Visitas Remotas</Label>
              <Input
                id="remote_visits"
                type="number"
                min="0"
                {...register("remote_visits", { valueAsNumber: true })}
              />
              {totals.remoteTotal > 0 && (
                <p className="text-xs text-muted-foreground">
                  @ USD 2.50/ea | Total: USD {formatCurrency(totals.remoteTotal)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Implementation Fee</Label>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="include_implementation"
                  className="w-4 h-4 rounded border-gray-300"
                  {...register("include_implementation")}
                />
                <label
                  htmlFor="include_implementation"
                  className="text-sm text-muted-foreground"
                >
                  Incluir Implementation Fee (USD 1,000.00)
                </label>
              </div>
            </div>
          </div>

          {totals.visitDiscountPercent > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm font-medium text-amber-800">
                Descuento por volumen: {totals.visitDiscountPercent}% (-USD{" "}
                {formatCurrency(totals.visitDiscountAmount)})
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Free-form Line Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#134252]">Items Adicionales</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                append({ description: "", quantity: 1, unit_price: 0 })
              }
            >
              <Plus className="w-4 h-4" />
              Agregar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">
              No hay items adicionales. Haz click en &quot;Agregar Item&quot;
              para agregar.
            </p>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-12 gap-3 items-start"
                >
                  <div className="col-span-12 md:col-span-5 space-y-1">
                    {index === 0 && (
                      <Label className="text-xs">Descripcion</Label>
                    )}
                    <Input
                      placeholder="Descripcion del servicio"
                      {...register(`items.${index}.description`)}
                    />
                    {errors.items?.[index]?.description && (
                      <p className="text-xs text-destructive">
                        {errors.items[index].description?.message}
                      </p>
                    )}
                  </div>
                  <div className="col-span-4 md:col-span-2 space-y-1">
                    {index === 0 && <Label className="text-xs">Cantidad</Label>}
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      {...register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2 space-y-1">
                    {index === 0 && (
                      <Label className="text-xs">Precio Unit.</Label>
                    )}
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      {...register(`items.${index}.unit_price`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="col-span-3 md:col-span-2 space-y-1">
                    {index === 0 && <Label className="text-xs">Total</Label>}
                    <div className="h-9 flex items-center text-sm font-medium px-3 bg-muted rounded-md">
                      USD{" "}
                      {formatCurrency(
                        (Number(watchedValues.items?.[index]?.quantity) || 0) *
                          (Number(watchedValues.items?.[index]?.unit_price) || 0)
                      )}
                    </div>
                  </div>
                  <div className="col-span-1 space-y-1">
                    {index === 0 && <Label className="text-xs">&nbsp;</Label>}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#134252]">Notas</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Notas adicionales para la factura..."
            {...register("notes")}
          />
        </CardContent>
      </Card>

      {/* Section 5: Totals Summary */}
      <Card className="border-[#1a7482]">
        <CardHeader>
          <CardTitle className="text-[#134252]">Resumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {totals.protocolTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span>Protocolos</span>
              <span>USD {formatCurrency(totals.protocolTotal)}</span>
            </div>
          )}
          {totals.onsiteTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span>Visitas On-Site</span>
              <span>USD {formatCurrency(totals.onsiteTotal)}</span>
            </div>
          )}
          {totals.remoteTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span>Visitas Remotas</span>
              <span>USD {formatCurrency(totals.remoteTotal)}</span>
            </div>
          )}
          {totals.visitDiscountAmount > 0 && (
            <div className="flex justify-between text-sm text-amber-600">
              <span>Descuento ({totals.visitDiscountPercent}%)</span>
              <span>-USD {formatCurrency(totals.visitDiscountAmount)}</span>
            </div>
          )}
          {totals.implementationFee > 0 && (
            <div className="flex justify-between text-sm">
              <span>Implementation Fee</span>
              <span>USD {formatCurrency(totals.implementationFee)}</span>
            </div>
          )}
          {totals.lineItemsTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span>Items Adicionales</span>
              <span>USD {formatCurrency(totals.lineItemsTotal)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-bold text-[#1a7482]">
            <span>TOTAL</span>
            <span>USD {formatCurrency(totals.total)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          type="submit"
          className="bg-[#1a7482] hover:bg-[#134252]"
          disabled={submitting}
        >
          {submitting ? "Generando..." : "Generar Factura"}
        </Button>
        <Link href="/dashboard/facturas">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  );
}
