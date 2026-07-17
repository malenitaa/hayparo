import { classifyStrike } from "@/lib/gemini";
import { fetchCandidateHeadlines, filterRecentRelevant } from "@/lib/google-news";
import { setStrikeStatus } from "@/lib/strike-status";

const LOG_PREFIX = "[cron:check-strike] (a confirmar en producción — primera corrida real)";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  console.log(LOG_PREFIX, "arrancando chequeo automático");

  let headlines: Awaited<ReturnType<typeof fetchCandidateHeadlines>>;
  try {
    headlines = await fetchCandidateHeadlines();
    console.log(LOG_PREFIX, `Google News RSS devolvió ${headlines.length} items`);
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error(LOG_PREFIX, "ERROR consultando Google News RSS:", error);
    // No tocamos el estado guardado: un error de red/fetch no es lo mismo
    // que "revisamos y no hay señal", así que no queremos pisar un estado
    // válido (manual o de una corrida anterior) por una falla transitoria.
    return Response.json({ ok: false, step: "fetch-news", error }, { status: 200 });
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
      "",
      "cron",
      result.isStrike ? result.sourceHeadline : ""
    );

    return Response.json({ ok: true, ...result, candidatesConsidered: candidates.length });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error(LOG_PREFIX, "ERROR clasificando con Gemini:", error);
    // Igual que arriba: una falla de la API de Gemini no debe pisar el
    // estado guardado.
    return Response.json({ ok: false, step: "gemini", error }, { status: 200 });
  }
}
