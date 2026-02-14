"use server";

import { createClient } from "@/lib/supabase/server";
import { clientSchema, type ClientFormData } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createClientAction(formData: ClientFormData) {
  const supabase = await createClient();
  const validated = clientSchema.parse(formData);

  const { error } = await supabase.from("clients").insert({
    nombre: validated.nombre,
    direccion: validated.direccion || null,
    telefono: validated.telefono || null,
    email: validated.email || null,
    rut_tax_id: validated.rut_tax_id || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/clientes");
  redirect("/dashboard/clientes");
}

export async function updateClientAction(id: string, formData: ClientFormData) {
  const supabase = await createClient();
  const validated = clientSchema.parse(formData);

  const { error } = await supabase
    .from("clients")
    .update({
      nombre: validated.nombre,
      direccion: validated.direccion || null,
      telefono: validated.telefono || null,
      email: validated.email || null,
      rut_tax_id: validated.rut_tax_id || null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/clientes");
  redirect("/dashboard/clientes");
}

export async function deleteClientAction(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) {
    if (error.message.includes("violates foreign key constraint")) {
      return {
        error:
          "No se puede eliminar este cliente porque tiene facturas asociadas.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/clientes");
  return { error: null };
}
