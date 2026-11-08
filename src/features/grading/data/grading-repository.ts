import { prisma } from "@/core/db/prisma";
import { GradingState } from "@prisma/client";

export class GradingRepository {
  async findSessionBySlotId(defenseSlotId: string) {
    return prisma.gradingSession.findUnique({
      where: { defenseSlotId },
      include: {
        grades: true,
        minutes: true,
        defenseSlot: {
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
              },
            },
          },
        },
      },
    });
  }

  async findSessionById(id: string) {
    return prisma.gradingSession.findUnique({
      where: { id },
      include: {
        grades: true,
        minutes: true,
        defenseSlot: {
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
              },
            },
          },
        },
      },
    });
  }

  async createOrGetSession(defenseSlotId: string) {
    const existing = await this.findSessionBySlotId(defenseSlotId);
    if (existing) {
      return existing;
    }

    return prisma.gradingSession.create({
      data: {
        defenseSlotId,
        state: GradingState.OPEN,
      },
      include: {
        grades: true,
        minutes: true,
        defenseSlot: {
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
              },
            },
          },
        },
      },
    });
  }

  async upsertGrade(params: {
    gradingSessionId: string;
    memberId: string;
    value: number;
    criterion?: string;
    weight?: number;
    comments?: string | null;
  }) {
    const criterion = params.criterion ?? "general";
    const weight = params.weight ?? 1.0;

    return prisma.grade.upsert({
      where: {
        gradingSessionId_memberId_criterion: {
          gradingSessionId: params.gradingSessionId,
          memberId: params.memberId,
          criterion,
        },
      },
      update: {
        value: params.value,
        weight,
        comments: params.comments,
      },
      create: {
        gradingSessionId: params.gradingSessionId,
        memberId: params.memberId,
        criterion,
        value: params.value,
        weight,
        comments: params.comments,
      },
    });
  }

  async closeSession(id: string, finalAverage: number) {
    return prisma.gradingSession.update({
      where: { id },
      data: {
        state: GradingState.CLOSED,
        finalAverage,
        closedAt: new Date(),
      },
      include: {
        grades: true,
        minutes: true,
      },
    });
  }
}

export const gradingRepository = new GradingRepository();
