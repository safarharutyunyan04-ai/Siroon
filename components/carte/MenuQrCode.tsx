"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n/messages";
import { useLocale, usePublicBaseUrl } from "@/lib/hooks";
import {
  buildCarteUrl,
  envSiteUrl,
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

function subscribeNoop() {
  return () => {};
}

function getClientOrigin() {
  return typeof window !== "undefined" ? window.location.origin : "";
}

export function MenuQrCode({ className = "" }: { className?: string }) {
  const { locale } = useLocale();
  const { publicBaseUrl, ready } = usePublicBaseUrl();
  const origin = useSyncExternalStore(
    subscribeNoop,
    getClientOrigin,
    () => "",
  );

  const carteUrl = useMemo(() => {
    if (!ready && !origin && !envSiteUrl()) return "";
    const base =
      resolvePublicBaseUrl(publicBaseUrl, origin) || envSiteUrl() || origin;
    return buildCarteUrl(base);
  }, [origin, publicBaseUrl, ready]);

  const dataUrl = useMemo(
    () => (carteUrl ? qrImageUrl(carteUrl, 280) : ""),
    [carteUrl],
  );

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
    if (!dataUrl) return;
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
      className={`panel flex flex-col items-center px-4 py-8 sm:px-7 sm:py-10 ${className}`.trim()}
    >
      <h2 className="font-display text-xl font-medium sm:text-2xl">
        {t(locale, "menuQrTitle")}
      </h2>

      <div className="mt-6 rounded-[12px] border border-border/80 bg-white p-3 shadow-[0_8px_24px_rgba(26,21,16,0.06)]">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={t(locale, "menuQrTitle")}
            width={220}
            height={220}
            className="block h-[220px] w-[220px]"
          />
        ) : (
          <div className="flex h-[220px] w-[220px] items-center justify-center px-4 text-center text-[12px] leading-snug text-muted">
            …
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button
          type="button"
          size="lg"
          onClick={download}
          disabled={!dataUrl}
        >
          {t(locale, "menuQrDownload")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={printQr}
          disabled={!dataUrl}
        >
          {t(locale, "menuQrPrint")}
        </Button>
      </div>
    </section>
  );
}
