import { prisma } from "@/core/db/prisma";
import { CommitteeMemberRole } from "@prisma/client";

export class CommitteeRepository {
  async findAll() {
    return prisma.committee.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.committee.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async create(
    name: string,
    members: Array<{ userId: string; role: CommitteeMemberRole }>,
  ) {
    return prisma.committee.create({
      data: {
        name,
        members: {
          create: members.map((m) => ({
            userId: m.userId,
            role: m.role,
          })),
        },
      },
      include: {
        members: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.committee.delete({
      where: { id },
    });
  }
}

export const committeeRepository = new CommitteeRepository();
