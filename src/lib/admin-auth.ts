import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";

// Sesión de /admin (#7): la cookie es un token aleatorio que no deriva de la
// contraseña. En la base (supabase-admin.sql) se guarda su hash con el
// vencimiento, así que el logout lo revoca de verdad.

const COOKIE_NAME = "hp_admin_session";
const SESSION_HOURS = 12;

// Freno a la fuerza bruta: con MAX_FAILURES intentos sin éxito desde una IP
// en la ventana, los siguientes se rechazan. Los rechazados también cuentan,
// así que el bloqueo dura hasta 15 min sin intentos.
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
    const { error } = await getSupabase()
      .from("admin_sessions")
      .delete()
      .eq("token_hash", hashToken(token));
    // Sin borrar la fila, la sesión seguiría sirviendo con una copia de la
    // cookie: mejor un error que un logout que no revoca.
    if (error) throw new Error(error.message);
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

// Registra el intento y después cuenta los de la ventana, incluido este. Al
// revés (contar y después registrar), muchos logins en paralelo cuentan
// todos antes de que se guarde ninguno y pasan el freno. Así, como la cuenta
// incluye el propio intento, pasan MAX_FAILURES como mucho. Un login exitoso
// borra los intentos de su IP (clearLoginFailures).
export async function registerLoginAttempt(ip: string): Promise<{ blocked: boolean }> {
  const supabase = getSupabase();
  const { error: insertError } = await supabase.from("admin_login_failures").insert({ ip });
  // Si la base falla, el login no sigue (ver actions.ts): mejor no dejar
  // entrar que dejar la puerta sin freno.
  if (insertError) throw new Error(insertError.message);

  const { count, error } = await supabase
    .from("admin_login_failures")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("attempted_at", windowStart());
  if (error) throw new Error(error.message);
  return { blocked: (count ?? 0) > MAX_FAILURES };
}

export async function clearLoginFailures(ip: string): Promise<void> {
  await getSupabase().from("admin_login_failures").delete().eq("ip", ip);
}
