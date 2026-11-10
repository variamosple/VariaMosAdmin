import { describe, expect, it } from "vitest";
import type { Configuration } from "./Configuration";
import { categoriesOf, categoryLabel } from "./ConfigurationCategory";

const inCategory = (category: string) => ({ category }) as Configuration;

describe("configuration categories", () => {
  it("makes one tab per category found, known ones first, none empty", () => {
    const categories = categoriesOf(
      [
        "monitoring",
        "storage_quota",
        "general",
        "ai",
        "monitoring",
        "security",
      ].map(inCategory),
    );

    expect(categories).toEqual([
      { key: "general", label: "General Options" },
      { key: "security", label: "Security & Passwords" },
      { key: "monitoring", label: "Monitoring" },
      { key: "ai", label: "Ai" },
      { key: "storage_quota", label: "Storage quota" },
    ]);
  });

  it("makes no tab without configurations", () => {
    expect(categoriesOf([])).toEqual([]);
  });

  it("names an unknown category after its key", () => {
    expect(categoryLabel("notification")).toBe("Notifications & SMTP");
    expect(categoryLabel("feature-flags")).toBe("Feature flags");
    expect(categoryLabel("bugs.github")).toBe("Bugs github");
  });
});
