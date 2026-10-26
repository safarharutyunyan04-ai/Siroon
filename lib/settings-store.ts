import {
  fetchSettings,
  subscribeSettingsTable,
  upsertSettings,
} from "@/lib/remote/settings";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { waitForSession } from "@/lib/supabase/session";
import type { Currency, Locale } from "@/types/domain";
import { normalizeBaseUrl } from "@/lib/site-url";

const storageKey = "siroon:settings:v3";
const legacyKey = "siroon:settings:v2";

type Settings = {
  currency: Currency;
  locale: Locale;
  publicBaseUrl: string;
};

const defaults: Settings = { currency: "AMD", locale: "hy", publicBaseUrl: "" };
let settings: Settings = defaults;
const emptyReady = false;
let ready = false;
let remoteBootstrapped = false;
let bootstrapPromise: Promise<void> | null = null;
let applyingRemote = false;
let unsubscribeRemote: (() => void) | null = null;
let reloadTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

export function subscribeSettings(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSettings() {
  return ready ? settings : defaults;
}

export function getServerSettings() {
  return defaults;
}

export function getSettingsReady() {
  return ready;
}

export function getServerSettingsReady() {
  return emptyReady;
}

export function ensureSettings() {
  if (ready) return;
  settings = read();
  ready = true;
  emit(false);
  void bootstrapRemote();
}

export function setCurrency(_currency?: Currency) {
  hydrate();
  if (settings.currency === "AMD") return;
  settings = { ...settings, currency: "AMD" };
  emit(true);
  void upsertSettings(settings);
}

export function setLocale(locale: Locale) {
  hydrate();
  settings = { ...settings, locale };
  emit(true);
  void upsertSettings(settings);
}

export function setPublicBaseUrl(publicBaseUrl: string) {
  hydrate();
  settings = { ...settings, publicBaseUrl: normalizeBaseUrl(publicBaseUrl) };
  emit(true);
  void upsertSettings(settings);
}

function hydrate() {
  if (!ready) {
    settings = read();
    ready = true;
  }
}

function read(): Settings {
  if (typeof localStorage === "undefined") return { ...defaults };
  try {
    const raw =
      localStorage.getItem(storageKey) ?? localStorage.getItem(legacyKey);
    if (!raw) return { ...defaults };
    return normalizeSettings(JSON.parse(raw) as Partial<Settings>);
  } catch {
    return { ...defaults };
  }
}

function normalizeSettings(parsed: Partial<Settings>): Settings {
  const currency = defaults.currency;
  const locale =
    parsed.locale === "hy" ||
    parsed.locale === "fr" ||
    parsed.locale === "en" ||
    parsed.locale === "ru"
      ? parsed.locale
      : defaults.locale;
  const publicBaseUrl =
    typeof parsed.publicBaseUrl === "string"
      ? normalizeBaseUrl(parsed.publicBaseUrl)
      : defaults.publicBaseUrl;
  return { currency, locale, publicBaseUrl };
}

function emit(persist: boolean) {
  if (persist && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }
  for (const listener of listeners) listener();
}

async function bootstrapRemote() {
  if (remoteBootstrapped || !isSupabaseConfigured()) return;
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    const session = await waitForSession();
    if (!session || remoteBootstrapped) return;
    remoteBootstrapped = true;

    const remote = await fetchSettings();
    if (remote) {
      applyRemote(remote);
    } else {
      await upsertSettings(settings);
    }

    if (!unsubscribeRemote) {
      unsubscribeRemote = subscribeSettingsTable(() => {
        if (applyingRemote) return;
        if (reloadTimer) clearTimeout(reloadTimer);
        reloadTimer = setTimeout(() => {
          reloadTimer = null;
          void reloadFromRemote();
        }, 300);
      });
    }
  })();

  await bootstrapPromise;
}

async function reloadFromRemote() {
  const remote = await fetchSettings();
  if (!remote) return;
  applyRemote(remote);
}

function applyRemote(remote: Settings) {
  applyingRemote = true;
  settings = normalizeSettings(remote);
  emit(true);
  applyingRemote = false;
}
