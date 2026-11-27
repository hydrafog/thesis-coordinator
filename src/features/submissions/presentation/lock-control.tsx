"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/core/ui/button";
import { lockSubmissionAction } from "../actions";

export interface LockControlProps {
  submissionId: string;
}

export function LockControl({ submissionId }: LockControlProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleLock() {
    if (
      !confirm(
        "Lock this version as the final submission? The student can no longer replace it.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    const result = await lockSubmissionAction(submissionId);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {error && (
        <p className="muted-block" role="alert">
          {error}
        </p>
      )}
      <Button size="sm" disabled={busy} onClick={handleLock}>
        Lock as final
      </Button>
    </div>
  );
}
