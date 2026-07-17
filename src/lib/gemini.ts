import type { NewsItem } from "@/lib/google-news";

export type StrikeClassification = {
  isStrike: boolean;
  message: string;
  affectedLines: string;
  sourceHeadline: string;
};

function todayInBuenosAires(): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

function buildPrompt(candidates: NewsItem[]): string {
  const list = candidates
    .map(
      (c, i) =>
        `${i + 1}. "${c.title}" (fuente: ${c.source || "desconocida"}, fecha: ${c.pubDate || "sin fecha"})`
    )
    .join("\n");

  return `Hoy es ${todayInBuenosAires()} en Buenos Aires, Argentina.

Te paso una lista de titulares de noticias recientes sobre transporte público en Buenos Aires (colectivos, subte, trenes):

${list}

Tu tarea: decidir si hay evidencia de un PARO DE TRANSPORTE PÚBLICO CONFIRMADO PARA HOY específicamente (no un paro de la semana que viene, no uno ya finalizado, no una simple amenaza o negociación en curso sin fecha confirmada de paro).

Respondé ÚNICAMENTE con un objeto JSON con esta forma exacta, sin texto adicional:
{
  "isStrike": boolean,
  "message": string,
  "affectedLines": string,
  "sourceHeadline": string
}

- "isStrike": true solo si hay evidencia clara de un paro confirmado para HOY.
- "message": si isStrike es true, una frase corta en español que diga CLARAMENTE qué servicios afecta — colectivos, subte, trenes, o todos —, el gremio, si es parcial o total, y horario si se sabe. Si un titular no aclara si afecta a los tres servicios o solo a alguno, decilo explícitamente en vez de asumir "todos". Si isStrike es false, string vacío.
- "affectedLines": si isStrike es true, desglosá por servicio lo que sepas de los titulares, en líneas separadas, con este formato (omití el/los servicios que no estén afectados o de los que no haya info):
  "Colectivos: 12, 45, 60 (o 'todas las líneas' si así lo dice el titular)
  Subte: línea A, B (o 'todas las líneas')
  Trenes: Sarmiento, Mitre (o 'todas las líneas')"
  Si ningún titular da detalle de líneas/servicios puntuales, string vacío — no inventes datos que no estén en los titulares.
- "sourceHeadline": el titular (de la lista) que más sustenta tu decisión. String vacío si isStrike es false.

Ante la duda, respondé isStrike: false.`;
}

export async function classifyStrike(
  candidates: NewsItem[]
): Promise<StrikeClassification> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta la variable de entorno GEMINI_API_KEY");
  }

  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(candidates) }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini respondió ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Respuesta de Gemini sin contenido de texto");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`No se pudo parsear el JSON de Gemini: ${text.slice(0, 300)}`);
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).isStrike !== "boolean"
  ) {
    throw new Error("La respuesta de Gemini no tiene la forma esperada");
  }

  const result = parsed as Record<string, unknown>;
  return {
    isStrike: result.isStrike as boolean,
    message: typeof result.message === "string" ? result.message : "",
    affectedLines:
      typeof result.affectedLines === "string" ? result.affectedLines : "",
    sourceHeadline:
      typeof result.sourceHeadline === "string" ? result.sourceHeadline : "",
  };
}
