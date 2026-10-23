import { SeatingPlanEditor } from "@/components/seating/SeatingPlanEditor";

export default async function EventSeatingPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SeatingPlanEditor eventId={id} />;
}
