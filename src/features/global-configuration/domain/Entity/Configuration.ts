export type ConfigurationValue =
  // biome-ignore lint/suspicious/noExplicitAny: configuration value can be any JSON-serializable type
  any;

export interface Configuration {
  id?: number;
  key: string;
  value: ConfigurationValue;
  type: "boolean" | "string" | "number" | "array" | "object";
  category: "general" | "security" | "notification" | "env";
  requiresMfa: boolean;
  isSecret: boolean;
  environmentScope: "production" | "development" | "test" | "all";
  isReadOnly: boolean;
  targetServices: string[];
  description?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}
