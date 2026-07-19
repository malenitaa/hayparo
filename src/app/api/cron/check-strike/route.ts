import { timingSafeEqual } from "crypto";
import { classifyStrike } from "@/lib/gemini";
import { fetchCandidateHeadlines, filterRecentRelevant } from "@/lib/google-news";
import { getStrikeStatus, setStrikeStatus } from "@/lib/strike-status";

const LOG_PREFIX = "[cron:check-strike]";

// El trigger de GitHub Actions dispara siempre cada 15 min. Cuando el
// estado guardado ya dice "no hay paro", no hace falta gastar una
// llamada a Gemini cada 15 min — alcanza con revisar cada 2hs. Si el
// estado es "hay paro", sí conviene chequear seguido (cada 15 min) por
// si cambia el horario, se suman líneas, o se levanta el paro.
const CALM_RECHECK_INTERVAL_MS = 2 * 60 * 60 * 1000;

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization") ?? "";
  // Guard against missing env var: without `!secret`, a missing CRON_SECRET
  // would make the check compare against the literal string "Bearer undefined",
  // authenticating anyone who sends exactly that header.
  if (!secret || !safeCompare(authHeader, `Bearer ${secret}`)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const current = await getStrikeStatus();
  if (current.ok && !current.isStrike) {
    const elapsedMs = Date.now() - Date.parse(current.updatedAt);
    if (Number.isFinite(elapsedMs) && elapsedMs < CALM_RECHECK_INTERVAL_MS) {
      console.log(
        LOG_PREFIX,
        `todo tranquilo, último chequeo hace ${Math.round(elapsedMs / 60000)} min (menos de 2hs) -> se salta este chequeo`
      );
      return Response.json({ ok: true, skipped: true, reason: "calm-recent-check" });
    }
  }

  console.log(LOG_PREFIX, "arrancando chequeo automático");

  let headlines: Awaited<ReturnType<typeof fetchCandidateHeadlines>>;
  try {
    headlines = await fetchCandidateHeadlines();
    console.log(LOG_PREFIX, `Google News RSS devolvió ${headlines.length} items`);
  } catch (e) {
    console.error(LOG_PREFIX, "ERROR consultando Google News RSS:", e);
    // No tocamos el estado guardado: un error de red/fetch no es lo mismo
    // que "revisamos y no hay señal", así que no queremos pisar un estado
    // válido (manual o de una corrida anterior) por una falla transitoria.
    return Response.json({ ok: false, step: "fetch-news", error: "Error al consultar Google News" }, { status: 200 });
  }

  const candidates = filterRecentRelevant(headlines);
  console.log(
    LOG_PREFIX,
    `${candidates.length} candidatos relevantes tras filtrar por fecha/keywords`
  );

  if (candidates.length === 0) {
    await setStrikeStatus(false, "", "", "cron", "");
    console.log(LOG_PREFIX, "sin señal clara -> estado seteado a NO hay paro");
    return Response.json({ ok: true, isStrike: false, reason: "no-candidates" });
  }

  try {
    const result = await classifyStrike(candidates);
    console.log(LOG_PREFIX, "resultado de Gemini:", result);

    await setStrikeStatus(
      result.isStrike,
      result.isStrike ? result.message : "",
      result.isStrike ? result.affectedLines : "",
      "cron",
      result.isStrike ? result.sourceHeadline : ""
    );

    return Response.json({ ok: true, ...result, candidatesConsidered: candidates.length });
  } catch (e) {
    console.error(LOG_PREFIX, "ERROR clasificando con Gemini:", e);
    // Igual que arriba: una falla de la API de Gemini no debe pisar el
    // estado guardado.
    return Response.json({ ok: false, step: "gemini", error: "Error al clasificar con Gemini" }, { status: 200 });
  }
}
