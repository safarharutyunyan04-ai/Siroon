import { EventEdit } from "@/components/events/EventEdit";

export default async function EventEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EventEdit eventId={id} />;
}
