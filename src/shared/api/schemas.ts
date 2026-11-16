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

/** Text the server may send as null or leave out; read as absent. */
export const optionalText = z.pipe(
  z.optional(z.nullable(z.string())),
  z.transform((value) => value ?? undefined),
);

/**
 * A whole number the server may send as text, read as a number. PostgreSQL
 * gives a bigint column as text: on 2026-11-16, production sent the language
 * ids so ("399"), although the code of variamos_ms_languages declares an
 * integer. Text that is not a whole number is still refused.
 */
export const wholeNumber = z.pipe(
  z.union([z.int(), z.string().check(z.regex(/^\d{1,15}$/))]),
  z.transform((value) => Number(value)),
);
