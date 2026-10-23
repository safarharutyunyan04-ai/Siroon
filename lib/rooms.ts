import type { Locale, RoomId } from "@/types/domain";
import type { MessageKey } from "@/lib/i18n/messages";
import { t } from "@/lib/i18n/messages";

export const rooms: {
  id: RoomId;
  nameKey: MessageKey;
  capacity: number;
}[] = [
  { id: "hall-1", nameKey: "roomGrande", capacity: 380 },
  { id: "hall-2", nameKey: "roomMoyenne", capacity: 126 },
  { id: "hall-3", nameKey: "roomPetite", capacity: 72 },
];

/** Contraste rose : Grande (foncé) → Moyenne → Petite (clair) */
export const roomTone: Record<
  RoomId,
  {
    wash: string;
    border: string;
    selected: string;
    title: string;
    dot: string;
  }
> = {
  "hall-1": {
    wash: "from-[#c45c6a] to-[#a34454]",
    border: "border-[#a34454]/50",
    selected: "ring-[#c45c6a] ring-2 ring-offset-2 ring-offset-[var(--background)]",
    title: "text-white",
    dot: "bg-[#a34454]",
  },
  "hall-2": {
    wash: "from-[#e8a0aa] to-[#d47886]",
    border: "border-[#c45c6a]/40",
    selected: "ring-[#d47886] ring-2 ring-offset-2 ring-offset-[var(--background)]",
    title: "text-[#3a1a20]",
    dot: "bg-[#d47886]",
  },
  "hall-3": {
    wash: "from-[#f8ecef] to-[#f0d4da]",
    border: "border-[#c45c6a]/25",
    selected: "ring-[#e8a0aa] ring-2 ring-offset-2 ring-offset-[var(--background)]",
    title: "text-[#a34454]",
    dot: "bg-[#e8a0aa]",
  },
};

export function getRoom(id: RoomId) {
  return rooms.find((room) => room.id === id);
}

export function roomName(id: RoomId, locale: Locale) {
  const room = getRoom(id);
  return room ? t(locale, room.nameKey) : id;
}
