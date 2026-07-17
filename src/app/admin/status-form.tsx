"use client";

import { useActionState, useState } from "react";
import { logout, updateStatus } from "./actions";

type Props = {
  initialIsStrike: boolean;
  initialMessage: string;
  initialAffectedLines: string;
  updatedAt: string | null;
  updatedBy: "cron" | "manual" | null;
  detectedFrom: string;
};

export default function StatusForm({
  initialIsStrike,
  initialMessage,
  initialAffectedLines,
  updatedAt,
  updatedBy,
  detectedFrom,
}: Props) {
  const [state, formAction, pending] = useActionState(updateStatus, undefined);
  const [isStrike, setIsStrike] = useState(initialIsStrike);

  return (
    <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-sm dark:bg-zinc-800">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Actualizar estado
        </h1>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            Salir
          </button>
        </form>
      </div>

      <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
        El estado se actualiza solo, varias veces al día, a partir de
        noticias. Guardar acá lo pisa como <strong>corrección manual</strong>{" "}
        — usalo solo si el sistema automático se equivocó, no como la forma
        normal de actualizar.
      </p>

      {updatedAt ? (
        <p className="mb-6 text-xs text-zinc-500 dark:text-zinc-400">
          Última actualización guardada:{" "}
          {new Date(updatedAt).toLocaleString("es-AR", {
            timeZone: "America/Argentina/Buenos_Aires",
          })}
          {updatedBy ? (
            <>
              {" "}
              — origen:{" "}
              <strong>
                {updatedBy === "cron" ? "automático" : "manual"}
              </strong>
              {updatedBy === "cron" && detectedFrom
                ? ` (titular: "${detectedFrom}")`
                : null}
            </>
          ) : null}
        </p>
      ) : null}

      <form action={formAction} className="space-y-5">
        <label className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <span className="font-medium text-zinc-800 dark:text-zinc-100">
            ¿Hay paro hoy?
          </span>
          <span className="flex items-center gap-3">
            <span
              className={
                isStrike
                  ? "text-zinc-400"
                  : "font-semibold text-emerald-600"
              }
            >
              NO
            </span>
            <input
              type="checkbox"
              name="isStrike"
              checked={isStrike}
              onChange={(e) => setIsStrike(e.target.checked)}
              className="relative h-6 w-11 cursor-pointer appearance-none rounded-full bg-zinc-300 transition-colors before:absolute before:left-0.5 before:top-0.5 before:h-5 before:w-5 before:rounded-full before:bg-white before:transition-transform checked:bg-red-600 checked:before:translate-x-5"
            />
            <span
              className={
                isStrike ? "font-semibold text-red-600" : "text-zinc-400"
              }
            >
              SÍ
            </span>
          </span>
        </label>

        <div>
          <label
            htmlFor="message"
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Contexto (gremio, servicios afectados, horario)
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            defaultValue={initialMessage}
            placeholder="Ej: Paro de UTA, afecta colectivos en todo el AMBA, de 0 a 24hs."
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label
            htmlFor="affectedLines"
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Líneas/servicios adheridos (opcional)
          </label>
          <textarea
            id="affectedLines"
            name="affectedLines"
            rows={3}
            defaultValue={initialAffectedLines}
            placeholder={
              "Ej:\nColectivos: 12, 15, 60, 152 (o 'todas')\nSubte: línea A, B\nTrenes: Sarmiento, Mitre"
            }
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Se muestra en un botón aparte (&ldquo;Ver líneas
            afectadas&rdquo;) para no desordenar la respuesta principal.
            Dejalo vacío si no aplica o no
            se sabe todavía.
          </p>
        </div>

        {state?.error ? (
          <p className="text-sm text-red-600">{state.error}</p>
        ) : null}
        {state?.success ? (
          <p className="text-sm text-emerald-600">Guardado ✓</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {pending ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </div>
  );
}
