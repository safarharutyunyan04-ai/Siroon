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

export function getRoom(id: RoomId) {
  return rooms.find((room) => room.id === id);
}

export function roomName(id: RoomId, locale: Locale) {
  const room = getRoom(id);
  return room ? t(locale, room.nameKey) : id;
}
