export const formatDateTime = (date: Date | string | number | null | undefined): string => {
  if (!date) return "N/A";
  const parsedDate = date instanceof Date ? date : new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return "N/A";
  }
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(parsedDate);
};

export const formatDate = (date: Date | string | number | null | undefined): string => {
  if (!date) return "N/A";
  const parsedDate = date instanceof Date ? date : new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return "N/A";
  }
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(parsedDate);
};

export const PASSWORD_REGEXP = Object.freeze(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,24}$/);

export const formatBoolean = (
  value?: boolean,
  yesValue: string = "Yes",
  noValue: string = "No",
  nullValue?: string,
) => {
  if (value === undefined || value === null) return nullValue || "";

  return value ? yesValue : noValue;
};
