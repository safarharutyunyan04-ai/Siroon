"use client";

import { Button } from "@/components/ui/Button";
import { EventForm } from "@/components/events/EventForm";
import { useEvent } from "@/lib/hooks";

export function EventEdit({ eventId }: { eventId: string }) {
  const { event, ready } = useEvent(eventId);

  if (!ready) {
    return <p className="text-sm text-muted">Chargement…</p>;
  }

  if (!event) {
    return (
      <div>
        <p className="text-sm text-muted">Cet événement n’existe pas sur cet appareil.</p>
        <Button href="/" className="mt-6">
          Retour
        </Button>
      </div>
    );
  }

  return <EventForm event={event} />;
}
