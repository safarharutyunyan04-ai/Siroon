"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n/messages";
import { useLocale, usePublicBaseUrl } from "@/lib/hooks";
import { setPublicBaseUrl } from "@/lib/settings-store";
import {
  buildCarteUrl,
  envSiteUrl,
  isLocalHostUrl,
  normalizeBaseUrl,
  resolvePublicBaseUrl,
} from "@/lib/site-url";

function qrImageUrl(target: string, size = 280) {
  const params = new URLSearchParams({
    size: `${size}x${size}`,
    data: target,
    color: "1a1510",
    bgcolor: "fffcf8",
    margin: "2",
  });
  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}

export function MenuQrCode({ className = "" }: { className?: string }) {
  const { locale } = useLocale();
  const { publicBaseUrl, ready } = usePublicBaseUrl();
  const [draft, setDraft] = useState("");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const resolved = resolvePublicBaseUrl(publicBaseUrl, origin);
    setDraft(resolved || envSiteUrl() || "");
  }, [origin, publicBaseUrl, ready]);

  const carteUrl = useMemo(() => {
    const base = resolvePublicBaseUrl(draft || publicBaseUrl, origin);
    return buildCarteUrl(base);
  }, [draft, origin, publicBaseUrl]);

  const localOnly = !carteUrl || isLocalHostUrl(carteUrl);
  const dataUrl = useMemo(
    () => (carteUrl && !localOnly ? qrImageUrl(carteUrl, 280) : ""),
    [carteUrl, localOnly],
  );

  function saveUrl() {
    const next = normalizeBaseUrl(draft);
    setPublicBaseUrl(next);
    setDraft(next);
  }

  async function copyLink() {
    if (!carteUrl || localOnly) return;
    try {
      await navigator.clipboard.writeText(carteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  async function download() {
    if (!dataUrl) return;
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "le-man-menu-qr.png";
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(dataUrl, "_blank", "noopener,noreferrer");
    }
  }

  function printQr() {
    if (!dataUrl || !carteUrl) return;
    const popup = window.open(
      "",
      "_blank",
      "noopener,noreferrer,width=480,height=640",
    );
    if (!popup) return;
    popup.document.write(`<!doctype html><html><head><title>QR · Le Man</title>
      <style>
        body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
          font-family:Georgia,serif;background:#fffcf8;color:#1a1510}
        .card{text-align:center;padding:2rem}
        img{width:240px;height:240px;display:block;margin:0 auto 1.25rem}
        h1{margin:0;font-size:1.35rem;letter-spacing:.18em;text-transform:uppercase}
        p{margin:.35rem 0 0;font-style:italic;color:#a8873d}
      </style></head><body>
      <div class="card">
        <img src="${dataUrl}" alt="QR" />
        <h1>Le Man</h1>
        <p>Wedding hall</p>
      </div>
      <script>window.onload=()=>{setTimeout(()=>window.print(),400);}</script>
      </body></html>`);
    popup.document.close();
  }

  return (
    <section
      className={`panel px-4 py-6 sm:px-7 sm:py-7 ${className}`.trim()}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-medium sm:text-2xl">
            {t(locale, "menuQrTitle")}
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted">
            {t(locale, "menuQrHint")}
          </p>

          <label className="mt-5 flex max-w-xl flex-col gap-2">
            <span className="label">{t(locale, "menuQrPublicUrl")}</span>
            <input
              type="url"
              value={draft}
              placeholder={t(locale, "menuQrPublicUrlPlaceholder")}
              onChange={(change) => setDraft(change.target.value)}
              onBlur={saveUrl}
              className="border-b border-border bg-transparent py-2 text-sm outline-none focus:border-foreground"
            />
          </label>

          {carteUrl ? (
            <p
              className={`mt-3 break-all text-[12px] tabular-nums ${
                localOnly ? "text-danger" : "text-accent"
              }`}
            >
              {carteUrl}
            </p>
          ) : null}

          {localOnly ? (
            <p className="mt-2 max-w-md text-[13px] text-danger">
              {t(locale, "menuQrLocalhostWarn")}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" onClick={saveUrl}>
              {t(locale, "menuQrSaveUrl")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={copyLink}
              disabled={localOnly || !carteUrl}
            >
              {copied ? t(locale, "menuQrCopied") : t(locale, "menuQrCopy")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={download}
              disabled={!dataUrl}
            >
              {t(locale, "menuQrDownload")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={printQr}
              disabled={!dataUrl}
            >
              {t(locale, "menuQrPrint")}
            </Button>
          </div>
        </div>

        <div className="mx-auto shrink-0 rounded-[12px] border border-border/80 bg-white p-3 shadow-[0_8px_24px_rgba(26,21,16,0.06)] sm:mx-0">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dataUrl}
              alt={t(locale, "menuQrTitle")}
              width={180}
              height={180}
              className="block h-[180px] w-[180px]"
            />
          ) : (
            <div className="flex h-[180px] w-[180px] items-center justify-center px-4 text-center text-[12px] leading-snug text-muted">
              {t(locale, "menuQrWaiting")}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
