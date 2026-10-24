// Part of VariaMos a bug concerns (EV-84 lot 5); the API checks the list
export const BUG_COMPONENTS = [
  "language",
  "model",
  "microservice",
  "admin",
  "other",
] as const;
export type BugComponent = (typeof BUG_COMPONENTS)[number];

export const BUG_COMPONENT_LABELS: Record<BugComponent, string> = {
  language: "Language",
  model: "Model",
  microservice: "Microservice",
  admin: "Administration interface",
  other: "Other",
};

export const componentLabel = (component?: string): string =>
  component
    ? (BUG_COMPONENT_LABELS[component as BugComponent] ?? component)
    : "Not specified";
