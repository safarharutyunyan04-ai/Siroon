import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { createRealtimeChannel } from "@/lib/supabase/realtime";
import type { Currency, Locale } from "@/types/domain";
import { normalizeBaseUrl } from "@/lib/site-url";

export type RemoteSettings = {
  currency: Currency;
  locale: Locale;
  publicBaseUrl: string;
};

type SettingsRow = {
  id: string;
  currency: string;
  locale: string;
  public_base_url: string;
};

export async function fetchSettings(): Promise<RemoteSettings | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    console.warn("[settings] fetch", error.message);
    return null;
  }
  if (!data) return null;
  return rowToSettings(data as SettingsRow);
}

export async function upsertSettings(settings: RemoteSettings) {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return;
  const { error } = await supabase.from("app_settings").upsert({
    id: "default",
    currency: settings.currency,
    locale: settings.locale,
    public_base_url: settings.publicBaseUrl,
  });
  if (error) console.warn("[settings] upsert", error.message);
}

export function subscribeSettingsTable(onChange: () => void) {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = createRealtimeChannel(supabase, "app_settings_table")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "app_settings" },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

function rowToSettings(row: SettingsRow): RemoteSettings {
  const currency =
    row.currency === "AMD" ||
    row.currency === "USD" ||
    row.currency === "EUR" ||
    row.currency === "RUB"
      ? row.currency
      : "AMD";
  const locale =
    row.locale === "hy" ||
    row.locale === "fr" ||
    row.locale === "en" ||
    row.locale === "ru"
      ? row.locale
      : "hy";
  return {
    currency,
    locale,
    publicBaseUrl: normalizeBaseUrl(row.public_base_url ?? ""),
  };
}
