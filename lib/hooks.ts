"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  ensureEvents,
  getEvent,
  getEvents,
  getEventsReady,
  getServerEvents,
  getServerEventsReady,
  subscribeEvents,
} from "@/lib/events-store";
import {
  ensureMenu,
  getMenuCategories,
  getMenuItems,
  getMenuReady,
  getServerMenuCategories,
  getServerMenuItems,
  getServerMenuReady,
  subscribeMenu,
} from "@/lib/menu-store";
import {
  ensureBrokenCatalog,
  getBrokenCatalog,
  getBrokenCatalogReady,
  getServerBrokenCatalog,
  getServerBrokenCatalogReady,
  subscribeBrokenCatalog,
} from "@/lib/broken-catalog-store";
import {
  ensureSettings,
  getServerSettings,
  getServerSettingsReady,
  getSettings,
  getSettingsReady,
  subscribeSettings,
} from "@/lib/settings-store";
import { todayIso } from "@/lib/format";

export function useMenu() {
  const items = useSyncExternalStore(
    subscribeMenu,
    getMenuItems,
    getServerMenuItems,
  );
  const categories = useSyncExternalStore(
    subscribeMenu,
    getMenuCategories,
    getServerMenuCategories,
  );
  const ready = useSyncExternalStore(
    subscribeMenu,
    getMenuReady,
    getServerMenuReady,
  );

  useEffect(() => {
    ensureMenu();
  }, []);

  return {
    items,
    categories: [...categories].sort((a, b) => a.sortOrder - b.sortOrder),
    ready,
  };
}

export function useEvents() {
  const events = useSyncExternalStore(
    subscribeEvents,
    getEvents,
    getServerEvents,
  );
  const ready = useSyncExternalStore(
    subscribeEvents,
    getEventsReady,
    getServerEventsReady,
  );

  useEffect(() => {
    ensureEvents();
  }, []);

  return { events, ready };
}

export function useEvent(eventId: string) {
  const { events, ready } = useEvents();
  return {
    event: getEvent(eventId) ?? events.find((entry) => entry.id === eventId),
    ready,
  };
}

export function useTodayEvents() {
  const { events, ready } = useEvents();
  const today = todayIso();
  return {
    events: events.filter(
      (event) => event.date === today && event.status !== "cancelled",
    ),
    ready,
    today,
  };
}

export function useBrokenCatalog() {
  const items = useSyncExternalStore(
    subscribeBrokenCatalog,
    getBrokenCatalog,
    getServerBrokenCatalog,
  );
  const ready = useSyncExternalStore(
    subscribeBrokenCatalog,
    getBrokenCatalogReady,
    getServerBrokenCatalogReady,
  );

  useEffect(() => {
    ensureBrokenCatalog();
  }, []);

  return { items, ready };
}

export function useCurrency() {
  const ready = useSyncExternalStore(
    subscribeSettings,
    getSettingsReady,
    getServerSettingsReady,
  );

  useEffect(() => {
    ensureSettings();
  }, []);

  return { currency: "AMD" as const, ready };
}

export function useLocale() {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getServerSettings,
  );
  const ready = useSyncExternalStore(
    subscribeSettings,
    getSettingsReady,
    getServerSettingsReady,
  );

  useEffect(() => {
    ensureSettings();
  }, []);

  return { locale: settings.locale, ready };
}

export function usePublicBaseUrl() {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getServerSettings,
  );
  const ready = useSyncExternalStore(
    subscribeSettings,
    getSettingsReady,
    getServerSettingsReady,
  );

  useEffect(() => {
    ensureSettings();
  }, []);

  return { publicBaseUrl: settings.publicBaseUrl, ready };
}
