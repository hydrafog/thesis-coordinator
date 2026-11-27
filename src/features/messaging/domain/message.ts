import { DomainError } from "@/core/errors/domain-error";

export const MAX_MESSAGE_LENGTH = 2000;

export interface AttachmentView {
  id: string;
  fileName: string;
  fileSize: number;
  downloadUrl: string;
}

export interface MessageView {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  attachments: AttachmentView[];
}

export type DeliveryState = "sent" | "read";

export function deliveryStateOf(message: {
  readAt: string | null;
}): DeliveryState {
  return message.readAt ? "read" : "sent";
}

export function validateMessage(raw: string, hasAttachment: boolean): string {
  const content = raw.trim();
  if (content === "" && !hasAttachment) {
    throw new DomainError(
      "validation_failed",
      "Write a message or attach a file.",
    );
  }
  if (content.length > MAX_MESSAGE_LENGTH) {
    throw new DomainError(
      "validation_failed",
      `Messages are limited to ${MAX_MESSAGE_LENGTH} characters.`,
    );
  }
  return content;
}

export function mergeMessages(
  current: MessageView[],
  incoming: MessageView[],
): MessageView[] {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) {
    byId.set(message.id, message);
  }
  return [...byId.values()].sort(
    (a, b) =>
      a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
}

export function markMessagesRead(
  messages: MessageView[],
  messageIds: string[],
  readAt: string,
): MessageView[] {
  const ids = new Set(messageIds);
  return messages.map((message) =>
    ids.has(message.id) && !message.readAt ? { ...message, readAt } : message,
  );
}
