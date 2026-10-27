import { ResponseModel } from "@variamosple/variamos-components";
import * as z from "zod/mini";

// The envelope every API of the module answers with; fields it does not
// know are kept, so a new field on the server breaks nothing
const envelopeFields = {
  transactionId: z.optional(z.string()),
  // null is "no error" in the shared ResponseModel
  errorCode: z.optional(z.nullable(z.union([z.number(), z.string()]))),
  message: z.optional(z.string()),
  totalCount: z.optional(z.number()),
};
const errorEnvelope = z.looseObject(envelopeFields);

/** The data of a response that carries none, such as an update. */
export const noData = z.pipe(
  z.optional(z.nullable(z.undefined())),
  z.transform(() => undefined),
);

const invalid = <T>(
  error: z.core.$ZodError,
  failureMessage: string,
): ResponseModel<T> => {
  // Paths and issue codes only: a value may be personal data
  console.error(
    "Unexpected API response:",
    error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"} ${issue.code}`)
      .join(", "),
  );
  return new ResponseModel<T>("APP-ERROR").withError(500, failureMessage);
};

/**
 * The ResponseModel of a successful request, checked against the schema of
 * its data (EV-97 lot 6c). A body that does not match gives an error
 * response, never a partial object; an error the server answered with a
 * success status is passed on unchecked, as before.
 */
export const parseResponse = <T>(
  schema: z.ZodMiniType<T>,
  body: object | string | null | undefined,
  failureMessage: string,
): ResponseModel<T> => {
  const envelope = errorEnvelope.safeParse(body);
  if (!envelope.success) return invalid(envelope.error, failureMessage);
  if (envelope.data.errorCode != null) {
    return Object.assign(new ResponseModel<T>(), envelope.data);
  }

  const parsed = z
    .looseObject({ ...envelopeFields, data: schema })
    .safeParse(body);
  if (!parsed.success) return invalid(parsed.error, failureMessage);
  return Object.assign(new ResponseModel<T>(), parsed.data);
};
