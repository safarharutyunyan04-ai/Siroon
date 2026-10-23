const KEYS = [
  "siroon:events",
  "siroon:menu:v4",
  "siroon:seating",
  "siroon:settings:v3",
  "siroon:settings:v2",
] as const;

export type BackupPayload = {
  version: 1;
  exportedAt: string;
  data: Record<string, unknown>;
};

export function exportBackup(): BackupPayload {
  const data: Record<string, unknown> = {};
  if (typeof window === "undefined") {
    return { version: 1, exportedAt: new Date().toISOString(), data };
  }
  for (const key of KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) data[key] = JSON.parse(raw);
    } catch {
      /* skip broken key */
    }
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function downloadBackup() {
  const payload = exportBackup();
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const stamp = payload.exportedAt.slice(0, 10);
  anchor.href = url;
  anchor.download = `siroon-backup-${stamp}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function importBackup(raw: string) {
  if (typeof window === "undefined") {
    throw new Error("client-only");
  }
  const parsed = JSON.parse(raw) as BackupPayload;
  if (!parsed || parsed.version !== 1 || !parsed.data) {
    throw new Error("invalid");
  }
  for (const key of KEYS) {
    if (key in parsed.data) {
      window.localStorage.setItem(key, JSON.stringify(parsed.data[key]));
    }
  }
  window.location.reload();
}
