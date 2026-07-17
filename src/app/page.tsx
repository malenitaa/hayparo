import { getStrikeStatus } from "@/lib/strike-status";
import LinesPopup from "./lines-popup";

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
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-100 px-6 text-center dark:bg-zinc-900">
        <p className="text-2xl font-semibold text-zinc-700 dark:text-zinc-200">
          No pudimos cargar el estado ahora mismo.
        </p>
        <p className="text-zinc-500 dark:text-zinc-400">
          Volvé a intentar en un momento.
        </p>
      </div>
    );
  }

  const { isStrike, message, affectedLines, updatedAt } = status;
  const bgClass = isStrike
    ? "bg-red-600 dark:bg-red-700"
    : "bg-emerald-600 dark:bg-emerald-700";

  return (
    <div className={`flex flex-1 flex-col ${bgClass} transition-colors`}>
      {/* items-center + top padding (not justify-center) so the SI/NO answer
          sits at a fixed position regardless of how much text/buttons render
          below it (context line, lines popup, etc). */}
      <main className="flex flex-1 flex-col items-center px-6 pt-10 pb-16 text-center sm:pt-16">
        <h1 className="text-2xl font-medium text-white/90 sm:text-3xl">
          ¿Hay paro hoy en Buenos Aires?
        </h1>

        <p className="mt-4 text-[22vw] font-black leading-none text-white drop-shadow-sm sm:text-[16rem]">
          {isStrike ? "SÍ" : "NO"}
        </p>

        {isStrike && message ? (
          <p className="mt-6 max-w-xl text-lg font-medium text-white sm:text-xl">
            {message}
          </p>
        ) : !isStrike ? (
          <p className="mt-6 max-w-xl text-lg font-medium text-white sm:text-xl">
            Circulá tranquila, no hay paros confirmados para hoy.
          </p>
        ) : null}

        {isStrike && affectedLines ? (
          <LinesPopup lines={affectedLines} />
        ) : null}

        <p className="mt-10 text-sm font-medium text-white/80">
          Última actualización: {formatUpdatedAt(updatedAt)} (hora de Argentina)
        </p>
      </main>

      <section className="bg-white px-6 py-10 dark:bg-zinc-950">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            <strong>¿Hay Paro Hoy?</strong> te dice al instante si hay paro de
            transporte público en Buenos Aires — colectivos, subte y trenes —
            para que sepas si vas a llegar a horario antes de salir de tu
            casa. El estado se actualiza a mano apenas se confirma un paro
            (gremio, servicios afectados y horario) y se revisa todos los
            días, así que la respuesta que ves arriba está siempre vigente.
          </p>
        </div>
      </section>
    </div>
  );
}
