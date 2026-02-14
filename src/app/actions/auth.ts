"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function loginWithPassword(email: string, password: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: error.message };
    }

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
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
