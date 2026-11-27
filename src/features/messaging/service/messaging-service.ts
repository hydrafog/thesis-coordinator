import { z } from "zod";
import type { SessionUser } from "@/core/auth/session";
import { getAppUrl, getMaxUploadBytes } from "@/core/config/app-config";
import { DomainError } from "@/core/errors/domain-error";
import { EVENT_CHANNELS, REALTIME_EVENTS } from "@/core/events/channels";
import { publishEvent } from "@/core/events/bus";
import { errorContext, logger } from "@/core/logging/logger";
import { sendMail } from "@/core/mail/transport";
import { unreadMessageAlert } from "@/core/mail/templates";
import { createDownloadUrl } from "@/core/storage/signed-url";
import { idSchema, parseInput } from "@/lib/validation/schemas";
import {
  discardFile,
  storeFile,
} from "@/features/submissions/data/storage-client";
import {
  validateUpload,
  type StoredFileDescriptor,
} from "@/features/submissions/domain/attachment";
import {
  conversationRepository,
  type ConversationContext,
} from "../data/conversation-repository";
import { messageRepository } from "../data/message-repository";
import {
  assertParticipant,
  previewOf,
  recipientOf,
  type ConversationSummary,
} from "../domain/conversation";
import { validateMessage, type MessageView } from "../domain/message";

type StoredMessage = Awaited<ReturnType<typeof messageRepository.create>>;

const sendSchema = z.object({ conversationId: idSchema });

function toMessageView(message: StoredMessage, viewerId: string): MessageView {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    readAt: message.readAt?.toISOString() ?? null,
    attachments: message.attachments.map((attachment) => ({
      id: attachment.id,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      downloadUrl: createDownloadUrl(attachment.fileKey, viewerId),
    })),
  };
}

async function requireParticipantIds(
  conversationId: string,
  user: SessionUser,
): Promise<string[]> {
  const participantIds = await messageRepository.participantIds(conversationId);
  if (!participantIds) {
    throw new DomainError("not_found", "Conversation not found.");
  }
  assertParticipant(participantIds, user.id);
  return participantIds;
}

async function alertOfflineRecipient(
  context: ConversationContext | null,
  messageId: string,
  conversationId: string,
  senderId: string,
  recipientId: string,
): Promise<void> {
  try {
    if (
      !context ||
      (await messageRepository.hasPendingAlert(conversationId, senderId))
    ) {
      return;
    }
    const recipient = context.participants.find(
      (person) => person.id === recipientId,
    );
    const sender = context.participants.find(
      (person) => person.id === senderId,
    );
    if (!recipient || !sender) {
      return;
    }
    const path =
      recipientId === context.studentUserId
        ? "/messages"
        : "/coordinator/messages";
    const mail = unreadMessageAlert({
      recipientName: recipient.name ?? recipient.email,
      senderName: sender.name ?? sender.email,
      thesisTitle: context.thesisTitle,
      link: `${getAppUrl()}${path}?c=${conversationId}`,
    });
    if (await sendMail({ to: recipient.email, ...mail })) {
      await messageRepository.markAlerted(messageId);
    }
  } catch (error) {
    logger.warn("unread message alert failed", errorContext(error));
  }
}

export interface SendMessageInput {
  actor: SessionUser;
  conversationId: string;
  content: string;
  file: File | null;
}

export async function sendMessage(
  input: SendMessageInput,
): Promise<MessageView> {
  const { conversationId } = parseInput(sendSchema, input);
  const participantIds = await requireParticipantIds(
    conversationId,
    input.actor,
  );
  const content = validateMessage(input.content, input.file !== null);

  let stored: StoredFileDescriptor | null = null;
  if (input.file) {
    const format = validateUpload(
      {
        fileName: input.file.name,
        size: input.file.size,
        mimeType: input.file.type,
      },
      { maxBytes: getMaxUploadBytes() },
    );
    stored = await storeFile({
      prefix: `messages/${conversationId}`,
      fileName: input.file.name,
      format,
      bytes: Buffer.from(await input.file.arrayBuffer()),
    });
  }

  let message: StoredMessage;
  try {
    message = await messageRepository.create({
      conversationId,
      senderId: input.actor.id,
      content,
      attachment: stored,
    });
  } catch (error) {
    if (stored) {
      await discardFile(stored.fileKey);
    }
    throw error;
  }

  const { recipients } = await publishEvent({
    channel: EVENT_CHANNELS.conversation(conversationId),
    event: REALTIME_EVENTS.MESSAGE_CREATED,
    payload: {
      messageId: message.id,
      conversationId,
      senderId: input.actor.id,
    },
    excludeUserId: input.actor.id,
  });

  const recipientId = recipientOf(participantIds, input.actor.id);
  if (recipients === 0 && recipientId) {
    await alertOfflineRecipient(
      await conversationRepository.findContext(conversationId),
      message.id,
      conversationId,
      input.actor.id,
      recipientId,
    );
  }

  return toMessageView(message, input.actor.id);
}

export async function loadMessages(
  actor: SessionUser,
  conversationId: string,
): Promise<MessageView[]> {
  await requireParticipantIds(conversationId, actor);
  const messages = await messageRepository.listRecent(conversationId);
  return messages.map((message) => toMessageView(message, actor.id));
}

export async function markConversationRead(
  actor: SessionUser,
  conversationId: string,
): Promise<void> {
  await requireParticipantIds(conversationId, actor);
  const { messageIds, readAt } = await messageRepository.markRead(
    conversationId,
    actor.id,
  );
  if (messageIds.length === 0) {
    return;
  }
  await publishEvent({
    channel: EVENT_CHANNELS.conversation(conversationId),
    event: REALTIME_EVENTS.MESSAGE_READ,
    payload: {
      conversationId,
      readerId: actor.id,
      messageIds,
      readAt: readAt.toISOString(),
    },
  });
}

export async function loadInbox(
  actor: SessionUser,
): Promise<ConversationSummary[]> {
  const thesisIds = await conversationRepository.findThesisIdsForUser(actor.id);
  for (const thesisId of thesisIds) {
    await conversationRepository.ensureForThesis(thesisId);
  }
  const conversations = await conversationRepository.listForUser(actor.id);
  return conversations.map((conversation) => {
    const counterpart = conversation.participants.find(
      (entry) => entry.user.id !== actor.id,
    )?.user;
    const last = conversation.messages[0];
    return {
      id: conversation.id,
      thesisTitle: conversation.thesis?.title ?? "Thesis supervision",
      counterpartName: counterpart?.name ?? counterpart?.email ?? "Participant",
      lastMessagePreview: last
        ? previewOf({
            content: last.content,
            attachmentName: last.attachments[0]?.fileName ?? null,
          })
        : null,
      lastMessageAt: last?.createdAt.toISOString() ?? null,
      unreadCount: conversation._count.messages,
    };
  });
}
