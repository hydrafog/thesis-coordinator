import { MinutesStatus } from "@prisma/client";

export { MinutesStatus };

export interface CommitteeMemberScore {
  memberName: string;
  role: "PRESIDENT" | "MEMBER";
  criterion: string;
  score: number;
  weight: number;
}

export interface DefenseMinutesDomain {
  id: string;
  gradingSessionId: string;
  studentName: string;
  studyGroup: string;
  thesisTitle: string;
  coordinatorName: string;
  committeeName: string;
  defenseDate: Date;
  room: string;
  scores: CommitteeMemberScore[];
  finalAverage: number;
  status: MinutesStatus;
  pdfKey: string;
  checksum: string;
  createdAt: Date;
}
