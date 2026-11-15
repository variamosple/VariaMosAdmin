import { browserTimeZone } from "@/shared/domain/TimeZone";
import { choiceOf } from "@/shared/domain/TimeZoneSearch";

/**
 * The country of a time zone, by the IANA table (EV-90): "America/Bogota"
 * gives "CO". Null for a zone of no country, such as UTC. Only the zone of
 * the browser is read: no address of the user.
 */
export const countryOfTimeZone = (
  zone: string = browserTimeZone(),
): string | null => choiceOf(zone)?.countryCode ?? null;
