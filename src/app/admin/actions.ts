"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  checkPassword,
  clearLoginFailures,
  createSession,
  destroySession,
  isAuthenticated,
  registerLoginAttempt,
} from "@/lib/admin-auth";
import { setStrikeStatus } from "@/lib/strike-status";

export type ActionState = { error?: string; success?: boolean } | undefined;

export async function login(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  // En Vercel, x-forwarded-for lo pone la plataforma: el primer valor es la
  // IP del cliente.
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";

  try {
    const { blocked } = await registerLoginAttempt(ip);
    if (blocked) {
      return { error: "Demasiados intentos fallidos. Probá de nuevo en 15 minutos." };
    }

    if (!checkPassword(password)) {
      return { error: "Contraseña incorrecta" };
    }

    await clearLoginFailures(ip);
    await createSession();
  } catch (e) {
    console.error("[admin] error en el login:", e);
    return { error: "No se pudo iniciar sesión. ¿Están creadas las tablas de supabase-admin.sql?" };
  }
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin");
}

export async function updateStatus(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await isAuthenticated())) {
    return { error: "No autenticado" };
  }

  const isStrike = formData.get("isStrike") === "on";
  const message = String(formData.get("message") ?? "");
  const affectedLines = String(formData.get("affectedLines") ?? "");

  try {
    await setStrikeStatus(isStrike, message, affectedLines, "manual");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al guardar" };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}
