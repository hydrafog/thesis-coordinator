import { prisma } from "@/core/db/prisma";
import { DossierState, DossierItemType, ItemStatus } from "@prisma/client";

export class DossierRepository {
  async findAll(status?: DossierState) {
    return prisma.defenseFile.findMany({
      where: status ? { state: status } : undefined,
      include: {
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
        items: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findByThesisId(thesisId: string) {
    return prisma.defenseFile.findUnique({
      where: { thesisId },
      include: {
        items: true,
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
    });
  }

  async findById(id: string) {
    return prisma.defenseFile.findUnique({
      where: { id },
      include: {
        items: true,
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
    });
  }

  async createOrGet(thesisId: string) {
    const existing = await this.findByThesisId(thesisId);
    if (existing) {
      return existing;
    }

    return prisma.defenseFile.create({
      data: {
        thesisId,
        state: DossierState.DRAFT,
        items: {
          create: [
            {
              type: DossierItemType.FINAL_THESIS,
              name: "Final thesis document",
              status: ItemStatus.PENDING,
            },
            {
              type: DossierItemType.COORDINATOR_REPORT,
              name: "Supervisor evaluation report",
              status: ItemStatus.PENDING,
            },
            {
              type: DossierItemType.SIMILARITY_REPORT,
              name: "Plagiarism similarity report",
              status: ItemStatus.PENDING,
            },
            {
              type: DossierItemType.APPROVAL_RECORD,
              name: "Topic approval & assignment record",
              status: ItemStatus.PENDING,
            },
          ],
        },
      },
      include: {
        items: true,
        thesis: true,
      },
    });
  }

  async updateState(
    id: string,
    state: DossierState,
    feedback?: string | null,
    verifiedAt?: Date | null,
  ) {
    return prisma.defenseFile.update({
      where: { id },
      data: {
        state,
        feedback,
        verifiedAt,
      },
      include: {
        items: true,
      },
    });
  }

  async updateItemStatus(
    defenseFileId: string,
    type: DossierItemType,
    status: ItemStatus,
    fileKey?: string | null,
  ) {
    return prisma.defenseFileItem.upsert({
      where: {
        defenseFileId_type: {
          defenseFileId,
          type,
        },
      },
      update: {
        status,
        fileKey: fileKey !== undefined ? fileKey : undefined,
      },
      create: {
        defenseFileId,
        type,
        name: type.replace(/_/g, " ").toLowerCase(),
        status,
        fileKey,
      },
    });
  }
}

export const dossierRepository = new DossierRepository();
