import type {
  AcceptedValues,
  Configuration,
  ConfigurationValue,
} from "./Configuration";

/** A whole number within the bounds the server sent; true without bounds. */
const isWithinAccepted = (value: number, accepts?: AcceptedValues) =>
  accepts?.min === undefined ||
  accepts.max === undefined ||
  (Number.isInteger(value) && value >= accepts.min && value <= accepts.max);

export type ParsedValue = { value: ConfigurationValue } | { error: string };

const numberOf = (input: string, accepts?: AcceptedValues): ParsedValue => {
  const num = Number(input);
  if (Number.isNaN(num)) return { error: "Please enter a valid number." };
  // The server refuses it too; saying it here spares a failed save
  if (!isWithinAccepted(num, accepts)) {
    return { error: `Enter ${accepts?.text}.` };
  }
  return { value: num };
};

// Throws on text that is not JSON
const jsonOf = (type: "array" | "object", input: string): ParsedValue => {
  const parsed = JSON.parse(input);
  if (type === "array" && !Array.isArray(parsed)) {
    return {
      error: 'Value must be a valid JSON array (e.g. ["val1", "val2"]).',
    };
  }
  if (
    type === "object" &&
    (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
  ) {
    return {
      error: 'Value must be a valid JSON object (e.g. { "key": "value" }).',
    };
  }
  return { value: parsed };
};

export interface FormInput {
  inputValue: string;
  boolValue: boolean;
}

/** The value to save from the form, or why it is refused. */
export const parsedValueOf = (
  config: Configuration,
  input: FormInput,
): ParsedValue => {
  const { inputValue, boolValue } = input;
  if (config.isSecret && config.type !== "boolean" && !inputValue.trim()) {
    return { error: "Enter a new value for this secret." };
  }
  if (config.type === "boolean") return { value: boolValue };
  if (config.type === "number") return numberOf(inputValue, config.accepts);
  if (config.type === "array" || config.type === "object") {
    return jsonOf(config.type, inputValue);
  }
  return { value: inputValue };
};
