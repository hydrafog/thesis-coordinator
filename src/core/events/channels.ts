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
  DEFENSE_SLOT_CHANGED: "defense.slot.changed",
  GRADEBOOK_UPDATED: "gradebook.updated",
  GRADEBOOK_CLOSED: "gradebook.closed",
} as const;

export type RealtimeEventName =
  (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];
