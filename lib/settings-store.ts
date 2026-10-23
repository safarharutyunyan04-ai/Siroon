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
}

export function setCurrency(currency: Currency) {
  hydrate();
  settings = { ...settings, currency };
  emit(true);
}

export function setLocale(locale: Locale) {
  hydrate();
  settings = { ...settings, locale };
  emit(true);
}

export function setPublicBaseUrl(publicBaseUrl: string) {
  hydrate();
  settings = { ...settings, publicBaseUrl: normalizeBaseUrl(publicBaseUrl) };
  emit(true);
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
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const currency =
      parsed.currency === "AMD" ||
      parsed.currency === "USD" ||
      parsed.currency === "EUR" ||
      parsed.currency === "RUB"
        ? parsed.currency
        : defaults.currency;
    const locale =
      parsed.locale === "hy" || parsed.locale === "fr"
        ? parsed.locale
        : defaults.locale;
    const publicBaseUrl =
      typeof parsed.publicBaseUrl === "string"
        ? normalizeBaseUrl(parsed.publicBaseUrl)
        : defaults.publicBaseUrl;
    return { currency, locale, publicBaseUrl };
  } catch {
    return { ...defaults };
  }
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
