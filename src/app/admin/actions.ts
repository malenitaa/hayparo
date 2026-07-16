"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  checkPassword,
  createSession,
  destroySession,
  isAuthenticated,
} from "@/lib/admin-auth";
import { setStrikeStatus } from "@/lib/strike-status";

export type ActionState = { error?: string; success?: boolean } | undefined;

export async function login(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");

  if (!checkPassword(password)) {
    return { error: "Contraseña incorrecta" };
  }

  await createSession();
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

  try {
    await setStrikeStatus(isStrike, message);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al guardar" };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}
