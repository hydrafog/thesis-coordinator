import { UserRole } from "@prisma/client";
import { prisma } from "../db/prisma";
import type { ParsedChannel } from "./channels";

export interface RealtimeUser {
  id: string;
  roles: UserRole[];
}

function isStaff(user: RealtimeUser): boolean {
  return (
    user.roles.includes(UserRole.ADMINISTRATOR) ||
    user.roles.includes(UserRole.SECRETARY)
  );
}

const THESIS_MEMBER = (userId: string) => ({
  OR: [{ student: { userId } }, { coordinator: { userId } }],
});

export async function canSubscribe(
  user: RealtimeUser,
  channel: ParsedChannel,
): Promise<boolean> {
  switch (channel.kind) {
    case "conversation": {
      const participant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId: channel.id,
            userId: user.id,
          },
        },
        select: { id: true },
      });
      return participant !== null;
    }
    case "thesis": {
      if (isStaff(user)) {
        return true;
      }
      const thesis = await prisma.thesis.findFirst({
        where: { id: channel.id, ...THESIS_MEMBER(user.id) },
        select: { id: true },
      });
      return thesis !== null;
    }
    case "coordinator": {
      if (isStaff(user) || user.roles.includes(UserRole.STUDENT)) {
        return true;
      }
      const profile = await prisma.coordinatorProfile.findFirst({
        where: { id: channel.id, userId: user.id },
        select: { id: true },
      });
      return profile !== null;
    }
    case "committee": {
      if (isStaff(user)) {
        return true;
      }
      const member = await prisma.committeeMember.findFirst({
        where: { committeeId: channel.id, userId: user.id },
        select: { id: true },
      });
      return member !== null;
    }
    case "defense": {
      if (isStaff(user)) {
        return true;
      }
      const slot = await prisma.defenseSlot.findFirst({
        where: {
          id: channel.id,
          OR: [
            { committee: { members: { some: { userId: user.id } } } },
            { thesis: THESIS_MEMBER(user.id) },
          ],
        },
        select: { id: true },
      });
      return slot !== null;
    }
  }
}
