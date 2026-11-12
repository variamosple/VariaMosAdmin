import type { ConfigurationAnnouncement } from "./Configuration";

/** The settings saved together that users notice, and what to tell them. */
export interface ChangeAnnouncement {
  keys: string[];
  title: string;
  body: string;
}

/**
 * One message for the settings saved together (EV-115 lot A): their
 * sentences one after the other, each note said once. Null when none of
 * them is a setting users notice.
 */
export const announcementOfChanges = (
  saved: { key: string; announcement?: ConfigurationAnnouncement }[],
): ChangeAnnouncement | null => {
  const announced = saved.filter(
    (item): item is { key: string; announcement: ConfigurationAnnouncement } =>
      item.announcement !== undefined,
  );
  const [first] = announced;
  if (!first) return null;
  const titles = new Set(announced.map((item) => item.announcement.title));
  const notes = [
    ...new Set(
      announced.flatMap((item) =>
        item.announcement.note ? [item.announcement.note] : [],
      ),
    ),
  ];
  return {
    keys: announced.map((item) => item.key),
    title: titles.size === 1 ? first.announcement.title : "Settings updated",
    body: [...announced.map((item) => item.announcement.body), ...notes].join(
      " ",
    ),
  };
};
