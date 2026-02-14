import { z } from "zod";

export const clientSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  direccion: z.string(),
  telefono: z.string(),
  email: z.union([z.string().email("Email invalido"), z.literal("")]),
  rut_tax_id: z.string(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Descripcion requerida"),
  quantity: z.coerce.number().min(0, "Cantidad debe ser positiva"),
  unit_price: z.coerce.number().min(0, "Precio debe ser positivo"),
});

export type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>;

export const invoiceSchema = z.object({
  client_id: z.string().min(1, "Seleccione un cliente"),
  invoice_number: z.string().min(1, "Numero de factura requerido"),
  date: z.string().min(1, "Fecha requerida"),
  period: z.string(),
  protocol_count: z.coerce.number().min(0),
  onsite_visits: z.coerce.number().min(0),
  remote_visits: z.coerce.number().min(0),
  include_implementation: z.boolean(),
  notes: z.string(),
  items: z.array(invoiceItemSchema),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(1, "Password requerido"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
