import { prisma } from "@/core/db/prisma";
import { SlotStatus } from "@prisma/client";

export class SlotRepository {
  async findAll() {
    return prisma.defenseSlot.findMany({
      include: {
        committee: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
        thesis: {
          include: {
            student: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
            coordinator: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
            defenseFile: true,
          },
        },
        gradingSession: true,
      },
      orderBy: [{ date: "asc" }, { order: "asc" }, { startTime: "asc" }],
    });
  }

  async findById(id: string) {
    return prisma.defenseSlot.findUnique({
      where: { id },
      include: {
        committee: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
        thesis: {
          include: {
            student: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
            coordinator: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
            defenseFile: true,
          },
        },
        gradingSession: true,
      },
    });
  }

  async findByThesisId(thesisId: string) {
    return prisma.defenseSlot.findUnique({
      where: { thesisId },
      include: {
        committee: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
        gradingSession: true,
      },
    });
  }

  async findByDate(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return prisma.defenseSlot.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        committee: {
          include: {
            members: true,
          },
        },
      },
    });
  }

  async create(data: {
    thesisId?: string;
    committeeId?: string;
    date: Date;
    startTime: string;
    endTime: string;
    room: string;
    status?: SlotStatus;
    order?: number;
  }) {
    return prisma.defenseSlot.create({
      data: {
        thesisId: data.thesisId,
        committeeId: data.committeeId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMinutes: 20,
        room: data.room,
        status: data.status ?? SlotStatus.DRAFT,
        order: data.order ?? 0,
      },
    });
  }

  async update(
    id: string,
    data: {
      thesisId?: string | null;
      committeeId?: string | null;
      date?: Date;
      startTime?: string;
      endTime?: string;
      room?: string;
      status?: SlotStatus;
      order?: number;
    },
  ) {
    return prisma.defenseSlot.update({
      where: { id },
      data,
    });
  }

  async reorder(orderedIds: string[]) {
    return prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.defenseSlot.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );
  }

  async delete(id: string) {
    return prisma.defenseSlot.delete({
      where: { id },
    });
  }
}

export const slotRepository = new SlotRepository();
