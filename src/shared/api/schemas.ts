import * as z from "zod/mini";

/**
 * Text the database may hold as NULL; read as "", which the screens show as
 * an empty value.
 */
export const textOrEmpty = z.pipe(
  z.nullable(z.string()),
  z.transform((value) => value ?? ""),
);

/** A date sent as ISO text, read as a Date. */
export const isoDate = z.pipe(
  z.iso.datetime({ offset: true }),
  z.transform((value) => new Date(value)),
);
