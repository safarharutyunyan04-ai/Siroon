import type { Locale } from "@/types/domain";

const TARGETS: Locale[] = ["hy", "fr", "en", "ru"];

async function sleep(ms: number) {
  await new Promise((resolve) => window.setTimeout(resolve, ms));
}

/** Free MyMemory API — best-effort auto translation. */
export async function translateText(
  text: string,
  from: Locale,
  to: Locale,
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || from === to) return trimmed;

  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", trimmed.slice(0, 450));
  url.searchParams.set("langpair", `${from}|${to}`);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return trimmed;
    const data = (await response.json()) as {
      responseData?: { translatedText?: string };
      responseStatus?: number;
    };
    const out = data.responseData?.translatedText?.trim();
    if (!out || data.responseStatus !== 200) return trimmed;
    // MyMemory sometimes returns "MYMEMORY WARNING..." 
    if (/^MYMEMORY WARNING/i.test(out)) return trimmed;
    return out;
  } catch {
    return trimmed;
  }
}

export async function translateToLocales(
  text: string,
  from: Locale,
  targets: Locale[] = TARGETS,
): Promise<Partial<Record<Locale, string>>> {
  const result: Partial<Record<Locale, string>> = { [from]: text.trim() };
  if (!text.trim()) return result;

  for (const to of targets) {
    if (to === from) continue;
    result[to] = await translateText(text, from, to);
    await sleep(250);
  }
  return result;
}

export function contentLocales(): Locale[] {
  return [...TARGETS];
}
