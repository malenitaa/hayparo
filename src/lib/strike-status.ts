import { getSupabase } from "@/lib/supabase";

export type StrikeStatus = {
  isStrike: boolean;
  message: string;
  updatedAt: string;
};

export type StrikeStatusResult =
  | ({ ok: true } & StrikeStatus)
  | { ok: false };

const ROW_ID = 1;

export async function getStrikeStatus(): Promise<StrikeStatusResult> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("strike_status")
      .select("is_strike, message, updated_at")
      .eq("id", ROW_ID)
      .single();

    if (error || !data) return { ok: false };

    return {
      ok: true,
      isStrike: data.is_strike,
      message: data.message ?? "",
      updatedAt: data.updated_at,
    };
  } catch {
    return { ok: false };
  }
}

export async function setStrikeStatus(
  isStrike: boolean,
  message: string
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("strike_status").upsert({
    id: ROW_ID,
    is_strike: isStrike,
    message: message.trim(),
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}
