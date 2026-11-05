const DELEGATED = Object.freeze([
  { type: "click", attribute: "action" },
  { type: "change", attribute: "change" },
  { type: "input", attribute: "input" },
  { type: "keydown", attribute: "keydown" },
]);

export function bindEvents(dispatch) {
  const doc = globalThis.document;

  for (const { type, attribute } of DELEGATED) {
    doc.addEventListener(type, (event) => {
      const element =
        event.target instanceof Element
          ? event.target.closest(`[data-${attribute}]`)
          : null;
      if (element) {
        dispatch(attribute, element.dataset[attribute], element, event);
      }
    });
  }

  doc.addEventListener("submit", (event) => {
    const form = event.target;
    if (form instanceof Element && form.dataset.submit) {
      event.preventDefault();
      dispatch("submit", form.dataset.submit, form, event);
    }
  });

  doc.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      dispatch("escape", "escape", null, event);
    }
  });
}
