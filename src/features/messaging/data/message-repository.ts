import { prisma } from "@/core/db/prisma";
import { runInTransaction } from "@/core/db/transaction";
import type { StoredFileDescriptor } from "@/features/submissions/domain/attachment";

const MESSAGE_INCLUDE = {
  attachments: { orderBy: { createdAt: "asc" } },
} as const;

const PAGE_SIZE = 200;

export interface CreateMessageInput {
  conversationId: string;
  senderId: string;
  content: string;
  attachment: StoredFileDescriptor | null;
}

export class MessageRepository {
  async create(input: CreateMessageInput) {
    return runInTransaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId: input.conversationId,
          senderId: input.senderId,
          content: input.content,
          attachments: input.attachment
            ? {
                create: {
                  fileKey: input.attachment.fileKey,
                  fileName: input.attachment.fileName,
                  fileSize: input.attachment.fileSize,
                  mimeType: input.attachment.mimeType,
                  checksum: input.attachment.checksum,
                },
              }
            : undefined,
        },
        include: MESSAGE_INCLUDE,
      });
      await tx.conversation.update({
        where: { id: input.conversationId },
        data: { updatedAt: new Date() },
      });
      return message;
    });
  }

  async listRecent(conversationId: string) {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE,
      include: MESSAGE_INCLUDE,
    });
    return messages.reverse();
  }

  async participantIds(conversationId: string): Promise<string[] | null> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { participants: { select: { userId: true } } },
    });
    return conversation
      ? conversation.participants.map((entry) => entry.userId)
      : null;
  }

  async markRead(
    conversationId: string,
    readerId: string,
  ): Promise<{ messageIds: string[]; readAt: Date }> {
    return runInTransaction(async (tx) => {
      const readAt = new Date();
      const unread = await tx.message.findMany({
        where: { conversationId, senderId: { not: readerId }, readAt: null },
        select: { id: true },
      });
      const messageIds = unread.map((message) => message.id);
      if (messageIds.length > 0) {
        await tx.message.updateMany({
          where: { id: { in: messageIds }, readAt: null },
          data: { readAt },
        });
      }
      return { messageIds, readAt };
    });
  }

  async hasPendingAlert(
    conversationId: string,
    senderId: string,
  ): Promise<boolean> {
    const count = await prisma.message.count({
      where: {
        conversationId,
        senderId,
        readAt: null,
        emailAlertedAt: { not: null },
      },
    });
    return count > 0;
  }

  async markAlerted(messageId: string): Promise<void> {
    await prisma.message.update({
      where: { id: messageId },
      data: { emailAlertedAt: new Date() },
    });
  }
}

export const messageRepository = new MessageRepository();
