"use client";

import React, { useRef } from "react";
import { Button } from "@/core/ui/button";
import { Icon } from "@/core/ui/icon";

export interface AttachmentPickerProps {
  id: string;
  file: File | null;
  maxBytes: number;
  disabled?: boolean;
  onChange: (file: File | null) => void;
  onError: (message: string) => void;
}

export function AttachmentPicker({
  id,
  file,
  maxBytes,
  disabled = false,
  onChange,
  onError,
}: AttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function clear() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onChange(null);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    if (selected && selected.size > maxBytes) {
      clear();
      onError(
        `Files larger than ${Math.floor(maxBytes / 1_048_576)} MB are not accepted.`,
      );
      return;
    }
    onChange(selected);
  }

  return (
    <>
      <label className="btn btn--sm" htmlFor={id}>
        <Icon name="add-line" small />
        <span>Attach</span>
      </label>
      <input
        ref={inputRef}
        className="sr-only"
        id={id}
        type="file"
        accept=".pdf,.zip,application/pdf,application/zip"
        disabled={disabled}
        onChange={handleChange}
      />
      {file && (
        <span className="bubble__file">
          <Icon name="document-2-line" small />
          <span>{file.name}</span>
          <Button size="sm" variant="ghost" onClick={clear}>
            Remove
          </Button>
        </span>
      )}
    </>
  );
}
