export const formatDate = (date: any) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
    .formatToParts(date)
    .map((part) => part.value)
    .join("");
