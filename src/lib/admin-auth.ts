import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";

// Sesión de /admin (#7): la cookie es un token aleatorio que no deriva de la
// contraseña. En la base (supabase-admin.sql) se guarda su hash con el
// vencimiento, así que el logout lo revoca de verdad.

const COOKIE_NAME = "hp_admin_session";
const SESSION_HOURS = 12;

// Freno a la fuerza bruta: con MAX_FAILURES logins fallidos desde una IP en
// la ventana, los siguientes se rechazan hasta que la ventana se vacíe.
const MAX_FAILURES = 5;
const FAILURE_WINDOW_MINUTES = 15;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;

  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function createSession(): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const supabase = getSupabase();
  const now = new Date();

  // De paso, se borran las sesiones vencidas.
  await supabase.from("admin_sessions").delete().lt("expires_at", now.toISOString());
  const { error } = await supabase.from("admin_sessions").insert({
    token_hash: hashToken(token),
    expires_at: new Date(now.getTime() + SESSION_HOURS * 60 * 60 * 1000).toISOString(),
  });
  if (error) throw new Error(error.message);

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await getSupabase().from("admin_sessions").delete().eq("token_hash", hashToken(token));
  }
  store.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    const { count, error } = await getSupabase()
      .from("admin_sessions")
      .select("token_hash", { count: "exact", head: true })
      .eq("token_hash", hashToken(token))
      .gt("expires_at", new Date().toISOString());
    return !error && (count ?? 0) > 0;
  } catch {
    return false;
  }
}

function windowStart(): string {
  return new Date(Date.now() - FAILURE_WINDOW_MINUTES * 60 * 1000).toISOString();
}

export async function isLoginBlocked(ip: string): Promise<boolean> {
  const { count, error } = await getSupabase()
    .from("admin_login_failures")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("attempted_at", windowStart());
  // Si la base falla, el login no sigue (ver actions.ts): mejor no dejar
  // entrar que dejar la puerta sin freno.
  if (error) throw new Error(error.message);
  return (count ?? 0) >= MAX_FAILURES;
}

export async function recordLoginFailure(ip: string): Promise<void> {
  await getSupabase().from("admin_login_failures").insert({ ip });
}

export async function clearLoginFailures(ip: string): Promise<void> {
  await getSupabase().from("admin_login_failures").delete().eq("ip", ip);
}
