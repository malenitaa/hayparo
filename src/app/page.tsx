import { getStrikeStatus } from "@/lib/strike-status";
import LinesPopup from "./lines-popup";
import BodyBgSync from "./body-bg-sync";

export const dynamic = "force-dynamic";

function formatUpdatedAt(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function Home() {
  const status = await getStrikeStatus();

  if (!status.ok) {
    return (
      <>
        <BodyBgSync light="#f4f4f5" dark="#18181b" />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-100 px-6 text-center dark:bg-zinc-900">
          <p className="text-2xl font-semibold text-zinc-700 dark:text-zinc-200">
            No pudimos cargar el estado ahora mismo.
          </p>
          <p className="text-zinc-500 dark:text-zinc-400">
            Volvé a intentar en un momento.
          </p>
        </div>
      </>
    );
  }

  const { isStrike, message, affectedLines, updatedAt } = status;
  const bgClass = isStrike
    ? "bg-red-600 dark:bg-red-700"
    : "bg-emerald-600 dark:bg-emerald-700";
  const bgHex = isStrike
    ? { light: "#dc2626", dark: "#b91c1c" }
    : { light: "#059669", dark: "#047857" };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "¿Hay Paro Hoy en Buenos Aires?",
    dateModified: updatedAt,
    about: {
      "@type": "Answer",
      text: isStrike
        ? `SÍ hay paro${message ? ` — ${message}` : ""}`
        : "NO hay paro — Todo tranquilo, no hay paros confirmados para hoy.",
    },
  };

  return (
    <>
      <BodyBgSync light={bgHex.light} dark={bgHex.dark} />
      {/* h-[var(--app-height)] + overflow-hidden: the whole page is exactly
          one screen, no scrollbar, on mobile and desktop alike
          (--app-height accounts for the mobile browser's address bar, see
          AppHeightFix). */}
      <div
        className={`flex h-[var(--app-height)] flex-col overflow-hidden ${bgClass} transition-colors`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* min-h-0 lets this flex item shrink below its content size instead
          of pushing the footer out of view; items-center (no
          justify-center) keeps the SI/NO answer's position independent of
          how much text/buttons render below it. */}
        <main className="flex min-h-0 flex-1 flex-col items-center px-6 pt-[6vh] text-center">
          <h1 className="text-lg font-medium text-white/90 sm:text-2xl">
            ¿Hay paro hoy en Buenos Aires?
          </h1>

          <p className="mt-1 text-[clamp(5rem,28vh,13rem)] font-black leading-none text-white drop-shadow-sm">
            {isStrike ? "SÍ" : "NO"}
          </p>

          {isStrike && message ? (
            <p className="mt-2 line-clamp-2 max-w-xl text-base font-medium text-white sm:text-lg">
              {message}
            </p>
          ) : !isStrike ? (
            <p className="mt-2 max-w-xl text-base font-medium text-white sm:text-lg">
              Todo tranquilo, no hay paros confirmados para hoy.
            </p>
          ) : null}

          {isStrike && affectedLines ? (
            <LinesPopup lines={affectedLines} />
          ) : null}

          <p className="mt-3 text-xs font-medium text-white/80 sm:text-sm">
            Última actualización: {formatUpdatedAt(updatedAt)} (hora de
            Argentina)
          </p>
        </main>

        <section className="shrink-0 bg-white px-6 py-3 dark:bg-zinc-950">
          <p className="mx-auto max-w-xl text-center text-xs leading-5 text-zinc-600 dark:text-zinc-400 sm:text-sm">
            <strong>¿Hay Paro Hoy?</strong> te dice al instante si hay paro de
            transporte público en Buenos Aires — colectivos, subte y trenes —,
            revisado varias veces al día.
          </p>
        </section>
      </div>
    </>
  );
}
