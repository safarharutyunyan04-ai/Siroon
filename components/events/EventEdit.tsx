"use client";

import { Button } from "@/components/ui/Button";
import { EventForm } from "@/components/events/EventForm";
import { t } from "@/lib/i18n/messages";
import { useEvent, useLocale } from "@/lib/hooks";

export function EventEdit({ eventId }: { eventId: string }) {
  const { locale } = useLocale();
  const { event, ready } = useEvent(eventId);

  if (!ready) {
    return <p className="text-sm text-muted">{t(locale, "loading")}</p>;
  }

  if (!event) {
    return (
      <div>
        <p className="text-sm text-muted">{t(locale, "missingEvent")}</p>
        <Button href="/" className="mt-6">
          {t(locale, "back")}
        </Button>
      </div>
    );
  }

  return <EventForm event={event} />;
}
