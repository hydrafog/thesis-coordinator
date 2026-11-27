"use client";

import React, { useState } from "react";
import { Button } from "@/core/ui/button";
import { SlotEditor } from "@/features/defense/presentation/slot-editor";

interface SlotScheduleControlsProps {
  committees: Array<{ id: string; name: string }>;
  verifiedTheses: Array<{ id: string; title: string; studentName: string }>;
}

export function SlotScheduleControls({
  committees,
  verifiedTheses,
}: SlotScheduleControlsProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        + Add 20-min Slot
      </Button>
      <SlotEditor
        isOpen={open}
        onClose={() => setOpen(false)}
        committees={committees}
        verifiedTheses={verifiedTheses}
      />
    </>
  );
}
