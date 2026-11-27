import { prisma } from "@/core/db/prisma";
import type { FileAccessContext } from "../domain/file-access";

export async function findFileAccessContext(
  fileKey: string,
): Promise<FileAccessContext | null> {
  const version = await prisma.fileVersion.findUnique({
    where: { fileKey },
    select: {
      fileName: true,
      mimeType: true,
      submission: {
        select: {
          thesis: {
            select: {
              student: { select: { userId: true } },
              coordinator: { select: { userId: true } },
            },
          },
        },
      },
    },
  });
  if (version) {
    const thesis = version.submission.thesis;
    return {
      fileName: version.fileName,
      mimeType: version.mimeType,
      memberUserIds: [thesis.student.userId, thesis.coordinator?.userId].filter(
        (id): id is string => Boolean(id),
      ),
      staffAllowed: true,
    };
  }

  const report = await prisma.supervisorReport.findUnique({
    where: { fileKey },
    select: {
      fileName: true,
      mimeType: true,
      thesis: {
        select: {
          student: { select: { userId: true } },
          coordinator: { select: { userId: true } },
        },
      },
    },
  });
  if (report) {
    return {
      fileName: report.fileName,
      mimeType: report.mimeType,
      memberUserIds: [
        report.thesis.student.userId,
        report.thesis.coordinator?.userId,
      ].filter((id): id is string => Boolean(id)),
      staffAllowed: true,
    };
  }

  const attachment = await prisma.attachment.findUnique({
    where: { fileKey },
    select: {
      fileName: true,
      mimeType: true,
      message: {
        select: {
          conversation: {
            select: { participants: { select: { userId: true } } },
          },
        },
      },
    },
  });
  if (attachment) {
    return {
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      memberUserIds: attachment.message.conversation.participants.map(
        (participant) => participant.userId,
      ),
      staffAllowed: false,
    };
  }

  return null;
}
