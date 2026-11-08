"use client";

import React, { useState } from "react";
import { Button } from "@/core/ui/button";
import { Dialog } from "@/core/ui/dialog";
import { createCommitteeAction } from "@/features/defense/actions";
import { CommitteeMemberRole } from "@prisma/client";

interface CommitteeControlsProps {
  users: Array<{ id: string; name: string | null; email: string }>;
}

export function CommitteeControls({ users }: CommitteeControlsProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [presidentId, setPresidentId] = useState("");
  const [member1Id, setMember1Id] = useState("");
  const [member2Id, setMember2Id] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !presidentId || !member1Id || !member2Id) {
      setError("Please specify committee name, president, and two members.");
      return;
    }

    if (new Set([presidentId, member1Id, member2Id]).size !== 3) {
      setError("President and members must be distinct individuals.");
      return;
    }

    setLoading(true);
    const members = [
      { userId: presidentId, role: CommitteeMemberRole.PRESIDENT },
      { userId: member1Id, role: CommitteeMemberRole.MEMBER },
      { userId: member2Id, role: CommitteeMemberRole.MEMBER },
    ];

    const res = await createCommitteeAction(name, members);
    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to create committee.");
    } else {
      setOpen(false);
      setName("");
      setPresidentId("");
      setMember1Id("");
      setMember2Id("");
    }
  };

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        + New Committee
      </Button>

      <Dialog
        id="new-committee-dialog"
        title="Create Defense Committee"
        open={open}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={handleSubmit} className="committee-form">
          {error && <div className="feedback feedback--error">{error}</div>}

          <div className="field">
            <label htmlFor="committee-name" className="field__label">
              Committee Name
            </label>
            <input
              id="committee-name"
              type="text"
              required
              placeholder="e.g. Committee A (Applied AI)"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="president-select" className="field__label">
              Committee President
            </label>
            <select
              id="president-select"
              required
              className="input"
              value={presidentId}
              onChange={(e) => setPresidentId(e.target.value)}
            >
              <option value="">Select president...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="member1-select" className="field__label">
              First Committee Member
            </label>
            <select
              id="member1-select"
              required
              className="input"
              value={member1Id}
              onChange={(e) => setMember1Id(e.target.value)}
            >
              <option value="">Select member...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="member2-select" className="field__label">
              Second Committee Member
            </label>
            <select
              id="member2-select"
              required
              className="input"
              value={member2Id}
              onChange={(e) => setMember2Id(e.target.value)}
            >
              <option value="">Select member...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
          </div>

          <div className="dialog__actions">
            <Button
              variant="outline"
              type="button"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Committee"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
