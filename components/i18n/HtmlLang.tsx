"use client";

import { useEffect } from "react";
import { getLocaleMeta } from "@/lib/i18n/messages";
import { useLocale } from "@/lib/hooks";

export function HtmlLang() {
  const { locale } = useLocale();

  useEffect(() => {
    document.documentElement.lang = getLocaleMeta(locale).intl;
  }, [locale]);

  return null;
}
