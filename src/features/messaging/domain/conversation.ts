import { DomainError } from "@/core/errors/domain-error";

export interface ConversationSummary {
  id: string;
  thesisTitle: string;
  counterpartName: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export function assertParticipant(
  participantIds: string[],
  userId: string,
): void {
  if (!participantIds.includes(userId)) {
    throw new DomainError(
      "forbidden",
      "You are not a participant in this conversation.",
    );
  }
}

export function recipientOf(
  participantIds: string[],
  senderId: string,
): string | null {
  return participantIds.find((id) => id !== senderId) ?? null;
}

export function previewOf(message: {
  content: string;
  attachmentName: string | null;
}): string {
  if (message.content !== "") {
    return message.content.slice(0, 80);
  }
  return message.attachmentName ? `Attachment: ${message.attachmentName}` : "";
}
