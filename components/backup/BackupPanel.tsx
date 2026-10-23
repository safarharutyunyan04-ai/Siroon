"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { downloadBackup, importBackup } from "@/lib/backup";
import { t } from "@/lib/i18n/messages";
import { useLocale } from "@/lib/hooks";

export function BackupPanel() {
  const { locale } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="panel px-4 py-5 sm:px-6">
      <h2 className="font-display text-xl font-medium">
        {t(locale, "backupTitle")}
      </h2>
      <p className="mt-2 max-w-xl text-sm text-muted">
        {t(locale, "backupHint")}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => downloadBackup()}>
          {t(locale, "backupExport")}
        </Button>
        <Button variant="ghost" onClick={() => inputRef.current?.click()}>
          {t(locale, "backupImport")}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(change) => {
            const file = change.target.files?.[0];
            change.target.value = "";
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              try {
                setError(null);
                importBackup(String(reader.result ?? ""));
              } catch {
                setError(t(locale, "backupError"));
              }
            };
            reader.readAsText(file);
          }}
        />
      </div>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </section>
  );
}
