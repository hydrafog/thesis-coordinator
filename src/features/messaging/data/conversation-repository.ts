import { Prisma } from "@prisma/client";
import { prisma } from "@/core/db/prisma";
import { DomainError } from "@/core/errors/domain-error";

export interface ConversationContext {
  id: string;
  thesisTitle: string;
  studentUserId: string | null;
  participants: Array<{ id: string; name: string | null; email: string }>;
}

export class ConversationRepository {
  async ensureForThesis(thesisId: string): Promise<string> {
    const existing = await prisma.conversation.findUnique({
      where: { thesisId },
      select: { id: true },
    });
    if (existing) {
      return existing.id;
    }
    const thesis = await prisma.thesis.findUnique({
      where: { id: thesisId },
      select: {
        student: { select: { userId: true } },
        coordinator: { select: { userId: true } },
      },
    });
    if (!thesis) {
      throw new DomainError("not_found", "Thesis not found.");
    }
    if (!thesis.coordinator) {
      throw new DomainError(
        "conflict",
        "Conversations open after a supervisor approves the topic.",
      );
    }
    try {
      const created = await prisma.conversation.create({
        data: {
          thesisId,
          participants: {
            create: [
              { userId: thesis.student.userId },
              { userId: thesis.coordinator.userId },
            ],
          },
        },
        select: { id: true },
      });
      return created.id;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const raced = await prisma.conversation.findUniqueOrThrow({
          where: { thesisId },
          select: { id: true },
        });
        return raced.id;
      }
      throw error;
    }
  }

  async findThesisIdsForUser(userId: string): Promise<string[]> {
    const theses = await prisma.thesis.findMany({
      where: {
        coordinatorId: { not: null },
        OR: [{ student: { userId } }, { coordinator: { userId } }],
      },
      select: { id: true },
    });
    return theses.map((thesis) => thesis.id);
  }

  async listForUser(userId: string) {
    return prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        thesis: { select: { title: true } },
        participants: {
          select: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        messages: {
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 1,
          select: {
            content: true,
            createdAt: true,
            attachments: { select: { fileName: true }, take: 1 },
          },
        },
        _count: {
          select: {
            messages: { where: { senderId: { not: userId }, readAt: null } },
          },
        },
      },
    });
  }

  async findContext(
    conversationId: string,
  ): Promise<ConversationContext | null> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        thesis: {
          select: { title: true, student: { select: { userId: true } } },
        },
        participants: {
          select: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    if (!conversation) {
      return null;
    }
    return {
      id: conversation.id,
      thesisTitle: conversation.thesis?.title ?? "Thesis supervision",
      studentUserId: conversation.thesis?.student.userId ?? null,
      participants: conversation.participants.map((entry) => entry.user),
    };
  }
}

export const conversationRepository = new ConversationRepository();
