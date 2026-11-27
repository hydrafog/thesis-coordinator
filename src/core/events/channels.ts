export const EVENT_CHANNELS = {
  defense: (defenseSlotId: string) => `defense:${defenseSlotId}`,
  committee: (committeeId: string) => `committee:${committeeId}`,
  thesis: (thesisId: string) => `thesis:${thesisId}`,
  coordinator: (coordinatorId: string) => `coordinator:${coordinatorId}`,
  conversation: (conversationId: string) => `conversation:${conversationId}`,
} as const;

export const REALTIME_EVENTS = {
  PROPOSAL_DECIDED: "proposal.decided",
  CAPACITY_CHANGED: "capacity.changed",
  MESSAGE_CREATED: "message.created",
  MESSAGE_READ: "message.read",
  MESSAGE_TYPING: "message.typing",
  DEFENSE_SLOT_CHANGED: "defense.slot.changed",
  GRADEBOOK_UPDATED: "gradebook.updated",
  GRADEBOOK_CLOSED: "gradebook.closed",
} as const;

export type RealtimeEventName =
  (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

export type ChannelKind = keyof typeof EVENT_CHANNELS;

export interface ParsedChannel {
  kind: ChannelKind;
  id: string;
}

const CHANNEL_PATTERN =
  /^(defense|committee|thesis|coordinator|conversation):([A-Za-z0-9_-]{1,64})$/;

export function parseChannel(name: unknown): ParsedChannel | null {
  if (typeof name !== "string") {
    return null;
  }
  const match = CHANNEL_PATTERN.exec(name);
  if (!match) {
    return null;
  }
  return { kind: match[1] as ChannelKind, id: match[2] };
}

export function isRealtimeEvent(name: unknown): name is RealtimeEventName {
  return (
    typeof name === "string" &&
    (Object.values(REALTIME_EVENTS) as string[]).includes(name)
  );
}
