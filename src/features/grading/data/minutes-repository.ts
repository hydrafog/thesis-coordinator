import { prisma } from "@/core/db/prisma";
import { MinutesStatus } from "@prisma/client";

export class MinutesRepository {
  async saveMinutes(params: {
    gradingSessionId: string;
    pdfKey: string;
    checksum: string;
    status?: MinutesStatus;
  }) {
    return prisma.defenseMinutes.upsert({
      where: { gradingSessionId: params.gradingSessionId },
      update: {
        pdfKey: params.pdfKey,
        checksum: params.checksum,
        status: params.status ?? MinutesStatus.FINALIZED,
      },
      create: {
        gradingSessionId: params.gradingSessionId,
        pdfKey: params.pdfKey,
        checksum: params.checksum,
        status: params.status ?? MinutesStatus.FINALIZED,
      },
    });
  }

  async findBySessionId(gradingSessionId: string) {
    return prisma.defenseMinutes.findUnique({
      where: { gradingSessionId },
    });
  }
}

export const minutesRepository = new MinutesRepository();
