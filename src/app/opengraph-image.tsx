import { ImageResponse } from "next/og";
import { getStrikeStatus } from "@/lib/strike-status";

// El estado puede cambiar en cualquier momento del día (el cron corre cada
// 15 min cuando hay paro activo), así que esta imagen se genera en cada
// request en vez de cachearse por tiempo fijo — igual que la página misma
// (ver page.tsx: dynamic = "force-dynamic"). Los crawlers de
// WhatsApp/Twitter ya cachean la preview de su lado por varias horas, así
// que el costo extra de renderizarla siempre fresca es despreciable.
export const dynamic = "force-dynamic";

export const alt = "¿Hay paro hoy en Buenos Aires?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export default async function OpengraphImage() {
  const status = await getStrikeStatus();
  const isStrike = status.ok && status.isStrike;
  const bg = !status.ok ? "#52525b" : isStrike ? "#dc2626" : "#059669";
  const headline = !status.ok ? "?" : isStrike ? "SÍ" : "NO";
  const subtitle = !status.ok
    ? "No pudimos cargar el estado ahora mismo."
    : isStrike
      ? truncate(status.message || "Hay paro hoy.", 90)
      : "Todo tranquilo, no hay paros confirmados para hoy.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: bg,
          fontFamily: "sans-serif",
          textAlign: "center",
          padding: "0 90px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 40,
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
          }}
        >
          ¿Hay paro hoy en Buenos Aires?
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 320,
            fontWeight: 900,
            lineHeight: 1,
            marginTop: 8,
            color: "white",
          }}
        >
          {headline}
        </div>
        <div
          style={{
            display: "flex",
            maxWidth: 920,
            marginTop: 24,
            fontSize: 32,
            fontWeight: 500,
            color: "white",
          }}
        >
          {subtitle}
        </div>
      </div>
    ),
    { ...size }
  );
}
