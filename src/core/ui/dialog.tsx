"use client";

import React, { useEffect, useRef } from "react";
import { Icon } from "./icon";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  id?: string;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
  id,
  className = "",
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    const handleClick = (e: MouseEvent) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;

      if (!isInDialog) {
        onClose();
      }
    };

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("click", handleClick);

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("click", handleClick);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      id={id}
      className={`dialog ${className}`.trim()}
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <div className="dialog__form">
        <div className="dialog__head">
          <h2 id={id ? `${id}-title` : undefined} className="dialog__title">
            {title}
          </h2>
          <button
            type="button"
            className="btn btn--ghost btn--icon btn--sm"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="close-line" small />
          </button>
        </div>
        <div className="dialog__fields">{children}</div>
        {actions && <div className="dialog__actions">{actions}</div>}
      </div>
    </dialog>
  );
}

export function DialogActions({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`dialog__actions ${className}`.trim()}>{children}</div>
  );
}
