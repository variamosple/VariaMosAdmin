export const formatDateTime = (date: any) =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(date);

export const formatDate = (date: any) =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(date);

export const PASSWORD_REGEXP = Object.freeze(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,24}$/
);

export const formatBoolean = (
  value?: boolean,
  yesValue: string = "Yes",
  noValue: string = "No",
  nullValue?: string
) => {
  if (value === undefined || value === null) return nullValue || "";

  return value ? yesValue : noValue;
};
