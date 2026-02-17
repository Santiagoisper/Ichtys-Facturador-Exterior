"use server";

import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export async function loginWithPassword(email: string, password: string) {
  try {
    const expectedEmail = process.env.ADMIN_EMAIL;
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedEmail || !expectedPassword) {
      return {
        error:
          "Faltan ADMIN_EMAIL o ADMIN_PASSWORD en variables de entorno.",
      };
    }

    if (
      email.trim().toLowerCase() !== expectedEmail.trim().toLowerCase() ||
      password !== expectedPassword
    ) {
      return { error: "Invalid login credentials" };
    }

    await setSessionCookie(expectedEmail);
    return { ok: true };
  } catch (err) {
    console.error("loginWithPassword error:", err);
    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: "network_error" };
  }
}

export async function logout() {
  await clearSessionCookie();
  redirect("/login");
}
