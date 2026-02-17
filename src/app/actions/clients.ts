"use server";

import { sql } from "@/lib/db";
import { clientSchema, type ClientFormData } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createClientAction(formData: ClientFormData) {
  const validated = clientSchema.parse(formData);

  try {
    await sql`
      insert into clients (nombre, direccion, telefono, email, rut_tax_id)
      values (
        ${validated.nombre},
        ${validated.direccion || null},
        ${validated.telefono || null},
        ${validated.email || null},
        ${validated.rut_tax_id || null}
      )
    `;
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "No se pudo crear el cliente." };
  }

  revalidatePath("/dashboard/clientes");
  redirect("/dashboard/clientes");
}

export async function updateClientAction(id: string, formData: ClientFormData) {
  const validated = clientSchema.parse(formData);

  try {
    await sql`
      update clients
      set
        nombre = ${validated.nombre},
        direccion = ${validated.direccion || null},
        telefono = ${validated.telefono || null},
        email = ${validated.email || null},
        rut_tax_id = ${validated.rut_tax_id || null}
      where id = ${id}::uuid
    `;
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "No se pudo actualizar el cliente." };
  }

  revalidatePath("/dashboard/clientes");
  redirect("/dashboard/clientes");
}

export async function deleteClientAction(id: string) {
  try {
    await sql`
      delete from clients
      where id = ${id}::uuid
    `;
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: string }).code)
        : "";
    if (code === "23503") {
      return {
        error:
          "No se puede eliminar este cliente porque tiene facturas asociadas.",
      };
    }
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "No se pudo eliminar el cliente." };
  }

  revalidatePath("/dashboard/clientes");
  return { error: null };
}
