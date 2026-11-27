export function icon(id, small = false) {
  return `<svg class="icon${small ? " icon--sm" : ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#${id}"></use></svg>`;
}
