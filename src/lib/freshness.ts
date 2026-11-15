// Decide qué afirma la página a partir del estado guardado. Si el último
// chequeo es de otro día (en hora argentina) o es muy viejo, no se afirma
// ni "SÍ" ni "NO": se dice que no hay datos actualizados.

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

function isFresh(updatedAt: string, now: Date): boolean {
  const updated = new Date(updatedAt);
  const ageMs = now.getTime() - updated.getTime();
  if (!Number.isFinite(ageMs)) return false;
  if (ageMs > MAX_STATUS_AGE_HOURS * 60 * 60 * 1000) return false;
  return BA_DAY.format(updated) === BA_DAY.format(now);
}

export function getDisplayState(
  status: { isStrike: boolean; updatedAt: string },
  now: Date = new Date()
): DisplayState {
  if (!isFresh(status.updatedAt, now)) return "stale";
  return status.isStrike ? "strike" : "calm";
}
