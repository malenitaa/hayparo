// Decide qué afirma la página a partir del estado guardado. Si el último
// chequeo es de otro día (en hora argentina) o es muy viejo, no se afirma
// ni "SÍ" ni "NO": se dice que no hay datos actualizados. Una corrección
// manual de /admin vale todo el día en que se cargó (#5).

// El cron corre cada pocas horas (en la práctica, ~5 h con GitHub Actions),
// así que 8 h deja margen para una corrida demorada sin dar por buena una
// respuesta de la mañana a la noche.
export const MAX_STATUS_AGE_HOURS = 8;

export type DisplayState = "strike" | "calm" | "stale";

const BA_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function isSameBuenosAiresDay(updatedAt: string, now: Date = new Date()): boolean {
  const updated = new Date(updatedAt);
  if (!Number.isFinite(updated.getTime())) return false;
  return BA_DAY.format(updated) === BA_DAY.format(now);
}

function isFresh(updatedAt: string, updatedBy: string | undefined, now: Date): boolean {
  if (!isSameBuenosAiresDay(updatedAt, now)) return false;
  if (updatedBy === "manual") return true;
  const ageMs = now.getTime() - new Date(updatedAt).getTime();
  return ageMs <= MAX_STATUS_AGE_HOURS * 60 * 60 * 1000;
}

export function getDisplayState(
  status: { isStrike: boolean; updatedAt: string; updatedBy?: string },
  now: Date = new Date()
): DisplayState {
  if (!isFresh(status.updatedAt, status.updatedBy, now)) return "stale";
  return status.isStrike ? "strike" : "calm";
}
