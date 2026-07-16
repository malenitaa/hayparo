"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form
      action={formAction}
      className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm dark:bg-zinc-800"
    >
      <h1 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Acceso admin
      </h1>

      <label
        htmlFor="password"
        className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        Contraseña
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoFocus
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
      />

      {state?.error ? (
        <p className="mt-2 text-sm text-red-600">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
