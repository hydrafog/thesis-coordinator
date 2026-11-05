export const NAVIGATION = Object.freeze({
  coordinator: Object.freeze([
    Object.freeze({
      label: "Workspace",
      items: Object.freeze([
        Object.freeze({
          key: "overview",
          label: "Overview",
          icon: "i-grid-line",
        }),
        Object.freeze({
          key: "settings",
          label: "Settings",
          icon: "i-settings-1-line",
        }),
      ]),
    }),
    Object.freeze({
      label: "Thesis work",
      items: Object.freeze([
        Object.freeze({
          key: "students",
          label: "Students",
          icon: "i-users-line",
        }),
        Object.freeze({ key: "chat", label: "Chat", icon: "i-chat-1-line" }),
        Object.freeze({
          key: "review",
          label: "Review",
          icon: "i-check-circle-line",
        }),
      ]),
    }),
    Object.freeze({
      label: "Defense",
      items: Object.freeze([
        Object.freeze({
          key: "schedule",
          label: "Schedule",
          icon: "i-calendar-line",
        }),
        Object.freeze({
          key: "gradebook",
          label: "Gradebook",
          icon: "i-clipboard-line",
        }),
      ]),
    }),
  ]),
  student: Object.freeze([
    Object.freeze({
      label: "Workspace",
      items: Object.freeze([
        Object.freeze({
          key: "overview",
          label: "Overview",
          icon: "i-grid-line",
        }),
        Object.freeze({
          key: "settings",
          label: "Settings",
          icon: "i-settings-1-line",
        }),
      ]),
    }),
    Object.freeze({
      label: "Thesis work",
      items: Object.freeze([
        Object.freeze({
          key: "coordinators",
          label: "Coordinators",
          icon: "i-users-line",
        }),
        Object.freeze({
          key: "my-thesis",
          label: "My thesis",
          icon: "i-document-2-line",
        }),
        Object.freeze({ key: "chat", label: "Chat", icon: "i-chat-1-line" }),
      ]),
    }),
    Object.freeze({
      label: "Defense",
      items: Object.freeze([
        Object.freeze({
          key: "schedule",
          label: "Schedule",
          icon: "i-calendar-line",
        }),
        Object.freeze({
          key: "gradebook",
          label: "Gradebook",
          icon: "i-clipboard-line",
        }),
      ]),
    }),
  ]),
});

export const DEFAULT_PAGE = "overview";
