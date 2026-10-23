"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { SiroonMark } from "@/components/brand/SiroonMark";
import { signInWithPassword } from "@/lib/auth-store";
import { useAuth } from "@/lib/hooks-auth";
import { t } from "@/lib/i18n/messages";
import { useLocale } from "@/lib/hooks";

export function LoginForm() {
  const { locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, user, requiresAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!requiresAuth || user) {
      const next = searchParams.get("next");
      router.replace(next && next.startsWith("/") ? next : "/");
    }
  }, [ready, requiresAuth, user, router, searchParams]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signInWithPassword(email, password);
      const next = searchParams.get("next");
      router.replace(next && next.startsWith("/") ? next : "/");
    } catch {
      setError(t(locale, "loginError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <SiroonMark size={28} />
          <span className="font-brand text-[13px] font-semibold tracking-[0.28em] text-accent uppercase">
            Siroon
          </span>
        </div>
        <LanguageSwitcher className="bg-surface-raised/80 ring-border/60" />
      </div>

      <h1 className="font-display text-2xl font-medium tracking-tight">
        {t(locale, "loginTitle")}
      </h1>
      <p className="mt-2 text-sm text-muted">{t(locale, "loginHint")}</p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="label">{t(locale, "loginEmail")}</span>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-b border-border bg-transparent py-2 text-sm outline-none focus:border-foreground"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="label">{t(locale, "loginPassword")}</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-b border-border bg-transparent py-2 text-sm outline-none focus:border-foreground"
          />
        </label>

        {error ? (
          <p className="text-[13px] text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={busy}>
          {busy ? t(locale, "loading") : t(locale, "loginSubmit")}
        </Button>
      </form>
    </div>
  );
}
