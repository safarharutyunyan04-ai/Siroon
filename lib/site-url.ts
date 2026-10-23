const ENV_SITE_URL =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim()
    : "";

export function normalizeBaseUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isLocalHostUrl(value: string) {
  try {
    const host = new URL(normalizeBaseUrl(value) || "http://invalid").hostname;
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host.endsWith(".local")
    );
  } catch {
    return true;
  }
}

export function buildCarteUrl(baseUrl: string) {
  const base = normalizeBaseUrl(baseUrl);
  if (!base) return "";
  return `${base}/carte`;
}

export function envSiteUrl() {
  return normalizeBaseUrl(ENV_SITE_URL);
}

export function resolvePublicBaseUrl(stored: string, browserOrigin = "") {
  const fromSettings = normalizeBaseUrl(stored);
  if (fromSettings && !isLocalHostUrl(fromSettings)) return fromSettings;

  const fromEnv = envSiteUrl();
  if (fromEnv && !isLocalHostUrl(fromEnv)) return fromEnv;

  if (fromSettings) return fromSettings;

  const origin = normalizeBaseUrl(browserOrigin);
  return origin;
}
