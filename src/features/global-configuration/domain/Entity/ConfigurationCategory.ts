import type { Configuration } from "./Configuration";

export interface ConfigurationCategory {
  key: string;
  label: string;
}

/** Categories with a label of their own, in the order of the tabs. */
const KNOWN_CATEGORIES: readonly ConfigurationCategory[] = [
  { key: "general", label: "General Options" },
  { key: "security", label: "Security & Passwords" },
  { key: "notification", label: "Notifications & SMTP" },
  { key: "monitoring", label: "Monitoring" },
  { key: "env", label: "System & Environments" },
];

/** The label of a category; another category is named after its key. */
export const categoryLabel = (key: string): string => {
  const known = KNOWN_CATEGORIES.find((category) => category.key === key);
  if (known) return known.label;
  const words = key.replace(/[_.-]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * One tab per category found in the configurations, none empty (EV-18 lot
 * C): a key of a new category shows without a change of the screen. Known
 * categories come first, in their order, then the others by name.
 */
export const categoriesOf = (
  configurations: readonly Configuration[],
): ConfigurationCategory[] => {
  const present = new Set(configurations.map((config) => config.category));
  const known = KNOWN_CATEGORIES.filter((category) =>
    present.has(category.key),
  );
  const others = [...present]
    .filter((key) => !KNOWN_CATEGORIES.some((category) => category.key === key))
    .sort()
    .map((key) => ({ key, label: categoryLabel(key) }));
  return [...known, ...others];
};
