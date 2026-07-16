import type { Metadata } from "next";
import { isAuthenticated } from "@/lib/admin-auth";
import { getStrikeStatus } from "@/lib/strike-status";
import LoginForm from "./login-form";
import StatusForm from "./status-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — ¿Hay Paro Hoy?",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const authed = await isAuthenticated();

  if (!authed) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-100 px-6 dark:bg-zinc-900">
        <LoginForm />
      </div>
    );
  }

  const status = await getStrikeStatus();

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-100 px-6 py-12 dark:bg-zinc-900">
      <StatusForm
        initialIsStrike={status.ok ? status.isStrike : false}
        initialMessage={status.ok ? status.message : ""}
        updatedAt={status.ok ? status.updatedAt : null}
      />
    </div>
  );
}
