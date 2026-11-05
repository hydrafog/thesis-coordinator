export function openDialog(id, focusId) {
  const dialog = globalThis.document.getElementById(id);
  if (dialog && !dialog.open) {
    dialog.classList.remove("dialog--leaving");
    dialog.showModal();
    globalThis.document.getElementById(focusId)?.focus();
  }
}

export function closeDialog(dialog) {
  if (!dialog || !dialog.open) {
    return;
  }
  if (globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    dialog.close();
    return;
  }
  dialog.classList.add("dialog--leaving");
  const onEnd = () => {
    dialog.removeEventListener("animationend", onEnd);
    dialog.classList.remove("dialog--leaving");
    dialog.close();
  };
  dialog.addEventListener("animationend", onEnd, { once: true });
}

export function closeDialogs() {
  for (const dialog of globalThis.document.querySelectorAll("dialog[open]")) {
    dialog.classList.remove("dialog--leaving");
    dialog.close();
  }
}

export function isDialogOpen() {
  return Boolean(globalThis.document.querySelector("dialog[open]"));
}
