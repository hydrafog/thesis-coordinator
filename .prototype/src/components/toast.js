let timer = 0;
let hideTimer = 0;

export function showToast(message) {
  const element = globalThis.document.getElementById("toast");
  if (!element) {
    return;
  }
  globalThis.clearTimeout(timer);
  globalThis.clearTimeout(hideTimer);
  element.textContent = message;
  element.classList.remove("toast--leaving");
  element.hidden = false;

  timer = globalThis.setTimeout(() => {
    element.classList.add("toast--leaving");
    hideTimer = globalThis.setTimeout(() => {
      element.hidden = true;
      element.classList.remove("toast--leaving");
    }, 200);
  }, 3000);
}
