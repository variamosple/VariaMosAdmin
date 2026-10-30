export type ConfigurationValue =
  // biome-ignore lint/suspicious/noExplicitAny: configuration value can be any JSON-serializable type
  any;

/**
 * What a key the code reads accepts, sent by the server (EV-18 lot C): a
 * sentence, the bounds and unit of a number, or the format of a text.
 */
export interface AcceptedValues {
  text: string;
  min?: number;
  max?: number;
  unit?: string;
  format?: "timeZone" | "timeSpan";
}

export interface Configuration {
  id?: number;
  key: string;
  value: ConfigurationValue;
  type: "boolean" | "string" | "number" | "array" | "object";
  /** Each category found in the configurations gets its own tab. */
  category: string;
  requiresMfa: boolean;
  isSecret: boolean;
  environmentScope: "production" | "development" | "test" | "all";
  isReadOnly: boolean;
  /** False when no service reads the key yet; absent from older backends. */
  isApplied?: boolean;
  /** Absent for a key that no code reads, and from older backends. */
  accepts?: AcceptedValues;
  targetServices: string[];
  description?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}
