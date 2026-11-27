import React from "react";
import { createHash } from "crypto";
import { DefenseMinutesDomain } from "@/features/grading/domain/minutes";

export interface DefenseMinutesProps {
  data: DefenseMinutesDomain;
}

export const DefenseMinutesDocument: React.FC<DefenseMinutesProps> = ({
  data,
}) => {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "40px",
        maxWidth: "800px",
        margin: "0 auto",
        color: "#111827",
        lineHeight: 1.5,
      }}
    >
      <header
        style={{
          borderBottom: "2px solid #e5e7eb",
          paddingBottom: "16px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              margin: "0 0 4px 0",
            }}
          >
            FACULTY OF COMPUTER SCIENCE
          </h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
            Bachelor Thesis Examination Board
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span
            style={{
              display: "inline-block",
              padding: "4px 8px",
              background: "#ecfdf5",
              color: "#065f46",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            OFFICIAL MINUTES
          </span>
        </div>
      </header>

      <section style={{ marginBottom: "24px" }}>
        <h2
          style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}
        >
          Candidate Details
        </h2>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
          }}
        >
          <tbody>
            <tr>
              <td
                style={{ padding: "6px 0", color: "#6b7280", width: "180px" }}
              >
                Candidate Name:
              </td>
              <td style={{ padding: "6px 0", fontWeight: "600" }}>
                {data.studentName}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0", color: "#6b7280" }}>
                Study Group:
              </td>
              <td style={{ padding: "6px 0" }}>{data.studyGroup}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0", color: "#6b7280" }}>
                Thesis Title:
              </td>
              <td style={{ padding: "6px 0", fontStyle: "italic" }}>
                {data.thesisTitle}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0", color: "#6b7280" }}>
                Supervisor:
              </td>
              <td style={{ padding: "6px 0" }}>{data.coordinatorName}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0", color: "#6b7280" }}>
                Defense Committee:
              </td>
              <td style={{ padding: "6px 0" }}>{data.committeeName}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0", color: "#6b7280" }}>
                Date & Location:
              </td>
              <td style={{ padding: "6px 0" }}>
                {data.defenseDate.toLocaleDateString()} • Room {data.room}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2
          style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}
        >
          Evaluation Scores
        </h2>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
            border: "1px solid #e5e7eb",
          }}
        >
          <thead>
            <tr style={{ background: "#f9fafb", textAlign: "left" }}>
              <th
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Committee Member
              </th>
              <th
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Role
              </th>
              <th
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Criterion
              </th>
              <th
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid #e5e7eb",
                  textAlign: "right",
                }}
              >
                Score (1–10)
              </th>
            </tr>
          </thead>
          <tbody>
            {data.scores.map((score, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "8px 12px", fontWeight: "500" }}>
                  {score.memberName}
                </td>
                <td style={{ padding: "8px 12px", color: "#6b7280" }}>
                  {score.role}
                </td>
                <td style={{ padding: "8px 12px", color: "#6b7280" }}>
                  {score.criterion}
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "right",
                    fontWeight: "600",
                  }}
                >
                  {score.score.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "#f9fafb", fontWeight: "bold" }}>
              <td colSpan={3} style={{ padding: "12px", textAlign: "right" }}>
                Final Computed Grade:
              </td>
              <td
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontSize: "16px",
                  color: "#065f46",
                }}
              >
                {data.finalAverage.toFixed(2)} / 10.00
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section style={{ marginTop: "48px" }}>
        <h2
          style={{ fontSize: "14px", fontWeight: "600", marginBottom: "32px" }}
        >
          Signatures
        </h2>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "24px",
          }}
        >
          <div
            style={{
              flex: 1,
              borderTop: "1px solid #9ca3af",
              paddingTop: "8px",
            }}
          >
            <p style={{ margin: 0, fontSize: "12px", fontWeight: 600 }}>
              Committee President
            </p>
            <p style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>
              {data.scores.find((s) => s.role === "PRESIDENT")?.memberName ??
                "President"}
            </p>
          </div>
          <div
            style={{
              flex: 1,
              borderTop: "1px solid #9ca3af",
              paddingTop: "8px",
            }}
          >
            <p style={{ margin: 0, fontSize: "12px", fontWeight: 600 }}>
              Committee Member
            </p>
            <p style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>
              {data.scores.filter((s) => s.role === "MEMBER")[0]?.memberName ??
                "Member"}
            </p>
          </div>
          <div
            style={{
              flex: 1,
              borderTop: "1px solid #9ca3af",
              paddingTop: "8px",
            }}
          >
            <p style={{ margin: 0, fontSize: "12px", fontWeight: 600 }}>
              Committee Member
            </p>
            <p style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>
              {data.scores.filter((s) => s.role === "MEMBER")[1]?.memberName ??
                "Member"}
            </p>
          </div>
        </div>
      </section>

      <footer
        style={{
          marginTop: "48px",
          paddingTop: "16px",
          borderTop: "1px solid #e5e7eb",
          fontSize: "11px",
          color: "#9ca3af",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Checksum: {data.checksum}</span>
        <span>Generated: {data.createdAt.toISOString()}</span>
      </footer>
    </div>
  );
};

export async function generateDefenseMinutesDocument(
  data: Omit<
    DefenseMinutesDomain,
    "id" | "pdfKey" | "checksum" | "createdAt" | "status"
  >,
): Promise<{
  buffer: Buffer;
  checksum: string;
  pdfKey: string;
}> {
  const content = [
    "ACADEMIC DEFENSE MINUTES",
    `Candidate: ${data.studentName}`,
    `Study Group: ${data.studyGroup}`,
    `Thesis Title: ${data.thesisTitle}`,
    `Coordinator: ${data.coordinatorName}`,
    `Committee: ${data.committeeName}`,
    `Date: ${data.defenseDate.toISOString()}`,
    `Room: ${data.room}`,
    "",
    "SCORES:",
    ...data.scores.map(
      (s) =>
        `- ${s.memberName} (${s.role}): ${s.score.toFixed(2)} [${s.criterion}]`,
    ),
    "",
    `FINAL AVERAGE: ${data.finalAverage.toFixed(2)} / 10.00`,
    `STATUS: FINALIZED`,
  ].join("\n");

  const buffer = Buffer.from(content, "utf-8");
  const checksum = createHash("sha256").update(buffer).digest("hex");
  const studentSlug = data.studentName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  const pdfKey = `minutes/defense-minutes-${studentSlug}-${checksum.slice(0, 8)}.pdf`;

  return {
    buffer,
    checksum,
    pdfKey,
  };
}
