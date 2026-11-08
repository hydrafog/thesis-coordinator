import React from "react";
import { committeeRepository } from "@/features/defense/data/committee-repository";
import { prisma } from "@/core/db/prisma";
import { CommitteeControls } from "./committee-controls";
import { Person } from "@/core/ui/person";
import { StatusBadge } from "@/core/ui/status-badge";

export default async function CommitteesPage() {
  const [committees, users] = await Promise.all([
    committeeRepository.findAll(),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="workspace">
      <main className="workspace__main">
        <div className="split">
          <div>
            <h1 className="card__title">Defense Committees</h1>
            <p className="muted">
              Configure examination committees with presidents and committee
              members.
            </p>
          </div>
          <CommitteeControls users={users} />
        </div>

        {committees.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state__title">No committees configured</h3>
            <p className="empty-state__description">
              Create an evaluation committee with a president and members to
              begin scheduling defenses.
            </p>
          </div>
        ) : (
          <div className="committee-list">
            {committees.map((committee) => (
              <div key={committee.id} className="card committee-card">
                <div className="split">
                  <h3 className="card__title">{committee.name}</h3>
                  <StatusBadge
                    status="approved"
                    label={`${committee.members.length} members`}
                  />
                </div>
                <div className="committee-members-grid">
                  {committee.members.map((m) => (
                    <div key={m.id} className="committee-member-row">
                      <Person
                        name={m.user.name ?? m.user.email}
                        role={
                          m.role === "PRESIDENT"
                            ? "President"
                            : "Committee Member"
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
