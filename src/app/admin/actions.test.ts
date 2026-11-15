import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Supabase en memoria: alcanza para las consultas que usa admin-auth.ts.
type Row = Record<string, unknown>;
const tables: Record<string, Row[]> = {};
let dbRota = false; // simula que no se corrió supabase-admin.sql
function query(table: string) {
  const filters: ((r: Row) => boolean)[] = [];
  let op: "select" | "delete" = "select";
  const b = {
    select() { op = "select"; return b; },
    delete() { op = "delete"; return b; },
    insert(row: Row) {
      if (dbRota) return Promise.resolve({ error: { message: "relation does not exist" } });
      (tables[table] ??= []).push({ attempted_at: new Date().toISOString(), ...row });
      return Promise.resolve({ error: null });
    },
    eq(c: string, v: unknown) { filters.push((r) => r[c] === v); return b; },
    gt(c: string, v: string) { filters.push((r) => String(r[c]) > v); return b; },
    gte(c: string, v: string) { filters.push((r) => String(r[c]) >= v); return b; },
    lt(c: string, v: string) { filters.push((r) => String(r[c]) < v); return b; },
    then(resolve: (v: unknown) => void) {
      if (dbRota) return resolve({ error: { message: "relation does not exist" }, count: null });
      const rows = tables[table] ?? [];
      const match = rows.filter((r) => filters.every((f) => f(r)));
      if (op === "delete") {
        tables[table] = rows.filter((r) => !match.includes(r));
        return resolve({ error: null });
      }
      return resolve({ error: null, count: match.length, data: match });
    },
  };
  return b;
}

const cookieJar = new Map<string, string>();
vi.mock("@/lib/supabase", () => ({ getSupabase: () => ({ from: query }) }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { value: cookieJar.get(name) } : undefined),
    set: (name: string, value: string) => cookieJar.set(name, value),
    delete: (name: string) => cookieJar.delete(name),
  }),
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }),
}));
vi.mock("next/navigation", () => ({
  redirect: () => {
    throw new Error("NEXT_REDIRECT");
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

import { isAuthenticated } from "@/lib/admin-auth";
import { login, logout } from "./actions";

const PASSWORD = "clave-de-test";

function form(password: string) {
  const f = new FormData();
  f.set("password", password);
  return f;
}

async function loginOk() {
  await expect(login(undefined, form(PASSWORD))).rejects.toThrow("NEXT_REDIRECT");
}

beforeEach(() => {
  process.env.ADMIN_PASSWORD = PASSWORD;
  dbRota = false;
  for (const k of Object.keys(tables)) delete tables[k];
  cookieJar.clear();
});

describe("sesión de /admin", () => {
  it("con la contraseña correcta, la cookie es un token aleatorio que no deriva de la contraseña", async () => {
    await loginOk();
    const token = cookieJar.get("hp_admin_session")!;

    expect(token).toBeTruthy();
    expect(token).not.toBe(createHash("sha256").update(PASSWORD).digest("hex"));
    expect(await isAuthenticated()).toBe(true);

    // Dos logins dan tokens distintos.
    cookieJar.clear();
    await loginOk();
    expect(cookieJar.get("hp_admin_session")).not.toBe(token);
  });

  it("una sesión vencida no sirve", async () => {
    await loginOk();
    tables.admin_sessions[0].expires_at = new Date(Date.now() - 1000).toISOString();
    expect(await isAuthenticated()).toBe(false);
  });

  it("después del logout, la cookie anterior deja de servir", async () => {
    await loginOk();
    const token = cookieJar.get("hp_admin_session")!;

    await expect(logout()).rejects.toThrow("NEXT_REDIRECT");
    cookieJar.set("hp_admin_session", token); // alguien que se guardó la cookie
    expect(await isAuthenticated()).toBe(false);
  });

  it("una cookie inventada no sirve", async () => {
    cookieJar.set("hp_admin_session", "cualquier-cosa");
    expect(await isAuthenticated()).toBe(false);
  });

  it("después de 5 fallos desde una IP, rechaza incluso la contraseña correcta", async () => {
    for (let i = 0; i < 5; i++) {
      expect(await login(undefined, form("mal"))).toEqual({ error: "Contraseña incorrecta" });
    }
    expect(await login(undefined, form(PASSWORD))).toEqual({
      error: "Demasiados intentos fallidos. Probá de nuevo en 15 minutos.",
    });
    expect(cookieJar.has("hp_admin_session")).toBe(false);
    expect(tables.admin_login_failures.every((r) => r.ip === "203.0.113.7")).toBe(true);
  });

  it("los fallos viejos (fuera de la ventana de 15 min) no bloquean", async () => {
    const viejo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    tables.admin_login_failures = Array.from({ length: 5 }, () => ({ ip: "203.0.113.7", attempted_at: viejo }));
    await loginOk();
  });
});

describe("sesión de /admin sin las tablas creadas", () => {
  it("el login avisa en vez de dejar entrar", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    dbRota = true;

    expect(await login(undefined, form(PASSWORD))).toEqual({
      error: "No se pudo iniciar sesión. ¿Están creadas las tablas de supabase-admin.sql?",
    });
    expect(cookieJar.has("hp_admin_session")).toBe(false);
  });
});
